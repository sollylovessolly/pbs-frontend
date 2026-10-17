"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { apiRequest, ApiError } from "@/lib/api/client";
import {
  galleryImage,
  type GalleryAlbum,
  type GalleryPage,
} from "@/lib/gallery/types";

export default function AlbumGallery({ slug }: { slug?: string }) {
  const [page, setPage] = useState(1);
  const [albums, setAlbums] = useState<GalleryPage | null>(null);
  const [album, setAlbum] = useState<GalleryAlbum | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        setLoading(true);
        setError("");
      }
    });
    const request = slug
      ? apiRequest<GalleryAlbum>(
          `/gallery/albums/${encodeURIComponent(slug)}`,
          { signal: controller.signal },
        ).then((data) => {
          if (!Array.isArray(data.photos) || !data.title)
            throw new Error("Invalid album response");
          setAlbum(data);
        })
      : apiRequest<GalleryPage>(`/gallery/albums?page=${page}&limit=12`, {
          signal: controller.signal,
        }).then((data) => {
          if (!Array.isArray(data.data) || !data.pagination)
            throw new Error("Invalid gallery response");
          setAlbums(data);
        });
    request
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(
            e instanceof ApiError && e.status === 404
              ? slug
                ? "This album isn’t available."
                : "Our albums are coming soon."
              : "We couldn’t load the gallery. Please try again.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [slug, page, attempt]);
  useEffect(() => {
    if (selected !== null && !dialog.current?.open) dialog.current?.showModal();
  }, [selected]);
  const photo = selected !== null ? album?.photos[selected] : null;
  return (
    <main className="bg-cream px-5 py-12 text-ink">
      <div className="mx-auto max-w-site">
        <Link href={slug ? "/gallery" : "/"} className="text-sm underline">
          ← {slug ? "All albums" : "Home"}
        </Link>
        <p className="mt-8 font-handwritten text-xl text-burgundy">
          moments worth keeping
        </p>
        <h1 className="mt-2 font-serif text-4xl sm:text-5xl">
          {slug ? album?.title || "Our gallery" : "The PBS gallery"}
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-ink/70">
          {slug
            ? album?.description
            : "Celebrations, station setups and little keepsakes. Take a look around our albums."}
        </p>
        {loading ? (
          <p role="status" className="py-12">
            Opening the album…
          </p>
        ) : error ? (
          <div className="my-8 rounded-xl bg-beige p-6">
            <p role="alert">{error}</p>
            <button
              className="mt-3 font-bold underline"
              onClick={() => setAttempt((x) => x + 1)}
            >
              Try again
            </button>
          </div>
        ) : slug && album ? (
          <>
            {!album.photos.length && (
              <p className="py-10">Photos are coming soon.</p>
            )}
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
              {album.photos.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => setSelected(index)}
                  className="overflow-hidden rounded-xl border-2 border-ink bg-paper text-left shadow-[3px_4px_0_#2A211C] focus-visible:outline-burgundy"
                >
                  <img
                    src={galleryImage(item.thumbnailUrl)}
                    alt={
                      item.alt ||
                      item.caption ||
                      `${album.title}, photo ${index + 1}`
                    }
                    width={item.width}
                    height={item.height}
                    loading="lazy"
                    className="aspect-square w-full object-cover"
                  />
                  <span className="block p-3 text-sm font-bold">
                    {item.caption || `${album.title} · ${index + 1}`}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            {!albums?.data.length && (
              <p className="py-10">
                Our first albums are on their way. Come back soon.
              </p>
            )}
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {albums?.data.map((item) => (
                <Link
                  key={item.id}
                  href={`/gallery/${encodeURIComponent(item.slug)}`}
                  className="overflow-hidden rounded-2xl border-2 border-ink bg-paper shadow-[4px_5px_0_#2A211C]"
                >
                  {item.cover ? (
                    <img
                      src={galleryImage(item.cover.thumbnailUrl)}
                      alt={item.cover.alt || item.title}
                      width={600}
                      height={600}
                      loading="lazy"
                      className="aspect-[4/3] w-full object-cover"
                    />
                  ) : (
                    <div className="aspect-[4/3] bg-blush" />
                  )}
                  <div className="p-5">
                    <h2 className="font-serif text-2xl">{item.title}</h2>
                    <p className="mt-2 text-sm">
                      {item.photoCount}{" "}
                      {item.photoCount === 1 ? "photo" : "photos"} · View album
                      →
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            {albums && albums.pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-5">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((x) => x - 1)}
                  className="disabled:opacity-40"
                >
                  ← Previous
                </button>
                <span>
                  {page} / {albums.pagination.totalPages}
                </span>
                <button
                  disabled={page >= albums.pagination.totalPages}
                  onClick={() => setPage((x) => x + 1)}
                  className="disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
        <dialog
          aria-label="Photo viewer"
          ref={dialog}
          onClose={() => setSelected(null)}
          className="fixed inset-0 m-auto max-h-[95dvh] w-[95vw] max-w-4xl overflow-auto rounded-2xl border-2 border-ink bg-paper p-4 text-ink backdrop:bg-black/75"
        >
          <button
            autoFocus
            type="button"
            onClick={() => dialog.current?.close()}
            className="mb-3 block min-h-11 rounded-full border border-ink px-4 ml-auto"
          >
            Close ×
          </button>
          {photo && (
            <>
              <img
                src={galleryImage(photo.url)}
                alt={photo.alt || photo.caption || album?.title}
                className="mx-auto max-h-[65dvh] w-full object-contain"
              />
              <p className="mt-4 text-center">
                {photo.caption || album?.title}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <button
                  disabled={selected === 0}
                  onClick={() => setSelected((x) => x! - 1)}
                  className="min-h-11 px-3 disabled:opacity-40"
                >
                  ← Previous
                </button>
                <span>
                  {selected! + 1} / {album!.photos.length}
                </span>
                <button
                  disabled={selected === album!.photos.length - 1}
                  onClick={() => setSelected((x) => x! + 1)}
                  className="min-h-11 px-3 disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </>
          )}
        </dialog>
      </div>
    </main>
  );
}
