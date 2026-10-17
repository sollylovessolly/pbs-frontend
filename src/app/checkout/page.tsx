import type { Metadata } from "next";

import CheckoutPage from "@/component/checkout/CheckoutPage";

export const metadata: Metadata = {
  title: "Checkout | PolaroidsBySolly",
  description:
    "Enter your delivery details and complete your PolaroidsBySolly order.",
};

const CheckoutRoute = async ({
  searchParams,
}: {
  searchParams: Promise<{ paymentReference?: string; discountCode?: string }>;
}) => {
  const { paymentReference, discountCode } = await searchParams;
  return (
    <CheckoutPage
      key={paymentReference || "checkout"}
      paymentReference={paymentReference}
      initialDiscountCode={discountCode}
    />
  );
};

export default CheckoutRoute;
