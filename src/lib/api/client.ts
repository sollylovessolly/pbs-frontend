const DEFAULT_API_URL = "http://localhost:4000/api";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

const getApiUrl = () =>
  (process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(/\/$/, "");

const getErrorMessage = (payload: unknown): string => {
  if (typeof payload === "string" && payload.trim()) {
    return "The request could not be completed. Please try again.";
  }

  if (payload && typeof payload === "object" && "message" in payload) {
    const message = payload.message;

    if (Array.isArray(message)) {
      return getErrorMessage({
        message: message
          .filter((part): part is string => typeof part === "string")
          .join(" "),
      });
    }

    if (typeof message === "string") {
      return /checkoutKey|checkoutToken|variantSku|requestToken|stack|prisma|sql|exception|secret|paystack|shipbubble|<html| at \w+\./i.test(
        message,
      )
        ? "The request could not be completed. Please check your details and retry."
        : message.slice(0, 500);
    }
  }

  return "Something went wrong. Please try again.";
};

const parseResponse = async (response: Response) => {
  const text = await response.text();

  if (!text) return undefined;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

export const apiRequest = async <T>(
  path: string,
  init: RequestInit = {},
): Promise<T> => {
  if (
    process.env.NEXT_PUBLIC_DIRECT_UPLOADS === "true" &&
    init.body instanceof FormData
  ) {
    const body = await prepareDirectUploads(
      path,
      init.body,
      init.headers,
      init.signal ?? undefined,
    );
    init = { ...init, body: JSON.stringify(body) };
  }
  let response: Response;

  try {
    response = await fetch(`${getApiUrl()}${path}`, {
      ...init,
      signal: init.signal
        ? AbortSignal.any([init.signal, AbortSignal.timeout(20000)])
        : AbortSignal.timeout(20000),
      headers: {
        Accept: "application/json",
        ...(init.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...init.headers,
      },
    });
  } catch (error) {
    if (init.signal?.aborted) throw error;
    throw new ApiError(
      "We could not reach the shop right now. Please try again.",
      0,
    );
  }

  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(
      response.status >= 500
        ? "The shop is temporarily unavailable. Please try again."
        : getErrorMessage(payload),
      response.status,
      payload,
    );
  }

  if (typeof payload === "string")
    throw new ApiError(
      "The shop returned an unexpected response. Please try again.",
      response.status,
    );
  return payload as T;
};

export const apiGet = <T>(path: string, signal?: AbortSignal) =>
  apiRequest<T>(path, { signal });

export const apiPost = <T>(path: string, body: unknown, signal?: AbortSignal) =>
  apiRequest<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
    signal,
  });

export const apiUpload = <T>(
  path: string,
  formData: FormData,
  signal?: AbortSignal,
) =>
  apiRequest<T>(path, {
    method: "POST",
    body: formData,
    signal,
  });

export function queryString(
  values: Record<string, string | number | boolean | null | undefined>,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values))
    if (value !== null && value !== undefined) params.set(key, String(value));
  const query = params.toString();
  return query ? `?${query}` : "";
}

/** XHR exposes upload progress; fetch remains the default for reads and JSON. */
export function apiUploadWithProgress<T>(
  path: string,
  body: FormData,
  onProgress: (percent: number) => void,
  signal?: AbortSignal,
): Promise<T> {
  if (process.env.NEXT_PUBLIC_DIRECT_UPLOADS === "true") {
    return prepareDirectUploads(path, body, undefined, signal, onProgress).then(
      (payload) => apiPost<T>(path, payload, signal),
    );
  }
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const abort = () => xhr.abort();
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    signal?.addEventListener("abort", abort, { once: true });
    xhr.open("POST", `${getApiUrl()}${path}`);
    xhr.timeout = 45000;
    xhr.ontimeout = () =>
      reject(new ApiError("Upload took too long. Please retry.", 0));
    xhr.setRequestHeader("Accept", "application/json");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable)
        onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onloadend = () => signal?.removeEventListener("abort", abort);
    xhr.onerror = () =>
      reject(new ApiError("We could not upload this file. Please retry.", 0));
    xhr.onabort = () => reject(new DOMException("Aborted", "AbortError"));
    xhr.onload = () => {
      let payload: unknown;
      try {
        payload = JSON.parse(xhr.responseText);
      } catch {
        reject(
          new ApiError(
            "The upload returned an unexpected response. Please retry.",
            xhr.status,
          ),
        );
        return;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(
          new ApiError(
            xhr.status >= 500
              ? "Photo upload is unavailable. Please try again shortly."
              : getErrorMessage(payload),
            xhr.status,
          ),
        );
        return;
      }
      resolve(payload as T);
    };
    xhr.send(body);
  });
}

type UploadGrant = {
  token: string;
  url: string;
  fields: Record<string, string>;
};

/** Files go straight to private storage; only signed references cross the API. */
async function prepareDirectUploads(
  path: string,
  body: FormData,
  headers?: HeadersInit,
  signal?: AbortSignal,
  onProgress?: (percent: number) => void,
): Promise<Record<string, unknown>> {
  const kind =
    path === "/uploads"
      ? "production"
      : path === "/admin/gallery/uploads"
        ? "gallery"
        : path === "/reviews"
          ? "review"
          : undefined;
  if (!kind) throw new ApiError("This upload is not supported.", 400);
  const payload: Record<string, unknown> = {};
  const files: File[] = [];
  for (const [key, value] of body.entries()) {
    if (value instanceof File && value.size) files.push(value);
    else if (typeof value === "string") payload[key] = value;
  }
  if ((kind !== "review" && files.length !== 1) || files.length > 3)
    throw new ApiError("Please select the required number of files.", 400);
  const tokens: string[] = [];
  for (const [index, file] of files.entries()) {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      await file.arrayBuffer(),
    );
    const sha256 = Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
    const grant = await apiRequest<UploadGrant>(
      `/uploads/direct${kind === "gallery" ? "/admin" : ""}`,
      {
        method: "POST",
        headers,
        signal,
        body: JSON.stringify({
          kind,
          contentType: file.type,
          size: file.size,
          sha256,
        }),
      },
    );
    await sendDirectFile(grant, file, signal, (percent) =>
      onProgress?.(Math.round((index * 100 + percent) / files.length)),
    );
    tokens.push(grant.token);
  }
  if (kind === "review") payload.uploadTokens = tokens;
  else payload.uploadToken = tokens[0];
  return payload;
}

function sendDirectFile(
  grant: UploadGrant,
  file: File,
  signal?: AbortSignal,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const abort = () => xhr.abort();
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    signal?.addEventListener("abort", abort, { once: true });
    xhr.open("POST", grant.url);
    xhr.timeout = 120000;
    xhr.onloadend = () => signal?.removeEventListener("abort", abort);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable)
        onProgress?.(Math.round((event.loaded * 100) / event.total));
    };
    xhr.onerror = () =>
      reject(new ApiError("We could not upload this file. Please retry.", 0));
    xhr.ontimeout = () =>
      reject(new ApiError("Upload took too long. Please retry.", 0));
    xhr.onabort = () => reject(new DOMException("Aborted", "AbortError"));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
      } else
        reject(
          new ApiError(
            "We could not upload this file. Please retry.",
            xhr.status,
          ),
        );
    };
    const form = new FormData();
    for (const [key, value] of Object.entries(grant.fields))
      form.append(key, value);
    form.append("file", file);
    xhr.send(form);
  });
}
