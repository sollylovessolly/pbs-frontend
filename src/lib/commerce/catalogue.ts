import type {
  BackendProduct,
  BackendProductCategory,
  BackendVariant,
} from "../api/types";
export const productAssets: Record<
  BackendProductCategory,
  { path: string; image: string }
> = {
  POLAROID: {
    path: "polaroids",
    image: "/images/gallery/product-showcase/polaroids-prints.jpeg",
  },
  PHOTOSTRIP: {
    path: "photostrips",
    image: "/images/gallery/product-showcase/photostrips-keepsakes.jpeg",
  },
  VINTAGE_LETTER: {
    path: "vintage-letters",
    image: "/images/gallery/product-showcase/vintage-letters-burnt-edges.jpeg",
  },
  PHONE_CASE: {
    path: "phone-cases",
    image: "/images/products/phone-case.jpg",
  },
  ALBUM: { path: "albums", image: "/images/products/albums.jpg" },
};
export const money = (amount: number | string) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(
    Number(amount),
  );
export const available = (v: BackendVariant) =>
  v.isActive &&
  v.inStock &&
  (v.availableQuantity === null || v.availableQuantity > 0);
export function validateCart(
  items: Array<{ variantSku?: string; quantity: number }>,
  products: BackendProduct[],
) {
  const counts = new Map<string, number>();
  for (const item of items) {
    if (!item.variantSku)
      throw new Error(
        "An older cart item needs to be customized again. Remove it and add it from the shop.",
      );
    if (!Number.isInteger(item.quantity) || item.quantity < 1)
      throw new Error("Choose a valid quantity.");
    counts.set(
      item.variantSku,
      (counts.get(item.variantSku) ?? 0) + item.quantity,
    );
  }
  for (const [sku, quantity] of counts) {
    const variant = products
      .filter((p) => p.isActive)
      .flatMap((p) => p.variants)
      .find((v) => v.sku === sku);
    if (!variant || !available(variant))
      throw new Error(
        `${variant?.name ?? "An item"} is no longer available. Please update your cart.`,
      );
    if (
      variant.availableQuantity !== null &&
      quantity > variant.availableQuantity
    )
      throw new Error(
        `Only ${variant.availableQuantity} of ${variant.name} are available across your cart.`,
      );
  }
}
export function safeUrl(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    const u = new URL(value);
    return ["https:", "http:"].includes(u.protocol) &&
      !u.username &&
      !u.password
      ? u.href
      : null;
  } catch {
    return null;
  }
}
