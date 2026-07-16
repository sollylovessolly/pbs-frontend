import type { Metadata } from "next";
import CartPage from "@/component/cart/CartPage";

export const metadata: Metadata = {
  title: "Your Cart | PolaroidsBySolly",
  description:
    "Review your customized keepsakes before checkout.",
};

const CartRoute = () => {
  return <CartPage />;
};

export default CartRoute;