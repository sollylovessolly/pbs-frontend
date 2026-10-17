"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api/client";
import { galleryImage, type FeaturedPhoto } from "@/lib/gallery/types";
import GalleryPhoto from "./GalleryPhoto";
import Button from "@/component/ui/Button";

const localItems = [
  {
    src: "/images/gallery/gallery-01.jpg",
    alt: "Polaroid prints from PolaroidsBySolly",
    fallback: "/images/products/polaroids.jpg",
  },
  {
    src: "/images/gallery/gallery-02.jpg",
    alt: "Photostrip keepsakes from PolaroidsBySolly",
    fallback: "/images/products/photostrips.jpg",
  },
  {
    src: "/images/gallery/gallery-03.jpg",
    alt: "A Polaroid station at an event",
    fallback: "/images/products/polaroids.jpg",
  },
  {
    src: "/images/gallery/gallery-04.jpg",
    alt: "A personalised vintage letter",
    fallback: "/images/products/vintage-letters.jpg",
  },
  {
    src: "/images/gallery/gallery-05.jpg",
    alt: "A Polaroid phone case",
    fallback: "/images/products/phone-case.jpg",
  },
  {
    src: "/images/gallery/gallery-06.jpg",
    alt: "A photo album filled with memories",
    fallback: "/images/products/albums.jpg",
  },
].map((item, index) => ({
  ...item,
  href: "/gallery",
  title: [
    "Polaroid prints",
    "Photostrips",
    "Station setups",
    "Vintage letters",
    "Phone cases",
    "Photo albums",
  ][index],
}));

const GalleryItem = ({
  item,
}: {
  item: (typeof localItems)[number];
  index: number;
}) => (
  <Link
    href={item.href}
    className="group relative aspect-square w-[145px] shrink-0 overflow-hidden rounded-[10px] border-2 border-ink bg-beige sm:w-[180px] lg:w-[215px]"
  >
    <GalleryPhoto {...item} />
    <span className="absolute inset-x-0 bottom-0 bg-ink/80 px-3 py-2 text-xs font-bold text-cream">
      {item.title}
    </span>
    <span
      aria-hidden="true"
      className="absolute bottom-2 right-2 text-base text-white drop-shadow transition-transform duration-150 group-hover:scale-125"
    >
      ♡
    </span>
  </Link>
);

const Gallery = () => {
  const [galleryItems, setGalleryItems] = useState(localItems);
  useEffect(() => {
    const controller = new AbortController();
    apiRequest<FeaturedPhoto[]>("/gallery/featured?limit=12", {
      signal: controller.signal,
    })
      .then((photos) =>
        setGalleryItems(
          photos.map((photo) => ({
            src: galleryImage(photo.thumbnailUrl),
            alt: photo.alt || photo.caption || photo.albumTitle,
            fallback: "/images/products/polaroids.jpg",
            href: `/gallery/${encodeURIComponent(photo.albumSlug)}`,
            title: photo.albumTitle,
          })),
        ),
      )
      .catch(() => {
        /* Keep the existing local gallery while the gallery API is unavailable. */
      });
    return () => controller.abort();
  }, []);
  return (
    <section className="overflow-hidden bg-cream py-12 sm:py-16 lg:py-[72px]">
      <div className="mx-auto max-w-site px-4 sm:px-5 md:px-7">
        <div className="mb-7 flex items-end justify-between gap-4 sm:mb-10 lg:mb-12">
          <h2 className="max-w-[180px] font-display text-2xl font-semibold leading-tight text-ink sm:max-w-none sm:text-4xl">
            From our gallery
          </h2>

          <div className="shrink-0">
            <Button href="/gallery" variant="ghost" size="small">
              <span className="sm:hidden">View gallery</span>

              <span className="hidden sm:inline">View gallery</span>
            </Button>
          </div>
        </div>
      </div>

      {!galleryItems.length && (
        <p className="mx-auto max-w-site px-5">
          New albums are on their way. Explore the gallery for more.
        </p>
      )}
      {/* Moving carousel */}
      <div className="gallery-marquee overflow-hidden">
        <div className="gallery-marquee-track flex w-max items-center">
          {/* First copy */}
          <div className="flex shrink-0 gap-3 pr-3 sm:gap-4 sm:pr-4">
            {galleryItems.map((item, index) => (
              <GalleryItem key={`gallery-${index}`} item={item} index={index} />
            ))}
          </div>

          {/* Duplicate copy for seamless looping */}
          <div
            aria-hidden="true"
            className="flex shrink-0 gap-3 pr-3 sm:gap-4 sm:pr-4"
          >
            {galleryItems.map((item, index) => (
              <GalleryItem
                key={`gallery-duplicate-${index}`}
                item={item}
                index={index}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Gallery;
