import type { Column } from "@/component/admin/primitives";
export type EntityConfig = {
  title: string;
  singular: string;
  endpoint: string;
  create?: string;
  update?: string;
  paginated?: boolean;
  remove?: "deactivate" | "delete";
  columns: Column[];
  description: string;
  summary?: string;
};
const money = (key: string, title?: string): Column => ({
  key,
  title,
  kind: "money",
});
const date = (key: string, title?: string): Column => ({
  key,
  title,
  kind: "date",
});
export const entities: Record<string, EntityConfig> = {
  orders: {
    title: "Orders",
    singular: "Order",
    endpoint: "/orders",
    paginated: true,
    columns: [
      { key: "orderNumber", title: "Order" },
      { key: "customer.name", title: "Customer" },
      { key: "source" },
      { key: "paymentStatus", title: "Payment", kind: "badge" },
      { key: "status", title: "Fulfillment", kind: "badge" },
      money("totalAmount", "Total"),
      date("createdAt", "Placed"),
    ],
    description: "Every keepsake, from the first hello to the final delivery.",
  },
  customers: {
    title: "Customers",
    singular: "Customer",
    endpoint: "/customers",
    paginated: true,
    columns: [
      { key: "name" },
      { key: "phone" },
      { key: "email" },
      { key: "totalOrders", title: "Orders" },
      money("totalSpent", "Total spent"),
    ],
    description: "The people behind your favourite memories.",
  },
  products: {
    title: "Products",
    singular: "Product",
    endpoint: "/products",
    create: "CreateProductDto",
    update: "UpdateProductDto",
    remove: "deactivate",
    columns: [
      { key: "name" },
      { key: "category" },
      { key: "slug" },
      { key: "isActive", title: "Active", kind: "badge" },
    ],
    description: "Manage the products customers can shop.",
  },
  variants: {
    title: "Product options",
    singular: "Product option",
    endpoint: "/variants",
    create: "CreateVariantDto",
    update: "UpdateVariantDto",
    remove: "deactivate",
    columns: [
      { key: "name" },
      { key: "product.name", title: "Product" },
      { key: "sku", title: "SKU" },
      money("sellingPrice", "Selling price"),
      money("outsourcedUnitCost", "Supplier cost"),
      { key: "isActive", title: "Active", kind: "badge" },
    ],
    description:
      "Sizes, styles and prices. Price changes apply to future orders.",
  },
  inventory: {
    title: "Inventory",
    singular: "Inventory item",
    endpoint: "/resources",
    create: "CreateResourceDto",
    update: "UpdateResourceDto",
    remove: "deactivate",
    columns: [
      { key: "name" },
      { key: "sku", title: "SKU" },
      { key: "category" },
      { key: "currentStock", title: "Stock" },
      { key: "unit" },
      money("averageUnitCost", "Average unit cost"),
      { key: "lowStockThreshold", title: "Low-stock level" },
    ],
    description:
      "See what you have, add supplies and keep track of what’s running low.",
  },
  "resource-rules": {
    title: "Supplies per product",
    singular: "Usage rule",
    endpoint: "/resource-rules",
    create: "CreateResourceRuleDto",
    update: "UpdateResourceRuleDto",
    remove: "delete",
    columns: [
      { key: "variant.name", title: "Variant" },
      { key: "resource.name", title: "Resource" },
      { key: "rule", title: "How it is used" },
      { key: "quantity" },
      { key: "capacity" },
    ],
    description:
      "Connect each keepsake to the supplies it uses. Changes affect future orders, not saved historical costs.",
  },
  suppliers: {
    title: "Suppliers",
    singular: "Supplier",
    endpoint: "/suppliers",
    create: "CreateSupplierDto",
    update: "UpdateSupplierDto",
    paginated: true,
    remove: "deactivate",
    columns: [
      { key: "name" },
      { key: "phone" },
      { key: "email" },
      { key: "isActive", title: "Active", kind: "badge" },
    ],
    description: "The people who help keep your studio stocked.",
  },
  purchases: {
    title: "Purchases",
    singular: "Purchase",
    endpoint: "/purchases",
    create: "CreatePurchaseDto",
    paginated: true,
    columns: [
      { key: "supplier.name", title: "Supplier" },
      date("purchasedAt", "Purchased"),
      money("totalCost", "Total cost"),
      { key: "note" },
    ],
    description: "Record purchases to update stock and average costs.",
  },
  "delivery-rates": {
    title: "Delivery rates",
    singular: "Delivery rate",
    endpoint: "/delivery-rates",
    create: "CreateDeliveryRateDto",
    update: "UpdateDeliveryRateDto",
    remove: "deactivate",
    columns: [
      { key: "state" },
      money("fee", "Customer fee"),
      { key: "isActive", title: "Active", kind: "badge" },
    ],
    description:
      "Customer delivery fees are separate from the courier costs your business pays.",
  },
  discounts: {
    title: "Discounts",
    singular: "Discount",
    endpoint: "/discounts",
    create: "CreateDiscountDto",
    update: "UpdateDiscountDto",
    remove: "deactivate",
    columns: [
      { key: "code" },
      { key: "type" },
      { key: "value" },
      money("minimumOrderAmount", "Minimum order"),
      date("startsAt", "Starts"),
      date("endsAt", "Ends"),
      { key: "isActive", title: "Enabled", kind: "badge" },
    ],
    description:
      "A little extra reason to make a memory. Paid-order totals stay unchanged.",
  },
  payments: {
    title: "Payments",
    singular: "Payment",
    endpoint: "/payments",
    paginated: true,
    columns: [
      { key: "reference" },
      { key: "order.orderNumber", title: "Order" },
      { key: "method" },
      money("amount"),
      { key: "status", kind: "badge" },
      date("paidAt", "Paid"),
    ],
    description:
      "Confirmed receipts and payment history. Record transfers from the order page.",
  },
  expenses: {
    title: "Expenses",
    singular: "Expense",
    endpoint: "/expenses",
    create: "CreateExpenseDto",
    update: "UpdateExpenseDto",
    remove: "delete",
    paginated: true,
    summary: "/expenses/summary",
    columns: [
      { key: "title" },
      { key: "category" },
      money("amount"),
      date("expenseDate", "Date"),
    ],
    description: "Track business spending separately from owner withdrawals.",
  },
  withdrawals: {
    title: "Owner withdrawals",
    singular: "Withdrawal",
    endpoint: "/owner-withdrawals",
    create: "CreateOwnerWithdrawalDto",
    update: "UpdateOwnerWithdrawalDto",
    remove: "delete",
    paginated: true,
    summary: "/owner-withdrawals/summary",
    columns: [
      money("amount"),
      { key: "description" },
      date("withdrawnAt", "Withdrawn"),
    ],
    description:
      "Money taken out of the business. Withdrawals do not reduce gross profit.",
  },
};
