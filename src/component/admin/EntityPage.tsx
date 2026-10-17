"use client";
import Link from "next/link";
import InventoryStockForm from "./InventoryStockForm";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import spec from "@/lib/admin/schema.json";
import { entities } from "@/lib/admin/entities";
import {
  at,
  asRecord,
  asRows,
  label,
  textValue,
  type AdminRecord,
  type PageResult,
} from "@/lib/admin/types";
import { adminRequest } from "@/lib/admin/api";
import { queryString } from "@/lib/api/client";
import { money } from "@/lib/commerce/catalogue";
import { useAdmin } from "./AdminShell";
import { useAdminQuery } from "./useAdminQuery";
import SchemaForm, { ReferenceSelect } from "./SchemaForm";
import {
  Button,
  DataTable,
  Feedback,
  Modal,
  PageHeader,
  Panel,
  QueryState,
} from "./primitives";
export default function EntityPage({ entity }: { entity: string }) {
  const config = entities[entity];
  const { revision, refresh } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [search, setSearch] = useState(params?.get("search") || "");
  const [edit, setEdit] = useState<AdminRecord | null | false>(false);
  const [stockId, setStockId] = useState<string | null>(null);
  const [remove, setRemove] = useState<AdminRecord | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const descriptors =
    (
      spec.queries as Record<
        string,
        Array<{
          name: string;
          schema?: { enum?: string[]; type?: string; format?: string };
        }>
      >
    )[config.endpoint] || [];
  const allowed = descriptors.map((p) => p.name);
  const query = Object.fromEntries(
    [...(params?.entries() || [])].filter(([key]) => allowed.includes(key)),
  );
  if (config.paginated) {
    query.page ||= "1";
    query.limit = "20";
  }
  const change = (key: string, value: string) => {
    const next = new URLSearchParams(params?.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.set("page", "1");
    router.replace(`${pathname}?${next}`, { scroll: false });
  };
  useEffect(() => {
    if (!allowed.includes("search") || search === (params?.get("search") || ""))
      return;
    const timer = setTimeout(() => change("search", search), 350);
    return () => clearTimeout(timer);
  });
  const result = useAdminQuery<AdminRecord[] | PageResult<AdminRecord>>(
    config.endpoint + queryString(query),
    revision,
  );
  const rows = asRows(result.data);
  const page = asRecord(asRecord(result.data).pagination);
  const summary = useAdminQuery<AdminRecord>(
    config.summary
      ? config.summary +
          queryString(
            Object.fromEntries(
              Object.entries(query).filter(
                ([k]) => k !== "page" && k !== "limit",
              ),
            ),
          )
      : null,
    revision,
  );
  const [localSearch, setLocalSearch] = useState("");
  const shown =
    !config.paginated && localSearch
      ? rows.filter((r) =>
          config.columns.some((c) =>
            textValue(at(r, c.key))
              .toLowerCase()
              .includes(localSearch.toLowerCase()),
          ),
        )
      : rows;
  const saved = () => {
    setEdit(false);
    setMessage("Saved successfully.");
    refresh();
  };
  return (
    <>
      <PageHeader title={config.title} description={config.description}>
        {entity === "inventory" ? (
          <Button className="primary" onClick={() => setStockId("")}>
            + Add stock
          </Button>
        ) : entity === "orders" ? (
          <Link className="adm-button primary" href="/admin/orders/new">
            + New manual order
          </Link>
        ) : entity === "purchases" ? (
          <Link className="adm-button primary" href="/admin/purchases/new">
            + Record purchase
          </Link>
        ) : (
          config.create && (
            <Button className="primary" onClick={() => setEdit(null)}>
              + Add {config.singular.toLowerCase()}
            </Button>
          )
        )}
      </PageHeader>
      {entity === "inventory" && (
        <p className="adm-note mb-5">
          Bought more supplies? Use <strong>Add stock</strong> and choose an
          existing item. Choose “Add a brand-new item” only for something you
          haven’t tracked before.{" "}
          <Link className="adm-text-link" href="/admin/purchases/new">
            Record several items together →
          </Link>
        </p>
      )}
      {stockId !== null && (
        <Modal title="Add inventory" onClose={() => setStockId(null)}>
          <InventoryStockForm
            initialId={stockId}
            onSaved={() => {
              setStockId(null);
              setMessage("Stock updated successfully.");
              refresh();
            }}
          />
        </Modal>
      )}
      {entity === "delivery-rates" && (
        <p className="adm-note">
          Existing rates can be viewed and new states added.
          Editing/deactivation requires the backend to include a rate ID in its
          response.
        </p>
      )}
      <div className="adm-filters">
        {allowed.includes("search") ? (
          <label className="adm-field">
            Search
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${config.title.toLowerCase()}`}
            />
          </label>
        ) : !config.paginated ? (
          <label className="adm-field">
            Search this list
            <input
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </label>
        ) : null}
        {descriptors
          .filter((p) => !["page", "limit", "search"].includes(p.name))
          .map((p) =>
            ["productId", "variantId", "supplierId"].includes(p.name) ? (
              <ReferenceSelect
                key={p.name}
                name={p.name}
                value={params?.get(p.name) || ""}
                onChange={(v) => change(p.name, v)}
              />
            ) : (
              <label className="adm-field" key={p.name}>
                {label(p.name)}
                {p.schema?.enum ? (
                  <select
                    aria-label={label(p.name)}
                    value={params?.get(p.name) || ""}
                    onChange={(e) => change(p.name, e.target.value)}
                  >
                    <option value="">All</option>
                    {p.schema.enum.map((v) => (
                      <option key={v} value={v}>
                        {label(v.toLowerCase())}
                      </option>
                    ))}
                  </select>
                ) : ["lowStock", "archived", "inactive"].includes(p.name) ? (
                  <select
                    aria-label={label(p.name)}
                    value={params?.get(p.name) || ""}
                    onChange={(e) => change(p.name, e.target.value)}
                  >
                    <option value="">Default</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                ) : (
                  <input
                    type={["from", "to"].includes(p.name) ? "date" : "text"}
                    value={(params?.get(p.name) || "").slice(
                      0,
                      ["from", "to"].includes(p.name) ? 10 : undefined,
                    )}
                    onChange={(e) => change(p.name, e.target.value)}
                  />
                )}
              </label>
            ),
          )}
      </div>
      <Feedback error={error} message={message} />
      {config.summary && <QueryState {...summary} />}
      {summary.data && (
        <Panel title="Period summary">
          <Summary data={summary.data} />
        </Panel>
      )}
      <QueryState {...result} />
      {!result.loading && !result.error && (
        <Panel className="flush">
          <DataTable
            rows={shown}
            columns={
              entity === "inventory"
                ? config.columns.filter(
                    (c) => !["category", "averageUnitCost"].includes(c.key),
                  )
                : config.columns
            }
            href={(r) =>
              r.id && entity !== "delivery-rates"
                ? `/admin/${entity}/${encodeURIComponent(r.id)}`
                : null
            }
            action={
              config.update || config.remove
                ? (r) =>
                    r.id ? (
                      <div className="adm-actions">
                        {entity === "inventory" && (
                          <Button onClick={() => setStockId(r.id!)}>
                            Add stock
                          </Button>
                        )}
                        {config.update && (
                          <button
                            className="adm-text-link"
                            onClick={() => setEdit(r)}
                          >
                            Edit
                          </button>
                        )}
                        {config.remove && (
                          <button
                            className="adm-text-link"
                            onClick={() => setRemove(r)}
                          >
                            {config.remove === "delete"
                              ? "Delete"
                              : "Deactivate"}
                          </button>
                        )}
                      </div>
                    ) : null
                : undefined
            }
          />
        </Panel>
      )}
      {config.paginated && (
        <div className="adm-pagination">
          <span>
            {textValue(page.total)} entries · Page {query.page} of{" "}
            {Number(page.totalPages) || 1}
          </span>
          <div className="adm-actions">
            <Button
              disabled={Number(query.page) <= 1 || result.loading}
              onClick={() => change("page", String(Number(query.page) - 1))}
            >
              ← Previous
            </Button>
            <Button
              disabled={
                Number(query.page) >= Number(page.totalPages || 1) ||
                result.loading
              }
              onClick={() => change("page", String(Number(query.page) + 1))}
            >
              Next →
            </Button>
          </div>
        </div>
      )}
      {edit !== false && (
        <Modal
          title={`${edit ? "Edit" : "Add"} ${config.singular.toLowerCase()}`}
          onClose={() => {
            if (
              window.confirm("Close this form? Unsaved changes will be lost.")
            )
              setEdit(false);
          }}
        >
          <SchemaForm
            schemaName={(edit ? config.update : config.create)!}
            initial={edit || {}}
            exclude={
              entity === "inventory" && edit
                ? ["currentStock", "averageUnitCost"]
                : []
            }
            onSave={async (body) => {
              await adminRequest(
                `${config.endpoint}${edit?.id ? "/" + encodeURIComponent(edit.id) : ""}`,
                { method: edit ? "PATCH" : "POST", body },
              );
              saved();
            }}
          />
        </Modal>
      )}
      {remove && (
        <Modal
          title={`${config.remove === "delete" ? "Delete" : "Deactivate"} ${config.singular.toLowerCase()}?`}
          onClose={() => !busy && setRemove(null)}
        >
          <p>
            {textValue(
              remove.name ||
                remove.title ||
                remove.code ||
                remove.state ||
                remove.description,
            )}
          </p>
          <p className="adm-note">
            {config.remove === "delete"
              ? "This removes the entry and may change financial summaries."
              : "This hides the entry from future use. Existing order snapshots stay unchanged."}
          </p>
          <Button
            className="danger"
            disabled={busy}
            onClick={async () => {
              if (busy) return;
              setBusy(true);
              setError("");
              try {
                await adminRequest(
                  `${config.endpoint}/${encodeURIComponent(remove.id!)}`,
                  { method: "DELETE" },
                );
                setRemove(null);
                setMessage("Updated successfully.");
                refresh();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Could not update.");
                setRemove(null);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Updating…" : "Confirm"}
          </Button>
        </Modal>
      )}
    </>
  );
}
export function Summary({ data }: { data: AdminRecord }) {
  return (
    <div className="adm-actions">
      {Object.entries(data)
        .filter(([, v]) => typeof v === "number" || typeof v === "string")
        .map(([key, value]) => (
          <p key={key}>
            <strong>{label(key)}: </strong>
            {/total|amount|profit|expense|withdraw/i.test(key)
              ? money(String(value))
              : String(value)}
          </p>
        ))}
      {Array.isArray(data.byCategory) && (
        <DataTable
          rows={data.byCategory as AdminRecord[]}
          columns={[{ key: "category" }, { key: "amount", kind: "money" }]}
        />
      )}
    </div>
  );
}
