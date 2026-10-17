import type { BackendProduct, BackendVariant } from "./types";
export type PublicCatalogueProduct = Omit<
  BackendProduct,
  "isActive" | "variants"
> & {
  isActive?: boolean;
  variants: Array<Omit<BackendVariant, "isActive"> & { isActive?: boolean }>;
};
// Public product endpoints already exclude inactive products and variants.
// The current safe response omits isActive; older responses may include it.
// Keep explicit false values and all stock/price fields unchanged.
export function normalizeCatalogueProduct(
  product: PublicCatalogueProduct,
): BackendProduct {
  return {
    ...product,
    isActive: product.isActive ?? true,
    variants: product.variants.map((variant) => ({
      ...variant,
      isActive: variant.isActive ?? true,
    })),
  };
}
export function normalizeCatalogue(
  products: PublicCatalogueProduct[],
): BackendProduct[] {
  const order = [
    "POLAROID",
    "PHOTOSTRIP",
    "VINTAGE_LETTER",
    "PHONE_CASE",
    "ALBUM",
  ];
  return products
    .map(normalizeCatalogueProduct)
    .sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));
}
