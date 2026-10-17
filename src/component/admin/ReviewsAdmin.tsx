"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { adminRequest } from "@/lib/admin/api";
import { ApiError } from "@/lib/api/client";
import type { AdminReview } from "@/lib/reviews/types";
import type { PageResult } from "@/lib/admin/types";
import { galleryImage } from "@/lib/gallery/types";
import { Button, Feedback, PageHeader, Panel } from "./primitives";
export default function ReviewsAdmin() {
  const [filter, setFilter] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PageResult<AdminReview> | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const lock = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    adminRequest<PageResult<AdminReview>>("/admin/reviews", {
      query: { status: filter, page, limit: 20 },
      signal: controller.signal,
    })
      .then(setResult)
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(
            e instanceof ApiError && e.status === 404
              ? "Review moderation isn’t connected yet. The backend review endpoints need to be added."
              : e.message,
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [filter, page, revision]);
  function refresh() {
    setError("");
    setLoading(true);
    setRevision((x) => x + 1);
  }
  async function moderate(
    review: AdminReview,
    status: "PUBLISHED" | "REJECTED" | "PENDING" | "DELETE",
  ) {
    if (lock.current) return;
    if (
      status === "DELETE" &&
      !window.confirm(
        "Permanently delete this review and its photos? This cannot be undone.",
      )
    )
      return;
    let moderationReason: string | null = null;
    if (status === "REJECTED") {
      moderationReason = window.prompt(
        "Why is this review being hidden? Use moderation for spam, privacy or inappropriate content—not a low rating.",
      );
      if (moderationReason === null) return;
      if (!moderationReason.trim()) {
        setError("Add a moderation reason.");
        return;
      }
    }
    lock.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await adminRequest(`/admin/reviews/${encodeURIComponent(review.id)}`, {
        method: status === "DELETE" ? "DELETE" : "PATCH",
        body: {
          expectedVersion: review.version,
          ...(status === "DELETE" ? {} : { status, moderationReason }),
        },
      });
      setMessage(
        status === "DELETE"
          ? "Review deleted."
          : status === "PUBLISHED"
            ? "Review published."
            : "Review hidden from the website.",
      );
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn’t update this review.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        title="Customer reviews"
        description="Review customer stories and photos before they appear publicly. Publish honest feedback, including lower ratings."
      />
      <div className="adm-panel">
        <label>
          Show reviews
          <select
            className="adm-input"
            disabled={busy}
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
              setError("");
              setLoading(true);
            }}
          >
            {["PENDING", "PUBLISHED", "REJECTED"].map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
      </div>
      <Feedback error={error} message={message} />
      {loading ? (
        <p role="status">Loading reviews…</p>
      ) : error ? (
        <Button onClick={refresh}>Retry</Button>
      ) : (
        <>
          <div className="grid gap-5 lg:grid-cols-2">
            {result?.data.map((review) => (
              <Panel key={review.id} title={review.displayName}>
                <p className="font-bold text-burgundy">
                  {review.rating}/5 stars · {review.status.toLowerCase()}
                </p>
                <p className="my-4 whitespace-pre-wrap break-words">
                  {review.text}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {review.photos.map((photo, index) => (
                    <a
                      key={photo.id}
                      href={galleryImage(photo.url)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={galleryImage(photo.thumbnailUrl)}
                        alt={`Review photo ${index + 1}`}
                        className="aspect-square w-full rounded-lg object-cover"
                      />
                    </a>
                  ))}
                </div>
                <p className="mt-4 text-sm">
                  Private contact: {review.phone}
                  <br />
                  Order: {review.orderNumber || "Not supplied"}
                  <br />
                  Permission to publish:{" "}
                  {review.publicationConsent ? "Confirmed" : "Not given"}
                </p>
                {review.moderationReason && (
                  <p className="mt-2 text-sm">
                    Moderation note: {review.moderationReason}
                  </p>
                )}
                <div className="adm-actions mt-4">
                  <Button
                    disabled={
                      busy ||
                      !review.publicationConsent ||
                      review.status === "PUBLISHED"
                    }
                    onClick={() => void moderate(review, "PUBLISHED")}
                  >
                    Publish review
                  </Button>
                  {review.status === "PUBLISHED" && (
                    <Button
                      disabled={busy}
                      onClick={() => void moderate(review, "PENDING")}
                    >
                      Unpublish
                    </Button>
                  )}
                  <Button
                    disabled={busy || review.status === "REJECTED"}
                    onClick={() => void moderate(review, "REJECTED")}
                  >
                    Reject / hide
                  </Button>
                  <Button
                    disabled={busy}
                    className="secondary"
                    onClick={() => void moderate(review, "DELETE")}
                  >
                    Delete
                  </Button>
                </div>
              </Panel>
            ))}
          </div>
          {!result?.data.length && (
            <Panel>
              <p>No {filter.toLowerCase()} reviews.</p>
            </Panel>
          )}
          {result && result.pagination.totalPages > 1 && (
            <div className="adm-actions mt-5">
              <Button
                disabled={page === 1 || busy}
                onClick={() => {
                  setLoading(true);
                  setPage((x) => x - 1);
                }}
              >
                Previous
              </Button>
              <span>
                Page {page} of {result.pagination.totalPages}
              </span>
              <Button
                disabled={page >= result.pagination.totalPages || busy}
                onClick={() => {
                  setLoading(true);
                  setPage((x) => x + 1);
                }}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}
