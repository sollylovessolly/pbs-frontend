"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useRef, useEffect } from "react";
import {
  LuCalendarDays,
  LuChevronRight,
  LuClock3,
  LuHash,
  LuPackage,
  LuPhone,
  LuSearch,
  LuShoppingBag,
} from "react-icons/lu";

import TornDivider from "@/component/ui/TornDivider";
import { findTrackedOrders } from "@/lib/api";
import type { TrackingOrderCard } from "@/lib/api/types";

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

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: "Processing",
    processing: "Processing",
    ready: "Ready",
    dispatched: "Dispatched",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };

  return labels[status.toLowerCase()] ?? status;
};

const getStatusClassName = (status: string) => {
  const styles: Record<string, string> = {
    pending: "border-burgundy bg-blush text-burgundy",
    processing: "border-burgundy bg-blush text-burgundy",
    ready: "border-ink bg-beige text-ink",
    dispatched: "border-ink bg-burgundy text-cream",
    delivered: "border-ink bg-ink text-cream",
    cancelled: "border-burgundy bg-paper text-burgundy",
  };

  return styles[status.toLowerCase()] ?? styles.processing;
};

const getProductSummary = (order: TrackingOrderCard) => {
  const items = order.items ?? [];
  const totalItems = items.reduce(
    (total, item) => total + (item.quantity ?? 0),
    0,
  );

  if (items.length === 1 && items[0].name) {
    return `${items[0].name} · Qty ${totalItems}`;
  }

  return `${totalItems} ${totalItems === 1 ? "keepsake" : "keepsakes"}`;
};

const TrackOrderPage = () => {
  const router = useRouter();
  const [trackingPhone, setTrackingPhone] = useState("");
  const [trackingBusy, setTrackingBusy] = useState(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const [phone, setPhone] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get(
      "orderNumber",
    );
    if (value) queueMicrotask(() => setTrackingNumber(value));
  }, []);
  const [phoneError, setPhoneError] = useState("");
  const [trackingError, setTrackingError] = useState("");

  const [matchingOrders, setMatchingOrders] = useState<
    TrackingOrderCard[] | null
  >(null);
  const [isSearching, setIsSearching] = useState(false);

  const handlePhoneSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSearching || trackingBusy) return;
    setPhoneError("");
    setMatchingOrders(null);

    const phoneDigits = phone.replace(/\D/g, "");

    if (phoneDigits.length < 10) {
      setPhoneError("Enter the phone number used during checkout.");

      setMatchingOrders(null);
      return;
    }

    setIsSearching(true);

    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    void findTrackedOrders(phoneDigits, controller.signal)
      .then((orders) => {
        if (controller.signal.aborted) return;
        setMatchingOrders(orders);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setMatchingOrders(null);
        setPhoneError(
          error instanceof Error
            ? error.message
            : "We could not search orders right now. Please try again.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsSearching(false);
      });
  };

  const handleTrackingSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (trackingBusy || isSearching) return;
    setTrackingError("");
    let value = trackingNumber.trim();
    if (!value) {
      setTrackingError("Enter your order number or tracking link.");
      return;
    }
    if (/^https?:\/\//i.test(value)) {
      try {
        const url = new URL(value);
        const match = url.pathname.match(/^\/orders\/([^/]+)\/?$/);
        if (!match) throw new Error();
        value = decodeURIComponent(match[1]);
      } catch {
        setTrackingError(
          "Please paste the full tracking link from your order.",
        );
        return;
      }
    }
    if (!/^PBS-/i.test(value)) {
      router.push(`/orders/${encodeURIComponent(value)}`);
      return;
    }
    const digits = (trackingPhone || phone).replace(/\D/g, "");
    if (digits.length < 10) {
      setTrackingError("Enter the phone number used for this order.");
      return;
    }
    const controller = new AbortController();
    request.current?.abort();
    request.current = controller;
    setTrackingBusy(true);
    try {
      const orders = await findTrackedOrders(digits, controller.signal);
      if (controller.signal.aborted) return;
      const match = orders.find(
        (order) => order.orderNumber.toUpperCase() === value.toUpperCase(),
      );
      if (!match) {
        setTrackingError(
          "No paid order matches that number and phone. Check both and try again.",
        );
        return;
      }
      router.push(`/orders/${encodeURIComponent(match.trackingToken)}`);
    } catch (error) {
      if (!controller.signal.aborted)
        setTrackingError(
          error instanceof Error
            ? error.message
            : "Could not find your order. Please retry.",
        );
    } finally {
      if (!controller.signal.aborted) setTrackingBusy(false);
    }
  };

  return (
    <main className="bg-cream pb-16 text-ink">
      {/* Header */}
      <section className="border-b-2 border-ink bg-burgundy text-cream">
        <div className="mx-auto max-w-[1240px] px-5 py-10 md:px-7 md:py-14">
          <div className="mb-4 text-sm font-semibold text-cream/45">
            <Link href="/" className="transition hover:text-cream">
              Home
            </Link>

            <span className="mx-2">/</span>
            <span>Track Order</span>
          </div>

          <span className="inline-flex -rotate-3 rounded-full border-2 border-ink bg-beige px-4 py-1 font-serif text-lg font-bold italic text-ink shadow-[3px_3px_0_#2A211C]">
            where are my memories?
          </span>

          <h1 className="mt-5 font-serif text-4xl font-semibold md:text-5xl">
            Track Your Order
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-cream/60">
            Enter the phone number used during checkout to see your orders, or
            find one using your order number and checkout phone number.
          </p>
        </div>
      </section>

      <TornDivider color="cream" />

      <section className="mx-auto max-w-[1050px] px-5 py-10 md:px-7 lg:py-14">
        {/* Demo notice */}
        <div className="mb-6 flex items-start gap-3 rounded-[14px] border-2 border-ink bg-beige px-4 py-4 text-sm leading-6">
          <LuClock3 className="mt-1 h-4 w-4 shrink-0" />

          <p>
            Search securely with the phone number used during checkout. We only
            show customer-safe order details.
          </p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          {/* Phone search */}
          <form
            onSubmit={handlePhoneSearch}
            className="rounded-[18px] border-2 border-ink bg-paper p-5 shadow-[0_6px_0_rgba(42,33,28,0.08)] sm:p-6"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-beige">
              <LuPhone className="h-5 w-5" />
            </span>

            <h2 className="mt-5 font-serif text-2xl font-semibold">
              Find My Orders
            </h2>

            <p className="mt-2 text-sm leading-6 text-ink/60">
              See every order connected to the phone number used during
              checkout.
            </p>

            <label
              htmlFor="tracking-phone"
              className="mb-2 mt-6 block text-sm font-bold"
            >
              Phone number
            </label>

            <div className="relative">
              <LuPhone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />

              <input
                id="tracking-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value);
                  setPhoneError("");
                }}
                placeholder="0803 123 4567"
                className={[
                  "w-full rounded-xl border-2 bg-cream py-3 pl-11 pr-4 text-sm outline-none transition focus:border-burgundy",
                  phoneError ? "border-burgundy" : "border-ink",
                ].join(" ")}
              />
            </div>

            {phoneError && (
              <p
                role="alert"
                className="mt-2 text-xs font-semibold leading-5 text-burgundy"
              >
                {phoneError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSearching}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border-2 border-ink bg-burgundy px-5 py-3.5 text-sm font-bold text-cream shadow-[4px_4px_0_#2A211C] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LuSearch className="h-4 w-4" />
              {isSearching ? "Searching…" : "Find My Orders"}
            </button>
          </form>

          {/* Tracking token search */}
          <form
            onSubmit={handleTrackingSearch}
            className="rounded-[18px] border-2 border-ink bg-paper p-5 shadow-[0_6px_0_rgba(42,33,28,0.08)] sm:p-6"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blush">
              <LuHash className="h-5 w-5" />
            </span>

            <h2 className="mt-5 font-serif text-2xl font-semibold">
              Find One Order
            </h2>

            <p className="mt-2 text-sm leading-6 text-ink/60">
              Use your PBS order number or paste your tracking link.
            </p>

            <label
              htmlFor="tracking-number"
              className="mb-2 mt-6 block text-sm font-bold"
            >
              Order number or tracking link
            </label>

            <div className="relative">
              <LuHash className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />

              <input
                id="tracking-number"
                type="text"
                value={trackingNumber}
                onChange={(event) => {
                  setTrackingNumber(event.target.value);

                  setTrackingError("");
                }}
                placeholder="PBS-… or your tracking link"
                className={[
                  "w-full rounded-xl border-2 bg-cream py-3 pl-11 pr-4 text-sm outline-none transition focus:border-burgundy",
                  trackingError ? "border-burgundy" : "border-ink",
                ].join(" ")}
              />
            </div>

            {/^PBS-/i.test(trackingNumber.trim()) && (
              <label
                className="mt-4 block text-sm font-bold"
                htmlFor="order-phone"
              >
                Phone number used for this order
                <input
                  id="order-phone"
                  type="tel"
                  autoComplete="tel"
                  value={trackingPhone}
                  onChange={(e) => setTrackingPhone(e.target.value)}
                  placeholder="0803 123 4567"
                  className="mt-2 w-full rounded-xl border-2 border-ink bg-cream p-3 text-sm"
                />
              </label>
            )}
            {trackingError && (
              <p
                role="alert"
                className="mt-2 text-xs font-semibold leading-5 text-burgundy"
              >
                {trackingError}
              </p>
            )}

            <button
              type="submit"
              disabled={trackingBusy || isSearching}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border-2 border-ink bg-paper px-5 py-3.5 text-sm font-bold shadow-[4px_4px_0_#2A211C]"
            >
              {trackingBusy ? "Finding order…" : "Find order"}
              <LuChevronRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Phone results */}
        {matchingOrders !== null && (
          <section aria-live="polite" className="mt-10">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <span className="inline-flex -rotate-2 rounded-full border-2 border-ink bg-blush px-4 py-1 font-serif text-lg font-bold italic shadow-[3px_3px_0_#2A211C]">
                  found them
                </span>

                <h2 className="mt-4 font-serif text-3xl font-semibold">
                  Your Orders
                </h2>
              </div>

              {matchingOrders.length > 0 && (
                <p className="text-sm font-semibold text-ink/55">
                  {matchingOrders.length}{" "}
                  {matchingOrders.length === 1 ? "order" : "orders"}
                </p>
              )}
            </div>

            {matchingOrders.length === 0 ? (
              <div className="mt-6 rounded-[18px] border-2 border-ink bg-paper px-6 py-12 text-center shadow-[0_6px_0_rgba(42,33,28,0.08)]">
                <LuPackage className="mx-auto h-10 w-10 text-ink/50" />

                <h3 className="mt-4 font-serif text-2xl font-semibold">
                  No orders found
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink/60">
                  Check the number and try again. Paid orders are only shown
                  when the phone number matches the order details.
                </p>

                <Link
                  href="/products"
                  className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-burgundy px-6 py-3 text-sm font-bold text-cream shadow-[4px_4px_0_#2A211C]"
                >
                  <LuShoppingBag className="h-4 w-4" />
                  Shop Products
                </Link>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {matchingOrders.map((order) => (
                  <article
                    key={order.trackingToken}
                    className="rounded-[18px] border-2 border-ink bg-paper p-5 shadow-[0_6px_0_rgba(42,33,28,0.08)] sm:p-6"
                  >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="font-serif text-xl font-semibold text-burgundy">
                            {order.orderNumber}
                          </h3>

                          <span
                            className={[
                              "inline-flex rounded-full border px-3 py-1 text-[11px] font-bold",
                              getStatusClassName(order.status),
                            ].join(" ")}
                          >
                            {getStatusLabel(order.status)}
                          </span>
                        </div>

                        <p className="mt-3 text-sm font-semibold">
                          {getProductSummary(order)}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink/55">
                          <span className="flex items-center gap-1.5">
                            <LuCalendarDays className="h-3.5 w-3.5" />

                            {order.createdAt
                              ? `Placed ${formatDate(order.createdAt)}`
                              : "Order placed"}
                          </span>

                          <span className="flex items-center gap-1.5">
                            <LuClock3 className="h-3.5 w-3.5" />

                            {order.paymentStatus
                              ? `Payment: ${order.paymentStatus}`
                              : "Payment status available"}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center justify-between gap-5 sm:flex-col sm:items-end">
                        <p className="font-serif text-xl font-bold">
                          {order.totalAmount !== undefined
                            ? formatPrice(Number(order.totalAmount))
                            : "Total available after opening"}
                        </p>

                        <Link
                          href={`/orders/${encodeURIComponent(order.trackingToken)}`}
                          className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-burgundy px-5 py-2.5 text-xs font-bold text-cream shadow-[3px_3px_0_#2A211C]"
                        >
                          View Order
                          <LuChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </section>
    </main>
  );
};

export default TrackOrderPage;
