"use client";
import { useUnsavedChanges } from "./useUnsavedChanges";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAdminQuery } from "./useAdminQuery";
import { useAdmin } from "./AdminShell";
import {
  asRows,
  type AdminRecord,
  type OrderRecord,
  type PageResult,
} from "@/lib/admin/types";
import type { BackendProduct, DeliveryRate } from "@/lib/api/types";
import type { CreateManualOrderDto } from "@/lib/admin/dto";
import { adminRequest } from "@/lib/admin/api";
import { money, available, safeUrl } from "@/lib/commerce/catalogue";
import { Button, Feedback, PageHeader, Panel, QueryState } from "./primitives";
export default function ManualOrder() {
  const router = useRouter();
  const { refresh } = useAdmin();
  const products = useAdminQuery<BackendProduct[]>("/products");
  const rates = useAdminQuery<DeliveryRate[]>("/delivery-rates");
  const [search, setSearch] = useState("");
  const [lookup, setLookup] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setLookup(search), 350);
    return () => clearTimeout(t);
  }, [search]);
  const customers = useAdminQuery<PageResult<AdminRecord>>(
    lookup ? `/customers?limit=20&search=${encodeURIComponent(lookup)}` : null,
  );
  const [form, setForm] = useState({
    source: "WHATSAPP",
    name: "",
    phone: "",
    email: "",
    state: "",
    address: "",
    customerNote: "",
    adminNote: "",
    discountCode: "",
  });
  const [items, setItems] = useState<
    Array<{
      key: string;
      variantSku: string;
      quantity: number;
      customization: Record<string, string>;
    }>
  >([{ key: "first", variantSku: "", quantity: 1, customization: {} }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const [dirty, setDirty] = useState(false);
  useUnsavedChanges(dirty);
  const variants =
    products.data
      ?.filter((p) => p.isActive)
      .flatMap((p) =>
        p.variants
          .filter((v) => v.isActive)
          .map((v) => ({ ...v, category: p.category, productName: p.name })),
      ) || [];
  const update = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  };
  return (
    <>
      <PageHeader
        title="A new memory, from a conversation."
        description="Create an order from WhatsApp, Instagram or an offline sale."
      >
        <Link href="/admin/orders" className="adm-button">
          Back to orders
        </Link>
      </PageHeader>
      <QueryState {...products} />
      <QueryState {...rates} />
      {products.data && rates.data && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (lock.current) return;
            lock.current = true;
            setBusy(true);
            setError("");
            try {
              const counts = new Map<string, number>();
              for (const item of items) {
                counts.set(
                  item.variantSku,
                  (counts.get(item.variantSku) || 0) + item.quantity,
                );
                for (const [key, value] of Object.entries(item.customization))
                  if (key !== "package" && value && !safeUrl(value))
                    throw new Error(
                      "Production references must be HTTP or HTTPS URLs.",
                    );
              }
              for (const [sku, count] of counts) {
                const v = variants.find((v) => v.sku === sku);
                if (
                  !v ||
                  !available(v) ||
                  !Number.isInteger(count) ||
                  count < 1 ||
                  (v.availableQuantity !== null && count > v.availableQuantity)
                )
                  throw new Error(
                    "Check item quantities and current availability.",
                  );
              }
              const body: CreateManualOrderDto = {
                source: form.source as CreateManualOrderDto["source"],
                customer: {
                  name: form.name.trim(),
                  phone: form.phone.trim(),
                  ...(form.email ? { email: form.email.trim() } : {}),
                },
                delivery: { state: form.state, address: form.address.trim() },
                items: items.map(({ variantSku, quantity, customization }) => ({
                  variantSku,
                  quantity,
                  ...(Object.keys(customization).length
                    ? {
                        customization: Object.fromEntries(
                          Object.entries(customization).filter(([, v]) => v),
                        ),
                      }
                    : {}),
                })),
                ...(form.customerNote
                  ? { customerNote: form.customerNote }
                  : {}),
                ...(form.adminNote ? { adminNote: form.adminNote } : {}),
                ...(form.discountCode
                  ? { discountCode: form.discountCode.trim().toUpperCase() }
                  : {}),
              };
              const result = await adminRequest<OrderRecord>("/orders/manual", {
                method: "POST",
                body,
              });
              setDirty(false);
              refresh();
              router.push(`/admin/orders/${result.id}`);
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Could not create order.",
              );
            } finally {
              lock.current = false;
              setBusy(false);
            }
          }}
        >
          <fieldset disabled={busy}>
            <div className="adm-two-columns">
              <div>
                <Panel title="Who is it for?">
                  <label className="adm-field">
                    Find an existing customer
                    <input
                      placeholder="Search by name or phone"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                  {lookup && (
                    <>
                      <QueryState {...customers} />
                      <div className="adm-actions my-4">
                        {asRows(customers.data).map((c) => (
                          <Button
                            type="button"
                            key={c.id}
                            onClick={() => {
                              setForm((f) => ({
                                ...f,
                                name: String(c.name || ""),
                                phone: String(c.phone || ""),
                                email: String(c.email || ""),
                              }));
                              setSearch("");
                              setDirty(true);
                            }}
                          >
                            {String(c.name)} · {String(c.phone)}
                          </Button>
                        ))}
                        {customers.data && !asRows(customers.data).length && (
                          <p className="adm-note">
                            No match. Enter their details below.
                          </p>
                        )}
                      </div>
                    </>
                  )}
                  <div className="adm-form-grid mt-5">
                    {(["name", "phone", "email"] as const).map((key) => (
                      <label className="adm-field" key={key}>
                        {key === "name"
                          ? "Customer name"
                          : key === "phone"
                            ? "Phone number"
                            : "Email (optional)"}
                        <input
                          required={key !== "email"}
                          type={
                            key === "email"
                              ? "email"
                              : key === "phone"
                                ? "tel"
                                : "text"
                          }
                          value={form[key]}
                          onChange={(e) => update(key, e.target.value)}
                        />
                      </label>
                    ))}
                    <label className="adm-field">
                      Order source
                      <select
                        aria-label="Order source"
                        value={form.source}
                        onChange={(e) => update("source", e.target.value)}
                      >
                        <option value="WHATSAPP">WhatsApp</option>
                        <option value="INSTAGRAM">Instagram</option>
                        <option value="MANUAL">Manual</option>
                      </select>
                    </label>
                    <label className="adm-field">
                      State
                      <select
                        aria-label="State"
                        required
                        value={form.state}
                        onChange={(e) => update("state", e.target.value)}
                      >
                        <option value="">Choose a state</option>
                        {rates.data.map((r) => (
                          <option key={r.state}>{r.state}</option>
                        ))}
                      </select>
                    </label>
                    <label className="adm-field wide">
                      Delivery address
                      <textarea
                        required
                        value={form.address}
                        onChange={(e) => update("address", e.target.value)}
                      />
                    </label>
                  </div>
                </Panel>
                <Panel title="Choose their keepsakes">
                  {!variants.length && (
                    <div className="adm-feedback" role="status">
                      <p>No active product options are available yet.</p>
                      <Link className="adm-text-link" href="/admin/variants">
                        Manage product options →
                      </Link>
                      <Button type="button" onClick={products.retry}>
                        Reload products
                      </Button>
                    </div>
                  )}
                  {items.map((item, index) => {
                    const variant = variants.find(
                      (v) => v.sku === item.variantSku,
                    );
                    const patch = (update: Partial<typeof item>) => {
                      setItems((all) =>
                        all.map((i) =>
                          i.key === item.key ? { ...i, ...update } : i,
                        ),
                      );
                      setDirty(true);
                    };
                    const fields =
                      variant?.category === "POLAROID"
                        ? ["finalPngUrl", "previewUrl"]
                        : variant?.category === "PHOTOSTRIP"
                          ? ["finalPngUrl"]
                          : variant?.category === "VINTAGE_LETTER"
                            ? ["finalPdfUrl"]
                            : [];
                    return (
                      <div className="adm-line-item" key={item.key}>
                        <div className="adm-form-grid">
                          <label className="adm-field">
                            Item {index + 1}
                            <select
                              aria-label={`Item ${index + 1}`}
                              required
                              value={item.variantSku}
                              onChange={(e) => {
                                if (
                                  Object.values(item.customization).some(
                                    Boolean,
                                  ) &&
                                  !window.confirm(
                                    "Changing the variant clears this item’s production references. Continue?",
                                  )
                                )
                                  return;
                                const v = variants.find(
                                  (v) => v.sku === e.target.value,
                                );
                                patch({
                                  variantSku: e.target.value,
                                  quantity: 1,
                                  customization:
                                    v?.category === "PHONE_CASE"
                                      ? { package: "CASE_ONLY" }
                                      : {},
                                });
                              }}
                            >
                              <option value="">Choose a product option</option>
                              {variants.map((v) => (
                                <option
                                  key={v.sku}
                                  value={v.sku}
                                  disabled={!available(v)}
                                >
                                  {v.productName} · {v.name} ·{" "}
                                  {money(v.sellingPrice)}
                                  {available(v) ? "" : " · unavailable"}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="adm-field">
                            Quantity
                            <input
                              type="number"
                              required
                              min={1}
                              step={1}
                              max={variant?.availableQuantity ?? undefined}
                              value={item.quantity}
                              onChange={(e) =>
                                patch({ quantity: Number(e.target.value) })
                              }
                            />
                          </label>
                          {fields.map((field) => (
                            <label className="adm-field wide" key={field}>
                              {field === "previewUrl"
                                ? "Preview file URL"
                                : field === "finalPdfUrl"
                                  ? "Production PDF URL"
                                  : "Production PNG URL"}{" "}
                              (optional)
                              <input
                                type="url"
                                value={item.customization[field] || ""}
                                onChange={(e) =>
                                  patch({
                                    customization: {
                                      ...item.customization,
                                      [field]: e.target.value,
                                    },
                                  })
                                }
                              />
                            </label>
                          ))}
                          {variant?.category === "PHONE_CASE" && (
                            <label className="adm-field">
                              Package
                              <select
                                aria-label="Package"
                                value={
                                  item.customization.package || "CASE_ONLY"
                                }
                                onChange={(e) =>
                                  patch({
                                    customization: { package: e.target.value },
                                  })
                                }
                              >
                                <option value="CASE_ONLY">Case only</option>
                                <option value="WITH_POLAROID">
                                  With Polaroid · final price set by backend
                                </option>
                              </select>
                            </label>
                          )}
                        </div>
                        <Button
                          type="button"
                          className="mt-4"
                          disabled={items.length === 1}
                          onClick={() =>
                            setItems((all) =>
                              all.filter((i) => i.key !== item.key),
                            )
                          }
                        >
                          Remove item
                        </Button>
                      </div>
                    );
                  })}
                  <Button
                    type="button"
                    onClick={() => {
                      setItems((all) => [
                        ...all,
                        {
                          key: crypto.randomUUID(),
                          variantSku: "",
                          quantity: 1,
                          customization: {},
                        },
                      ]);
                      setDirty(true);
                    }}
                  >
                    + Add another item
                  </Button>
                  <p className="adm-note">
                    Manual orders can be created before artwork is ready. Attach
                    production files from the order detail before printing.
                  </p>
                </Panel>
              </div>
              <aside>
                <Panel title="A few final details">
                  {(["customerNote", "adminNote", "discountCode"] as const).map(
                    (key) => (
                      <label className="adm-field mb-4" key={key}>
                        {key === "customerNote"
                          ? "Customer note"
                          : key === "adminNote"
                            ? "Private studio note"
                            : "Discount code"}{" "}
                        (optional)
                        <input
                          value={form[key]}
                          onChange={(e) => update(key, e.target.value)}
                        />
                      </label>
                    ),
                  )}
                  <p className="adm-note">
                    The backend confirms the final total, discount and delivery
                    fee after creation. Review the order before recording
                    payment.
                  </p>
                  <Feedback error={error} />
                  <Button className="primary" disabled={busy}>
                    {busy ? "Creating order…" : "Create order & review →"}
                  </Button>
                </Panel>
              </aside>
            </div>
          </fieldset>
        </form>
      )}
    </>
  );
}
