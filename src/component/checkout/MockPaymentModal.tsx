"use client";

import { useEffect } from "react";
import {
  LuCreditCard,
  LuLockKeyhole,
  LuX,
} from "react-icons/lu";

type MockPaymentModalProps = {
  isOpen: boolean;
  total: number;
  isProcessing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

const formatPrice = (amount: number) => {
  return `₦${amount.toLocaleString("en-NG")}`;
};

const MockPaymentModal = ({
  isOpen,
  total,
  isProcessing,
  onCancel,
  onConfirm,
}: MockPaymentModalProps) => {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key === "Escape" &&
        !isProcessing
      ) {
        onCancel();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [isOpen, isProcessing, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mock-payment-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/65 px-4 py-8"
    >
      <div className="relative w-full max-w-md rounded-[20px] border-2 border-ink bg-paper p-6 text-ink shadow-[8px_8px_0_#2A211C] sm:p-8">
        <button
          type="button"
          aria-label="Close payment preview"
          disabled={isProcessing}
          onClick={onCancel}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-cream disabled:cursor-not-allowed disabled:opacity-40"
        >
          <LuX
            aria-hidden="true"
            className="h-4 w-4"
          />
        </button>

        <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink bg-beige">
          <LuCreditCard
            aria-hidden="true"
            className="h-6 w-6"
          />
        </span>

        <h2
          id="mock-payment-title"
          className="mt-5 pr-10 font-serif text-2xl font-semibold"
        >
          Paystack checkout goes here
        </h2>

        <p className="mt-3 text-sm leading-6 text-ink/65">
          In the completed version, Paystack’s secure
          payment window will open here. For now, click
          the button below to simulate a successful
          payment.
        </p>

        <div className="mt-5 flex items-center justify-between rounded-[14px] border-2 border-ink bg-beige px-4 py-4">
          <span className="text-sm font-semibold">
            Amount to pay
          </span>

          <span className="font-serif text-xl font-bold text-burgundy">
            {formatPrice(total)}
          </span>
        </div>

        <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-ink/55">
          <LuLockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />

          <p>
            This is only a demo. No real payment will be
            charged.
          </p>
        </div>

        <button
          type="button"
          disabled={isProcessing}
          onClick={onConfirm}
          className="mt-6 flex w-full items-center justify-center rounded-full border-2 border-ink bg-burgundy px-5 py-3.5 text-sm font-bold text-cream shadow-[4px_4px_0_#2A211C] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isProcessing
            ? "Creating Your Order…"
            : "OK — Simulate Payment"}
        </button>

        <button
          type="button"
          disabled={isProcessing}
          onClick={onCancel}
          className="mt-3 flex w-full items-center justify-center rounded-full border-2 border-ink bg-paper px-5 py-3.5 text-sm font-bold shadow-[4px_4px_0_#2A211C] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default MockPaymentModal;