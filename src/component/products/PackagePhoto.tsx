import Image from "next/image";
import { getPackage } from "@/lib/commerce/packages";
import { packageImages } from "@/data/package-images";
export default function PackagePhoto({ id }: { id: string }) {
  const p = getPackage(id);
  const custom = packageImages[id];
  if (custom)
    return (
      <div className="absolute inset-0">
        <Image
          src={custom}
          alt={`${p?.name ?? "Gift"} package`}
          fill
          sizes="(max-width: 639px) 100vw, 33vw"
          className="object-cover"
        />
      </div>
    );
  const photos = [
    {
      src: "/images/gallery/product-showcase/polaroids-prints.jpeg",
      alt: "Custom Polaroid prints",
    },
    { src: "/images/products/phone-case.jpg", alt: "Polaroid phone case" },
    {
      src: "/images/gallery/product-showcase/vintage-letters-burnt-edges.jpeg",
      alt: "Custom vintage letter",
    },
    ...(p?.strips
      ? [
          {
            src: "/images/gallery/product-showcase/photostrips-keepsakes.jpeg",
            alt: "Custom photostrips",
          },
        ]
      : []),
  ];
  return (
    <div
      className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-1 bg-beige p-1"
      aria-label={`${p?.name ?? "Gift"} package keepsakes`}
    >
      {photos.map((photo, index) => (
        <div
          key={photo.src}
          className={`relative min-h-0 overflow-hidden ${photos.length === 3 && index === 0 ? "row-span-2" : ""}`}
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(max-width: 639px) 50vw, 20vw"
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}
