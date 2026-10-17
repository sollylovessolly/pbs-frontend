"use client";
import { createContext, useContext, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import {
  getPackage,
  packageQuantity,
  packageStepRemaining,
} from "@/lib/commerce/packages";
import type { NewCartItem } from "@/types/cart";
import type { BackendProductCategory } from "@/lib/api/types";
const types: Record<BackendProductCategory, string> = {
  POLAROID: "polaroid",
  PHONE_CASE: "phone-case",
  VINTAGE_LETTER: "vintage-letter",
  PHOTOSTRIP: "photostrip",
  ALBUM: "album",
};
type Step = {
  draftId: string;
  remaining: number;
  returnHref: string;
  assertQuantity: (quantity: number) => void;
  saveItems: (items: NewCartItem[]) => void;
};
const Context = createContext<Step | null>(null);
export const usePackageStep = () => useContext(Context);
export default function PackageStepProvider({
  category,
  children,
}: {
  category: BackendProductCategory;
  children: ReactNode;
}) {
  const params = useSearchParams();
  const { draftItems, addItems, isReady } = useCart();
  const id = params?.get("giftPackage") ?? "";
  const draftId = params?.get("packageDraft") ?? "";
  const p = getPackage(id);
  const productType = types[category];
  if (!id && !draftId) return <>{children}</>;
  if (
    !p ||
    !/^[a-zA-Z0-9_-]{1,80}$/.test(draftId) ||
    !packageQuantity(id, productType)
  )
    return (
      <p role="alert" className="mx-auto max-w-site p-6">
        This package link is invalid.{" "}
        <Link href="/products/packages" className="underline">
          Choose a package
        </Link>
        .
      </p>
    );
  const remaining = packageStepRemaining(id, draftId, productType, draftItems);
  const returnHref = `/products/packages/${id}?draft=${encodeURIComponent(draftId)}`;
  const assertQuantity = (quantity: number) => {
    if (
      !isReady ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > remaining
    )
      throw new Error(
        `This package has room for ${remaining} more ${productType === "polaroid" ? "Polaroid prints" : "items"}. Please reduce your selection.`,
      );
  };
  const saveItems = (items: NewCartItem[]) => {
    assertQuantity(items.reduce((sum, i) => sum + i.quantity, 0));
    if (
      items.some(
        (i) =>
          i.productType !== productType ||
          (productType === "phone-case" &&
            i.customization?.package !== "CASE_ONLY"),
      )
    )
      throw new Error(
        "Choose Case Only for package phone cases; your Polaroid prints are included separately.",
      );
    addItems(
      items.map((i) => ({
        ...i,
        packageDraftId: draftId,
        packageDraftTemplateId: id,
      })),
    );
  };
  return (
    <Context.Provider
      value={{ draftId, remaining, returnHref, assertQuantity, saveItems }}
    >
      <div className="mx-auto max-w-site px-5 py-4">
        <div className="rounded-xl border-2 border-ink bg-blush p-4">
          <Link href={returnHref} className="font-bold underline">
            ← Continue {p.name}
          </Link>
          <p className="mt-2 text-sm">
            {remaining}{" "}
            {productType === "polaroid"
              ? "Polaroid prints"
              : productType === "photostrip"
                ? "photostrips"
                : productType === "phone-case"
                  ? "phone cases"
                  : "vintage letters"}{" "}
            remaining in your package. These keepsakes are included in your
            fixed package price. Saving returns you to finish the other
            keepsakes.
            {category === "PHONE_CASE"
              ? " Select Case Only; your package prints are created separately."
              : ""}
          </p>
        </div>
      </div>
      {isReady ? (
        remaining ? (
          children
        ) : (
          <p className="mx-auto max-w-site px-5 py-10">
            This part of your package is ready.{" "}
            <Link href={returnHref} className="font-bold underline">
              Continue your package →
            </Link>
          </p>
        )
      ) : (
        <p className="p-5">Loading package…</p>
      )}
    </Context.Provider>
  );
}
