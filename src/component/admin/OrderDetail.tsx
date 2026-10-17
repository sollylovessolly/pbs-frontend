"use client";
import Link from "next/link";
import Image from "next/image";
import { useRef, useState } from "react";
import type { OrderRecord } from "@/lib/admin/types";
import { date, textValue, label } from "@/lib/admin/types";
import { adminRequest } from "@/lib/admin/api";
import { money, safeUrl } from "@/lib/commerce/catalogue";
import { useAdmin } from "./AdminShell";
import { useAdminQuery } from "./useAdminQuery";
import {
  Button,
  DataTable,
  Feedback,
  KeyValues,
  Modal,
  PageHeader,
  Panel,
  QueryState,
} from "./primitives";
import SchemaForm from "./SchemaForm";
import spec from "@/lib/admin/schema.json";
import { uploadProductionFile } from "@/lib/api";
import type { UploadPurpose } from "@/lib/api/types";
type Action =
  | "status"
  | "admin-note"
  | "tracking"
  | "delivery-cost"
  | "manual-payment"
  | "cancel"
  | "shipment/retry";
const actionSchemas: Partial<Record<Action, string>> = {
  status: "UpdateOrderStatusDto",
  "admin-note": "UpdateAdminNoteDto",
  tracking: "UpdateTrackingDto",
  "delivery-cost": "UpdateDeliveryCostDto",
  "manual-payment": "ManualPaymentDto",
};
export default function OrderDetail({ id }: { id: string }) {
  const { revision, refresh } = useAdmin();
  const q = useAdminQuery<OrderRecord>(
    `/orders/${encodeURIComponent(id)}`,
    revision,
  );
  const order = q.data;
  const [action, setAction] = useState<Action | null>(null);
  const [fileItem, setFileItem] = useState<OrderRecord["items"][number] | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const complete = () => {
    setAction(null);
    setFileItem(null);
    setMessage("Order updated successfully.");
    refresh();
  };
  const mutate = async (body: unknown) => {
    if (!action) return;
    await adminRequest(`/orders/${encodeURIComponent(id)}/${action}`, {
      method: ["manual-payment", "cancel", "shipment/retry"].includes(action)
        ? "POST"
        : "PATCH",
      body,
    });
    complete();
  };
  if (!order)
    return (
      <>
        <PageHeader title="Order detail" />
        <QueryState {...q} />
      </>
    );
  const terminal = ["CANCELLED", "DELIVERED"].includes(order.status);
  const phone = order.customer.phone.replace(/\D/g, "");
  const whatsapp = phone.startsWith("0") ? `234${phone.slice(1)}` : phone;
  return (
    <>
      <Link className="adm-text-link" href="/admin/orders">
        ← Back to orders
      </Link>
      <div className="mt-5">
        <PageHeader
          title={`Order ${order.orderNumber}`}
          description={`Placed ${date(order.createdAt)} · ${order.customer.name}`}
        >
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="adm-button"
          >
            Contact on WhatsApp ↗
          </a>
        </PageHeader>
      </div>
      <div className="adm-actions mb-6">
        <span className="adm-badge">
          {label((order.source as string) || "")}
        </span>
        <span className="adm-badge">{label(order.status.toLowerCase())}</span>
        <span
          className={`adm-badge ${order.paymentStatus === "PAID" ? "good" : ""}`}
        >
          {label(order.paymentStatus.toLowerCase())}
        </span>
      </div>
      <Feedback error={error} message={message} />
      <div className="adm-two-columns">
        <div>
          <Panel title="The keepsakes in this order">
            {order.items.map((item) => (
              <article key={item.id} className="adm-line-item">
                <header>
                  <div>
                    <h3>{item.variant.product.name}</h3>
                    <p className="adm-note">
                      {item.variant.name} · {item.variant.sku}
                    </p>
                  </div>
                  <strong>{money(item.totalPriceSnapshot)}</strong>
                </header>
                {safeUrl(item.customization?.previewUrl) && (
                  <Image
                    className="adm-production-preview"
                    src={safeUrl(item.customization?.previewUrl)!}
                    alt={`Production preview for ${item.variant.product.name}`}
                    width={120}
                    height={120}
                    unoptimized
                  />
                )}
                <p>
                  Quantity {item.quantity} · {money(item.unitPriceSnapshot)}{" "}
                  each
                </p>
                {item.customization?.giftPackageName && (
                  <p className="adm-note">
                    Gift package: {item.customization.giftPackageName} · premium
                    packaging included
                  </p>
                )}
                {item.customization?.bonusMiniPhotostrip && (
                  <p className="adm-note">
                    Include a free mini photostrip using this design.
                  </p>
                )}
                {item.customization?.package && (
                  <p className="adm-note">
                    {label(item.customization.package.toLowerCase())}
                  </p>
                )}
                <div className="adm-actions mt-4">
                  {Object.entries(item.customization || {})
                    .filter(([key]) =>
                      ["finalPngUrl", "previewUrl", "finalPdfUrl"].includes(
                        key,
                      ),
                    )
                    .map(([key, url]) =>
                      safeUrl(url) ? (
                        <a
                          key={key}
                          className="adm-button"
                          href={safeUrl(url)!}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {key === "previewUrl"
                            ? "View preview"
                            : "Open production file"}{" "}
                          ↗
                        </a>
                      ) : null,
                    )}
                  {item.variant.product.category !== "ALBUM" && (
                    <Button onClick={() => setFileItem(item)}>
                      Update fulfillment
                    </Button>
                  )}
                </div>
              </article>
            ))}
            {!order.items.length && <p>No items returned for this order.</p>}
          </Panel>
          <Panel title="Production & order history">
            <ol className="adm-timeline">
              {Boolean(order.paidAt) && (
                <li>
                  <strong>Payment received</strong>
                  <small>{date(order.paidAt)}</small>
                </li>
              )}
              {order.statusHistory?.map((entry, i) => (
                <li key={i}>
                  <strong>{label(entry.status.toLowerCase())}</strong>
                  <small>{date(entry.changedAt)}</small>
                  {entry.note && <p className="adm-note">{entry.note}</p>}
                </li>
              ))}
            </ol>
            {!order.statusHistory?.length && (
              <p className="adm-note">No status updates recorded yet.</p>
            )}
            <Button
              className="primary"
              disabled={terminal}
              onClick={() => setAction("status")}
            >
              Update order status
            </Button>
            {terminal && (
              <p className="adm-note">
                Completed and cancelled orders cannot change status.
              </p>
            )}
          </Panel>
          <Panel title="Studio notes">
            <p className="whitespace-pre-wrap">{textValue(order.adminNote)}</p>
            <Button onClick={() => setAction("admin-note")} className="mt-4">
              Edit private note
            </Button>
            {Boolean(order.customerNote) && (
              <div className="adm-line-item">
                <strong>Customer note</strong>
                <p className="whitespace-pre-wrap">
                  {textValue(order.customerNote)}
                </p>
              </div>
            )}
          </Panel>
          <Panel title="Profitability · saved order figures">
            <KeyValues
              record={order}
              fields={[
                "revenueSnapshot",
                "materialCostSnapshot",
                "packagingCostSnapshot",
                "outsourceCostSnapshot",
                "deliveryCostSnapshot",
                "grossProfitSnapshot",
              ].map((key) => ({
                key,
                title: label(key.replace("Snapshot", "")),
                kind: "money",
              }))}
            />
          </Panel>
        </div>
        <aside>
          <Panel title="Customer">
            <KeyValues
              record={order.customer}
              fields={[{ key: "name" }, { key: "phone" }, { key: "email" }]}
            />
            {order.customer.id && (
              <Link
                className="adm-text-link"
                href={`/admin/customers/${order.customer.id}`}
              >
                Customer history →
              </Link>
            )}
          </Panel>
          <Panel title="Payment & totals">
            <KeyValues
              record={order}
              fields={[
                { key: "subtotal", kind: "money" },
                { key: "packagingFee", kind: "money" },
                { key: "premiumPackaging" },
                {
                  key: "deliveryFee",
                  title: "Customer delivery fee",
                  kind: "money",
                },
                { key: "discount", kind: "money" },
                { key: "totalAmount", title: "Order total", kind: "money" },
              ]}
            />
            {order.payments?.length ? (
              <DataTable
                rows={order.payments}
                columns={[
                  { key: "method" },
                  { key: "status", kind: "badge" },
                  { key: "amount", kind: "money" },
                  { key: "reference" },
                ]}
              />
            ) : (
              <p className="adm-note">No payments recorded.</p>
            )}
            {order.paymentStatus !== "PAID" && order.status !== "CANCELLED" && (
              <Button
                className="primary mt-5"
                onClick={() => setAction("manual-payment")}
              >
                Record transfer / OPay
              </Button>
            )}
          </Panel>
          <Panel title="Delivery">
            <div className="adm-line-item">
              <p>{textValue(order.deliveryAddress)}</p>
              <strong>{textValue(order.deliveryState)}</strong>
            </div>
            <KeyValues
              record={order}
              fields={[
                {
                  key: "actualDeliveryCost",
                  title: "Actual courier cost",
                  kind: "money",
                },
                { key: "shipmentStatus", title: "Shipment status" },
                { key: "shipmentReference", title: "Shipment reference" },
              ]}
            />
            {Boolean(order.shipmentError) && (
              <p className="adm-feedback error">
                {textValue(order.shipmentError)}
              </p>
            )}
            {safeUrl(order.trackingLink) && (
              <a
                className="adm-text-link"
                href={safeUrl(order.trackingLink)!}
                target="_blank"
                rel="noopener noreferrer"
              >
                Courier tracking ↗
              </a>
            )}
            <div className="adm-actions mt-5">
              <Button onClick={() => setAction("tracking")}>
                Set tracking link
              </Button>
              <Button onClick={() => setAction("delivery-cost")}>
                Update courier cost
              </Button>
              {order.paymentStatus === "PAID" &&
                !order.shipmentReference &&
                Boolean(order.shipmentRequestToken) &&
                order.shipmentStatus === "FAILED" && (
                  <Button onClick={() => setAction("shipment/retry")}>
                    Retry shipment
                  </Button>
                )}
            </div>
            <p className="adm-note">
              Delivery booking is handled by the backend after payment. Customer
              fees and actual courier costs are separate.
            </p>
          </Panel>
          {order.status !== "CANCELLED" && (
            <Panel title="Order cancellation">
              <p className="adm-note">
                Cancellation does not refund a payment automatically.
              </p>
              <Button className="danger" onClick={() => setAction("cancel")}>
                Cancel order
              </Button>
            </Panel>
          )}
        </aside>
      </div>
      {action && (
        <Modal
          title={label(action.replaceAll("-", " ").replace("/", " "))}
          onClose={() => !busy && setAction(null)}
        >
          {action === "status" ? (
            <form
              aria-busy={busy}
              onSubmit={async (e) => {
                e.preventDefault();
                if (lock.current) return;
                lock.current = true;
                setBusy(true);
                setError("");
                const f = new FormData(e.currentTarget);
                try {
                  await mutate({
                    status: f.get("status"),
                    ...(f.get("note") ? { note: f.get("note") } : {}),
                  });
                } catch (err) {
                  setError(
                    err instanceof Error ? err.message : "Could not update.",
                  );
                } finally {
                  lock.current = false;
                  setBusy(false);
                }
              }}
            >
              <label className="adm-field">
                Next status
                <select name="status" aria-label="Next status" required>
                  {spec.schemas.UpdateOrderStatusDto.properties.status.enum
                    .filter((v) => v !== order.status && v !== "CANCELLED")
                    .map((v) => (
                      <option key={v} value={v}>
                        {label(v.toLowerCase())}
                      </option>
                    ))}
                </select>
              </label>
              <label className="adm-field mt-4">
                Status note (optional)
                <textarea name="note" />
              </label>
              <Feedback error={error} />
              <Button className="primary mt-5" disabled={busy}>
                Save status
              </Button>
            </form>
          ) : action === "manual-payment" ? (
            <>
              <p className="adm-note">
                Record {money(order.totalAmount)} only after checking your bank
                or OPay account. This triggers stock deduction, profit
                snapshots, notifications and a shipment attempt.
              </p>
              <SchemaForm
                schemaName="ManualPaymentDto"
                onSave={mutate}
                submitLabel="Confirm received payment"
              >
                <label className="adm-field mt-5">
                  <span>
                    <input type="checkbox" required /> I have independently
                    confirmed receipt of this payment.
                  </span>
                </label>
              </SchemaForm>
            </>
          ) : action === "cancel" || action === "shipment/retry" ? (
            <form
              aria-busy={busy}
              onSubmit={async (e) => {
                e.preventDefault();
                if (lock.current) return;
                lock.current = true;
                setBusy(true);
                const f = new FormData(e.currentTarget);
                try {
                  await mutate(
                    action === "cancel"
                      ? {
                          reason: f.get("reason"),
                          restoreInventory: f.get("restoreInventory") === "on",
                        }
                      : undefined,
                  );
                } catch (err) {
                  setError(
                    err instanceof Error ? err.message : "Could not update.",
                  );
                } finally {
                  lock.current = false;
                  setBusy(false);
                }
              }}
            >
              <p className="adm-note">
                {action === "cancel"
                  ? "This cancels the order; it does not refund money. Restoring stock returns the recorded materials to inventory. Only choose this if those supplies can actually be reused."
                  : "Retry shipment creation with the saved courier selection. Check the courier account first if the earlier request may have succeeded."}
              </p>
              {action === "cancel" && (
                <>
                  <label className="adm-field">
                    Cancellation reason
                    <textarea
                      name="reason"
                      required
                      minLength={3}
                      maxLength={500}
                    />
                  </label>
                  {order.paymentStatus === "PAID" && (
                    <label className="adm-field mt-4">
                      <span>
                        <input type="checkbox" name="restoreInventory" />{" "}
                        Restore inventory for this paid order
                      </span>
                    </label>
                  )}
                </>
              )}
              <Feedback error={error} />
              <Button className="danger mt-5" disabled={busy}>
                {busy ? "Updating…" : "Confirm"}
              </Button>
            </form>
          ) : (
            <>
              {action === "delivery-cost" && (
                <p className="adm-note">
                  The amount your business paid the courier. This refreshes
                  saved profit without changing the customer’s delivery fee.
                </p>
              )}
              <SchemaForm
                schemaName={actionSchemas[action]!}
                initial={order}
                onSave={async (body) => {
                  if (action === "tracking" && !safeUrl(body.trackingLink))
                    throw new Error(
                      "Enter a valid HTTP or HTTPS tracking URL.",
                    );
                  await mutate(body);
                }}
              />
            </>
          )}
        </Modal>
      )}
      {fileItem && (
        <Modal
          title="Update production files"
          onClose={() => !busy && setFileItem(null)}
        >
          <FulfillmentForm item={fileItem} orderId={id} onSaved={complete} />
        </Modal>
      )}
    </>
  );
}
function FulfillmentForm({
  item,
  orderId,
  onSaved,
}: {
  item: OrderRecord["items"][number];
  orderId: string;
  onSaved: () => void;
}) {
  const category = item.variant.product.category;
  const keys =
    category === "POLAROID"
      ? ["finalPngUrl", "previewUrl"]
      : category === "PHOTOSTRIP"
        ? ["finalPngUrl"]
        : category === "VINTAGE_LETTER"
          ? ["finalPdfUrl"]
          : ["package"];
  const [values, setValues] = useState<Record<string, string>>({
    ...item.customization,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const purpose = (key: string): UploadPurpose =>
    key === "finalPdfUrl"
      ? "VINTAGE_LETTER_FINAL"
      : key === "previewUrl"
        ? "POLAROID_PREVIEW"
        : category === "PHOTOSTRIP"
          ? "PHOTOSTRIP_FINAL"
          : "POLAROID_FINAL";
  return (
    <form
      aria-busy={busy}
      onSubmit={async (e) => {
        e.preventDefault();
        if (lock.current || busy) return;
        lock.current = true;
        setBusy(true);
        setError("");
        try {
          for (const key of keys)
            if (key !== "package" && !safeUrl(values[key]))
              throw new Error("Complete all production file references.");
          await adminRequest(
            `/orders/${orderId}/items/${item.id}/fulfillment`,
            {
              method: "PATCH",
              body: {
                customization: Object.fromEntries(
                  keys.map((k) => [k, values[k]]),
                ),
              },
            },
          );
          onSaved();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not save.");
        } finally {
          lock.current = false;
          setBusy(false);
        }
      }}
    >
      <p className="adm-note">
        Replacing a file changes what the studio will print. Check the new file
        before confirming.
      </p>
      {keys.map((key) => (
        <div key={key} className="adm-field mb-4">
          <label htmlFor={`file-${key}`}>{label(key)}</label>
          {key === "package" ? (
            <select
              id={`file-${key}`}
              value={values[key] || ""}
              onChange={(e) =>
                setValues((v) => ({ ...v, [key]: e.target.value }))
              }
              required
            >
              <option value="">Choose package</option>
              <option value="CASE_ONLY">Case only</option>
              <option value="WITH_POLAROID">With Polaroid</option>
            </select>
          ) : (
            <>
              <input
                id={`file-${key}`}
                type="url"
                required
                value={values[key] || ""}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [key]: e.target.value }))
                }
              />
              <label>
                Upload replacement
                <input
                  type="file"
                  accept={
                    key === "finalPdfUrl" ? "application/pdf" : "image/png"
                  }
                  disabled={busy}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setBusy(true);
                    setError("");
                    try {
                      const result = await uploadProductionFile(
                        file,
                        purpose(key),
                      );
                      setValues((v) => ({ ...v, [key]: result.url }));
                    } catch (err) {
                      setError(
                        err instanceof Error
                          ? err.message
                          : "Upload failed. Retry this file.",
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              </label>
            </>
          )}
        </div>
      ))}
      <label className="adm-field">
        <span>
          <input type="checkbox" required /> I checked these references and
          confirm the replacement.
        </span>
      </label>
      <Feedback error={error} />
      <Button className="primary mt-5" disabled={busy}>
        {busy ? "Working…" : "Save fulfillment"}
      </Button>
    </form>
  );
}
