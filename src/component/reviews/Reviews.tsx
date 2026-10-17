"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { apiRequest, ApiError } from "@/lib/api/client";
import type { ReviewPage } from "@/lib/reviews/types";
import ReviewCards from "./ReviewCards";

type Selection = { file: File; url: string };
export default function Reviews({ preview = false }: { preview?: boolean }) {
  const [result, setResult] = useState<ReviewPage | null>(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    apiRequest<ReviewPage>(`/reviews?page=${page}&limit=${preview ? 3 : 12}`, {
      signal: controller.signal,
    })
      .then((data) => {
        if (!Array.isArray(data.data) || !data.pagination)
          throw new Error("Invalid reviews response");
        setResult(data);
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(
            e instanceof ApiError && e.status === 404
              ? "Customer reviews are coming soon."
              : "Reviews couldn’t load. Please try again.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [page, preview, attempt]);
  return (
    <section className="bg-cream px-5 py-14 text-ink">
      <div className="mx-auto max-w-site">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          {preview ? (
            <h2 className="font-serif text-3xl sm:text-4xl">
              Loved, kept, gifted
            </h2>
          ) : (
            <h1 className="font-serif text-4xl">Your PBS stories</h1>
          )}
          <Link
            href={preview ? "/reviews" : "#write-review"}
            className="rounded-lg border-2 border-ink bg-paper px-4 py-3 font-bold shadow-button"
          >
            {preview ? "Read & write reviews →" : "Write a review →"}
          </Link>
        </div>
        {loading ? (
          <p role="status">Loading reviews…</p>
        ) : error ? (
          <p role="status">
            {error}{" "}
            <button
              className="font-bold underline"
              onClick={() => {
                setError("");
                setLoading(true);
                setAttempt((x) => x + 1);
              }}
            >
              Retry
            </button>
          </p>
        ) : result?.data.length ? (
          <ReviewCards reviews={result.data} />
        ) : (
          <p>
            Have a PBS keepsake or an event memory? We’d love to hear your
            experience.
          </p>
        )}
        {!preview && result && result.pagination.totalPages > 1 && (
          <div className="my-6 flex items-center gap-5">
            <button
              disabled={page === 1 || loading}
              onClick={() => {
                setError("");
                setLoading(true);
                setPage((x) => x - 1);
              }}
            >
              ← Previous
            </button>
            <span>
              {page} / {result.pagination.totalPages}
            </span>
            <button
              disabled={page >= result.pagination.totalPages || loading}
              onClick={() => {
                setError("");
                setLoading(true);
                setPage((x) => x + 1);
              }}
            >
              Next →
            </button>
          </div>
        )}
        {!preview && <ReviewForm />}
      </div>
    </section>
  );
}
function ReviewForm() {
  const [photos, setPhotos] = useState<Selection[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const lock = useRef(false);
  const requestKey = useRef("");
  const urls = useRef(new Set<string>());
  useEffect(() => {
    const current = urls.current;
    return () => current.forEach((url) => URL.revokeObjectURL(url));
  }, []);
  const field =
    "mt-2 w-full min-w-0 rounded-xl border-2 border-ink bg-cream p-3 text-base";
  function choose(files: File[]) {
    if (photos.length + files.length > 3) {
      setError("Choose up to 3 photos in total.");
      return;
    }
    if (
      files.some(
        (file) =>
          !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
          file.size > 5 * 1024 * 1024,
      )
    ) {
      setError("Use JPG, PNG or WebP photos up to 5 MB each.");
      return;
    }
    setError("");
    requestKey.current = "";
    setPhotos((current) => [
      ...current,
      ...files.map((file) => {
        const url = URL.createObjectURL(file);
        urls.current.add(url);
        return { file, url };
      }),
    ]);
  }
  return (
    <section
      id="write-review"
      className="mx-auto mt-14 max-w-2xl scroll-mt-28 rounded-2xl border-2 border-ink bg-paper p-5 sm:p-8"
    >
      <h2 className="font-serif text-3xl">Tell us how it went</h2>
      <p className="mt-3 text-sm leading-6">
        Share your honest experience. Photos are optional. Reviews are checked
        before appearing here; your contact details stay private.
      </p>
      {success ? (
        <p role="status" className="mt-6 rounded-xl bg-blush p-5">
          Thank you! Your review has been submitted for approval.
        </p>
      ) : (
        <form
          className="mt-6 space-y-5"
          onChange={() => {
            requestKey.current = "";
          }}
          onSubmit={async (event) => {
            event.preventDefault();
            if (lock.current) return;
            lock.current = true;
            setBusy(true);
            setError("");
            const body = new FormData(event.currentTarget);
            body.delete("reviewPhotos");
            const orderNumber = String(body.get("orderNumber") || "").trim();
            if (orderNumber) body.set("orderNumber", orderNumber);
            else body.delete("orderNumber");
            if (!requestKey.current) requestKey.current = crypto.randomUUID();
            body.set("requestKey", requestKey.current);
            body.set("publicationConsent", "true");
            body.set("consentVersion", "review-publication-v1");
            photos.forEach((photo) => body.append("photos", photo.file));
            try {
              const response = await apiRequest<{
                id: string;
                status: "PENDING";
              }>("/reviews", { method: "POST", body });
              if (response.status !== "PENDING")
                throw new Error(
                  "We couldn’t confirm your submission. Please retry.",
                );
              setSuccess(true);
              photos.forEach((p) => {
                URL.revokeObjectURL(p.url);
                urls.current.delete(p.url);
              });
              setPhotos([]);
            } catch (e) {
              setError(
                e instanceof ApiError && [404, 501].includes(e.status)
                  ? "Review submissions aren’t available yet. Please try again later."
                  : e instanceof Error
                    ? e.message
                    : "Couldn’t submit your review. Please retry.",
              );
            } finally {
              lock.current = false;
              setBusy(false);
            }
          }}
        >
          <fieldset disabled={busy} className="min-w-0 space-y-5">
            <label className="block text-sm font-bold">
              Display name
              <input
                required
                name="displayName"
                maxLength={80}
                className={field}
                placeholder="e.g. Ada O."
              />
            </label>
            <label className="block text-sm font-bold">
              Your rating
              <select name="rating" required defaultValue="" className={field}>
                <option value="" disabled>
                  Choose a rating
                </option>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "star" : "stars"}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-bold">
              Your review
              <textarea
                name="text"
                required
                minLength={10}
                maxLength={2000}
                rows={4}
                className={field}
              />
            </label>
            <label className="block text-sm font-bold">
              Phone number (private)
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                maxLength={25}
                className={field}
              />
            </label>
            <label className="block text-sm font-bold">
              Order number (optional, private)
              <input
                name="orderNumber"
                maxLength={100}
                className={field}
                placeholder="PBS-…"
              />
            </label>
            <label className="block text-sm font-bold">
              Add up to 3 photos (optional)
              <input
                name="reviewPhotos"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="mt-3 block w-full max-w-full text-sm"
                onChange={(e) => {
                  choose(Array.from(e.target.files || []));
                  e.target.value = "";
                }}
              />
              <span className="mt-2 block text-xs font-normal">
                JPG, PNG or WebP · 5 MB per photo
              </span>
            </label>
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {photos.map((photo, index) => (
                  <div key={photo.url}>
                    <img
                      src={photo.url}
                      alt={`Selected review photo ${index + 1}`}
                      className="aspect-square w-full rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      className="mt-2 min-h-10 text-xs font-bold underline"
                      onClick={() => {
                        URL.revokeObjectURL(photo.url);
                        urls.current.delete(photo.url);
                        setPhotos((p) =>
                          p.filter((item) => item.url !== photo.url),
                        );
                        requestKey.current = "";
                      }}
                    >
                      Remove photo {index + 1}
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label className="flex items-start gap-3 text-sm leading-6">
              <input
                required
                type="checkbox"
                name="publicationConsent"
                className="mt-1.5"
              />
              <span>
                I agree to publish my display name, review and attached photos
                on this website. I have permission from anyone shown. This does
                not give permission to repost them on social media.
              </span>
            </label>
            <p className="text-xs">
              For removal requests,{" "}
              <a href="https://wa.me/2347088694074" className="underline">
                contact Solly
              </a>
              .{" "}
              <Link href="/privacy" className="underline">
                Privacy policy
              </Link>
            </p>
            {error && (
              <p role="alert" className="text-sm text-burgundy">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="w-full rounded-xl border-2 border-ink bg-burgundy px-5 py-3 font-bold text-cream disabled:opacity-50"
            >
              {busy ? "Sending your review…" : "Submit review"}
            </button>
          </fieldset>
        </form>
      )}
    </section>
  );
}
