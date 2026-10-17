"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { adminRequest } from "@/lib/admin/api";
import { ApiError } from "@/lib/api/client";
import {
  galleryImage,
  type GalleryAlbum,
  type GalleryPage,
  type GalleryPhoto,
} from "@/lib/gallery/types";
import { Button, Feedback, PageHeader, Panel } from "./primitives";
import { useUnsavedChanges } from "./useUnsavedChanges";

const blank: GalleryAlbum = {
  id: "",
  slug: "",
  title: "",
  description: "",
  status: "DRAFT",
  version: 0,
  permissionConfirmed: false,
  coverPhotoId: null,
  photos: [],
  updatedAt: "",
};
const explain = (error: unknown) =>
  error instanceof ApiError && (error.status === 404 || error.status === 501)
    ? "Gallery management isn’t connected yet. The backend gallery endpoints need to be added before albums can be saved or uploaded."
    : error instanceof Error
      ? error.message
      : "The gallery request failed. Please try again.";

export default function GalleryAdmin({ id }: { id?: string }) {
  const router = useRouter();
  const [album, setAlbum] = useState<GalleryAlbum>(blank);
  const [list, setList] = useState<GalleryPage | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(id !== "new");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [failed, setFailed] = useState<Array<{ file: File; key: string }>>([]);
  const [uploadProgress, setUploadProgress] = useState("");
  const lock = useRef(false);
  const createKey = useRef("");
  useUnsavedChanges(dirty || busy);
  useEffect(() => {
    if (id === "new") return;
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        setLoading(true);
        setError("");
      }
    });
    const request = id
      ? adminRequest<GalleryAlbum>(
          `/admin/gallery/albums/${encodeURIComponent(id)}`,
          { signal: controller.signal },
        ).then(setAlbum)
      : adminRequest<GalleryPage>("/admin/gallery/albums", {
          query: { page, limit: 20 },
          signal: controller.signal,
        }).then(setList);
    request
      .catch((e) => {
        if (!controller.signal.aborted) setError(explain(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id, page, attempt]);
  function change(updates: Partial<GalleryAlbum>) {
    setAlbum((a) => ({ ...a, ...updates }));
    setDirty(true);
    setMessage("");
  }
  async function save() {
    if (lock.current) return;
    if (!album.title.trim()) {
      setError("Give this album a name.");
      return;
    }
    if (
      album.status === "PUBLISHED" &&
      (!album.permissionConfirmed ||
        !album.photos.length ||
        !album.coverPhotoId)
    ) {
      setError(
        "Before publishing, add photos, choose a cover and confirm permission to publish.",
      );
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    if (!createKey.current) createKey.current = crypto.randomUUID();
    try {
      const body = {
        title: album.title.trim(),
        description: album.description.trim(),
        status: album.status,
        permissionConfirmed: album.permissionConfirmed,
        coverPhotoId: album.coverPhotoId,
        photos: album.photos.map((p) => ({
          id: p.id,
          caption: p.caption.trim(),
          alt: p.alt.trim(),
          featured: p.featured,
        })),
        ...(id === "new"
          ? { requestKey: createKey.current }
          : { expectedVersion: album.version }),
      };
      const saved = await adminRequest<GalleryAlbum>(
        id === "new"
          ? "/admin/gallery/albums"
          : `/admin/gallery/albums/${encodeURIComponent(id!)}`,
        { method: id === "new" ? "POST" : "PATCH", body },
      );
      setAlbum(saved);
      setDirty(false);
      setMessage(
        saved.status === "PUBLISHED" ? "Album published." : "Draft saved.",
      );
      if (id === "new")
        router.replace(`/admin/gallery/${encodeURIComponent(saved.id)}`);
    } catch (e) {
      setError(explain(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function upload(entries: Array<{ file: File; key: string }>) {
    if (lock.current || !entries.length) return;
    if (album.photos.length + entries.length > 100) {
      setError(
        "Each album can hold up to 100 photos. Split larger events into another album.",
      );
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    setFailed([]);
    const failures: typeof entries = [];
    let added = 0;
    for (const [index, entry] of entries.entries()) {
      setUploadProgress(`Uploading photo ${index + 1} of ${entries.length}…`);
      try {
        if (
          !["image/jpeg", "image/png", "image/webp"].includes(
            entry.file.type,
          ) ||
          entry.file.size > 10 * 1024 * 1024
        )
          throw new Error("Use JPG, PNG or WebP photos no larger than 10 MB.");
        const body = new FormData();
        body.append("file", entry.file);
        body.append("requestKey", entry.key);
        const photo = await adminRequest<GalleryPhoto>(
          "/admin/gallery/uploads",
          { method: "POST", body },
        );
        setAlbum((a) =>
          a.photos.some((p) => p.id === photo.id)
            ? a
            : {
                ...a,
                coverPhotoId: a.coverPhotoId || photo.id,
                photos: [
                  ...a.photos,
                  { ...photo, caption: "", alt: "", featured: false },
                ],
                permissionConfirmed: false,
              },
        );
        setDirty(true);
        added++;
      } catch (e) {
        failures.push(entry);
        setError(explain(e));
        if (e instanceof ApiError && [401, 403, 404, 501].includes(e.status)) {
          failures.push(...entries.slice(index + 1));
          break;
        }
      }
    }
    setFailed(failures);
    setUploadProgress("");
    setMessage(
      added
        ? `${added} ${added === 1 ? "photo added" : "photos added"}. Save the album to keep your changes.`
        : "",
    );
    lock.current = false;
    setBusy(false);
  }
  function move(index: number, step: number) {
    const photos = [...album.photos];
    [photos[index], photos[index + step]] = [
      photos[index + step],
      photos[index],
    ];
    change({ photos });
  }
  async function removeAlbum() {
    if (
      lock.current ||
      !window.confirm(
        `Delete “${album.title}” and remove it from the public gallery? This cannot be undone.`,
      )
    )
      return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await adminRequest(`/admin/gallery/albums/${encodeURIComponent(id!)}`, {
        method: "DELETE",
        body: { expectedVersion: album.version },
      });
      setDirty(false);
      router.push("/admin/gallery");
    } catch (e) {
      setError(explain(e));
      lock.current = false;
      setBusy(false);
    }
  }
  if (!id)
    return (
      <>
        <PageHeader
          title="Gallery"
          description="Create albums for events, station setups and your favourite keepsakes."
        >
          <Link className="adm-button" href="/admin/gallery/new">
            + Add album
          </Link>
        </PageHeader>
        <Feedback error={error} />
        {loading ? (
          <p role="status">Loading albums…</p>
        ) : error ? (
          <Button onClick={() => setAttempt((x) => x + 1)}>Retry</Button>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {list?.data.map((item) => (
                <Link
                  key={item.id}
                  href={`/admin/gallery/${encodeURIComponent(item.id)}`}
                  className="adm-panel"
                >
                  {item.cover && (
                    <img
                      src={galleryImage(item.cover.thumbnailUrl)}
                      alt={item.cover.alt || item.title}
                      className="mb-4 aspect-[4/3] w-full rounded-xl object-cover"
                    />
                  )}
                  <h2>{item.title}</h2>
                  <p>
                    {item.status === "PUBLISHED" ? "Published" : "Draft"} ·{" "}
                    {item.photoCount} photos
                  </p>
                  <span className="font-bold underline">Manage album →</span>
                </Link>
              ))}
            </div>
            {!list?.data.length && (
              <Panel>
                <p>
                  No albums yet. Start with an event or a collection of your
                  keepsakes.
                </p>
              </Panel>
            )}
            {list && list.pagination.totalPages > 1 && (
              <div className="adm-actions mt-5">
                <Button
                  disabled={page === 1}
                  onClick={() => setPage((x) => x - 1)}
                >
                  Previous
                </Button>
                <span>
                  Page {page} of {list.pagination.totalPages}
                </span>
                <Button
                  disabled={page >= list.pagination.totalPages}
                  onClick={() => setPage((x) => x + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </>
    );
  return (
    <>
      <PageHeader
        title={id === "new" ? "New gallery album" : "Edit gallery album"}
        description="Upload together, add optional captions, then save or publish."
      >
        <Link href="/admin/gallery" className="adm-button secondary">
          ← Albums
        </Link>
      </PageHeader>
      <Feedback error={error} message={message} />
      {loading ? (
        <p role="status">Loading album…</p>
      ) : id !== "new" && !album.id ? (
        <Button onClick={() => setAttempt((x) => x + 1)}>Retry</Button>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <fieldset
            disabled={busy}
            className="min-w-0 space-y-6 disabled:opacity-70"
          >
            <Panel title="Album details">
              <div className="adm-form-grid">
                <label>
                  Album name
                  <input
                    className="adm-input"
                    required
                    maxLength={120}
                    value={album.title}
                    onChange={(e) => change({ title: e.target.value })}
                    placeholder="e.g. GTCO Event"
                  />
                </label>
                <label>
                  Visibility
                  <select
                    className="adm-input"
                    value={album.status}
                    onChange={(e) =>
                      change({
                        status: e.target.value as GalleryAlbum["status"],
                      })
                    }
                  >
                    <option value="DRAFT">Draft — only visible in admin</option>
                    <option value="PUBLISHED">
                      Published — visible to everyone
                    </option>
                  </select>
                </label>
                <label className="sm:col-span-2">
                  Description (optional)
                  <textarea
                    className="adm-input"
                    rows={3}
                    maxLength={2000}
                    value={album.description}
                    onChange={(e) => change({ description: e.target.value })}
                  />
                </label>
              </div>
            </Panel>
            <Panel title={`Photos (${album.photos.length}/100)`}>
              <label className="block font-bold">
                Add photos
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="mt-3 block w-full max-w-full text-sm"
                  onChange={(e) => {
                    const entries = Array.from(e.target.files || []).map(
                      (file) => ({ file, key: crypto.randomUUID() }),
                    );
                    e.target.value = "";
                    void upload(entries);
                  }}
                />
              </label>
              <p className="mt-2 text-sm">
                Select several photos at once. JPG, PNG or WebP, up to 10 MB
                each. New uploads reset your publishing-permission confirmation.
              </p>
              {failed.length > 0 && (
                <div className="my-4 rounded-lg bg-beige p-4">
                  <p>
                    {failed.length} uploads need another try:{" "}
                    {failed.map((f) => f.file.name).join(", ")}
                  </p>
                  <Button type="button" onClick={() => void upload(failed)}>
                    Retry failed uploads
                  </Button>
                  <Button type="button" onClick={() => setFailed([])}>
                    Dismiss failed uploads
                  </Button>
                </div>
              )}
              <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {album.photos.map((photo, index) => (
                  <article
                    key={photo.id}
                    className="min-w-0 rounded-xl border border-ink/30 bg-cream p-3"
                  >
                    <img
                      src={galleryImage(photo.thumbnailUrl)}
                      alt={photo.alt || `Photo ${index + 1}`}
                      className="aspect-square w-full rounded-lg object-cover"
                    />
                    <label className="mt-3 block">
                      Caption (optional)
                      <input
                        className="adm-input"
                        maxLength={300}
                        value={photo.caption}
                        onChange={(e) =>
                          change({
                            photos: album.photos.map((p) =>
                              p.id === photo.id
                                ? { ...p, caption: e.target.value }
                                : p,
                            ),
                          })
                        }
                      />
                    </label>
                    <label className="mt-3 block">
                      Photo description (optional)
                      <input
                        className="adm-input"
                        maxLength={300}
                        placeholder="Describe what is in the photo"
                        value={photo.alt}
                        onChange={(e) =>
                          change({
                            photos: album.photos.map((p) =>
                              p.id === photo.id
                                ? { ...p, alt: e.target.value }
                                : p,
                            ),
                          })
                        }
                      />
                    </label>
                    <label className="mt-3 flex items-center gap-2">
                      <input
                        type="radio"
                        name="cover"
                        checked={album.coverPhotoId === photo.id}
                        onChange={() => change({ coverPhotoId: photo.id })}
                      />
                      Album cover
                    </label>
                    <label className="mt-3 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={photo.featured}
                        onChange={(e) =>
                          change({
                            photos: album.photos.map((p) =>
                              p.id === photo.id
                                ? { ...p, featured: e.target.checked }
                                : p,
                            ),
                          })
                        }
                      />
                      Show on homepage
                    </label>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        aria-label={`Move photo ${index + 1} earlier`}
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                      >
                        ←
                      </Button>
                      <Button
                        type="button"
                        aria-label={`Move photo ${index + 1} later`}
                        disabled={index === album.photos.length - 1}
                        onClick={() => move(index, 1)}
                      >
                        →
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Remove this photo from the album? Save the album to apply this change.",
                            )
                          )
                            change({
                              photos: album.photos.filter(
                                (p) => p.id !== photo.id,
                              ),
                              coverPhotoId:
                                album.coverPhotoId === photo.id
                                  ? album.photos.find((p) => p.id !== photo.id)
                                      ?.id || null
                                  : album.coverPhotoId,
                            });
                        }}
                      >
                        Remove photo {index + 1}
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </Panel>
            <Panel>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={album.permissionConfirmed}
                  onChange={(e) =>
                    change({ permissionConfirmed: e.target.checked })
                  }
                />
                <span>
                  I have permission to publish every photo in this album,
                  including any people or personal messages shown.
                </span>
              </label>
              <div className="adm-actions mt-5">
                <Button type="submit">
                  {album.status === "PUBLISHED"
                    ? "Save & publish"
                    : "Save draft"}
                </Button>
                {id !== "new" && (
                  <Button
                    type="button"
                    className="secondary"
                    onClick={() => void removeAlbum()}
                  >
                    Delete album
                  </Button>
                )}
              </div>
            </Panel>
          </fieldset>
          {busy && (
            <p role="status" className="my-4 font-bold text-burgundy">
              {uploadProgress || "Saving changes…"}
            </p>
          )}
        </form>
      )}
    </>
  );
}
