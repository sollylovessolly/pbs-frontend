/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { showcasePhotos } from "@/lib/gallery/albums";
export default function ProductGallery({ category }: { category: string }) {
  const photos = showcasePhotos(category);
  if (!photos.length) return null;
  return (
    <section className="mx-auto max-w-site px-5 py-12">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="font-serif text-3xl">Made with love</h2>
        <Link href="/gallery/product-showcase" className="font-bold underline">
          View showcase →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {photos.slice(0, 6).map((photo) => (
          <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer">
            <img
              src={photo.thumbnailUrl}
              alt={photo.alt}
              width={1200}
              height={1200}
              loading="lazy"
              className="aspect-square w-full rounded-xl border-2 border-ink object-cover"
            />
            <p className="mt-2 text-sm">{photo.caption}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
