import type { CartItem } from "../../types/cart";
import type { CreateOrderPayload } from "../api/types";
import { safeUrl } from "./catalogue";
export function orderItems(items: CartItem[]): CreateOrderPayload["items"] {
  if (!items.length) throw new Error("Your cart is empty.");
  return items.map((item) => {
    if (
      !item.variantSku ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1
    )
      throw new Error(
        "Please remove older cart items and customize them again.",
      );
    const data = item.customization ?? {};
    const required =
      item.productType === "polaroid"
        ? ["finalPngUrl", "previewUrl"]
        : item.productType === "photostrip"
          ? ["finalPngUrl"]
          : item.productType === "vintage-letter"
            ? ["finalPdfUrl"]
            : [];
    if (required.some((key) => !safeUrl(data[key])))
      throw new Error(`Please finish uploading ${item.name} before checkout.`);
    if (
      item.productType === "phone-case" &&
      !["CASE_ONLY", "WITH_POLAROID"].includes(data.package)
    )
      throw new Error("Please choose a phone case package.");
    const customization = Object.fromEntries(
      required.map((key) => [key, data[key]]),
    );
    if (item.productType === "phone-case") customization.package = data.package;
    return {
      variantSku: item.variantSku,
      quantity: item.quantity,
      ...(Object.keys(customization).length ? { customization } : {}),
    };
  });
}
export const PENDING_PAYMENT_KEY = "pbs-pending-payment-v1";
export type PendingPayment = {
  orderId: string;
  orderNumber: string;
  totalAmount: string | number;
  reference?: string;
  itemIds: string[];
};
export function readPending(): PendingPayment | null {
  try {
    const data = JSON.parse(
      sessionStorage.getItem(PENDING_PAYMENT_KEY) || "null",
    );
    return data &&
      typeof data.orderId === "string" &&
      Array.isArray(data.itemIds)
      ? data
      : null;
  } catch {
    return null;
  }
}

export const CHECKOUT_ATTEMPT_KEY = "pbs-checkout-attempt-v1";
export type CheckoutAttempt = {
  payload: CreateOrderPayload;
  itemIds: string[];
};
export function readCheckoutAttempt(): CheckoutAttempt | null {
  try {
    const value = JSON.parse(
      sessionStorage.getItem(CHECKOUT_ATTEMPT_KEY) || "null",
    );
    return value?.payload?.source === "WEBSITE" && Array.isArray(value.itemIds)
      ? value
      : null;
  } catch {
    return null;
  }
}
