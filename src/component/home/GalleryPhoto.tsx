"use client";
import Image from "next/image";
import { useState } from "react";

export default function GalleryPhoto({
  src,
  alt,
  fallback,
}: {
  src: string;
  alt: string;
  fallback: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <Image
      sizes="(max-width: 639px) 145px, (max-width: 1023px) 180px, 215px"
      src={failed ? fallback : src}
      alt={failed ? "PolaroidsBySolly product preview" : alt}
      loading="lazy"
      decoding="async"
      width={600}
      height={600}
      onError={() => setFailed(true)}
      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
    />
  );
}
