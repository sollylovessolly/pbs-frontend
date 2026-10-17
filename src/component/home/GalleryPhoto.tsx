"use client";
/* eslint-disable @next/next/no-img-element */
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
    <img
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
