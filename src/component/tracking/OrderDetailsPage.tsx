"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import {
  LuArrowLeft,
  LuCalendarDays,
  LuClock3,
  LuCreditCard,
  LuMapPin,
  LuMessageCircle,
  LuPackage,
  LuTruck,
} from "react-icons/lu";

import TornDivider from "@/component/ui/TornDivider";
import OrderTimeline from "@/component/tracking/OrderTimeline";
import { useOrders } from "@/context/OrderContext";
import type { Order } from "@/types/order";

type OrderDetailsPageProps = {
  orderNumber: string;
};

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

const formatDateTime = (dateValue: string) => {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateValue));
};

const getStatusLabel = (
  status: Order["orderStatus"],
) => {
  const labels: Record<
    Order["orderStatus"],
    string
  > = {
    processing: "Processing",
    ready: "Ready for delivery",
    dispatched: "Dispatched",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };

  return labels[status];
};

const getDeliveryMessage = (order: Order) => {
  switch (order.orderStatus) {
    case "processing":
      return "Your products are currently being prepared. Delivery will be arranged when every item is ready.";

    case "ready":
      return "Your order is ready. Delivery arrangements will begin shortly.";

    case "dispatched":
      return "Your order has been handed over for delivery.";

    case "delivered":
      return "Your order has been delivered.";

    case "cancelled":
      return "Delivery will not be arranged because this order has been cancelled.";
  }
};

const OrderDetailsPage = ({
  orderNumber,
}: OrderDetailsPageProps) => {
  const {
    isReady,
    getOrderByNumber,
  } = useOrders();

  const order = getOrderByNumber(orderNumber);

  const whatsappNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(
      /\D/g,
      "",
    ) ?? "";

  const whatsappMessage = order
    ? `Hello, I need help with order ${order.orderNumber}.`
    : "";

  const whatsappHref =
    order && whatsappNumber
      ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
          whatsappMessage,
        )}`
      : null;

  if (!isReady) {
    return (
      <main className="min-h-[60vh] bg-cream px-5 py-20 text-ink">
        <p className="text-center text-sm font-semibold text-ink/55">
          Loading order…
        </p>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="bg-cream px-5 py-20 text-ink">
        <div className="mx-auto max-w-xl rounded-[18px] border-2 border-ink bg-paper p-8 text-center shadow-[0_6px_0_rgba(42,33,28,0.08)]">
          <LuPackage className="mx-auto h-10 w-10 text-ink/50" />

          <h1 className="mt-5 font-serif text-3xl font-semibold">
            Order not found
          </h1>

          <p className="mt-3 text-sm leading-6 text-ink/60">
            This mock order may have been created on
            another device, or its browser storage may
            have been cleared.
          </p>

          <Link
            href="/track-order"
            className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-burgundy px-6 py-3 text-sm font-bold text-cream shadow-[4px_4px_0_#2A211C]"
          >
            <LuArrowLeft className="h-4 w-4" />
            Back to Tracking
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-cream pb-16 text-ink">
      {/* Page header */}
      <section className="border-b-2 border-ink bg-burgundy text-cream">
        <div className="mx-auto max-w-[1240px] px-5 py-10 md:px-7 md:py-14">
          <div className="mb-4 text-sm font-semibold text-cream/45">
            <Link
              href="/track-order"
              className="transition hover:text-cream"
            >
              Track Order
            </Link>

            <span className="mx-2">/</span>

            <span>{order.orderNumber}</span>
          </div>

          <span className="inline-flex -rotate-2 rounded-full border-2 border-ink bg-beige px-4 py-1 font-serif text-lg font-bold italic text-ink shadow-[3px_3px_0_#2A211C]">
            currently:{" "}
            {getStatusLabel(
              order.orderStatus,
            ).toLowerCase()}
          </span>

          <h1 className="mt-5 break-words font-serif text-3xl font-semibold sm:text-4xl md:text-5xl">
            {order.orderNumber}
          </h1>

          <p className="mt-3 flex items-center gap-2 text-sm text-cream/60">
            <LuCalendarDays className="h-4 w-4" />

            Placed {formatDateTime(order.createdAt)}
          </p>
        </div>
      </section>

      <TornDivider color="cream" />

      <section className="mx-auto grid max-w-[1100px] items-start gap-6 px-5 py-10 md:px-7 lg:grid-cols-[1.2fr_0.8fr] lg:py-14">
        <div className="space-y-5">
          {/* Timeline */}
          <section className="rounded-[18px] border-2 border-ink bg-paper p-5 shadow-[0_6px_0_rgba(42,33,28,0.08)] sm:p-6">
            <h2 className="font-serif text-2xl font-semibold">
              Order Progress
            </h2>

            <p className="mt-2 text-sm leading-6 text-ink/60">
              Follow your keepsakes from confirmation to
              delivery.
            </p>

            <div className="mt-7">
              <OrderTimeline order={order} />
            </div>
          </section>

          {/* Delivery */}
          <section className="rounded-[18px] border-2 border-ink bg-paper p-5 shadow-[0_6px_0_rgba(42,33,28,0.08)] sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-beige">
                <LuTruck className="h-5 w-5" />
              </span>

              <div>
                <h2 className="font-serif text-xl font-semibold">
                  Delivery
                </h2>

                <p className="mt-0.5 text-xs text-ink/55">
                  Delivery status and destination
                </p>
              </div>
            </div>

            <p className="mt-5 text-sm leading-6 text-ink/65">
              {getDeliveryMessage(order)}
            </p>

            <div className="mt-5 flex items-start gap-3 rounded-[14px] border-2 border-ink bg-beige p-4">
              <LuMapPin className="mt-0.5 h-5 w-5 shrink-0" />

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink/45">
                  Delivery destination
                </p>

                <p className="mt-2 text-sm font-semibold leading-6">
                  {order.delivery.maskedAddress},{" "}
                  {order.delivery.city},{" "}
                  {order.delivery.state}
                </p>
              </div>
            </div>

            {order.trackingUrl && (
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-5 flex w-full items-center justify-center rounded-full border-2 border-ink bg-burgundy px-5 py-3 text-sm font-bold text-cream shadow-[4px_4px_0_#2A211C]"
              >
                Track Delivery
              </a>
            )}
          </section>

          {/* Help */}
          <section className="rounded-[18px] border-2 border-ink bg-blush p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <LuMessageCircle className="mt-1 h-5 w-5 shrink-0" />

              <div className="flex-1">
                <h2 className="font-serif text-xl font-semibold">
                  Need help with this order?
                </h2>

                <p className="mt-2 text-sm leading-6 text-ink/65">
                  Contact PolaroidsBySolly and include
                  your tracking number so the order is
                  easier to find.
                </p>

                {whatsappHref ? (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-paper px-5 py-2.5 text-sm font-bold shadow-[3px_3px_0_#2A211C]"
                  >
                    <LuMessageCircle className="h-4 w-4" />
                    Chat on WhatsApp
                  </a>
                ) : (
                  <p className="mt-4 text-xs font-semibold text-burgundy">
                    Add your WhatsApp number to
                    `NEXT_PUBLIC_WHATSAPP_NUMBER` to
                    enable this button.
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Order summary */}
        <aside className="rounded-[18px] border-2 border-ink bg-paper p-5 shadow-[0_6px_0_rgba(42,33,28,0.08)] sm:p-6 lg:sticky lg:top-28">
          <h2 className="font-serif text-xl font-semibold">
            Order Summary
          </h2>

          <div className="mt-5 space-y-4">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 border-b border-dashed border-ink/20 pb-4"
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 border-ink bg-beige">
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

                <p className="shrink-0 text-sm font-bold">
                  {formatPrice(
                    item.unitPrice *
                      item.quantity,
                  )}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-between py-2 text-sm">
            <span className="font-semibold text-ink/55">
              Subtotal
            </span>

            <span className="font-bold">
              {formatPrice(order.subtotal)}
            </span>
          </div>

          <div className="flex justify-between border-b border-dashed border-ink/20 py-2 text-sm">
            <span className="font-semibold text-ink/55">
              Delivery
            </span>

            <span className="font-bold">
              {formatPrice(order.delivery.fee)}
            </span>
          </div>

          <div className="flex items-center justify-between py-4">
            <span className="font-semibold">
              Total
            </span>

            <span className="font-serif text-2xl font-bold text-burgundy">
              {formatPrice(order.total)}
            </span>
          </div>

                    <div className="space-y-3 rounded-[14px] border-2 border-ink bg-beige p-4 text-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 font-semibold text-ink/55">
                <LuCreditCard
                  aria-hidden="true"
                  className="h-4 w-4"
                />

                Payment
              </span>

              <span className="font-bold capitalize">
                {order.paymentStatus}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 font-semibold text-ink/55">
                <LuClock3
                  aria-hidden="true"
                  className="h-4 w-4"
                />

                Expected ready
              </span>

              <span className="text-right font-bold">
                {formatDate(order.expectedReadyAt)}
              </span>
            </div>
          </div>

          <Link
            href="/track-order"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border-2 border-ink bg-paper px-5 py-3.5 text-sm font-bold shadow-[4px_4px_0_#2A211C]"
          >
            <LuArrowLeft
              aria-hidden="true"
              className="h-4 w-4"
            />

            Track Another Order
          </Link>
        </aside>
      </section>
    </main>
  );
};

export default OrderDetailsPage;