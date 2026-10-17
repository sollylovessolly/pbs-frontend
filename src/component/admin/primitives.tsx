"use client";
import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { money } from "@/lib/commerce/catalogue";
import {
  at,
  date,
  label,
  textValue,
  type AdminRecord,
} from "@/lib/admin/types";
export const Button = ({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...props} className={`adm-button ${props.className || ""}`}>
    {children}
  </button>
);
export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <header className="adm-page-header">
      <div>
        <p className="adm-eyebrow">POLAROIDS BY SOLLY / STUDIO ADMIN</p>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      <div className="adm-actions">{children}</div>
    </header>
  );
}
export function Panel({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`adm-panel ${className}`}>
      {title && <h2>{title}</h2>}
      {children}
    </section>
  );
}
export function Badge({ value }: { value: unknown }) {
  const v = textValue(value);
  return (
    <span
      className={`adm-badge ${/PAID|DELIVERED|true|Active/.test(v) && v !== "UNPAID" ? "good" : /CANCEL|FAILED|Out of stock/.test(v) ? "bad" : ""}`}
    >
      {label(v.toLowerCase())}
    </span>
  );
}
export function Feedback({
  error,
  message,
}: {
  error?: string;
  message?: string;
}) {
  return error ? (
    <p className="adm-feedback error" role="alert">
      {error}
    </p>
  ) : message ? (
    <p className="adm-feedback" role="status">
      {message}
    </p>
  ) : null;
}
export function QueryState({
  loading,
  error,
  retry,
}: {
  loading?: boolean;
  error?: string;
  retry: () => void;
}) {
  return loading ? (
    <div className="adm-skeleton" role="status">
      <span>Loading your studio…</span>
      <div />
      <div />
      <div />
    </div>
  ) : error ? (
    <div className="adm-feedback error" role="alert">
      <p>{error}</p>
      <Button onClick={retry}>Try again</Button>
    </div>
  ) : null;
}
export type Column = {
  key: string;
  title?: string;
  kind?: "money" | "date" | "badge";
};
export function cell(row: AdminRecord, column: Column) {
  const value = at(row, column.key);
  return column.kind === "money" && value != null ? (
    money(String(value))
  ) : column.kind === "date" ? (
    date(value)
  ) : column.kind === "badge" ? (
    <Badge value={value} />
  ) : (
    textValue(value)
  );
}
export function DataTable({
  rows,
  columns,
  href,
  action,
}: {
  rows: AdminRecord[];
  columns: Column[];
  href?: (row: AdminRecord) => string | null;
  action?: (row: AdminRecord) => ReactNode;
}) {
  if (!rows.length)
    return (
      <div className="adm-empty">
        <span aria-hidden="true">✦</span>
        <h3>Nothing here yet</h3>
        <p>Try another filter, or add your first entry.</p>
      </div>
    );
  return (
    <>
      <div className="adm-desktop-table">
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>{c.title || label(c.key)}</th>
              ))}
              {(href || action) && (
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id || (r.state ? String(r.state) : i)}>
                {columns.map((c) => (
                  <td key={c.key}>{cell(r, c)}</td>
                ))}
                {(href || action) && (
                  <td>
                    {href?.(r) && (
                      <Link className="adm-text-link" href={href(r)!}>
                        View{" "}
                        <span className="sr-only">
                          {textValue(r.name || r.orderNumber)}
                        </span>
                        ↗
                      </Link>
                    )}
                    {action?.(r)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="adm-mobile-cards">
        {rows.map((r, i) => (
          <article key={r.id || i} className="adm-mobile-card">
            <dl>
              {columns.map((c) => (
                <div key={c.key}>
                  <dt>{c.title || label(c.key)}</dt>
                  <dd>{cell(r, c)}</dd>
                </div>
              ))}
            </dl>
            <div className="adm-actions">
              {href?.(r) && (
                <Link className="adm-button" href={href(r)!}>
                  View details →
                </Link>
              )}
              {action?.(r)}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    return () => d?.close();
  }, []);
  const close = () => {
    if (!ref.current?.querySelector('form[aria-busy="true"]')) onClose();
  };
  return (
    <dialog
      ref={ref}
      className="adm-dialog"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      aria-label={title}
    >
      <header>
        <h2>{title}</h2>
        <Button aria-label="Close dialog" onClick={close}>
          ×
        </Button>
      </header>
      {children}
    </dialog>
  );
}
export function KeyValues({
  record,
  fields,
}: {
  record: AdminRecord;
  fields: Column[];
}) {
  return (
    <dl className="adm-key-values">
      {fields.map((c) => (
        <div key={c.key}>
          <dt>{c.title || label(c.key)}</dt>
          <dd>{cell(record, c)}</dd>
        </div>
      ))}
    </dl>
  );
}
