import type { Metadata } from "next";

import CheckoutPage from "@/component/checkout/CheckoutPage";

export const metadata: Metadata = {
  title: "Checkout | PolaroidsBySolly",
  description:
    "Enter your delivery details and complete your PolaroidsBySolly order.",
};

const CheckoutRoute = () => {
  return <CheckoutPage />;
};

export default CheckoutRoute;