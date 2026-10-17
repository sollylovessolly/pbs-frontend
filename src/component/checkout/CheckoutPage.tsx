"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PaymentResultModal from "./PaymentResultModal";
import { openPaymentPopup } from "@/lib/commerce/paystack";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useCart } from "@/context/CartContext";
import {
  createOrder,
  getDeliveryRates,
  getProducts,
  getShippingRates,
  initializePayment,
} from "@/lib/api";
import type { DeliveryRate, ShippingRateResponse } from "@/lib/api/types";
import { money, validateCart } from "@/lib/commerce/catalogue";
import {
  CHECKOUT_ATTEMPT_KEY,
  readCheckoutAttempt,
  type CheckoutAttempt,
  orderItems,
  PENDING_PAYMENT_KEY,
  readPending,
  type PendingPayment,
} from "@/lib/commerce/checkout";
import { ApiError } from "@/lib/api/client";
import TornDivider from "@/component/ui/TornDivider";
const fieldClass =
  "mt-2 w-full rounded-xl border-2 border-ink bg-cream px-4 py-3 focus:outline-burgundy";
const buttonClass =
  "rounded-full border-2 border-ink bg-burgundy px-6 py-3 font-bold text-cream shadow-[3px_3px_0_#2A211C] disabled:opacity-40";
export default function CheckoutPage({
  paymentReference,
  initialDiscountCode = "",
}: {
  paymentReference?: string;
  initialDiscountCode?: string;
}) {
  const router = useRouter();
  const [resultReference, setResultReference] = useState(
    paymentReference || "",
  );
  const { items, subtotal, isReady, updateItem } = useCart();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    state: "",
    note: "",
    discountCode: initialDiscountCode,
  });
  const [premiumPackaging, setPremiumPackaging] = useState(false);
  const packagingIncluded = items.some((i) => !!i.packageGroupId);
  const packagingFee = premiumPackaging && !packagingIncluded ? 1500 : 0;
  const [rates, setRates] = useState<DeliveryRate[]>([]);
  const [ratesLoaded, setRatesLoaded] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState(false);
  const [shipping, setShipping] = useState<ShippingRateResponse | null>(null);
  const [courierIndex, setCourierIndex] = useState("");
  const [shippingMessage, setShippingMessage] = useState("");
  const [recovery, setRecovery] = useState<CheckoutAttempt | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [pending, setPending] = useState<PendingPayment | null>(null);
  const lock = useRef(false);
  const quoteVersion = useRef(0);
  const loadRates = (signal?: AbortSignal) =>
    getDeliveryRates(signal)
      .then((data) => {
        setRates(data.filter((r) => r.isActive));
        setRatesLoaded(true);
      })
      .catch((e) => {
        if (!signal?.aborted) setError(e.message);
      });
  useEffect(() => {
    const controller = new AbortController();
    void loadRates(controller.signal);
    queueMicrotask(() => {
      setPending(readPending());
      setRecovery(readCheckoutAttempt());
      setUncertain(
        sessionStorage.getItem("pbs-order-submitting") === "true" &&
          !readPending() &&
          !readCheckoutAttempt(),
      );
    });
    return () => controller.abort();
  }, []);
  const courier = shipping?.couriers[Number(courierIndex)];
  const fee = rates.find((rate) => rate.state === form.state)?.fee;
  const change = (key: keyof typeof form, value: string) => {
    quoteVersion.current++;
    setQuoting(false);
    setForm((current) => ({ ...current, [key]: value }));
    setReview(false);
    setShipping(null);
    setCourierIndex("");
    setShippingMessage("");
  };
  const validate = () => {
    if (
      !form.name.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ||
      form.phone.replace(/\D/g, "").length < 10 ||
      form.address.trim().length < 10 ||
      !form.state
    )
      throw new Error(
        "Enter your name, valid email and phone number, state and complete delivery address.",
      );
    return orderItems(items);
  };
  const prepareReview = async (event: FormEvent) => {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      validate();
      const products = await getProducts(undefined, true);
      validateCart(items, products);
      for (const item of items) {
        const v = products
          .flatMap((p) => p.variants)
          .find((v) => v.sku === item.variantSku)!;
        updateItem(item.id, {
          unitPrice: Number(v.sellingPrice),
          availableQuantity: v.availableQuantity,
        });
      }
      setReview(true);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Please check your details and retry.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const loadCouriers = async () => {
    const version = ++quoteVersion.current;
    setQuoting(true);
    setShippingMessage("");
    try {
      const quotes = await getShippingRates(
        {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.replace(/\D/g, ""),
          address: form.address.trim(),
          state: form.state,
          items: orderItems(items).map(({ variantSku, quantity }) => ({
            variantSku,
            quantity,
          })),
        },
        AbortSignal.timeout(8000),
      );
      if (version !== quoteVersion.current) return;
      setShipping(quotes);
      if (!quotes.couriers.length)
        setShippingMessage("Standard delivery is available.");
    } catch {
      if (version !== quoteVersion.current) return;
      setShippingMessage("Standard delivery is available.");
    } finally {
      if (version === quoteVersion.current) setQuoting(false);
    }
  };
  const pay = async () => {
    if (lock.current || uncertain) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      let current = pending ?? readPending();
      if (!current) {
        let attempt = readCheckoutAttempt();
        if (!attempt) {
          const payloadItems = validate();
          if (fee === undefined)
            throw new Error("Please select an available delivery option.");
          // Confirm recovery storage works before creating an order.
          sessionStorage.setItem("pbs-storage-check", "1");
          sessionStorage.removeItem("pbs-storage-check");
          attempt = {
            itemIds: items.map((item) => item.id),
            payload: {
              checkoutKey: crypto.randomUUID(),
              source: "WEBSITE",
              premiumPackaging: premiumPackaging || packagingIncluded,
              customer: {
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone.replace(/\D/g, ""),
              },
              delivery: { state: form.state, address: form.address.trim() },
              ...(form.note.trim() ? { customerNote: form.note.trim() } : {}),
              ...(form.discountCode.trim()
                ? { discountCode: form.discountCode.trim() }
                : {}),
              ...(courierIndex !== "" && courier && shipping
                ? {
                    shipment: {
                      requestToken: shipping.requestToken,
                      serviceCode: courier.serviceCode,
                      courierId: courier.courierId,
                    },
                  }
                : {}),
              items: payloadItems,
            },
          };
          sessionStorage.setItem(CHECKOUT_ATTEMPT_KEY, JSON.stringify(attempt));
        }
        const order = await createOrder(attempt.payload).catch((error) => {
          if (
            error instanceof ApiError &&
            error.status >= 400 &&
            error.status < 500
          ) {
            sessionStorage.removeItem(CHECKOUT_ATTEMPT_KEY);
            setRecovery(null);
          } else setRecovery(attempt);
          throw error;
        });
        current = {
          orderId: order.id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          itemIds: attempt.itemIds,
        };
        setPending(current);
        sessionStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(current));
        sessionStorage.removeItem("pbs-order-submitting");
        sessionStorage.removeItem(CHECKOUT_ATTEMPT_KEY);
        setRecovery(null);
      }
      let payment;
      try {
        payment = await initializePayment(current.orderId);
      } catch (error) {
        if (
          current.reference &&
          error instanceof ApiError &&
          error.status === 400 &&
          /already.*paid/i.test(error.message)
        ) {
          setResultReference(current.reference);
          return;
        }
        throw error;
      }

      const saved = { ...current, reference: payment.reference };
      setPending(saved);
      sessionStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(saved));
      if (await openPaymentPopup(payment.accessCode)) {
        setResultReference(payment.reference);
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Payment could not start. Please retry.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  if (!isReady)
    return (
      <p className="p-12" role="status">
        Loading checkout…
      </p>
    );
  return (
    <main className="bg-cream pb-16 text-ink">
      {resultReference && (
        <PaymentResultModal
          key={resultReference}
          reference={resultReference}
          onVerified={() => setPending(null)}
          onClose={() => {
            setResultReference("");
            if (paymentReference) router.replace("/checkout");
          }}
        />
      )}
      <section className="border-b-2 border-ink bg-burgundy px-5 py-12 text-cream">
        <div className="mx-auto max-w-[1240px]">
          <Link href="/cart">Cart / Checkout</Link>
          <h1 className="mt-5 font-serif text-5xl">Checkout</h1>
          <p className="mt-3">Your memories, almost on their way.</p>
        </div>
      </section>
      <TornDivider color="cream" />
      <div className="mx-auto max-w-[1240px] px-5 py-8">
        {error && (
          <p
            role="alert"
            className="mb-5 rounded-xl border-2 border-burgundy p-4"
          >
            {error}{" "}
            {!ratesLoaded && (
              <button
                onClick={() => {
                  setError("");
                  void loadRates();
                }}
              >
                Retry delivery rates
              </button>
            )}
          </p>
        )}
        {uncertain && !pending ? (
          <section className="rounded-2xl border-2 border-ink bg-paper p-6">
            <h2 className="font-serif text-2xl">
              We could not confirm whether your order was created
            </h2>
            <p className="my-4">
              Please contact the shop before placing it again, so you are not
              charged for a duplicate order. Your cart is still saved.
            </p>
            <Link href="/track-order" className="underline">
              Check paid orders
            </Link>
          </section>
        ) : recovery && !pending ? (
          <section className="rounded-2xl border-2 border-ink bg-paper p-6">
            <h2 className="font-serif text-2xl">Continue your order</h2>
            <p className="my-4">Your order details are saved.</p>
            <button
              className={buttonClass}
              disabled={busy}
              onClick={() => void pay()}
            >
              {busy ? "Opening payment…" : "Continue to payment"}
            </button>
          </section>
        ) : pending ? (
          <section className="rounded-2xl border-2 border-ink bg-paper p-6">
            <h2 className="font-serif text-2xl">
              Order {pending.orderNumber} is awaiting payment
            </h2>
            <p className="my-4">Total: {money(pending.totalAmount)}.</p>
            <button
              className={buttonClass}
              disabled={busy}
              onClick={() => void pay()}
            >
              {busy ? "Opening payment…" : "Retry payment"}
            </button>
            {pending.reference && (
              <button
                className="ml-4 underline"
                onClick={() => setResultReference(pending.reference!)}
              >
                Check payment status
              </button>
            )}
          </section>
        ) : !items.length ? (
          <p>
            Your cart is empty.{" "}
            <Link href="/products" className="underline">
              Shop keepsakes
            </Link>
          </p>
        ) : (
          <div className="grid items-start gap-8 lg:grid-cols-[1.5fr_1fr]">
            <form
              onSubmit={prepareReview}
              className="space-y-5 rounded-2xl border-2 border-ink bg-paper p-6"
            >
              <h2 className="font-serif text-2xl">Delivery details</h2>

              {(["name", "email", "phone", "address"] as const).map((key) => (
                <label
                  key={key}
                  className="block font-semibold"
                  htmlFor={`checkout-${key}`}
                >
                  {
                    {
                      name: "Full name",
                      email: "Email",
                      phone: "Phone number",
                      address: "Complete delivery address",
                    }[key]
                  }
                  <input
                    id={`checkout-${key}`}
                    className={fieldClass}
                    value={form[key]}
                    type={
                      key === "email"
                        ? "email"
                        : key === "phone"
                          ? "tel"
                          : "text"
                    }
                    autoComplete={
                      {
                        name: "name",
                        email: "email",
                        phone: "tel",
                        address: "street-address",
                      }[key]
                    }
                    required
                    minLength={key === "address" ? 10 : undefined}
                    onChange={(e) => change(key, e.target.value)}
                    disabled={busy}
                  />
                </label>
              ))}
              <label className="block font-semibold" htmlFor="checkout-state">
                State
                <select
                  id="checkout-state"
                  aria-label="State"
                  className={fieldClass}
                  required
                  value={form.state}
                  onChange={(e) => change("state", e.target.value)}
                  disabled={busy || !ratesLoaded}
                >
                  <option value="">
                    {ratesLoaded ? "Choose a state" : "Loading delivery rates…"}
                  </option>
                  {rates.map((rate) => (
                    <option key={rate.state}>{rate.state}</option>
                  ))}
                </select>
              </label>
              {ratesLoaded && !rates.length && (
                <p>
                  No state delivery rates are configured yet. Please try again
                  later.
                </p>
              )}
              <div className="rounded-xl border-2 border-ink bg-paper p-4">
                {packagingIncluded ? (
                  <p className="font-bold">
                    Premium protective packaging is included with your gift
                    package.
                  </p>
                ) : (
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={premiumPackaging}
                      onChange={(e) => {
                        setPremiumPackaging(e.target.checked);
                        setReview(false);
                      }}
                      className="mt-1"
                    />
                    <span>
                      <strong>Premium protective packaging · ₦1,500</strong>
                      <span className="mt-2 block text-sm leading-6">
                        Add a sturdy protective box for extra cushioning and
                        support during delivery, helping reduce the risk of
                        crushing and damage from rough handling.
                      </span>
                    </span>
                  </label>
                )}
              </div>
              <label className="block" htmlFor="checkout-note">
                Order note (optional)
                <textarea
                  id="checkout-note"
                  className={fieldClass}
                  value={form.note}
                  onChange={(e) => change("note", e.target.value)}
                />
              </label>
              <label className="block" htmlFor="checkout-discount">
                Discount code (optional)
                <input
                  id="checkout-discount"
                  className={fieldClass}
                  value={form.discountCode}
                  onChange={(e) => change("discountCode", e.target.value)}
                />
              </label>
              <button className={buttonClass} disabled={busy || !ratesLoaded}>
                {busy ? "Checking your order…" : "Review order"}
              </button>
            </form>
            <aside className="rounded-2xl border-2 border-ink bg-paper p-6 lg:sticky lg:top-24">
              <h2 className="font-serif text-2xl">Order summary</h2>
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between gap-4 border-b border-dashed border-ink/30 py-4"
                >
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>
                    {item.packageId
                      ? "Included in package"
                      : money(item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))}
              <p className="mt-4">Subtotal: {money(subtotal)}</p>
              <p className="mt-2">
                Premium packaging:{" "}
                {packagingIncluded
                  ? "Included"
                  : packagingFee
                    ? money(packagingFee)
                    : "Not selected"}
              </p>
              <p className="mt-2">
                Delivery: {fee === undefined ? "Choose a state" : money(fee)}
              </p>
              <p className="my-4 font-serif text-2xl">
                Estimated total:{" "}
                {money(subtotal + packagingFee + Number(fee ?? 0))}
              </p>
              {review && (
                <section aria-live="polite">
                  {!shipping && (
                    <button
                      type="button"
                      className="text-sm underline"
                      disabled={quoting}
                      onClick={() => void loadCouriers()}
                    >
                      {quoting ? "Finding couriers…" : "Other delivery options"}
                    </button>
                  )}
                  {shippingMessage && (
                    <p className="text-sm">{shippingMessage}</p>
                  )}
                  {shipping && (
                    <label className="mt-4 block" htmlFor="courier">
                      Delivery option
                      <select
                        id="courier"
                        aria-label="Delivery option"
                        className={fieldClass}
                        value={courierIndex}
                        onChange={(e) => setCourierIndex(e.target.value)}
                      >
                        <option value="">State delivery rate</option>
                        {shipping.couriers.map((c, i) => (
                          <option
                            key={`${c.courierId}-${c.serviceCode}`}
                            value={i}
                          >
                            {c.courierName} · {c.serviceType} · quote{" "}
                            {money(c.total)} {c.deliveryEta ?? ""}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <p className="my-4 text-sm">
                    Deliver to {form.name}, {form.address}, {form.state}.
                    Confirmation: {form.email}.
                  </p>

                  <p className="my-4 text-xs leading-5 text-ink/70">
                    Custom orders: no change-of-mind refunds once processing
                    starts, except where required by law.{" "}
                    <Link
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      Terms
                    </Link>
                    {" · "}
                    <Link
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      Privacy
                    </Link>
                  </p>
                  <button
                    className={buttonClass}
                    disabled={busy || fee === undefined}
                    onClick={() => void pay()}
                  >
                    {busy ? "Preparing payment…" : "Place order & pay securely"}
                  </button>
                </section>
              )}
              {process.env.NEXT_PUBLIC_PAYSTACK_TEST_MODE === "true" && (
                <p className="mt-4 font-bold">
                  Test mode — use Paystack test payment details.
                </p>
              )}
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
