import { uploadProductionFile } from "../api";
import type { UploadPurpose } from "../api/types";
const uploads = new Map<string, Promise<string>>();
type UploadJob = {
  key: string;
  name: string;
  percent: number;
  status: "uploading" | "complete" | "failed";
  error?: string;
  retry?: () => void;
};
let jobs: UploadJob[] = [];
const listeners = new Set<() => void>();
export const subscribeUploads = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export const getUploadJobs = () => jobs;
export function beginUploadSession() {
  jobs = [];
  listeners.forEach((listener) => listener());
}
export async function prepareInBatches<T, R>(
  items: T[],
  prepare: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let next = 0;
  let failure: unknown;
  let failed = false;
  await Promise.all(
    Array.from({ length: Math.min(2, items.length) }, async () => {
      while (!failed && next < items.length) {
        const index = next++;
        try {
          results[index] = await prepare(items[index], index);
        } catch (error) {
          failure = error;
          failed = true;
        }
      }
    }),
  );
  if (failed) throw failure;
  return results;
}
const updateJob = (key: string, changes: Partial<UploadJob>) => {
  jobs = jobs.map((job) => (job.key === key ? { ...job, ...changes } : job));
  listeners.forEach((listener) => listener());
};
export async function uploadAsset(
  source: string | Blob,
  purpose: UploadPurpose,
) {
  const blob =
    typeof source === "string" ? await (await fetch(source)).blob() : source;
  const digest = Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", await blob.arrayBuffer()),
    ),
  )
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
  const key = `${purpose}:${digest}`;
  if (!uploads.has(key)) {
    if (!jobs.some((job) => job.key === key))
      jobs = [
        ...jobs,
        {
          key,
          name: `${purpose === "VINTAGE_LETTER_FINAL" ? "Letter PDF" : purpose === "POLAROID_PREVIEW" ? "Photo preview" : "Print artwork"} ${jobs.length + 1}`,
          percent: 0,
          status: "uploading",
        },
      ];
    updateJob(key, { status: "uploading", error: undefined });
    const pending = uploadProductionFile(
      new File(
        [blob],
        `${purpose}.${blob.type === "application/pdf" ? "pdf" : "png"}`,
        { type: blob.type },
      ),
      purpose,
      undefined,
      (percent) => updateJob(key, { percent }),
    )
      .then((result) => {
        const url = new URL(result.url);
        if (!["https:", "http:"].includes(url.protocol))
          throw new Error(
            "The upload did not return a usable file. Please retry.",
          );
        updateJob(key, { status: "complete", percent: 100, retry: undefined });
        return url.href;
      })
      .catch((error) => {
        uploads.delete(key);
        updateJob(key, {
          status: "failed",
          error: error.message,
          retry: () => {
            void uploadAsset(blob, purpose).catch(() => {});
          },
        });
        throw error;
      });
    uploads.set(key, pending);
  }
  return uploads.get(key)!;
}
export const loadArtwork = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("Could not prepare your artwork. Please retry."));
    image.src = src;
  });
export async function polaroidPng(src: string, preview = false) {
  const image = await loadArtwork(src);
  if (!preview) {
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    canvas.getContext("2d")!.drawImage(image, 0, 0);
    return canvas.toDataURL("image/png");
  }
  const frame = await loadArtwork("/images/polaroid-frame.svg");
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = Math.round(
    (canvas.width * frame.naturalHeight) / frame.naturalWidth,
  );
  const context = canvas.getContext("2d")!;
  context.drawImage(
    image,
    canvas.width * 0.2,
    canvas.height * 0.31,
    canvas.width * 0.58,
    canvas.height * 0.42,
  );
  context.drawImage(frame, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}
// Small previews survive cart reloads without keeping original customer uploads.
export async function cartThumbnail(src: string) {
  const image = await loadArtwork(src);
  const scale = Math.min(
    1,
    480 / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d")!;
  context.fillStyle = "#F6F0E5";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.8);
}
// Image-only, multi-page A4 PDF: the artwork and font rendering stay identical to the canvas.
export function canvasesToPdf(pages: HTMLCanvasElement[]) {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const offsets = [0];
  let length = 0;
  const append = (value: string | Uint8Array) => {
    const bytes = typeof value === "string" ? encoder.encode(value) : value;
    parts.push(bytes);
    length += bytes.length;
  };
  const object = (id: number, body: string) => {
    offsets[id] = length;
    append(`${id} 0 obj\n${body}\nendobj\n`);
  };
  append("%PDF-1.4\n");
  object(1, "<< /Type /Catalog /Pages 2 0 R >>");
  object(
    2,
    `<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_, i) => `${3 + i * 3} 0 R`).join(" ")}] >>`,
  );
  pages.forEach((page, index) => {
    const id = 3 + index * 3;
    const bytes = Uint8Array.from(
      atob(page.toDataURL("image/jpeg", 0.95).split(",")[1]),
      (c) => c.charCodeAt(0),
    );
    object(
      id,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Artwork ${id + 1} 0 R >> >> /Contents ${id + 2} 0 R >>`,
    );
    offsets[id + 1] = length;
    append(
      `${id + 1} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`,
    );
    append(bytes);
    append("\nendstream\nendobj\n");
    const stream = "q 595.28 0 0 841.89 0 0 cm /Artwork Do Q";
    object(
      id + 2,
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    );
  });
  const start = length;
  append(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);
  offsets
    .slice(1)
    .forEach((offset) =>
      append(`${String(offset).padStart(10, "0")} 00000 n \n`),
    );
  append(
    `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`,
  );
  return new Blob(parts as BlobPart[], { type: "application/pdf" });
}
