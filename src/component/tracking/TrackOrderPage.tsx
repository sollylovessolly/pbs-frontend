"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  useState,
} from "react";
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
import { useOrders } from "@/context/OrderContext";
import type { Order } from "@/types/order";

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

const getStatusLabel = (
  status: Order["orderStatus"],
) => {
  const labels: Record<
    Order["orderStatus"],
    string
  > = {
    processing: "Processing",
    ready: "Ready",
    dispatched: "Dispatched",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };

  return labels[status];
};

const getStatusClassName = (
  status: Order["orderStatus"],
) => {
  const styles: Record<
    Order["orderStatus"],
    string
  > = {
    processing:
      "border-burgundy bg-blush text-burgundy",
    ready:
      "border-ink bg-beige text-ink",
    dispatched:
      "border-ink bg-burgundy text-cream",
    delivered:
      "border-ink bg-ink text-cream",
    cancelled:
      "border-burgundy bg-paper text-burgundy",
  };

  return styles[status];
};

const getOrderItemCount = (order: Order) => {
  return order.items.reduce(
    (total, item) => total + item.quantity,
    0,
  );
};

const getProductSummary = (order: Order) => {
  const totalItems = getOrderItemCount(order);

  if (order.items.length === 1) {
    return `${order.items[0].name} · Qty ${totalItems}`;
  }

  return `${totalItems} ${
    totalItems === 1 ? "keepsake" : "keepsakes"
  }`;
};

const TrackOrderPage = () => {
  const router = useRouter();

  const {
    isReady,
    getOrdersByPhone,
    getOrderByNumber,
  } = useOrders();

  const [phone, setPhone] = useState("");
  const [trackingNumber, setTrackingNumber] =
    useState("");

  const [phoneError, setPhoneError] = useState("");
  const [trackingError, setTrackingError] =
    useState("");

  const [matchingOrders, setMatchingOrders] =
    useState<Order[] | null>(null);

  const handlePhoneSearch = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setPhoneError("");

    const phoneDigits = phone.replace(/\D/g, "");

    if (phoneDigits.length < 10) {
      setPhoneError(
        "Enter the phone number used during checkout.",
      );

      setMatchingOrders(null);
      return;
    }

    const orders = [
      ...getOrdersByPhone(phone),
    ].sort(
      (firstOrder, secondOrder) =>
        new Date(secondOrder.createdAt).getTime() -
        new Date(firstOrder.createdAt).getTime(),
    );

    setMatchingOrders(orders);

    if (orders.length === 0) {
      setPhoneError(
        "We couldn’t find an order with that phone number in this browser.",
      );
    }
  };

  const handleTrackingSearch = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setTrackingError("");

    const normalizedTrackingNumber =
      trackingNumber.trim().toUpperCase();

    if (!normalizedTrackingNumber) {
      setTrackingError(
        "Enter your PolaroidsBySolly tracking number.",
      );
      return;
    }

    const order = getOrderByNumber(
      normalizedTrackingNumber,
    );

    if (!order) {
      setTrackingError(
        "We couldn’t find that tracking number in this browser.",
      );
      return;
    }

    router.push(
      `/orders/${encodeURIComponent(
        order.orderNumber,
      )}`,
    );
  };

  if (!isReady) {
    return (
      <main className="min-h-[60vh] bg-cream px-5 py-20 text-ink">
        <p className="text-center text-sm font-semibold text-ink/55">
          Loading order tracking…
        </p>
      </main>
    );
  }

  return (
    <main className="bg-cream pb-16 text-ink">
      {/* Header */}
      <section className="border-b-2 border-ink bg-burgundy text-cream">
        <div className="mx-auto max-w-[1240px] px-5 py-10 md:px-7 md:py-14">
          <div className="mb-4 text-sm font-semibold text-cream/45">
            <Link
              href="/"
              className="transition hover:text-cream"
            >
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
            Enter the phone number used during checkout
            to see your orders, or track one directly
            with its PBS number.
          </p>
        </div>
      </section>

      <TornDivider color="cream" />

      <section className="mx-auto max-w-[1050px] px-5 py-10 md:px-7 lg:py-14">
        {/* Demo notice */}
        <div className="mb-6 flex items-start gap-3 rounded-[14px] border-2 border-ink bg-beige px-4 py-4 text-sm leading-6">
          <LuClock3 className="mt-1 h-4 w-4 shrink-0" />

          <p>
            This mock tracking system only finds orders
            created in this browser. Cross-device
            tracking will work when the order backend is
            connected.
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
              See every order connected to the phone
              number used during checkout.
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
                  phoneError
                    ? "border-burgundy"
                    : "border-ink",
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
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border-2 border-ink bg-burgundy px-5 py-3.5 text-sm font-bold text-cream shadow-[4px_4px_0_#2A211C]"
            >
              <LuSearch className="h-4 w-4" />
              Find My Orders
            </button>
          </form>

          {/* Tracking number search */}
          <form
            onSubmit={handleTrackingSearch}
            className="rounded-[18px] border-2 border-ink bg-paper p-5 shadow-[0_6px_0_rgba(42,33,28,0.08)] sm:p-6"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blush">
              <LuHash className="h-5 w-5" />
            </span>

            <h2 className="mt-5 font-serif text-2xl font-semibold">
              Use Tracking Number
            </h2>

            <p className="mt-2 text-sm leading-6 text-ink/60">
              Open one order directly using the PBS
              number shown after checkout.
            </p>

            <label
              htmlFor="tracking-number"
              className="mb-2 mt-6 block text-sm font-bold"
            >
              PBS tracking number
            </label>

            <div className="relative">
              <LuHash className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />

              <input
                id="tracking-number"
                type="text"
                value={trackingNumber}
                onChange={(event) => {
                  setTrackingNumber(
                    event.target.value.toUpperCase(),
                  );

                  setTrackingError("");
                }}
                placeholder="PBS-260714-K7M4Q2"
                className={[
                  "w-full rounded-xl border-2 bg-cream py-3 pl-11 pr-4 text-sm uppercase outline-none transition focus:border-burgundy",
                  trackingError
                    ? "border-burgundy"
                    : "border-ink",
                ].join(" ")}
              />
            </div>

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
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border-2 border-ink bg-paper px-5 py-3.5 text-sm font-bold shadow-[4px_4px_0_#2A211C]"
            >
              Track This Order
              <LuChevronRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Phone results */}
        {matchingOrders !== null && (
          <section
            aria-live="polite"
            className="mt-10"
          >
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
                  {matchingOrders.length === 1
                    ? "order"
                    : "orders"}
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
                  Check the number and try again. Mock
                  orders can only be found on the device
                  where they were created.
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
                    key={order.id}
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
                              getStatusClassName(
                                order.orderStatus,
                              ),
                            ].join(" ")}
                          >
                            {getStatusLabel(
                              order.orderStatus,
                            )}
                          </span>
                        </div>

                        <p className="mt-3 text-sm font-semibold">
                          {getProductSummary(order)}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink/55">
                          <span className="flex items-center gap-1.5">
                            <LuCalendarDays className="h-3.5 w-3.5" />

                            Placed{" "}
                            {formatDate(order.createdAt)}
                          </span>

                          <span className="flex items-center gap-1.5">
                            <LuClock3 className="h-3.5 w-3.5" />

                            Ready by{" "}
                            {formatDate(
                              order.expectedReadyAt,
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center justify-between gap-5 sm:flex-col sm:items-end">
                        <p className="font-serif text-xl font-bold">
                          {formatPrice(order.total)}
                        </p>

                        <Link
                          href={`/orders/${encodeURIComponent(
                            order.orderNumber,
                          )}`}
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