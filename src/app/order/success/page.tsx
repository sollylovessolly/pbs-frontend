"use client";

import Link from "next/link";
import {
  Suspense,
  useMemo,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  LuCheck,
  LuClock3,
  LuCopy,
  LuMail,
  LuMapPin,
  LuPackage,
  LuShoppingBag,
  LuTruck,
} from "react-icons/lu";

import TornDivider from "@/component/ui/TornDivider";
import { useOrders } from "@/context/OrderContext";

const formatPrice = (amount: number) => {
  return `₦${amount.toLocaleString("en-NG")}`;
};

const formatDate = (dateValue: string) => {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));
};

const OrderSuccessContent = () => {
  const searchParams = useSearchParams();
  const { isReady, getOrderByNumber } =
    useOrders();

  const orderNumber =
    searchParams.get("order") ?? "";

  const order = useMemo(() => {
    if (!orderNumber) return undefined;

    return getOrderByNumber(orderNumber);
  }, [getOrderByNumber, orderNumber]);

  const copyOrderNumber = async () => {
    if (!order) return;

    try {
      await navigator.clipboard.writeText(
        order.orderNumber,
      );
    } catch (error) {
      console.error(
        "Could not copy order number:",
        error,
      );
    }
  };

  if (!isReady) {
    return (
      <main className="min-h-[60vh] bg-cream px-5 py-20">
        <p className="text-center text-sm font-semibold text-ink/55">
          Loading your order…
        </p>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="bg-cream px-5 py-20 text-ink">
        <div className="mx-auto max-w-xl rounded-[18px] border-2 border-ink bg-paper p-8 text-center shadow-[0_6px_0_rgba(42,33,28,0.08)]">
          <LuPackage className="mx-auto h-10 w-10" />

          <h1 className="mt-5 font-serif text-3xl font-semibold">
            Order not found
          </h1>

          <p className="mt-3 text-sm leading-6 text-ink/60">
            This demo order may have been created in a
            different browser or its local data may have
            been cleared.
          </p>

          <Link
            href="/products"
            className="mt-6 inline-flex rounded-full border-2 border-ink bg-burgundy px-6 py-3 text-sm font-bold text-cream shadow-[4px_4px_0_#2A211C]"
          >
            Shop Products
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-cream pb-16 text-ink">
      <section className="border-b-2 border-ink bg-burgundy text-cream">
        <div className="mx-auto max-w-[1240px] px-5 py-12 text-center md:px-7 md:py-16">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-ink bg-beige text-ink shadow-[4px_4px_0_#2A211C]">
            <LuCheck className="h-8 w-8" />
          </span>

          <span className="mt-6 inline-flex -rotate-2 rounded-full border-2 border-ink bg-blush px-4 py-1 font-serif text-lg font-bold italic text-ink shadow-[3px_3px_0_#2A211C]">
            order received
          </span>

          <h1 className="mt-5 font-serif text-4xl font-semibold md:text-5xl">
            Payment Successful
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-cream/65">
            Your demo order has been created and is now
            marked as processing.
          </p>
        </div>
      </section>

      <TornDivider color="cream" />

      <section className="mx-auto grid max-w-[1050px] items-start gap-6 px-5 py-10 md:px-7 lg:grid-cols-[1.2fr_0.8fr] lg:py-14">
        <div className="space-y-5">
          <section className="rounded-[18px] border-2 border-ink bg-paper p-6 shadow-[0_6px_0_rgba(42,33,28,0.08)]">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink/50">
              PolaroidsBySolly tracking number
            </p>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="font-serif text-2xl font-bold text-burgundy sm:text-3xl">
                {order.orderNumber}
              </p>

              <button
                type="button"
                onClick={copyOrderNumber}
                className="flex items-center gap-2 rounded-full border-2 border-ink bg-cream px-4 py-2 text-xs font-bold shadow-[2px_2px_0_#2A211C]"
              >
                <LuCopy className="h-4 w-4" />
                Copy
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-ink/60">
              Keep this number safe. It can continue to
              be used after the real order backend and
              Paystack integration are added.
            </p>
          </section>

          <section className="rounded-[18px] border-2 border-ink bg-paper p-6 shadow-[0_6px_0_rgba(42,33,28,0.08)]">
            <h2 className="font-serif text-xl font-semibold">
              What happens next?
            </h2>

            <div className="mt-5 space-y-4">
              <div className="flex gap-3">
                <LuPackage className="mt-1 h-5 w-5 shrink-0" />

                <div>
                  <p className="text-sm font-bold">
                    Your order is processing
                  </p>

                  <p className="mt-1 text-xs leading-5 text-ink/55">
                    Production begins after successful
                    payment confirmation.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <LuClock3 className="mt-1 h-5 w-5 shrink-0" />

                <div>
                  <p className="text-sm font-bold">
                    Expected ready date
                  </p>

                  <p className="mt-1 text-xs leading-5 text-ink/55">
                    {formatDate(
                      order.expectedReadyAt,
                    )}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <LuTruck className="mt-1 h-5 w-5 shrink-0" />

                <div>
                  <p className="text-sm font-bold">
                    Delivery comes afterwards
                  </p>

                  <p className="mt-1 text-xs leading-5 text-ink/55">
                    Delivery will be arranged when every
                    item in the order is ready.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[18px] border-2 border-ink bg-beige p-6">
            <div className="flex gap-3">
              <LuMail className="mt-1 h-5 w-5 shrink-0" />

              <div>
                <h2 className="font-serif text-lg font-semibold">
                  Email confirmation
                </h2>

                <p className="mt-2 text-sm leading-6 text-ink/65">
                  A confirmation email is meant to be
                  sent to{" "}
                  <strong>
                    {order.customer.email}
                  </strong>
                  , but email delivery is not connected
                  yet.
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="rounded-[18px] border-2 border-ink bg-paper p-6 shadow-[0_6px_0_rgba(42,33,28,0.08)] lg:sticky lg:top-28">
          <h2 className="font-serif text-xl font-semibold">
            Order Summary
          </h2>

          <div className="mt-5 space-y-3">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 border-b border-dashed border-ink/20 pb-3"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-ink bg-beige">
                  <img
                    src={item.previewUrl}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    {item.name}
                  </p>

                  <p className="mt-1 text-xs text-ink/50">
                    Qty {item.quantity}
                  </p>
                </div>

                <p className="text-sm font-bold">
                  {formatPrice(
                    item.unitPrice *
                      item.quantity,
                  )}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-between text-sm">
            <span className="font-semibold text-ink/55">
              Delivery
            </span>

            <span className="font-bold">
              {formatPrice(
                order.delivery.fee,
              )}
            </span>
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-xl bg-beige p-3">
            <LuMapPin className="mt-0.5 h-4 w-4 shrink-0" />

            <p className="text-xs leading-5">
              {order.delivery.maskedAddress},{" "}
              {order.delivery.city},{" "}
              {order.delivery.state}
            </p>
          </div>

          <div className="mt-5 flex items-center justify-between border-t-2 border-ink pt-4">
            <span className="font-semibold">
              Total
            </span>

            <span className="font-serif text-2xl font-bold text-burgundy">
              {formatPrice(order.total)}
            </span>
          </div>

          <Link
            href={`/orders/${encodeURIComponent(
              order.orderNumber,
            )}`}
            className="mt-6 flex w-full items-center justify-center rounded-full border-2 border-ink bg-burgundy px-5 py-3.5 text-sm font-bold text-cream shadow-[4px_4px_0_#2A211C]"
          >
            Track This Order
          </Link>

          <Link
            href="/products"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border-2 border-ink bg-paper px-5 py-3.5 text-sm font-bold shadow-[4px_4px_0_#2A211C]"
          >
            <LuShoppingBag className="h-4 w-4" />
            Continue Shopping
          </Link>
        </aside>
      </section>
    </main>
  );
};

const OrderSuccessPage = () => {
  return (
    <Suspense
      fallback={
        <main className="min-h-[60vh] bg-cream px-5 py-20">
          <p className="text-center text-sm font-semibold text-ink/55">
            Loading your order…
          </p>
        </main>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
};

export default OrderSuccessPage;