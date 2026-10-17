import type { CartItem } from "@/types/cart";

export type PaymentStatus = "pending" | "paid" | "failed";

export type OrderStatus =
  "processing" | "ready" | "dispatched" | "delivered" | "cancelled";

export type DeliveryStatus = "not_dispatched" | "dispatched" | "delivered";

export type Order = {
  id: string;
  orderNumber: string;

  customer: {
    fullName: string;
    phone: string;
    email: string;
  };

  delivery: {
    address: string;
    maskedAddress: string;
    city: string;
    state: string;
    fee: number;
    notes?: string;
  };

  items: CartItem[];

  subtotal: number;
  total: number;

  paymentStatus: PaymentStatus;
  paymentReference?: string;

  orderStatus: OrderStatus;
  deliveryStatus: DeliveryStatus;

  trackingUrl?: string | null;

  createdAt: string;
  expectedReadyAt: string;
};

export type NewOrder = Omit<Order, "id">;
