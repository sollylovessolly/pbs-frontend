"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { verifyPayment, findTrackedOrders } from "@/lib/api";
import type { BackendOrder } from "@/lib/api/types";
import { money } from "@/lib/commerce/catalogue";
import { PENDING_PAYMENT_KEY, readPending } from "@/lib/commerce/checkout";
import { useCart } from "@/context/CartContext";
export default function PaymentResultModal({
  reference,
  onClose,
  onVerified,
}: {
  reference: string;
  onClose: () => void;
  onVerified: () => void;
}) {
  const { isReady, removeItem } = useCart();
  const ref = useRef<HTMLDialogElement>(null);
  const actions = useRef({ removeItem, onVerified });
  useEffect(() => {
    actions.current = { removeItem, onVerified };
  }, [removeItem, onVerified]);
  const [order, setOrder] = useState<BackendOrder | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [token, setToken] = useState("");
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  useEffect(() => {
    if (!isReady) return;
    const controller = new AbortController();
    const run = async () => {
      setBusy(true);
      setError("");
      try {
        const saved = readPending();
        const result = await verifyPayment(reference, controller.signal);
        if (controller.signal.aborted) return;
        if (result.paymentStatus !== "PAID")
          throw new Error(
            "Your payment is not confirmed yet. Please check again shortly.",
          );
        if (saved?.reference === reference && saved.orderId !== result.id)
          throw new Error(
            "We could not match this payment to your order. Please contact us.",
          );
        setOrder(result);
        if (saved?.orderId === result.id) {
          for (const id of saved.itemIds) actions.current.removeItem(id);
          sessionStorage.removeItem(PENDING_PAYMENT_KEY);
          actions.current.onVerified();
        }
        if (result.trackingToken) setToken(result.trackingToken);
        else if (result.customer?.phone) {
          void findTrackedOrders(result.customer.phone, controller.signal)
            .then((orders) => {
              const match = orders.find(
                (o) => o.orderNumber === result.orderNumber,
              );
              if (!controller.signal.aborted && match)
                setToken(match.trackingToken);
            })
            .catch(() => {});
        }
      } catch (e) {
        if (!controller.signal.aborted)
          setError(
            e instanceof Error
              ? e.message
              : "Could not confirm payment. Please retry.",
          );
      } finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    };
    void run();
    return () => controller.abort();
  }, [reference, attempt, isReady]);
  const button =
    "rounded-full border-2 border-ink bg-burgundy px-5 py-3 font-bold text-cream";
  return (
    <dialog
      ref={ref}
      aria-labelledby="payment-result-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto rounded-2xl border-2 border-ink bg-paper p-6 text-ink shadow-xl backdrop:bg-ink/50 sm:p-8"
    >
      <button
        onClick={onClose}
        aria-label="Close payment status"
        className="float-right rounded-full px-3 py-1 text-xl"
      >
        ×
      </button>
      <div aria-hidden="true" className="mb-5 text-4xl text-burgundy">
        {order ? "✓" : "♡"}
      </div>
      <h2 id="payment-result-title" className="font-serif text-3xl">
        {order
          ? "Payment successful"
          : busy
            ? "Confirming payment…"
            : "Payment status"}
      </h2>
      {busy ? (
        <p role="status" className="my-5">
          Just a moment…
        </p>
      ) : order ? (
        <>
          <p className="mt-5">Thank you for your order!</p>
          <p className="my-3 font-semibold">{order.orderNumber}</p>
          <p className="mb-6">Paid: {money(order.totalAmount)}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              className={button}
              href={
                token
                  ? `/orders/${encodeURIComponent(token)}`
                  : `/track-order?orderNumber=${encodeURIComponent(order.orderNumber)}`
              }
            >
              Track your order
            </Link>
            <button className="px-3 underline" onClick={onClose}>
              Continue shopping
            </button>
          </div>
        </>
      ) : (
        <>
          <p role="alert" className="my-5">
            {error}
          </p>
          <button className={button} onClick={() => setAttempt((n) => n + 1)}>
            Check payment again
          </button>
        </>
      )}
    </dialog>
  );
}
