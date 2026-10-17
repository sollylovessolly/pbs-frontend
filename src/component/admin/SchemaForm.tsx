"use client";
import { useUnsavedChanges } from "./useUnsavedChanges";
import { useEffect, useRef, useState } from "react";
import { schemas, buildFormPayload, localDateInput } from "@/lib/admin/forms";
import { asRows, label, textValue, type AdminRecord } from "@/lib/admin/types";
import { adminRequest } from "@/lib/admin/api";
import { useAdminQuery } from "./useAdminQuery";
import { Button, Feedback } from "./primitives";
const references: Record<string, { path: string; label: string }> = {
  productId: { path: "/products", label: "Product" },
  variantId: { path: "/variants", label: "Variant" },
  resourceId: { path: "/resources", label: "Resource" },
  supplierId: { path: "/suppliers?limit=100", label: "Supplier" },
  relatedOrderId: { path: "/orders?limit=100", label: "Related order" },
};
export function ReferenceSelect({
  name,
  value,
  onChange,
  required = false,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const config = references[name];
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [lookup, setLookup] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setLookup(search), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const q = useAdminQuery<unknown>(
    config.path +
      (name === "supplierId" || name === "relatedOrderId"
        ? `&page=${page}&search=${encodeURIComponent(lookup)}`
        : ""),
  );
  const rows = asRows(q.data);
  return (
    <div className="adm-field">
      <label htmlFor={`reference-${name}`}>
        {config.label}
        {required ? " *" : " (optional)"}
      </label>
      {(name === "supplierId" || name === "relatedOrderId") && (
        <input
          aria-label={`Search ${config.label.toLowerCase()}`}
          placeholder={`Search ${config.label.toLowerCase()}`}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      )}
      <select
        id={`reference-${name}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={q.loading}
        aria-label={config.label}
      >
        <option value="">{q.loading ? "Loading…" : "Choose an option"}</option>
        {value && !rows.some((r) => r.id === value) && (
          <option value={value}>Current selection</option>
        )}
        {rows.map((r) => (
          <option key={r.id} value={r.id}>
            {textValue(r.name || r.orderNumber)}
            {r.sku ? ` · ${r.sku}` : ""}
          </option>
        ))}
      </select>
      {q.error && (
        <p role="alert">
          {q.error}{" "}
          <button type="button" onClick={q.retry}>
            Retry
          </button>
        </p>
      )}
      {page > 1 && (
        <Button type="button" onClick={() => setPage((p) => p - 1)}>
          Previous options
        </Button>
      )}
      {rows.length === 100 && (
        <Button type="button" onClick={() => setPage((p) => p + 1)}>
          Next options
        </Button>
      )}
    </div>
  );
}
export default function SchemaForm({
  schemaName,
  initial = {},
  onSave,
  submitLabel = "Save changes",
  exclude = [],
  children,
}: {
  schemaName: string;
  initial?: AdminRecord;
  onSave: (body: Record<string, unknown>) => Promise<void>;
  submitLabel?: string;
  exclude?: string[];
  children?: React.ReactNode;
}) {
  const schema = schemas[schemaName];
  const [values, setValues] = useState<Record<string, unknown>>(() =>
    Object.fromEntries(
      Object.entries(schema.properties).map(([key, p]) => [
        key,
        p.format === "date-time" || key === "purchasedAt"
          ? localDateInput(initial[key] ?? "")
          : (initial[key] ?? p.default ?? ""),
      ]),
    ),
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const lock = useRef(false);
  useUnsavedChanges(dirty);
  const update = (key: string, value: unknown) => {
    setValues((v) => ({ ...v, [key]: value }));
    setDirty(true);
  };
  return (
    <form
      aria-busy={busy}
      onChange={() => setDirty(true)}
      onSubmit={async (e) => {
        e.preventDefault();
        if (lock.current) return;
        lock.current = true;
        setBusy(true);
        setError("");
        try {
          await onSave(buildFormPayload(schemaName, values, exclude));
          setDirty(false);
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not save. Please retry.",
          );
        } finally {
          lock.current = false;
          setBusy(false);
        }
      }}
    >
      <fieldset disabled={busy}>
        <div className="adm-form-grid">
          {Object.entries(schema.properties)
            .filter(
              ([key, p]) =>
                !exclude.includes(key) &&
                p.type !== "array" &&
                p.type !== "object",
            )
            .map(([key, p]) =>
              references[key] ? (
                <ReferenceSelect
                  key={key}
                  name={key}
                  value={String(values[key] || "")}
                  required={schema.required?.includes(key)}
                  onChange={(v) => update(key, v)}
                />
              ) : (
                <label
                  key={key}
                  className={`adm-field ${/description|note/i.test(key) ? "wide" : ""}`}
                >
                  {label(key)}
                  {schema.required?.includes(key)
                    ? " *"
                    : p.type !== "boolean"
                      ? " (optional)"
                      : ""}
                  {p.enum ? (
                    <select
                      aria-label={label(key)}
                      required={schema.required?.includes(key)}
                      value={String(values[key])}
                      onChange={(e) => update(key, e.target.value)}
                    >
                      <option value="">Choose an option</option>
                      {p.enum.map((v) => (
                        <option key={v} value={v}>
                          {label(v.toLowerCase())}
                        </option>
                      ))}
                    </select>
                  ) : p.type === "boolean" ? (
                    <input
                      type="checkbox"
                      checked={values[key] === true}
                      onChange={(e) => update(key, e.target.checked)}
                    />
                  ) : /description|note/i.test(key) ? (
                    <textarea
                      rows={3}
                      value={String(values[key])}
                      onChange={(e) => update(key, e.target.value)}
                      maxLength={p.maxLength}
                      required={
                        key !== "adminNote" && schema.required?.includes(key)
                      }
                    />
                  ) : (
                    <input
                      type={
                        p.type === "number"
                          ? "number"
                          : p.format === "email"
                            ? "email"
                            : p.format === "date-time" || key === "purchasedAt"
                              ? "datetime-local"
                              : "text"
                      }
                      value={
                        p.format === "date-time" || key === "purchasedAt"
                          ? String(values[key]).slice(0, 16)
                          : String(values[key])
                      }
                      onChange={(e) => update(key, e.target.value)}
                      required={schema.required?.includes(key)}
                      min={p.minimum}
                      max={p.maximum}
                      minLength={p.minLength}
                      maxLength={p.maxLength}
                      step={p.type === "number" ? "0.01" : undefined}
                    />
                  )}
                  <small>
                    {key === "rule"
                      ? "Per unit: each item uses this quantity. Fixed: once per group. Capacity: one resource serves a group of items."
                      : p.description}
                  </small>
                </label>
              ),
            )}
        </div>
        {children}
        <Feedback error={error} />
        <div className="adm-form-footer">
          <Button className="primary" disabled={busy}>
            {busy ? "Saving…" : submitLabel}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
export function EditForm({
  schemaName,
  path,
  method = "PATCH",
  initial,
  onSaved,
  exclude,
}: {
  schemaName: string;
  path: string;
  method?: "POST" | "PATCH";
  initial?: AdminRecord;
  onSaved: () => void;
  exclude?: string[];
}) {
  return (
    <SchemaForm
      schemaName={schemaName}
      initial={initial}
      exclude={exclude}
      onSave={async (body) => {
        await adminRequest(path, { method, body });
        onSaved();
      }}
    />
  );
}
