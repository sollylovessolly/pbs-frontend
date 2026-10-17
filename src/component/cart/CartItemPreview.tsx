"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import type { CartItem } from "@/types/cart";

export default function CartItemPreview({ item }: { item: CartItem }) {
  const sources = [
    ...new Set(
      [
        item.previewUrl,
        item.customization?.previewUrl,
        item.productType === "photostrip"
          ? item.customization?.finalPngUrl
          : undefined,
      ].filter((src): src is string => Boolean(src)),
    ),
  ];
  const [index, setIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);
  return index < sources.length ? (
    <img
      key={`${index}-${attempt}`}
      src={sources[index]}
      alt={`${item.name} preview`}
      onError={() => setIndex((n) => n + 1)}
      className="h-full w-full object-contain"
    />
  ) : (
    <div className="flex h-full flex-col items-center justify-center gap-1 p-1 text-center text-[10px]">
      <span>Preview unavailable</span>
      <button
        type="button"
        className="font-bold underline"
        onClick={() => {
          setIndex(0);
          setAttempt((n) => n + 1);
        }}
      >
        Retry preview
      </button>
    </div>
  );
}
