"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { asRows, textValue, type AdminRecord } from "@/lib/admin/types";
import { adminRequest } from "@/lib/admin/api";
import { money } from "@/lib/commerce/catalogue";
import { useAdmin } from "./AdminShell";
import { useAdminQuery } from "./useAdminQuery";
import SchemaForm from "./SchemaForm";
import { Button, PageHeader, Panel, QueryState } from "./primitives";
export default function PurchaseForm() {
  const router = useRouter();
  const { refresh } = useAdmin();
  const q = useAdminQuery<AdminRecord[]>("/resources");
  const [items, setItems] = useState([
    {
      key: "first",
      resourceId: "",
      purchaseQuantity: 1,
      purchaseUnit: "PACK",
      unitsPerPurchaseUnit: 1,
      totalCost: 0,
    },
  ]);
  return (
    <>
      <PageHeader
        title="Bring a little more into the studio."
        description="Record a purchase. Stock and weighted-average costs update together."
      />
      <QueryState {...q} />
      {q.data && (
        <Panel title="Purchase details">
          <SchemaForm
            schemaName="CreatePurchaseDto"
            exclude={["items"]}
            submitLabel="Confirm purchase & update stock"
            onSave={async (body) => {
              if (
                !items.length ||
                items.some(
                  (i) =>
                    !i.resourceId ||
                    i.purchaseQuantity <= 0 ||
                    i.unitsPerPurchaseUnit <= 0 ||
                    i.totalCost < 0,
                )
              )
                throw new Error("Check every resource, quantity and cost.");
              const result = await adminRequest<AdminRecord>("/purchases", {
                method: "POST",
                body: {
                  ...body,
                  items: items.map(
                    ({
                      resourceId,
                      purchaseQuantity,
                      purchaseUnit,
                      unitsPerPurchaseUnit,
                      totalCost,
                    }) => ({
                      resourceId,
                      purchaseQuantity,
                      purchaseUnit,
                      unitsPerPurchaseUnit,
                      totalCost,
                    }),
                  ),
                },
              });
              refresh();
              router.push(`/admin/purchases/${result.id}`);
            }}
          >
            <h2 className="mt-8">Supplies purchased</h2>
            {items.map((item, index) => (
              <div key={item.key} className="adm-line-item">
                <div className="adm-form-grid">
                  <label className="adm-field">
                    Resource {index + 1}
                    <select
                      aria-label={`Resource ${index + 1}`}
                      required
                      value={item.resourceId}
                      onChange={(e) =>
                        setItems((all) =>
                          all.map((i) =>
                            i.key === item.key
                              ? { ...i, resourceId: e.target.value }
                              : i,
                          ),
                        )
                      }
                    >
                      <option value="">Choose a resource</option>
                      {asRows(q.data).map((r) => (
                        <option key={r.id} value={r.id}>
                          {textValue(r.name)} · base unit: {textValue(r.unit)}
                        </option>
                      ))}
                    </select>
                  </label>
                  {(
                    [
                      "purchaseQuantity",
                      "purchaseUnit",
                      "unitsPerPurchaseUnit",
                      "totalCost",
                    ] as const
                  ).map((key) => (
                    <label className="adm-field" key={key}>
                      {
                        {
                          purchaseQuantity: "Number of purchase units",
                          purchaseUnit: "Purchase unit (e.g. PACK)",
                          unitsPerPurchaseUnit: "Base units per purchase unit",
                          totalCost: "Total paid for this line (₦)",
                        }[key]
                      }
                      <input
                        required
                        type={key === "purchaseUnit" ? "text" : "number"}
                        min={key === "totalCost" ? 0 : 0.01}
                        step="0.01"
                        value={item[key]}
                        onChange={(e) =>
                          setItems((all) =>
                            all.map((i) =>
                              i.key === item.key
                                ? {
                                    ...i,
                                    [key]:
                                      key === "purchaseUnit"
                                        ? e.target.value
                                        : Number(e.target.value),
                                  }
                                : i,
                            ),
                          )
                        }
                      />
                    </label>
                  ))}
                </div>
                <p className="adm-note">
                  Adds {item.purchaseQuantity * item.unitsPerPurchaseUnit} base
                  units · {money(item.totalCost)} total cost.
                </p>
                <Button
                  type="button"
                  disabled={items.length === 1}
                  onClick={() =>
                    setItems((all) => all.filter((i) => i.key !== item.key))
                  }
                >
                  Remove line
                </Button>
              </div>
            ))}
            <Button
              type="button"
              onClick={() =>
                setItems((all) => [
                  ...all,
                  {
                    key: crypto.randomUUID(),
                    resourceId: "",
                    purchaseQuantity: 1,
                    purchaseUnit: "PACK",
                    unitsPerPurchaseUnit: 1,
                    totalCost: 0,
                  },
                ])
              }
            >
              + Add resource
            </Button>
            <div className="adm-line-item">
              <strong>
                Review: {items.length} lines ·{" "}
                {money(items.reduce((sum, i) => sum + i.totalCost, 0))}
              </strong>
              <p className="adm-note">
                Check the conversion carefully: 3 packs × 20 sheets adds 60
                sheets. Total paid means the cost of all packs on that line.
              </p>
              <label className="adm-field">
                <span>
                  <input type="checkbox" required /> I checked the quantities,
                  unit conversions and costs.
                </span>
              </label>
            </div>
          </SchemaForm>
        </Panel>
      )}
    </>
  );
}
