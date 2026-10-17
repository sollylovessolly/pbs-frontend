/* eslint-disable @next/next/no-img-element */
import type { Review } from "@/lib/reviews/types";
import { galleryImage } from "@/lib/gallery/types";
export default function ReviewCards({ reviews }: { reviews: Review[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {reviews.map((review) => (
        <article
          key={review.id}
          className="relative flex min-w-0 flex-col overflow-hidden rounded-sm border-2 border-ink bg-burgundy p-6 text-cream shadow-[4px_5px_0_rgba(42,33,28,0.18)] sm:p-7"
        >
          <div
            aria-hidden="true"
            className="mb-2 flex items-center justify-between"
          >
            <span className="font-serif text-6xl leading-none opacity-60">
              “
            </span>
          </div>
          {review.rating > 0 && (
            <p
              aria-label={`${review.rating} out of 5 stars`}
              className="text-xl tracking-widest"
            >
              {"★".repeat(Math.max(0, Math.min(5, review.rating)))}
              {"☆".repeat(Math.max(0, 5 - review.rating))}
            </p>
          )}
          <blockquote className="mt-2 flex-1 whitespace-pre-wrap break-words text-base leading-7">
            {review.text}
          </blockquote>
          {review.photos.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {review.photos.map((photo, index) => (
                <a
                  key={photo.id}
                  href={galleryImage(photo.url)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open photo ${index + 1} from ${review.displayName}'s review`}
                >
                  <img
                    src={galleryImage(photo.thumbnailUrl)}
                    alt={`Customer photo ${index + 1} shared by ${review.displayName}`}
                    width={200}
                    height={200}
                    loading="lazy"
                    className="aspect-square w-full rounded-lg object-cover"
                  />
                </a>
              ))}
            </div>
          )}
          <div className="mt-6 flex items-center gap-3 border-t border-current/25 pt-4">
            <p className="font-bold">{review.displayName}</p>
          </div>
          {review.verifiedPurchase && (
            <p className="mt-2 text-xs font-semibold">Verified purchase</p>
          )}
        </article>
      ))}
    </div>
  );
}
