/* eslint-disable @next/next/no-img-element */
import type { Review } from "@/lib/reviews/types";
import { galleryImage } from "@/lib/gallery/types";
export default function ReviewCards({ reviews }: { reviews: Review[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {reviews.map((review) => (
        <article
          key={review.id}
          className="min-w-0 rounded-2xl border-2 border-ink bg-paper p-5 shadow-soft"
        >
          {review.rating > 0 && (
            <p
              aria-label={`${review.rating} out of 5 stars`}
              className="text-xl tracking-widest text-burgundy"
            >
              {"★".repeat(Math.max(0, Math.min(5, review.rating)))}
              {"☆".repeat(Math.max(0, 5 - review.rating))}
            </p>
          )}
          <p className="mt-4 whitespace-pre-wrap break-words leading-7">
            {review.text}
          </p>
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
          <p className="mt-5 font-bold">{review.displayName}</p>
          {review.verifiedPurchase && (
            <p className="mt-1 text-xs text-burgundy">Verified purchase</p>
          )}
        </article>
      ))}
    </div>
  );
}
