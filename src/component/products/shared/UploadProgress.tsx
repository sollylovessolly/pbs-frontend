"use client";
import { useSyncExternalStore } from "react";
import { LuImage, LuRotateCw } from "react-icons/lu";
import { getUploadJobs, subscribeUploads } from "@/lib/commerce/production";
const empty: ReturnType<typeof getUploadJobs> = [];
export default function UploadProgress() {
  const jobs = useSyncExternalStore(
    subscribeUploads,
    getUploadJobs,
    () => empty,
  );
  const active = jobs.filter((j) => j.status === "uploading");
  const failed = jobs.filter((j) => j.status === "failed");
  if (!active.length && !failed.length) return null;
  return (
    <section
      className="mx-auto max-w-[1240px] px-5 pb-5 text-sm"
      aria-label="Photo uploads"
    >
      <div className="rounded-2xl border-2 border-ink bg-paper p-4 shadow-[3px_4px_0_#2A211C] sm:p-5">
        {active.length > 0 && (
          <div role="status" className="flex items-center gap-4">
            <div
              aria-hidden="true"
              className="relative flex h-14 w-14 shrink-0 items-center justify-center"
            >
              <span className="absolute inset-0 rounded-full border-2 border-blush border-t-burgundy motion-safe:animate-spin" />
              <span className="flex h-9 w-7 -rotate-6 items-start justify-center rounded-sm border border-ink bg-cream p-1 pb-2 shadow-[2px_2px_0_#2A211C]">
                <LuImage className="h-5 w-5 bg-blush text-burgundy" />
              </span>
            </div>
            <div>
              <p className="font-serif text-lg font-semibold text-burgundy">
                A little magic in the making…
              </p>
              <p className="mt-1 text-xs text-ink/65">
                Getting your photos ready for the cart.
              </p>
            </div>
          </div>
        )}
        {failed.length > 0 && (
          <div
            className={active.length ? "mt-4 border-t border-ink/15 pt-4" : ""}
          >
            <p role="alert" className="font-bold text-burgundy">
              {failed.length === 1
                ? "One photo needs another try."
                : `${failed.length} photos need another try.`}
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {failed.map((job, i) => (
                <li key={job.key}>
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink bg-cream px-4 py-2 text-xs font-bold hover:bg-blush focus-visible:outline-2 focus-visible:outline-burgundy"
                    onClick={job.retry}
                  >
                    <LuRotateCw aria-hidden="true" className="h-4 w-4" />
                    Retry this file<span className="sr-only"> {i + 1}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
