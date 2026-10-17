"use client";
import Link from "next/link";
import OrderHelp from "@/component/layout/OrderHelp";
import { useEffect, useState } from "react";
import { getTrackedOrder } from "@/lib/api";
import type { TrackingOrderCard } from "@/lib/api/types";
import { money, safeUrl } from "@/lib/commerce/catalogue";
const status = (value: string) => value.toLowerCase().replaceAll("_", " ");
const date = (value: string) =>
  new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
export default function OrderDetailsPage({
  orderNumber: token,
}: {
  orderNumber: string;
}) {
  const [order, setOrder] = useState<TrackingOrderCard | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    getTrackedOrder(token, controller.signal)
      .then(setOrder)
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [token, attempt]);
  const external = safeUrl(order?.trackingLink);
  return (
    <main className="bg-cream px-5 py-12 text-ink">
      <div className="mx-auto max-w-4xl">
        <Link href="/track-order" className="underline">
          ← Find my orders
        </Link>
        {error ? (
          <section className="mt-6 rounded-2xl border-2 border-ink bg-paper p-6">
            <p role="alert">{error}</p>
            <button
              className="mt-4 underline"
              onClick={() => {
                setError("");
                setAttempt((x) => x + 1);
              }}
            >
              Retry
            </button>
          </section>
        ) : !order ? (
          <p className="py-12" role="status">
            Loading your order…
          </p>
        ) : (
          <>
            <header className="my-6 rounded-2xl border-2 border-ink bg-burgundy p-8 text-cream">
              <h1 className="font-serif text-3xl">Order {order.orderNumber}</h1>
              <p className="mt-4 capitalize">{status(order.status)}</p>
              {order.paymentStatus && (
                <p className="mt-2 capitalize">
                  Payment: {status(order.paymentStatus)}
                </p>
              )}
            </header>
            <OrderHelp orderNumber={order.orderNumber} />
            <Link
              href="/reviews#write-review"
              className="my-4 inline-block font-bold text-burgundy underline"
            >
              Share your experience & photos →
            </Link>
            <div className="grid gap-6 md:grid-cols-2">
              <section className="rounded-2xl border-2 border-ink bg-paper p-6">
                <h2 className="font-serif text-2xl">Your keepsakes</h2>
                {order.items?.length ? (
                  order.items.map((item, i) => (
                    <p
                      key={i}
                      className="border-b border-dashed border-ink/20 py-4"
                    >
                      {item.productName} · {item.name} × {item.quantity}
                    </p>
                  ))
                ) : (
                  <p>No item details are available.</p>
                )}
                {order.totalAmount !== undefined && (
                  <p className="mt-5 font-bold">
                    Total: {money(order.totalAmount)}
                  </p>
                )}
                {order.createdAt && (
                  <p className="mt-3 text-sm">Placed {date(order.createdAt)}</p>
                )}
                {order.paidAt && (
                  <p className="mt-2 text-sm">Paid {date(order.paidAt)}</p>
                )}
              </section>
              <section className="rounded-2xl border-2 border-ink bg-paper p-6">
                <h2 className="font-serif text-2xl">Delivery</h2>
                <p className="mt-4">
                  {order.maskedDeliveryAddress ||
                    order.deliveryState ||
                    "Delivery details will appear here."}
                </p>
                {order.shipmentStatus && (
                  <p className="mt-3 capitalize">
                    {status(order.shipmentStatus)}
                  </p>
                )}
                {external ? (
                  <a
                    href={external}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block font-bold underline"
                  >
                    Track with courier ↗ (external)
                  </a>
                ) : (
                  <p className="mt-4 text-sm">
                    Your courier tracking link will appear when available.
                  </p>
                )}
              </section>
            </div>
            <section className="mt-6 rounded-2xl border-2 border-ink bg-paper p-6">
              <h2 className="font-serif text-2xl">Order updates</h2>
              {order.timeline?.length ? (
                <ol className="mt-5 space-y-4">
                  {order.timeline.map((entry, i) => (
                    <li key={i}>
                      <span className="font-bold capitalize">
                        {status(entry.status)}
                      </span>
                      <p className="text-sm">{date(entry.changedAt)}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-4">
                  Updates will appear as your order progresses.
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
