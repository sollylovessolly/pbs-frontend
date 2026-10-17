"use client";
import { usePathname } from "next/navigation";
import { LuMessageCircle } from "react-icons/lu";
import { useCart } from "@/context/CartContext";

export default function OrderHelp({ orderNumber }: { orderNumber?: string }) {
  const pathname = usePathname() ?? "";
  const { items } = useCart();
  const names: Record<string, string> = {
    "/products/polaroids": "Polaroid prints",
    "/products/photostrips": "photostrips",
    "/products/vintage-letters": "vintage letters",
    "/products/phone-cases": "Polaroid phone cases",
    "/products/albums": "photo albums",
  };
  const product = names[pathname];
  const checkout = pathname === "/cart" || pathname === "/checkout";
  if (!orderNumber && !product && !checkout && pathname !== "/track-order")
    return null;
  const message = orderNumber
    ? `Hi Solly! I need help with order ${orderNumber}.`
    : product
      ? `Hi Solly! I need help ordering ${product}.`
      : checkout
        ? `Hi Solly! I need help with my ${pathname === "/cart" ? "cart" : "checkout"}.${
            items.length
              ? "\n" +
                items
                  .slice(0, 15)
                  .map((item) => `${item.name} × ${item.quantity}`)
                  .join("\n")
              : ""
          }`
        : "Hi Solly! I need help finding my order.";
  return (
    <aside aria-label="Order help" className="bg-cream px-5 py-6">
      <div className="mx-auto flex max-w-site flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/20 bg-paper px-5 py-4">
        <div>
          <p className="font-bold text-ink">Need a hand?</p>
          <p className="mt-1 text-sm text-ink/65">
            Ask Solly on WhatsApp.{" "}
            {orderNumber
              ? "Your order number"
              : product
                ? "The product name"
                : checkout
                  ? "Your cart summary"
                  : "A message"}{" "}
            is already filled in.
          </p>
        </div>
        <a
          href={`https://wa.me/2347088694074?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-ink bg-cream px-4 py-2 text-sm font-bold text-burgundy hover:bg-blush"
        >
          <LuMessageCircle aria-hidden="true" />
          Help with{" "}
          {orderNumber ? "this order" : checkout ? "my order" : "ordering"} →
        </a>
      </div>
    </aside>
  );
}
