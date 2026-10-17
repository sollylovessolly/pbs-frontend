"use client";
import { useRef, useState } from "react";
import { adminRequest } from "@/lib/admin/api";
import { asRows, textValue, type AdminRecord } from "@/lib/admin/types";
import { money } from "@/lib/commerce/catalogue";
import { useAdminQuery } from "./useAdminQuery";
import { useUnsavedChanges } from "./useUnsavedChanges";
import { Button, Feedback, QueryState } from "./primitives";

function suggestedSku(name: string, rows: AdminRecord[]) {
  const base = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70);
  if (!base) return "";
  const used = new Set(rows.map((r) => String(r.sku).toUpperCase()));
  let code = `SUP-${base}`,
    suffix = 2;
  while (used.has(code)) code = `SUP-${base}-${suffix++}`;
  return code;
}
export default function InventoryStockForm({
  initialId = "",
  onSaved,
}: {
  initialId?: string;
  onSaved: () => void;
}) {
  const q = useAdminQuery<AdminRecord[]>("/resources");
  const rows = asRows(q.data).filter((r) => r.isActive !== false);
  const [selection, setSelection] = useState(initialId);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("MATERIAL");
  const [unit, setUnit] = useState("PIECE");
  const [quantity, setQuantity] = useState("");
  const [cost, setCost] = useState("");
  const [threshold, setThreshold] = useState("5");
  const [note, setNote] = useState("");
  const [customSku, setCustomSku] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const lock = useRef(false);
  useUnsavedChanges(dirty);
  const creating = selection === "new";
  const selected = rows.find((r) => r.id === selection);
  const sku =
    customSku.trim().toUpperCase() || suggestedSku(name, asRows(q.data));
  const units = creating ? unit : String(selected?.unit || "units");
  const count = Number(quantity),
    paid = Number(cost);
  return (
    <>
      <p className="adm-note mb-5">
        Choose the item you bought, then enter how many you added and what you
        paid. We’ll update the stock and cost for you.
      </p>
      <QueryState {...q} />
      {q.data && (
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
              if (
                !Number.isFinite(count) ||
                count <= 0 ||
                !Number.isFinite(paid) ||
                paid < 0 ||
                cost === ""
              )
                throw new Error(
                  "Enter a quantity above zero and the total amount paid.",
                );
              if (creating) {
                if (name.trim().length < 2)
                  throw new Error(
                    "Enter an item name with at least two characters.",
                  );
                if (
                  sku.length < 2 ||
                  asRows(q.data).some(
                    (r) => String(r.sku).toUpperCase() === sku,
                  )
                )
                  throw new Error(
                    "That stock code is already used. Choose the existing item or use a different code.",
                  );
                const low = Number(threshold);
                if (!Number.isFinite(low) || low < 0)
                  throw new Error(
                    "Enter a low-stock reminder of zero or more.",
                  );
                await adminRequest("/resources", {
                  method: "POST",
                  body: {
                    name: name.trim(),
                    sku,
                    category,
                    unit,
                    currentStock: count,
                    averageUnitCost: paid / count,
                    lowStockThreshold: low,
                    isActive: true,
                  },
                });
              } else {
                if (!selected?.id)
                  throw new Error("Choose an inventory item first.");
                await adminRequest(
                  `/resources/${encodeURIComponent(selected.id)}/restock`,
                  {
                    method: "POST",
                    body: {
                      quantity: count,
                      unitCost: paid / count,
                      ...(note.trim() ? { note: note.trim() } : {}),
                    },
                  },
                );
              }
              setDirty(false);
              onSaved();
            } catch (err) {
              setError(
                err instanceof Error
                  ? err.message
                  : "Could not save stock. Please retry.",
              );
            } finally {
              lock.current = false;
              setBusy(false);
            }
          }}
        >
          <fieldset disabled={busy}>
            <label className="adm-field mb-5">
              Item / SKU
              <select
                aria-label="Item / SKU"
                required
                value={selection}
                onChange={(e) => {
                  setSelection(e.target.value);
                  setQuantity("");
                  setCost("");
                  setNote("");
                }}
              >
                <option value="">Choose an item by name or code</option>
                {rows.map((r) => (
                  <option key={r.id} value={r.id}>
                    {textValue(r.name)} — {textValue(r.sku)}
                  </option>
                ))}
                <option value="new">+ Add a brand-new item</option>
              </select>
            </label>
            {!rows.length && (
              <p className="adm-note mb-4">
                Your inventory is empty. Choose “Add a brand-new item” to start.
              </p>
            )}
            {(creating || selected) && (
              <>
                {creating ? (
                  <div className="adm-form-grid mb-5">
                    <label className="adm-field wide">
                      Item name
                      <input
                        required
                        minLength={2}
                        maxLength={100}
                        placeholder="e.g. Polaroid film or gift boxes"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </label>
                    <label className="adm-field">
                      What is it used for?
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        <option value="MATERIAL">
                          Making products (paper, film)
                        </option>
                        <option value="PACKAGING">
                          Packaging (boxes, bags)
                        </option>
                        <option value="CONSUMABLE">
                          Everyday supplies (ink, glue)
                        </option>
                        <option value="FINISHED_GOOD">
                          Ready-to-sell items
                        </option>
                      </select>
                    </label>
                    <label className="adm-field">
                      How do you count it?
                      <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                      >
                        {[
                          "PIECE",
                          "SHEET",
                          "ROLL",
                          "PACK",
                          "BOX",
                          "ML",
                          "GRAM",
                        ].map((u) => (
                          <option key={u}>{u}</option>
                        ))}
                      </select>
                      <small>Use the same unit each time you add stock.</small>
                    </label>
                  </div>
                ) : (
                  <p className="adm-feedback">
                    Currently on hand:{" "}
                    <strong>
                      {textValue(selected?.currentStock)} {units}
                    </strong>
                  </p>
                )}
                <div className="adm-form-grid">
                  <label className="adm-field">
                    Quantity added ({units})
                    <input
                      required
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                    <small>
                      For 2 packs of 20 sheets, enter 40 when counting sheets.
                    </small>
                  </label>
                  <label className="adm-field">
                    Total amount paid (₦)
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                    />
                    <small>The amount for all the units you’re adding.</small>
                  </label>
                </div>
                {count > 0 && cost !== "" && paid >= 0 && (
                  <p className="adm-note mt-4">
                    Adding {count} {units} · {money(paid)} total ·{" "}
                    {money(paid / count)} per {units.toLowerCase()}
                  </p>
                )}
                <details className="adm-simple-details mt-5">
                  <summary>
                    {creating
                      ? "Stock code & low-stock reminder"
                      : "Add a note (optional)"}
                  </summary>
                  <div className="adm-form-grid mt-4">
                    {creating ? (
                      <>
                        <label className="adm-field">
                          Stock code (SKU)
                          <input
                            required
                            minLength={2}
                            maxLength={100}
                            value={sku}
                            onChange={(e) => setCustomSku(e.target.value)}
                          />
                          <small>
                            Created automatically from the name. You can leave
                            it as it is.
                          </small>
                        </label>
                        <label className="adm-field">
                          Remind me when stock reaches
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            value={threshold}
                            onChange={(e) => setThreshold(e.target.value)}
                          />
                          <small>In {units.toLowerCase()}.</small>
                        </label>
                      </>
                    ) : (
                      <label className="adm-field wide">
                        Note
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                        />
                      </label>
                    )}
                  </div>
                </details>
                <Feedback error={error} />
                <div className="adm-form-footer">
                  <Button className="primary" disabled={busy}>
                    {busy
                      ? "Saving stock…"
                      : creating
                        ? "Create item & add stock"
                        : "Add stock"}
                  </Button>
                </div>
              </>
            )}
          </fieldset>
        </form>
      )}
    </>
  );
}
