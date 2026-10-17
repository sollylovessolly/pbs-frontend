"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { getPackage } from "@/lib/commerce/packages";
import CartItemPreview from "./CartItemPreview";
import TornDivider from "../ui/TornDivider";

const formatPrice = (amount: number) => {
  return `₦${amount.toLocaleString("en-NG")}`;
};

const CartPage = () => {
  const {
    items,
    draftItems,
    cartCount,
    subtotal,
    isReady,
    updateQuantity,
    removeItem,
  } = useCart();

  const [promoCode, setPromoCode] = useState("");
  const [promoMessage, setPromoMessage] = useState("");

  const hasSlowItem = items.some((item) => !item.isFast);

  const handlePromoCode = () => {
    if (!promoCode.trim()) {
      setPromoMessage("Enter a promo code first.");
      return;
    }

    setPromoMessage("Code saved. Your discount will be checked at checkout.");
  };

  if (!isReady) {
    return (
      <main className="min-h-[60vh] bg-cream px-5 py-20 text-ink">
        <p className="text-center text-sm font-semibold text-ink/55">
          Loading your cart…
        </p>
      </main>
    );
  }

  return (
    <main className="bg-cream pb-28 text-ink lg:pb-0">
      {/* Page header */}
      <section className="border-b-2 border-ink bg-burgundy text-cream pb-15">
        <div className="mx-auto max-w-[1240px] px-5 py-10 md:px-7 text-cream">
          <div className="mb-4 text-sm font-semibold text-cream/40">
            <Link href="/" className="transition hover:text-burgundy-deep">
              Home
            </Link>

            <span className="mx-2">/</span>
            <span>Cart</span>
          </div>

          <span className="inline-flex -rotate-3 rounded-full border-2 border-ink bg-beige px-4 py-1 font-serif text-lg font-bold italic shadow-[3px_3px_0_#2A211C] text-ink">
            almost there
          </span>

          <h1 className="mt-5 font-serif text-4xl font-semibold md:text-5xl">
            Your Cart
          </h1>

          {cartCount > 0 && (
            <p className="mt-2 text-sm text-cream/40">
              {cartCount} {cartCount === 1 ? "print" : "prints"} in your cart
            </p>
          )}
        </div>
      </section>
      <TornDivider color="cream" />

      <section className="mx-auto grid max-w-[1240px] items-start gap-8 px-5 py-10 md:px-7 lg:grid-cols-[1.7fr_1fr] lg:py-14">
        {/* Cart items */}
        <div>
          {[...new Set(draftItems.map((i) => i.packageDraftId))].map(
            (draftId) => {
              const item = draftItems.find(
                (i) => i.packageDraftId === draftId,
              )!;
              return (
                <div
                  key={draftId}
                  className="mb-5 rounded-xl border-2 border-ink bg-blush p-4"
                >
                  <p className="font-bold">
                    Your {getPackage(item.packageDraftTemplateId)?.name} package
                    is still in progress.
                  </p>
                  <Link
                    href={`/products/packages/${item.packageDraftTemplateId}?draft=${draftId}`}
                    className="mt-2 inline-block font-bold underline"
                  >
                    Continue your package →
                  </Link>
                </div>
              );
            },
          )}
          {items.length === 0 ? (
            <div className="rounded-[18px] border-2 border-ink bg-paper px-6 py-16 text-center shadow-[0_6px_0_rgba(42,33,28,0.08)]">
              <div className="text-4xl">🛍️</div>

              <h2 className="mt-4 font-serif text-2xl font-semibold">
                Your cart is empty
              </h2>

              <p className="mt-2 text-sm leading-6 text-ink/60">
                Looks like you haven&apos;t added a keepsake yet.
              </p>

              <Link
                href="/products"
                className="mt-6 inline-flex rounded-full border-2 border-ink bg-burgundy px-6 py-3 text-sm font-bold text-cream shadow-[4px_4px_0_#2A211C] transition hover:-translate-x-0.5 hover:-translate-y-0.5"
              >
                Shop Products
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <article
                  key={item.id}
                  className="flex gap-4 rounded-[16px] border-2 border-ink bg-paper p-4 shadow-[0_6px_0_rgba(42,33,28,0.08)] sm:gap-5 sm:p-5"
                >
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border-2 border-ink bg-beige shadow-[3px_4px_0_rgba(42,33,28,0.14)]">
                    <CartItemPreview key={item.previewUrl} item={item} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h2 className="font-serif text-lg font-semibold">
                          {item.name}
                        </h2>
                        {item.options && (
                          <p className="mt-1 text-xs text-ink/55">
                            {item.options.phoneModel}

                            {item.options.packageLabel
                              ? ` · ${item.options.packageLabel}`
                              : ""}
                          </p>
                        )}

                        <p className="mt-1 text-xs text-ink/55">
                          Custom photo {index + 1}
                          {typeof item.rotation === "number"
                            ? ` · Rotated ${item.rotation}°`
                            : ""}
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-bold">
                        {item.packageId
                          ? "Included in package"
                          : formatPrice(item.unitPrice * item.quantity)}
                      </p>
                    </div>

                    <span className="mt-3 inline-flex rounded-full border border-ink bg-beige px-3 py-1 text-[11px] font-bold">
                      {item.packageId
                        ? `${getPackage(item.packageId)?.name} · premium packaging included`
                        : item.turnaround}
                    </span>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={!!item.packageGroupId}
                          aria-label={`Reduce quantity for ${item.name}`}
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-cream font-bold"
                        >
                          −
                        </button>

                        <span className="min-w-5 text-center text-sm font-bold">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          disabled={!!item.packageGroupId}
                          aria-label={`Increase quantity for ${item.name}`}
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-cream font-bold"
                        >
                          +
                        </button>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-bold">
                        <Link
                          href={item.editHref}
                          className="underline underline-offset-4"
                        >
                          Create another
                        </Link>

                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-burgundy underline underline-offset-4"
                        >
                          {item.packageId ? "Remove package" : "Remove"}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {items.length > 0 && (
            <div className="mt-5 flex gap-3 rounded-[14px] border-2 border-ink bg-beige px-4 py-4 text-sm leading-6">
              <span>{hasSlowItem ? "🎞️" : "⚡"}</span>

              <p>
                {hasSlowItem
                  ? "Your order contains an item that needs up to 48 hours. Delivery will be scheduled when everything is ready."
                  : "Your Polaroid prints can be prepared shortly after successful payment confirmation."}
              </p>
            </div>
          )}
        </div>

        {/* Summary */}
        <aside className="rounded-[18px] border-2 border-ink bg-paper p-6 shadow-[0_6px_0_rgba(42,33,28,0.08)] lg:sticky lg:top-28">
          <h2 className="font-serif text-xl font-semibold">Order Summary</h2>
          <Link
            href="/products/packages"
            className="mt-4 inline-block text-sm font-bold underline"
          >
            Build or complete a gift package →
          </Link>
          {[...new Set(items.map((i) => i.packageGroupId).filter(Boolean))].map(
            (group) => {
              const p = getPackage(
                items.find((i) => i.packageGroupId === group)?.packageId,
              );
              return p ? (
                <p key={group} className="mt-3 text-sm">
                  {p.name}: {formatPrice(p.price)} · packaging included
                </p>
              ) : null;
            },
          )}

          <div className="mt-5 flex justify-between border-b border-dashed border-ink/20 py-3 text-sm">
            <span className="font-semibold text-ink/60">Subtotal</span>

            <span className="font-bold">{formatPrice(subtotal)}</span>
          </div>

          <div className="flex justify-between border-b border-dashed border-ink/20 py-3 text-sm">
            <span className="font-semibold text-ink/60">Delivery</span>

            <span className="text-right text-xs font-bold">
              Calculated at checkout
            </span>
          </div>

          <div className="flex items-center justify-between py-4">
            <span className="font-semibold">Total</span>

            <span className="font-serif text-2xl font-bold text-burgundy">
              {formatPrice(subtotal)}
            </span>
          </div>

          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(event) => {
                setPromoCode(event.target.value);
                setPromoMessage("");
              }}
              placeholder="Promo code"
              className="min-w-0 flex-1 rounded-xl border-2 border-ink bg-cream px-3 py-2.5 text-sm outline-none focus:border-burgundy"
            />

            <button
              type="button"
              onClick={handlePromoCode}
              className="rounded-xl border-2 border-ink bg-paper px-4 text-xs font-bold shadow-[2px_2px_0_#2A211C]"
            >
              Apply
            </button>
          </div>

          {promoMessage && (
            <p className="mt-2 text-xs font-medium text-burgundy">
              {promoMessage}
            </p>
          )}

          {items.length > 0 ? (
            <Link
              href={
                promoCode.trim()
                  ? `/checkout?discountCode=${encodeURIComponent(promoCode.trim())}`
                  : "/checkout"
              }
              className="mt-6 flex w-full items-center justify-center rounded-full border-2 border-ink bg-burgundy px-5 py-3.5 text-sm font-bold text-cream shadow-[4px_4px_0_#2A211C]"
            >
              Proceed to Checkout
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="mt-6 flex w-full cursor-not-allowed items-center justify-center rounded-full border-2 border-ink bg-burgundy px-5 py-3.5 text-sm font-bold text-cream opacity-40 shadow-[4px_4px_0_#2A211C]"
            >
              Proceed to Checkout
            </button>
          )}

          <Link
            href="/products"
            className="mt-3 flex w-full items-center justify-center rounded-full border-2 border-ink bg-paper px-5 py-3.5 text-sm font-bold shadow-[4px_4px_0_#2A211C]"
          >
            Continue Shopping
          </Link>
        </aside>
      </section>

      {/* Mobile checkout */}
      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t-2 border-ink bg-cream px-4 py-3 lg:hidden">
          <div className="shrink-0">
            <p className="text-[10px] font-semibold text-ink/55">Total</p>

            <p className="font-serif text-base font-bold text-burgundy">
              {formatPrice(subtotal)}
            </p>
          </div>

          <Link
            href={
              promoCode.trim()
                ? `/checkout?discountCode=${encodeURIComponent(promoCode.trim())}`
                : "/checkout"
            }
            className="flex flex-1 items-center justify-center rounded-full border-2 border-ink bg-burgundy px-4 py-3 text-sm font-bold text-cream shadow-[3px_3px_0_#2A211C]"
          >
            Checkout
          </Link>
        </div>
      )}
    </main>
  );
};

export default CartPage;
