export type BackendProductCategory =
  "POLAROID" | "PHOTOSTRIP" | "VINTAGE_LETTER" | "PHONE_CASE" | "ALBUM";

export type BackendVariant = {
  id: string;
  name: string;
  sku: string;
  sellingPrice: string | number;
  tracksStock: boolean;
  isActive: boolean;
  inStock: boolean;
  availableQuantity: number | null;
  reasonIfUnavailable: string | null;
};

export type BackendProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: BackendProductCategory;
  isActive: boolean;
  variants: BackendVariant[];
};

export type DeliveryRate = {
  state: string;
  fee: string | number;
  isActive: boolean;
};

export type UploadPurpose =
  | "POLAROID_FINAL"
  | "POLAROID_PREVIEW"
  | "PHOTOSTRIP_FINAL"
  | "VINTAGE_LETTER_FINAL";

export type UploadResponse = { key: string; url: string };

export type CreateOrderPayload = {
  checkoutKey: string;
  discountCode?: string;
  premiumPackaging?: boolean;
  shipment?: {
    requestToken: string;
    serviceCode: string;
    courierId: string;
  };
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  delivery: {
    state: string;
    address: string;
  };
  source: "WEBSITE";
  customerNote?: string;
  items: Array<{
    variantSku: string;
    quantity: number;
    packageId?: string;
    packageGroupId?: string;
    customization?: Record<string, unknown>;
  }>;
};

export type BackendOrder = {
  trackingToken?: string;
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: string | number;
  deliveryFee: string | number;
  totalAmount: string | number;
  deliveryState: string;
  deliveryAddress: string;
  createdAt: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    unitPriceSnapshot: string | number;
    totalPriceSnapshot: string | number;
    customization?: Record<string, unknown>;
    variant: {
      name: string;
      sku: string;
      product: {
        name: string;
        category: BackendProductCategory;
      };
    };
  }>;
};

export type PaymentInitialization = {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
};

export type TrackingOrderCard = {
  trackingToken: string;
  orderNumber: string;
  status: string;
  paymentStatus?: string;
  totalAmount?: string | number;
  createdAt?: string;
  items?: Array<{
    name?: string;
    productName?: string;
    quantity?: number;
  }>;
  trackingLink?: string | null;
  shipmentStatus?: string | null;
  deliveryState?: string;
  maskedDeliveryAddress?: string;
  paidAt?: string | null;
  timeline?: Array<{ status: string; changedAt: string }>;
};

export type ShippingRateResponse = {
  requestToken: string;
  couriers: Array<{
    courierId: string;
    courierName: string;
    serviceCode: string;
    serviceType: string;
    deliveryEta: string | null;
    currency: string;
    total: number;
  }>;
};
