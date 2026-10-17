import {
  normalizeCatalogue,
  normalizeCatalogueProduct,
  type PublicCatalogueProduct,
} from "./catalogue";
import {
  apiGet,
  apiPost,
  apiUpload,
  apiUploadWithProgress,
} from "@/lib/api/client";
import type {
  BackendOrder,
  CreateOrderPayload,
  DeliveryRate,
  PaymentInitialization,
  ShippingRateResponse,
  TrackingOrderCard,
  UploadPurpose,
  UploadResponse,
} from "@/lib/api/types";

let catalogueCache:
  | { expires: number; products: ReturnType<typeof normalizeCatalogue> }
  | undefined;
export const getProducts = (signal?: AbortSignal, fresh = false) => {
  if (
    !fresh &&
    catalogueCache &&
    catalogueCache.expires > Date.now() &&
    !signal?.aborted
  )
    return Promise.resolve(catalogueCache.products);
  return apiGet<PublicCatalogueProduct[]>("/products", signal).then((data) => {
    const products = normalizeCatalogue(data);
    catalogueCache = { expires: Date.now() + 15000, products };
    return products;
  });
};

export const getProduct = (id: string, signal?: AbortSignal) =>
  apiGet<PublicCatalogueProduct>(
    `/products/${encodeURIComponent(id)}`,
    signal,
  ).then(normalizeCatalogueProduct);

export const getDeliveryRates = (signal?: AbortSignal) =>
  apiGet<DeliveryRate[]>("/delivery-rates", signal);

export const getDeliveryRate = (state: string, signal?: AbortSignal) =>
  apiGet<DeliveryRate>(`/delivery-rates/${encodeURIComponent(state)}`, signal);

export const getShippingRates = (
  payload: {
    name: string;
    email: string;
    phone: string;
    address: string;
    state: string;
    pickupDate?: string;
    items: Array<{
      variantSku: string;
      quantity: number;
    }>;
  },
  signal?: AbortSignal,
) => apiPost<ShippingRateResponse>("/shipping/rates", payload, signal);

export const uploadProductionFile = async (
  file: File,
  purpose: UploadPurpose,
  signal?: AbortSignal,
  onProgress?: (percent: number) => void,
) => {
  const types =
    purpose === "VINTAGE_LETTER_FINAL"
      ? ["application/pdf"]
      : purpose === "POLAROID_PREVIEW"
        ? ["image/png", "image/jpeg", "image/webp"]
        : ["image/png"];
  if (!types.includes(file.type))
    throw new Error("Please choose a file in the required format.");
  const limit =
    purpose === "POLAROID_PREVIEW"
      ? 2_000_000
      : purpose === "VINTAGE_LETTER_FINAL"
        ? 20_000_000
        : 15_000_000;
  if (!file.size || file.size > limit)
    throw new Error(`Please use a file smaller than ${limit / 1_000_000} MB.`);
  const formData = new FormData();
  formData.append("file", file);
  formData.append("purpose", purpose);

  return onProgress
    ? apiUploadWithProgress<UploadResponse>(
        "/uploads",
        formData,
        onProgress,
        signal,
      )
    : apiUpload<UploadResponse>("/uploads", formData, signal);
};

export const createOrder = (
  payload: CreateOrderPayload,
  signal?: AbortSignal,
) => apiPost<BackendOrder>("/orders", payload, signal);

export const initializePayment = (orderId: string, signal?: AbortSignal) =>
  apiPost<PaymentInitialization>("/payments/initialize", { orderId }, signal);

export const verifyPayment = (reference: string, signal?: AbortSignal) =>
  apiPost<BackendOrder>("/payments/verify", { reference }, signal);

export const findTrackedOrders = (phone: string, signal?: AbortSignal) =>
  apiPost<TrackingOrderCard[]>("/tracking/orders", { phone }, signal);

export const getTrackedOrder = (token: string, signal?: AbortSignal) =>
  apiGet<TrackingOrderCard>(`/tracking/${encodeURIComponent(token)}`, signal);
