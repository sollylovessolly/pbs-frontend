"use client";
import {
  createContext,
  Suspense,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { beginUploadSession } from "@/lib/commerce/production";
import PackageStepProvider from "./PackageStepProvider";
import UploadProgress from "./UploadProgress";
import { getProducts } from "@/lib/api";
import type {
  BackendProduct,
  BackendProductCategory,
  BackendVariant,
} from "@/lib/api/types";
import { available, money } from "@/lib/commerce/catalogue";
const Context = createContext<{
  products: BackendProduct[];
  variant: BackendVariant;
  selectVariant: (sku: string) => void;
} | null>(null);
export function useProduct() {
  const value = useContext(Context);
  if (!value) throw new Error("Product selection is required");
  return value;
}
export default function ProductProvider({
  category,
  children,
}: {
  category: BackendProductCategory;
  children: ReactNode;
}) {
  const [products, setProducts] = useState<BackendProduct[]>([]);
  const [sku, setSku] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    beginUploadSession();
  }, [category]);
  useEffect(() => {
    const controller = new AbortController();
    getProducts(controller.signal)
      .then((all) => {
        setProducts(all.filter((p) => p.isActive && p.category === category));
        setLoading(false);
      })
      .catch((e) => {
        if (!controller.signal.aborted) {
          setError(e.message);
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [category, attempt]);
  const variants = products.flatMap((p) =>
    p.variants.filter((v) => v.isActive),
  );
  const variant =
    variants.find((v) => v.sku === sku) ??
    variants.find(available) ??
    variants[0];
  return (
    <>
      <section className="mx-auto max-w-[1240px] px-5 py-6" aria-live="polite">
        {loading ? (
          <p>Loading options…</p>
        ) : error ? (
          <p role="alert">
            {error}{" "}
            <button
              onClick={() => {
                setError("");
                setLoading(true);
                setAttempt((x) => x + 1);
              }}
            >
              Retry
            </button>
          </p>
        ) : !variant ? (
          <p>No options are available yet. Please check back soon.</p>
        ) : (
          <>
            {category !== "PHONE_CASE" && category !== "PHOTOSTRIP" && (
              <>
                <label className="block font-bold" htmlFor="backend-variant">
                  Product option
                </label>
                <select
                  id="backend-variant"
                  className="mt-2 w-full rounded-xl border-2 border-ink bg-paper p-3"
                  value={variant.sku}
                  onChange={(e) => setSku(e.target.value)}
                >
                  {variants.map((v) => (
                    <option key={v.sku} value={v.sku}>
                      {v.name} — {money(v.sellingPrice)}
                      {available(v) ? "" : " — unavailable"}
                    </option>
                  ))}
                </select>
              </>
            )}
            {category !== "PHONE_CASE" &&
              category !== "PHOTOSTRIP" &&
              !available(variant) && (
                <div
                  role="status"
                  className="mt-4 rounded-xl border border-burgundy/30 bg-blush p-4 text-ink"
                >
                  <p className="font-bold">
                    {variant.reasonIfUnavailable ||
                      "This option is out of stock."}
                  </p>
                  {variant.availableQuantity === 0 && (
                    <p className="mt-1 text-sm leading-6">
                      This option is currently out of stock. Ordering will
                      reopen when it is restocked.
                    </p>
                  )}
                </div>
              )}
          </>
        )}
      </section>
      <UploadProgress />
      {!loading && !error && variant && (
        <Context.Provider value={{ products, variant, selectVariant: setSku }}>
          <fieldset
            disabled={
              category !== "PHONE_CASE" &&
              category !== "PHOTOSTRIP" &&
              category !== "VINTAGE_LETTER" &&
              !available(variant)
            }
            className="min-w-0"
          >
            <Suspense fallback={<p className="p-5">Loading customiser…</p>}>
              <PackageStepProvider category={category}>
                {children}
              </PackageStepProvider>
            </Suspense>
          </fieldset>
        </Context.Provider>
      )}
    </>
  );
}
