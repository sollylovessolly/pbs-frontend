import type { CartItem } from "@/types/cart";
import { resolveArtworkUrl } from "../api/client";

export function restoreCart(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is CartItem =>
        item != null &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        typeof item.previewUrl === "string" &&
        [
          "polaroid",
          "photostrip",
          "vintage-letter",
          "phone-case",
          "album",
        ].includes(item.productType) &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0 &&
        typeof item.unitPrice === "number" &&
        Number.isFinite(item.unitPrice) &&
        item.unitPrice >= 0 &&
        typeof item.editHref === "string" &&
        item.editHref.startsWith("/products/"),
    )
    .map((item) => ({
      ...item,
      previewUrl: resolveArtworkUrl(item.previewUrl),
      ...(item.customization
        ? {
            customization: Object.fromEntries(
              Object.entries(item.customization).map(([key, entry]) => [
                key,
                ["previewUrl", "finalPngUrl", "finalPdfUrl"].includes(key) &&
                typeof entry === "string"
                  ? resolveArtworkUrl(entry)
                  : entry,
              ]),
            ),
          }
        : {}),
    }));
}

export function cartPreview(item: CartItem): string {
  if (
    item.previewUrl.length <= 350_000 &&
    /^data:image\/(jpeg|png|webp);base64,/.test(item.previewUrl)
  )
    return item.previewUrl;
  if (
    item.customization?.previewUrl &&
    /^https?:\/\//.test(item.customization.previewUrl)
  )
    return item.customization.previewUrl;
  if (
    !item.previewUrl.startsWith("data:") &&
    !item.previewUrl.startsWith("blob:")
  )
    return item.previewUrl;
  const images = {
    polaroid: "polaroid-prints.jpg",
    photostrip: "photo-strips.jpg",
    "vintage-letter": "vintage-letter.jpg",
    "phone-case": "polaroid-phonecase.jpeg",
    album: "photo-album.jpg",
  };
  return `/images/categories/${images[item.productType]}`;
}
