export type Admin = { id: string; name: string; email: string };
export type LoginResponse = {
  accessToken: string;
  expiresIn: number;
  admin: Admin;
};
export type AdminRecord = { id?: string; [key: string]: unknown };
export type PageResult<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
export type Money = string | number;
export type DashboardSummary = {
  revenue: Money;
  orderGrossProfit: Money;
  operatingExpenses: Money;
  businessProfit: Money;
  ownerWithdrawals: Money;
  retainedAfterWithdrawals: Money;
  paidOrders: number;
  pendingOrders: number;
  averageOrderValue: Money;
  lowStockCount: number;
  urgentLowStock: AdminRecord[];
};
export type MonthlyProfit = {
  month: number;
  label: string;
  revenue: Money;
  grossProfit: Money;
  expenses: Money;
  businessProfit: Money;
};
export type OrderRecord = AdminRecord & {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: Money;
  customer: { id?: string; name: string; phone: string; email?: string };
  items: Array<
    AdminRecord & {
      id: string;
      quantity: number;
      unitPriceSnapshot: Money;
      totalPriceSnapshot: Money;
      customization?: Record<string, string>;
      variant: {
        id: string;
        name: string;
        sku: string;
        product: { name: string; category: string };
      };
    }
  >;
  statusHistory?: Array<{ status: string; changedAt: string; note?: string }>;
  payments?: AdminRecord[];
};
export const asRecord = (value: unknown): AdminRecord =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as AdminRecord)
    : {};
export const asRows = (value: unknown): AdminRecord[] =>
  Array.isArray(value)
    ? (value as AdminRecord[])
    : Array.isArray(asRecord(value).data)
      ? (asRecord(value).data as AdminRecord[])
      : [];
export const label = (value: string) =>
  value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/^./, (c) => c.toUpperCase());
export const textValue = (value: unknown): string =>
  value === null || value === undefined || value === ""
    ? "—"
    : typeof value === "boolean"
      ? value
        ? "Yes"
        : "No"
      : typeof value === "object"
        ? String(asRecord(value).name ?? asRecord(value).orderNumber ?? "—")
        : String(value);
export const at = (record: AdminRecord, path: string): unknown =>
  path.split(".").reduce<unknown>((value, key) => asRecord(value)[key], record);
export const date = (value: unknown) =>
  typeof value === "string" && !Number.isNaN(Date.parse(value))
    ? new Intl.DateTimeFormat("en-NG", {
        dateStyle: "medium",
        timeZone: "Africa/Lagos",
      }).format(new Date(value))
    : "—";
