// Generated from deployed OpenAPI on 2026-09-17.
export type CreateProductDto = {
  name: string;
  slug: string;
  description?: string;
  category:
    "POLAROID" | "PHONE_CASE" | "PHOTOSTRIP" | "VINTAGE_LETTER" | "ALBUM";
  isActive?: boolean;
};
export type UpdateProductDto = {
  name?: string;
  slug?: string;
  description?: string;
  category?:
    "POLAROID" | "PHONE_CASE" | "PHOTOSTRIP" | "VINTAGE_LETTER" | "ALBUM";
  isActive?: boolean;
};
export type CreateVariantDto = {
  productId: string;
  name: string;
  sku: string;
  sellingPrice: number;
  tracksStock?: boolean;
  isActive?: boolean;
  outsourcedUnitCost?: number;
  supplierId?: string;
};
export type UpdateVariantDto = {
  productId?: string;
  name?: string;
  sku?: string;
  sellingPrice?: number;
  tracksStock?: boolean;
  isActive?: boolean;
  outsourcedUnitCost?: number;
  supplierId?: string;
};
export type CreateResourceDto = {
  name: string;
  sku: string;
  category: "MATERIAL" | "PACKAGING" | "CONSUMABLE" | "FINISHED_GOOD";
  unit: string;
  currentStock?: number;
  averageUnitCost?: number;
  lowStockThreshold?: number;
  isActive?: boolean;
};
export type RestockResourceDto = {
  quantity: number;
  unitCost: number;
  note?: string;
};
export type UpdateResourceDto = {
  name?: string;
  sku?: string;
  category?: "MATERIAL" | "PACKAGING" | "CONSUMABLE" | "FINISHED_GOOD";
  unit?: string;
  currentStock?: number;
  averageUnitCost?: number;
  lowStockThreshold?: number;
  isActive?: boolean;
};
export type ShipmentSelectionDto = {
  requestToken: string;
  serviceCode: string;
  courierId: string;
};
export type CustomerDto = {
  name: string;
  phone: string;
  email?: string;
};
export type DeliveryDto = {
  state: string;
  address: string;
};
export type OrderItemDto = {
  variantSku: string;
  quantity: number;
  customization?: Record<string, unknown>;
};
export type CreateOrderDto = {
  discountCode?: string;
  shipment?: ShipmentSelectionDto;
  customer: CustomerDto;
  delivery: DeliveryDto;
  source: "WEBSITE" | "WHATSAPP" | "INSTAGRAM" | "MANUAL";
  customerNote?: string;
  items: Array<OrderItemDto>;
};
export type CreateManualOrderDto = {
  discountCode?: string;
  shipment?: ShipmentSelectionDto;
  customer: CustomerDto;
  delivery: DeliveryDto;
  customerNote?: string;
  items: Array<OrderItemDto>;
  source: "WHATSAPP" | "INSTAGRAM" | "MANUAL";
  adminNote?: string;
};
export type UpdateOrderStatusDto = {
  status:
    | "PENDING"
    | "DESIGNING"
    | "PRINTING"
    | "PACKING"
    | "READY"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "CANCELLED";
  note?: string;
};
export type UpdateAdminNoteDto = {
  adminNote: string;
};
export type UpdateTrackingDto = {
  trackingLink: string;
};
export type UpdateDeliveryCostDto = {
  actualDeliveryCost: number;
};
export type UpdateFulfillmentDto = {
  customization: Record<string, unknown>;
};
export type ManualPaymentDto = {
  method: "TRANSFER" | "OPAY";
  reference?: string;
};
export type CancelOrderDto = {
  reason: string;
  restoreInventory?: boolean;
};
export type CreateDeliveryRateDto = {
  state: string;
  fee: number;
};
export type UpdateDeliveryRateDto = {
  state?: string;
  fee?: number;
  isActive?: boolean;
};
export type InitializePaymentDto = {
  orderId: string;
};
export type VerifyPaymentDto = {
  reference: string;
};
export type ShippingRateItemDto = {
  variantSku: string;
  quantity: number;
};
export type ShippingRateDto = {
  name: string;
  email: string;
  phone: string;
  address: string;
  state: string;
  pickupDate?: string;
  items: Array<ShippingRateItemDto>;
};
export type ArchiveCustomerDto = { archived: boolean };
export type CreateDiscountDto = {
  code: string;
  type: "FIXED" | "PERCENTAGE";
  value: number;
  startsAt?: string;
  endsAt?: string;
  minimumOrderAmount?: number;
};
export type UpdateDiscountDto = {
  code?: string;
  type?: "FIXED" | "PERCENTAGE";
  value?: number;
  startsAt?: string;
  endsAt?: string;
  minimumOrderAmount?: number;
  isActive?: boolean;
};
export type CreateResourceRuleDto = {
  variantId: string;
  resourceId: string;
  rule: "PER_UNIT" | "FIXED" | "CAPACITY";
  quantity: number;
  capacity?: number;
  usageGroup?: string;
};
export type UpdateResourceRuleDto = {
  variantId?: string;
  resourceId?: string;
  rule?: "PER_UNIT" | "FIXED" | "CAPACITY";
  quantity?: number;
  capacity?: number;
  usageGroup?: string;
};
export type CreateSupplierDto = {
  name: string;
  phone?: string;
  email?: string;
  note?: string;
};
export type UpdateSupplierDto = {
  name?: string;
  phone?: string;
  email?: string;
  note?: string;
};
export type PurchaseItemDto = {
  resourceId: string;
  purchaseQuantity: number;
  purchaseUnit: string;
  unitsPerPurchaseUnit?: number;
  totalCost: number;
};
export type CreatePurchaseDto = {
  supplierId?: string;
  purchasedAt?: string;
  note?: string;
  items: Array<PurchaseItemDto>;
};
export type TrackOrdersDto = {
  phone: string;
};
export type CreateExpenseDto = {
  title: string;
  description?: string;
  category:
    | "DATA"
    | "HOSTING"
    | "SALARY"
    | "MARKETING"
    | "DELIVERY"
    | "UTILITIES"
    | "EQUIPMENT"
    | "MATERIAL_PURCHASE"
    | "OUTSOURCING"
    | "OTHER";
  amount: number;
  expenseDate: string;
  relatedOrderId?: string;
};
export type UpdateExpenseDto = {
  title?: string;
  description?: string;
  category?:
    | "DATA"
    | "HOSTING"
    | "SALARY"
    | "MARKETING"
    | "DELIVERY"
    | "UTILITIES"
    | "EQUIPMENT"
    | "MATERIAL_PURCHASE"
    | "OUTSOURCING"
    | "OTHER";
  amount?: number;
  expenseDate?: string;
  relatedOrderId?: string;
};
export type AdminLoginDto = {
  email: string;
  password: string;
};
export type CreateOwnerWithdrawalDto = {
  amount: number;
  description?: string;
  withdrawnAt?: string;
};
export type UpdateOwnerWithdrawalDto = {
  amount?: number;
  description?: string;
  withdrawnAt?: string;
};
