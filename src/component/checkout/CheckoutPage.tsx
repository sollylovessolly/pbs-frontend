"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  LuArrowLeft,
  LuClock3,
  LuCreditCard,
  LuLockKeyhole,
  LuMail,
  LuMapPin,
  LuPackage,
  LuShieldCheck,
  LuShoppingBag,
  LuTruck,
  LuUserRound,
} from "react-icons/lu";

import TornDivider from "@/component/ui/TornDivider";
import MockPaymentModal from "@/component/checkout/MockPaymentModal";
import { useCart } from "@/context/CartContext";
import { useOrders } from "@/context/OrderContext";

const CHECKOUT_STORAGE_KEY =
  "polaroidsbysolly-checkout-details";

const DELIVERY_FEES: Partial<Record<string, number>> = {
  Lagos: 3800,
};

const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Federal Capital Territory",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

type CheckoutForm = {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  notes: string;
};

type CheckoutErrors = Partial<
  Record<keyof CheckoutForm, string>
>;

const initialForm: CheckoutForm = {
  fullName: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  notes: "",
};

const formatPrice = (amount: number) => {
  return `₦${amount.toLocaleString("en-NG")}`;
};

const generateOrderNumber = () => {
  const now = new Date();

  const datePart = [
    String(now.getFullYear()).slice(-2),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");

  const characters =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  const randomValues = new Uint32Array(6);

  crypto.getRandomValues(randomValues);

  const randomPart = Array.from(randomValues)
    .map(
      (value) =>
        characters[value % characters.length],
    )
    .join("");

  return `PBS-${datePart}-${randomPart}`;
};

const maskAddress = (address: string) => {
  const cleanedAddress = address.trim();

  if (!cleanedAddress) {
    return "Address hidden";
  }

  const addressParts = cleanedAddress.split(/\s+/);

  const maskedParts = addressParts.map(
    (part, index) => {
      if (index === 0 && /^\d+[A-Za-z]?$/.test(part)) {
        return part;
      }

      if (part.length <= 2) {
        return `${part[0] ?? ""}••`;
      }

      return `${part.slice(0, 2)}${"•".repeat(
        Math.min(part.length - 2, 5),
      )}`;
    },
  );

  return maskedParts.slice(0, 3).join(" ");
};

const CheckoutPage = () => {
  const router = useRouter();

  const {
    items,
    cartCount,
    subtotal,
    isReady: cartIsReady,
    clearCart,
  } = useCart();

  const {
    addOrder,
    isReady: ordersAreReady,
  } = useOrders();

  const [form, setForm] =
    useState<CheckoutForm>(initialForm);

  const [errors, setErrors] =
    useState<CheckoutErrors>({});

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [
    isMockPaymentOpen,
    setIsMockPaymentOpen,
  ] = useState(false);

  const [
    hasLoadedSavedDetails,
    setHasLoadedSavedDetails,
  ] = useState(false);

  const hasSlowItem = useMemo(() => {
    return items.some((item) => !item.isFast);
  }, [items]);

  const processingEstimate = hasSlowItem
    ? "Up to 48hrs"
    : "Within 24hrs";

  const expectedReadyDate = useMemo(() => {
    const estimatedDate = new Date();

    estimatedDate.setDate(
      estimatedDate.getDate() +
        (hasSlowItem ? 2 : 1),
    );

    return new Intl.DateTimeFormat("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(estimatedDate);
  }, [hasSlowItem]);

  const deliveryFee = form.state
    ? DELIVERY_FEES[form.state] ?? null
    : null;

  const total = subtotal + (deliveryFee ?? 0);

  const paymentDisabled =
    items.length === 0 ||
    isSubmitting ||
    !ordersAreReady ||
    (Boolean(form.state) && deliveryFee === null);

  useEffect(() => {
    try {
      const savedDetails =
        window.localStorage.getItem(
          CHECKOUT_STORAGE_KEY,
        );

      if (savedDetails) {
        const parsedDetails = JSON.parse(
          savedDetails,
        ) as Partial<CheckoutForm>;

        setForm((currentForm) => ({
          ...currentForm,
          ...parsedDetails,
        }));
      }
    } catch (error) {
      console.error(
        "Could not load checkout details:",
        error,
      );
    } finally {
      setHasLoadedSavedDetails(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedSavedDetails) return;

    try {
      window.localStorage.setItem(
        CHECKOUT_STORAGE_KEY,
        JSON.stringify(form),
      );
    } catch (error) {
      console.error(
        "Could not save checkout details:",
        error,
      );
    }
  }, [form, hasLoadedSavedDetails]);

  const updateField = (
    field: keyof CheckoutForm,
    value: string,
  ) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));
  };

  const handleInputChange = (
    event: ChangeEvent<
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement
    >,
  ) => {
    const field =
      event.target.name as keyof CheckoutForm;

    updateField(field, event.target.value);
  };

  const validateForm = () => {
    const nextErrors: CheckoutErrors = {};

    if (form.fullName.trim().length < 2) {
      nextErrors.fullName =
        "Enter your full name.";
    }

    const phoneDigits = form.phone.replace(
      /\D/g,
      "",
    );

    if (
      phoneDigits.length < 10 ||
      phoneDigits.length > 14
    ) {
      nextErrors.phone =
        "Enter a valid phone number.";
    }

    const emailIsValid =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim(),
      );

    if (!emailIsValid) {
      nextErrors.email =
        "Enter a valid email address.";
    }

    if (form.address.trim().length < 5) {
      nextErrors.address =
        "Enter your delivery address.";
    }

    if (form.city.trim().length < 2) {
      nextErrors.city = "Enter your city.";
    }

    if (!form.state) {
      nextErrors.state =
        "Choose your delivery state.";
    } else if (deliveryFee === null) {
      nextErrors.state =
        "Delivery pricing for this state has not been configured yet.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!validateForm()) return;

    setIsMockPaymentOpen(true);
  };

  const handleMockPaymentSuccess = async () => {
    if (
      deliveryFee === null ||
      items.length === 0 ||
      isSubmitting
    ) {
      return;
    }

    setIsSubmitting(true);

    try {
      const orderNumber =
        generateOrderNumber();

      const createdAt = new Date();

      const expectedReadyAt = new Date(
        createdAt,
      );

      expectedReadyAt.setDate(
        expectedReadyAt.getDate() +
          (hasSlowItem ? 2 : 1),
      );

      addOrder({
        orderNumber,

        customer: {
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
        },

        delivery: {
          address: form.address.trim(),
          maskedAddress: maskAddress(
            form.address,
          ),
          city: form.city.trim(),
          state: form.state,
          fee: deliveryFee,
          notes: form.notes.trim(),
        },

        items,

        subtotal,
        total,

        paymentStatus: "paid",
        paymentReference: `MOCK-${orderNumber}`,

        orderStatus: "processing",
        deliveryStatus: "not_dispatched",

        trackingUrl: null,

        createdAt: createdAt.toISOString(),
        expectedReadyAt:
          expectedReadyAt.toISOString(),
      });

      clearCart();

      setIsMockPaymentOpen(false);

      router.push(
        `/order/success?order=${encodeURIComponent(
          orderNumber,
        )}`,
      );
    } catch (error) {
      console.error(
        "Could not create mock order:",
        error,
      );

      window.alert(
        "Something went wrong while creating your order. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClassName = (
    field: keyof CheckoutForm,
  ) => {
    return [
      "w-full rounded-xl border-2 bg-cream px-4 py-3 text-sm text-ink outline-none transition",
      errors[field]
        ? "border-burgundy"
        : "border-ink focus:border-burgundy",
    ].join(" ");
  };

  if (!cartIsReady || !ordersAreReady) {
    return (
      <main className="min-h-[60vh] bg-cream px-5 py-20 text-ink">
        <p className="text-center text-sm font-semibold text-ink/55">
          Loading checkout…
        </p>
      </main>
    );
  }

  return (
    <main className="bg-cream pb-28 text-ink lg:pb-0">
      {/* Page heading */}
      <section className="border-b-2 border-ink bg-burgundy text-cream">
        <div className="mx-auto max-w-[1240px] px-5 py-10 md:px-7 md:py-12">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="mb-4 text-sm font-semibold text-cream/45">
                <Link
                  href="/cart"
                  className="transition hover:text-cream"
                >
                  Cart
                </Link>

                <span className="mx-2">/</span>

                <span>Checkout</span>
              </div>

              <span className="inline-flex -rotate-3 rounded-full border-2 border-ink bg-beige px-4 py-1 font-serif text-lg font-bold italic text-ink shadow-[3px_3px_0_#2A211C]">
                last step
              </span>

              <h1 className="mt-5 font-serif text-4xl font-semibold md:text-5xl">
                Checkout
              </h1>

              <p className="mt-2 max-w-lg text-sm leading-6 text-cream/55">
                Add your delivery details and review your
                order before making payment.
              </p>
            </div>

            <div className="hidden items-center gap-2 pt-2 text-xs font-bold md:flex">
              <span className="text-cream/50">
                Cart
              </span>

              <span className="text-cream/30">
                →
              </span>

              <span>Checkout</span>

              <span className="text-cream/30">
                →
              </span>

              <span className="text-cream/50">
                Order placed
              </span>
            </div>
          </div>
        </div>
      </section>

      <TornDivider color="cream" />

      {items.length === 0 ? (
        <section className="mx-auto max-w-[760px] px-5 py-16 text-center md:px-7">
          <div className="rounded-[18px] border-2 border-ink bg-paper px-6 py-14 shadow-[0_6px_0_rgba(42,33,28,0.08)]">
            <LuShoppingBag
              aria-hidden="true"
              className="mx-auto h-10 w-10"
            />

            <h2 className="mt-5 font-serif text-2xl font-semibold">
              There’s nothing to check out yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink/60">
              Add a keepsake to your cart before entering
              your delivery information.
            </p>

            <Link
              href="/products"
              className="mt-6 inline-flex items-center justify-center rounded-full border-2 border-ink bg-burgundy px-6 py-3 text-sm font-bold text-cream shadow-[4px_4px_0_#2A211C]"
            >
              Shop Products
            </Link>
          </div>
        </section>
      ) : (
        <section className="mx-auto grid max-w-[1240px] items-start gap-8 px-5 py-10 md:px-7 lg:grid-cols-[1.5fr_1fr] lg:py-14">
          {/* Checkout form */}
          <form
            id="checkout-form"
            onSubmit={handleSubmit}
            noValidate
            className="space-y-5"
          >
            {/* Customer details */}
            <section className="rounded-[18px] border-2 border-ink bg-paper p-5 shadow-[0_6px_0_rgba(42,33,28,0.08)] sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-beige">
                  <LuUserRound
                    aria-hidden="true"
                    className="h-5 w-5"
                  />
                </span>

                <div>
                  <h2 className="font-serif text-xl font-semibold">
                    Your Details
                  </h2>

                  <p className="mt-0.5 text-xs text-ink/55">
                    We’ll use these details for order
                    updates.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="fullName"
                    className="mb-2 block text-sm font-bold"
                  >
                    Full name
                  </label>

                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    value={form.fullName}
                    onChange={handleInputChange}
                    placeholder="e.g. Ada Okafor"
                    className={fieldClassName(
                      "fullName",
                    )}
                  />

                  {errors.fullName && (
                    <p className="mt-1.5 text-xs font-semibold text-burgundy">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-bold"
                  >
                    Phone number
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    value={form.phone}
                    onChange={handleInputChange}
                    placeholder="0803 123 4567"
                    className={fieldClassName(
                      "phone",
                    )}
                  />

                  {errors.phone && (
                    <p className="mt-1.5 text-xs font-semibold text-burgundy">
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-bold"
                  >
                    Email address
                  </label>

                  <div className="relative">
                    <LuMail
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45"
                    />

                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={handleInputChange}
                      placeholder="you@email.com"
                      className={`${fieldClassName(
                        "email",
                      )} pl-11`}
                    />
                  </div>

                  {errors.email && (
                    <p className="mt-1.5 text-xs font-semibold text-burgundy">
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Delivery address */}
            <section className="rounded-[18px] border-2 border-ink bg-paper p-5 shadow-[0_6px_0_rgba(42,33,28,0.08)] sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-beige">
                  <LuMapPin
                    aria-hidden="true"
                    className="h-5 w-5"
                  />
                </span>

                <div>
                  <h2 className="font-serif text-xl font-semibold">
                    Delivery Address
                  </h2>

                  <p className="mt-0.5 text-xs text-ink/55">
                    Where should we send your keepsakes?
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="address"
                    className="mb-2 block text-sm font-bold"
                  >
                    Delivery address
                  </label>

                  <input
                    id="address"
                    name="address"
                    type="text"
                    autoComplete="street-address"
                    value={form.address}
                    onChange={handleInputChange}
                    placeholder="Street, apartment and closest landmark"
                    className={fieldClassName(
                      "address",
                    )}
                  />

                  {errors.address && (
                    <p className="mt-1.5 text-xs font-semibold text-burgundy">
                      {errors.address}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="city"
                    className="mb-2 block text-sm font-bold"
                  >
                    City
                  </label>

                  <input
                    id="city"
                    name="city"
                    type="text"
                    autoComplete="address-level2"
                    value={form.city}
                    onChange={handleInputChange}
                    placeholder="e.g. Ikeja"
                    className={fieldClassName(
                      "city",
                    )}
                  />

                  {errors.city && (
                    <p className="mt-1.5 text-xs font-semibold text-burgundy">
                      {errors.city}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="state"
                    className="mb-2 block text-sm font-bold"
                  >
                    State
                  </label>

                  <select
                    id="state"
                    name="state"
                    autoComplete="address-level1"
                    value={form.state}
                    onChange={handleInputChange}
                    className={fieldClassName(
                      "state",
                    )}
                  >
                    <option value="">
                      Choose a state
                    </option>

                    {NIGERIAN_STATES.map((state) => (
                      <option
                        key={state}
                        value={state}
                      >
                        {state}
                      </option>
                    ))}
                  </select>

                  {errors.state && (
                    <p className="mt-1.5 text-xs font-semibold text-burgundy">
                      {errors.state}
                    </p>
                  )}

                  {form.state &&
                    deliveryFee === null &&
                    !errors.state && (
                      <p className="mt-1.5 text-xs leading-5 text-ink/55">
                        Delivery pricing for this state
                        has not been added yet.
                      </p>
                    )}
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="notes"
                    className="mb-2 block text-sm font-bold"
                  >
                    Order notes{" "}
                    <span className="font-normal text-ink/45">
                      (optional)
                    </span>
                  </label>

                  <textarea
                    id="notes"
                    name="notes"
                    value={form.notes}
                    onChange={handleInputChange}
                    placeholder="Delivery timing, gift instructions or anything else we should know"
                    rows={3}
                    className={`${fieldClassName(
                      "notes",
                    )} resize-y`}
                  />
                </div>
              </div>
            </section>

            {/* Payment */}
            <section className="rounded-[18px] border-2 border-ink bg-paper p-5 shadow-[0_6px_0_rgba(42,33,28,0.08)] sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-beige">
                  <LuCreditCard
                    aria-hidden="true"
                    className="h-5 w-5"
                  />
                </span>

                <div>
                  <h2 className="font-serif text-xl font-semibold">
                    Payment
                  </h2>

                  <p className="mt-0.5 text-xs text-ink/55">
                    Production begins after successful
                    payment.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-4 rounded-[14px] border-2 border-ink bg-beige px-4 py-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-paper">
                  <LuLockKeyhole
                    aria-hidden="true"
                    className="h-5 w-5"
                  />
                </span>

                <div>
                  <p className="text-sm font-bold">
                    Pay online with Paystack
                  </p>

                  <p className="mt-1 text-xs leading-5 text-ink/55">
                    Card, bank transfer or USSD through
                    Paystack’s secure checkout.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex gap-3">
                  <LuShieldCheck
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 shrink-0"
                  />

                  <p className="leading-6">
                    Your uploaded photos are only used to
                    prepare your order.
                  </p>
                </div>

                <div className="flex gap-3">
                  <LuMail
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 shrink-0"
                  />

                  <p className="leading-6">
                    A confirmation email is meant to be
                    sent after payment. Email delivery is
                    not connected yet.
                  </p>
                </div>

                <div className="flex gap-3">
                  <LuTruck
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 shrink-0"
                  />

                  <p className="leading-6">
                    Delivery will be arranged once all
                    products are ready.
                  </p>
                </div>
              </div>
            </section>
          </form>

          {/* Order summary */}
          <aside className="rounded-[18px] border-2 border-ink bg-paper p-5 shadow-[0_6px_0_rgba(42,33,28,0.08)] sm:p-6 lg:sticky lg:top-28">
            <h2 className="font-serif text-xl font-semibold">
              Order Summary
            </h2>

            <div className="mt-5 max-h-[310px] space-y-1 overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 border-b border-dashed border-ink/20 py-3"
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

                  <p className="shrink-0 text-sm font-bold">
                    {formatPrice(
                      item.unitPrice *
                        item.quantity,
                    )}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-3 flex justify-between border-b border-dashed border-ink/20 py-3 text-sm">
              <span className="font-semibold text-ink/55">
                Subtotal
              </span>

              <span className="font-bold">
                {formatPrice(subtotal)}
              </span>
            </div>

            <div className="flex justify-between border-b border-dashed border-ink/20 py-3 text-sm">
              <span className="font-semibold text-ink/55">
                Delivery fee
              </span>

              <span className="text-right font-bold">
                {!form.state
                  ? "Choose a state"
                  : deliveryFee === null
                    ? "Not configured"
                    : formatPrice(deliveryFee)}
              </span>
            </div>

            <div className="flex items-center justify-between py-4">
              <span className="font-semibold">
                Total
              </span>

              <span className="font-serif text-2xl font-bold text-burgundy">
                {formatPrice(total)}
              </span>
            </div>

            <div className="rounded-[14px] border-2 border-ink bg-beige px-4 py-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2 font-semibold text-ink/55">
                  <LuClock3
                    aria-hidden="true"
                    className="h-4 w-4"
                  />

                  Processing
                </span>

                <span className="text-right font-bold">
                  {processingEstimate}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="flex items-center gap-2 font-semibold text-ink/55">
                  <LuPackage
                    aria-hidden="true"
                    className="h-4 w-4"
                  />

                  Expected ready
                </span>

                <span className="text-right font-bold">
                  {expectedReadyDate}
                </span>
              </div>
            </div>

            <button
              type="submit"
              form="checkout-form"
              disabled={paymentDisabled}
              className="mt-6 flex w-full items-center justify-center rounded-full border-2 border-ink bg-burgundy px-5 py-3.5 text-sm font-bold text-cream shadow-[4px_4px_0_#2A211C] transition hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-x-0 disabled:hover:translate-y-0"
            >
              {isSubmitting
                ? "Creating Order…"
                : `Pay Securely — ${formatPrice(
                    total,
                  )}`}
            </button>

            <Link
              href="/cart"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border-2 border-ink bg-paper px-5 py-3.5 text-sm font-bold shadow-[4px_4px_0_#2A211C]"
            >
              <LuArrowLeft
                aria-hidden="true"
                className="h-4 w-4"
              />

              Back to Cart
            </Link>
          </aside>
        </section>
      )}

      {/* Mobile checkout bar */}
      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t-2 border-ink bg-cream px-4 py-3 lg:hidden">
          <div className="shrink-0">
            <p className="text-[10px] font-semibold text-ink/55">
              Total
            </p>

            <p className="font-serif text-base font-bold text-burgundy">
              {formatPrice(total)}
            </p>
          </div>

          <button
            type="submit"
            form="checkout-form"
            disabled={paymentDisabled}
            className="flex flex-1 items-center justify-center rounded-full border-2 border-ink bg-burgundy px-4 py-3 text-sm font-bold text-cream shadow-[3px_3px_0_#2A211C] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting
              ? "Creating Order…"
              : "Continue to Payment"}
          </button>
        </div>
      )}

      <MockPaymentModal
        isOpen={isMockPaymentOpen}
        total={total}
        isProcessing={isSubmitting}
        onCancel={() => {
          if (!isSubmitting) {
            setIsMockPaymentOpen(false);
          }
        }}
        onConfirm={handleMockPaymentSuccess}
      />
    </main>
  );
};

export default CheckoutPage;