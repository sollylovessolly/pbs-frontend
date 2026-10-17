"use client";
import Link from "next/link";
import { useState, useRef } from "react";
import { useAdmin } from "./AdminShell";
import { useAdminQuery } from "./useAdminQuery";
import { entities } from "@/lib/admin/entities";
import {
  asRecord,
  asRows,
  textValue,
  type AdminRecord,
} from "@/lib/admin/types";
import { adminRequest } from "@/lib/admin/api";
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
import InventoryStockForm from "./InventoryStockForm";
export default function EntityDetail({
  entity,
  id,
}: {
  entity: string;
  id: string;
}) {
  const config = entities[entity];
  const { revision, refresh } = useAdmin();
  const q = useAdminQuery<AdminRecord>(
    `${config.endpoint}/${encodeURIComponent(id)}`,
    revision,
  );
  const [action, setAction] = useState<"edit" | "restock" | "archive" | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [now] = useState(() => Date.now());
  const row = q.data;
  const done = () => {
    setAction(null);
    setMessage("Saved successfully.");
    refresh();
  };
  if (!row)
    return (
      <>
        <PageHeader title={config.singular} />
        <QueryState {...q} />
      </>
    );
  const fields = [
    ...config.columns,
    ...["description", "note", "email", "phone", "stockStatus", "createdAt"]
      .filter(
        (k) => row[k] !== undefined && !config.columns.some((c) => c.key === k),
      )
      .map((key) => ({ key })),
  ];
  return (
    <>
      <Link className="adm-text-link" href={`/admin/${entity}`}>
        ← Back to {config.title.toLowerCase()}
      </Link>
      <div className="mt-5">
        <PageHeader
          title={textValue(
            row.name ||
              row.title ||
              row.code ||
              row.state ||
              `${config.singular} details`,
          )}
          description={config.description}
        >
          {config.update && (
            <Button className="primary" onClick={() => setAction("edit")}>
              Edit {config.singular.toLowerCase()}
            </Button>
          )}
          {entity === "inventory" && (
            <Button className="primary" onClick={() => setAction("restock")}>
              + Restock
            </Button>
          )}
          {entity === "customers" && (
            <Button onClick={() => setAction("archive")}>
              {row.isArchived ? "Restore customer" : "Archive customer"}
            </Button>
          )}
        </PageHeader>
      </div>
      <Feedback error={error} message={message} />
      <Panel title="Details">
        <KeyValues record={row} fields={fields} />
        {entity === "discounts" && (
          <p className="adm-note">
            {!row.isActive
              ? "Disabled"
              : row.startsAt && Date.parse(String(row.startsAt)) > now
                ? "Scheduled"
                : row.endsAt && Date.parse(String(row.endsAt)) < now
                  ? "Expired"
                  : "Active"}
          </p>
        )}
        {asRecord(row.order).id && (
          <Link
            href={`/admin/orders/${asRecord(row.order).id}`}
            className="adm-text-link"
          >
            Open order →
          </Link>
        )}
      </Panel>
      {Array.isArray(row.variants) && (
        <Panel title="Variants">
          <DataTable
            rows={asRows(row.variants)}
            columns={entities.variants.columns}
            href={(r) => `/admin/variants/${r.id}`}
          />
          <Link
            className="adm-button mt-4"
            href={`/admin/variants?productId=${id}`}
          >
            Manage variants →
          </Link>
        </Panel>
      )}
      {Array.isArray(row.orders) && (
        <Panel title="Order history">
          <DataTable
            rows={asRows(row.orders)}
            columns={entities.orders.columns.filter(
              (c) => c.key !== "customer.name",
            )}
            href={(r) =>
              r.id
                ? `/admin/orders/${r.id}`
                : `/admin/orders?search=${encodeURIComponent(String(r.orderNumber))}`
            }
          />
        </Panel>
      )}
      {Array.isArray(row.purchases) && (
        <Panel title="Recent purchases">
          <DataTable
            rows={asRows(row.purchases)}
            columns={entities.purchases.columns}
            href={(r) => `/admin/purchases/${r.id}`}
          />
        </Panel>
      )}
      {Array.isArray(row.items) && (
        <Panel title="Purchase items">
          <DataTable
            rows={asRows(row.items)}
            columns={[
              { key: "resource.name", title: "Resource" },
              { key: "purchaseQuantity", title: "Purchased quantity" },
              { key: "purchaseUnit", title: "Purchase unit" },
              {
                key: "unitsPerPurchaseUnit",
                title: "Base units per purchase unit",
              },
              { key: "totalCost", kind: "money" },
            ]}
          />
        </Panel>
      )}
      {Array.isArray(row.movements) && (
        <Panel title="Stock movements">
          <DataTable
            rows={asRows(row.movements)}
            columns={[
              { key: "reason" },
              { key: "quantity" },
              { key: "unitCost", kind: "money" },
              { key: "note" },
              { key: "createdAt", kind: "date" },
            ]}
          />
        </Panel>
      )}
      {action && (
        <Modal
          title={
            action === "archive"
              ? "Change customer archive status"
              : action === "restock"
                ? "Restock resource"
                : `Edit ${config.singular.toLowerCase()}`
          }
          onClose={() => !busy && setAction(null)}
        >
          {action === "restock" ? (
            <InventoryStockForm initialId={id} onSaved={done} />
          ) : action === "archive" ? (
            <>
              <p className="adm-note">
                {row.isArchived
                  ? "Restore this customer to your active list."
                  : "Archiving hides this customer from the active list. It does not delete their order history."}
              </p>
              <Button
                className="primary"
                disabled={busy}
                onClick={async () => {
                  if (lock.current) return;
                  lock.current = true;
                  setBusy(true);
                  try {
                    await adminRequest(`/customers/${id}/archive`, {
                      method: "PATCH",
                      body: { archived: !row.isArchived },
                    });
                    done();
                  } catch (e) {
                    setError(
                      e instanceof Error ? e.message : "Could not update.",
                    );
                    setAction(null);
                  } finally {
                    lock.current = false;
                    setBusy(false);
                  }
                }}
              >
                Confirm
              </Button>
            </>
          ) : (
            <>
              <SchemaForm
                schemaName={config.update!}
                initial={row}
                exclude={
                  entity === "inventory" && action === "edit"
                    ? ["currentStock", "averageUnitCost"]
                    : []
                }
                onSave={async (body) => {
                  await adminRequest(`${config.endpoint}/${id}`, {
                    method: "PATCH",
                    body,
                  });
                  done();
                }}
              />
            </>
          )}
        </Modal>
      )}
    </>
  );
}
