import packages from "@/data/packages.json";
import type { CartItem } from "@/types/cart";
export const giftPackages = packages;
export type GiftPackage = (typeof packages)[number];
export const getPackage = (id?: string) =>
  giftPackages.find((p) => p.id === id);
export function packageContents(p: GiftPackage) {
  return [
    `${p.polaroids} custom Polaroid prints`,
    `${p.cases} Polaroid phone ${p.cases === 1 ? "case" : "cases"}`,
    ...(p.strips
      ? [`${p.strips} ${p.strips === 1 ? "photostrip" : "photostrips"}`]
      : []),
    "Custom vintage letter",
    "Premium protective packaging",
    ...(p.mini ? ["Free mini photostrip"] : []),
  ];
}
export function validatePackageItems(id: string, items: CartItem[]) {
  const p = getPackage(id);
  if (!p) throw new Error("Choose a valid package.");
  const counts = new Map<string, number>();
  for (const item of items) {
    if (item.packageGroupId)
      throw new Error("An item already belongs to a package.");
    if (!Number.isInteger(item.quantity) || item.quantity < 1)
      throw new Error("Choose a valid quantity.");
    if (
      item.productType === "phone-case" &&
      item.customization?.package !== "CASE_ONLY"
    )
      throw new Error(
        "Choose Case Only for package phone cases; the package already includes your Polaroid prints.",
      );
    counts.set(
      item.productType,
      (counts.get(item.productType) ?? 0) + item.quantity,
    );
  }
  const expected: Record<string, number> = {
    polaroid: p.polaroids,
    "phone-case": p.cases,
    "vintage-letter": 1,
    photostrip: p.strips,
  };
  if (
    [...counts.keys()].some((key) => !(key in expected)) ||
    Object.entries(expected).some(
      ([key, count]) => (counts.get(key) ?? 0) !== count,
    )
  )
    throw new Error(
      "Select exactly the items listed in this package. Adjust quantities in your cart if needed.",
    );
  return p;
}
export function cartSubtotal(items: CartItem[]) {
  const groups = new Set<string>();
  return items.reduce((sum, item) => {
    if (!item.packageGroupId) return sum + item.unitPrice * item.quantity;
    if (groups.has(item.packageGroupId)) return sum;
    groups.add(item.packageGroupId);
    return (
      sum +
      (getPackage(item.packageId)?.price ?? item.unitPrice * item.quantity)
    );
  }, 0);
}
export function validateCartPackages(items: CartItem[]) {
  const groups = new Map<string, CartItem[]>();
  for (const item of items) {
    if (!!item.packageId !== !!item.packageGroupId)
      throw new Error("Please rebuild this package.");
    if (item.packageGroupId)
      groups.set(item.packageGroupId, [
        ...(groups.get(item.packageGroupId) ?? []),
        item,
      ]);
  }
  for (const group of groups.values()) {
    if (group.some((i) => i.packageId !== group[0].packageId))
      throw new Error("Please rebuild this package.");
    validatePackageItems(
      group[0].packageId!,
      group.map((i) => ({ ...i, packageGroupId: undefined })),
    );
  }
}
