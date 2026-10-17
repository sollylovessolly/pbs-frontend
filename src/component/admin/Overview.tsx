"use client";
import Link from "next/link";
import { useState } from "react";
import { useAdmin } from "./AdminShell";
import { useAdminQuery } from "./useAdminQuery";
import { DataTable, PageHeader, Panel, QueryState } from "./primitives";
import { entities } from "@/lib/admin/entities";
import {
  asRows,
  textValue,
  type AdminRecord,
  type DashboardSummary,
  type MonthlyProfit,
  type PageResult,
} from "@/lib/admin/types";
import { money } from "@/lib/commerce/catalogue";
import { queryString } from "@/lib/api/client";
export default function Overview() {
  const { admin, revision } = useAdmin();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const query = queryString({ from: from || undefined, to: to || undefined });
  const summary = useAdminQuery<DashboardSummary>(
    "/dashboard/summary" + query,
    revision,
  );
  const monthly = useAdminQuery<MonthlyProfit[]>(
    "/dashboard/monthly-profit?year=" + year,
    revision,
  );
  const products = useAdminQuery<AdminRecord[]>(
    "/dashboard/products" + query,
    revision,
  );
  const sources = useAdminQuery<AdminRecord[]>(
    "/dashboard/sources" + query,
    revision,
  );
  const orders = useAdminQuery<PageResult<AdminRecord>>(
    "/orders?page=1&limit=6",
    revision,
  );
  const stats: Array<[keyof DashboardSummary, string, string, boolean?]> = [
    ["revenue", "Revenue", "Paid orders in this period", true],
    ["orderGrossProfit", "Gross profit", "Before operating expenses"],
    ["paidOrders", "Paid orders", "In the selected period"],
    ["pendingOrders", "Open orders", "All time · not delivered or cancelled"],
    [
      "operatingExpenses",
      "Operating expenses",
      "Excludes costs already counted",
    ],
    [
      "businessProfit",
      "Business profit",
      "Gross profit less operating expenses",
    ],
    ["ownerWithdrawals", "Owner withdrawals", "Does not reduce gross profit"],
    ["lowStockCount", "Low-stock supplies", "Current inventory"],
  ];
  const max = Math.max(
    1,
    ...(monthly.data || []).map((m) => Math.abs(Number(m.businessProfit))),
  );
  return (
    <>
      <PageHeader
        title={`Welcome back, ${admin.name?.split(" ")[0] || "Solly"}.`}
        description="A little overview of your studio, and the memories in the making."
      >
        <Link href="/admin/orders/new" className="adm-button primary">
          + New manual order
        </Link>
      </PageHeader>
      <div className="adm-filters">
        <label className="adm-field">
          From
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="adm-field">
          To (exclusive)
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <p className="adm-note">
          Leave blank for this month. Dates use Nigeria time.
        </p>
      </div>
      <QueryState {...summary} />
      {summary.data && (
        <>
          <div className="adm-metrics">
            {stats.map(([key, title, description, accent]) => (
              <article
                key={key}
                className={`adm-metric ${accent ? "accent" : ""}`}
              >
                <small>{title}</small>
                <strong>
                  {["paidOrders", "pendingOrders", "lowStockCount"].includes(
                    key,
                  )
                    ? textValue(summary.data![key])
                    : money(String(summary.data![key]))}
                </strong>
                <p>{description}</p>
              </article>
            ))}
          </div>
          <p className="adm-note mb-6">
            Retained after withdrawals:{" "}
            <strong>{money(summary.data.retainedAfterWithdrawals)}</strong> ·
            Average paid order:{" "}
            <strong>{money(summary.data.averageOrderValue)}</strong>
          </p>
          {summary.data.urgentLowStock?.length > 0 && (
            <Panel title="A little attention needed" className="beige">
              {summary.data.urgentLowStock.map((r, i) => (
                <div className="adm-attention" key={r.id || i}>
                  <span aria-hidden="true">◉</span>
                  <div>
                    <strong>{textValue(r.name)}</strong>
                    <p className="adm-note">
                      {textValue(r.currentStock)} {textValue(r.unit)} remaining
                    </p>
                  </div>
                  <Link
                    href={
                      r.id
                        ? `/admin/inventory/${r.id}`
                        : "/admin/inventory?lowStock=true"
                    }
                  >
                    Restock →
                  </Link>
                </div>
              ))}
            </Panel>
          )}
        </>
      )}
      <div className="adm-two-columns">
        <Panel title="Your year, in perspective">
          <div className="adm-actions">
            <label className="adm-field">
              Year
              <input
                type="number"
                min={2000}
                max={2100}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              />
            </label>
            <p className="adm-note">
              Monthly business profit · bars show magnitude; losses are
              labelled.
            </p>
          </div>
          <QueryState {...monthly} />
          {monthly.data && (
            <>
              <div
                className="adm-chart"
                role="img"
                aria-label={`Monthly business profit for ${year}. Exact amounts in the table below.`}
              >
                {monthly.data.map((m) => (
                  <div className="adm-chart-column" key={m.month}>
                    <div
                      className="adm-chart-bar"
                      title={`${m.label}: ${money(m.businessProfit)}`}
                      style={{
                        height: `${(Math.abs(Number(m.businessProfit)) / max) * 135}px`,
                        background:
                          Number(m.businessProfit) < 0
                            ? "var(--color-rose)"
                            : undefined,
                      }}
                    />
                    <small>
                      {m.label}
                      {Number(m.businessProfit) < 0 ? " −" : ""}
                    </small>
                  </div>
                ))}
              </div>
              <details className="mt-5">
                <summary className="adm-text-link">
                  View monthly figures
                </summary>
                <DataTable
                  rows={monthly.data}
                  columns={[
                    { key: "label", title: "Month" },
                    { key: "revenue", kind: "money" },
                    { key: "grossProfit", kind: "money" },
                    { key: "expenses", kind: "money" },
                    { key: "businessProfit", kind: "money" },
                  ]}
                />
              </details>
            </>
          )}
        </Panel>
        <Panel title="Where your orders begin">
          <p className="adm-note">
            Paid orders by source in the selected period.
          </p>
          <QueryState {...sources} />
          {sources.data && (
            <DataTable
              rows={sources.data}
              columns={[
                { key: "source" },
                { key: "orders" },
                { key: "revenue", kind: "money" },
              ]}
            />
          )}
        </Panel>
      </div>
      <Panel title="Recent orders">
        <div className="adm-actions mb-4">
          <Link href="/admin/orders" className="adm-button">
            All orders →
          </Link>
          <Link
            href="/admin/orders?paymentStatus=UNPAID"
            className="adm-button"
          >
            Awaiting payment
          </Link>
          <Link href="/admin/orders?status=READY" className="adm-button">
            Ready to go
          </Link>
        </div>
        <QueryState {...orders} />
        {orders.data && (
          <DataTable
            rows={asRows(orders.data)}
            columns={entities.orders.columns}
            href={(r) => `/admin/orders/${r.id}`}
          />
        )}
      </Panel>
      <Panel title="Keepsakes people love">
        <QueryState {...products} />
        {products.data && (
          <DataTable
            rows={products.data}
            columns={[
              { key: "product", title: "Product" },
              { key: "quantitySold", title: "Quantity sold" },
              { key: "revenue", kind: "money" },
            ]}
          />
        )}
      </Panel>
    </>
  );
}
