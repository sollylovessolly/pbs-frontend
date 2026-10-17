"use client";
import PackagePhoto from "./PackagePhoto";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import {
  getPackage,
  packageContents,
  packageQuantity,
  packageStepRemaining,
  validatePackageItems,
} from "@/lib/commerce/packages";
import { money } from "@/lib/commerce/catalogue";
export default function PackageBuilder({ id }: { id: string }) {
  const p = getPackage(id)!;
  const { items, draftItems, isReady, bundleItems, removeDraftStep } =
    useCart();
  const [draftId, setDraftId] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const router = useRouter();
  useEffect(() => {
    const key = `pbs-package-draft-${id}`;
    let saved = new URLSearchParams(window.location.search).get("draft");
    try {
      saved = saved || localStorage.getItem(key);
    } catch {}
    const value =
      saved && /^[a-zA-Z0-9_-]{1,80}$/.test(saved)
        ? saved
        : crypto.randomUUID();
    try {
      localStorage.setItem(key, value);
    } catch {}
    queueMicrotask(() => setDraftId(value));
  }, [id]);
  const pieces = draftItems.filter(
    (i) => i.packageDraftId === draftId && i.packageDraftTemplateId === id,
  );
  const chosen = [...pieces, ...items.filter((i) => selected.includes(i.id))];
  let ready = false;
  try {
    validatePackageItems(id, chosen);
    ready = true;
  } catch {}
  const steps = [
    { path: "polaroids", type: "polaroid", name: "Polaroid prints" },
    { path: "phone-cases", type: "phone-case", name: "phone cases" },
    { path: "vintage-letters", type: "vintage-letter", name: "vintage letter" },
    ...(p.strips
      ? [{ path: "photostrips", type: "photostrip", name: "photostrips" }]
      : []),
  ];
  return (
    <main className="bg-cream px-5 py-12 text-ink">
      <div className="mx-auto max-w-3xl">
        <Link href="/products#packages" className="underline">
          ← All packages
        </Link>
        <p className="mt-6 font-bold text-burgundy">{p.occasion} package</p>
        <h1 className="mt-2 font-serif text-4xl">{p.name}</h1>
        <p className="mt-4 text-xl">
          <strong>{money(p.price)}</strong>{" "}
          <del className="text-base text-ink/60">{money(p.compareAt)}</del>
        </p>
        <div className="relative mt-6 aspect-[4/3] max-w-xl overflow-hidden rounded-2xl border-2 border-ink">
          <PackagePhoto id={id} />
        </div>
        <ul className="my-6 list-disc space-y-2 pl-5">
          {packageContents(p).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <h2 className="mt-10 font-serif text-2xl">Personalise your package</h2>
        <p className="mt-3 leading-7">
          Complete each keepsake below. Each customiser is limited to your
          package quantities and brings you back here when saved. Your progress
          is saved on this device; the package goes to your cart once everything
          is ready.
        </p>
        <div className="my-6 space-y-4">
          {steps.map((step, index) => {
            const total = packageQuantity(id, step.type);
            const remaining = packageStepRemaining(
              id,
              draftId,
              step.type,
              draftItems,
            );
            const href = `/products/${step.path}?giftPackage=${id}&packageDraft=${encodeURIComponent(draftId)}`;
            return (
              <div
                key={step.type}
                className={`rounded-xl border-2 border-ink p-5 ${remaining === 0 ? "bg-blush" : "bg-paper"}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-bold">
                    {index + 1}. {step.name}
                  </h3>
                  <span className="text-sm" role="status">
                    {total - remaining} / {total} ready
                  </span>
                </div>
                <p className="mt-2 text-sm">
                  {remaining
                    ? `${remaining} more to personalise`
                    : "Ready to include in your package."}
                </p>
                {draftId &&
                  isReady &&
                  (remaining ? (
                    <Link
                      href={href}
                      className="mt-4 inline-block rounded-full border-2 border-ink bg-burgundy px-4 py-2 font-bold text-cream"
                    >
                      Create {remaining} {step.name} →
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="mt-4 font-bold underline"
                      onClick={() => {
                        removeDraftStep(draftId, step.type);
                        router.push(href);
                      }}
                    >
                      Replace {step.name}
                    </button>
                  ))}
              </div>
            );
          })}
        </div>
        {p.mini && (
          <p className="text-sm">
            Your free mini photostrip uses the same design as the included
            full-size photostrip.
          </p>
        )}
        {pieces.length > 0 && (
          <div className="my-6 rounded-xl border border-ink/30 bg-paper p-4">
            <h3 className="font-bold">Saved in this package</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {pieces.map((i) => (
                <li key={i.id}>
                  {i.name} × {i.quantity}
                  {i.options?.phoneModel ? ` · ${i.options.phoneModel}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
        {items.some((i) => !i.packageGroupId) && (
          <details className="my-6 rounded-xl border border-ink/30 bg-paper p-4">
            <summary className="cursor-pointer font-bold">
              Use keepsakes already in your cart
            </summary>
            <p className="mt-3 text-sm">
              You can include matching items you created earlier.
            </p>
            <div className="mt-4 space-y-3">
              {items
                .filter((i) => !i.packageGroupId)
                .map((item) => (
                  <label key={item.id} className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(item.id)}
                      onChange={(e) =>
                        setSelected((ids) =>
                          e.target.checked
                            ? [...ids, item.id]
                            : ids.filter((v) => v !== item.id),
                        )
                      }
                      className="mt-1"
                    />
                    <span>
                      {item.name} × {item.quantity}
                      {item.options?.phoneModel
                        ? ` · ${item.options.phoneModel}`
                        : ""}
                    </span>
                  </label>
                ))}
            </div>
          </details>
        )}
        {error && (
          <p role="alert" className="my-4 text-burgundy">
            {error}
          </p>
        )}
        <p className="mt-6 text-sm">
          {ready
            ? "All keepsakes are ready. Premium protective packaging is included."
            : "Finish the keepsakes above to add the complete package to your cart."}
        </p>
        <button
          disabled={!isReady || !ready}
          className="mt-4 block rounded-full border-2 border-ink bg-burgundy px-6 py-3 font-bold text-cream disabled:opacity-40"
          onClick={() => {
            try {
              bundleItems(
                id,
                chosen.map((i) => i.id),
              );
              try {
                localStorage.removeItem(`pbs-package-draft-${id}`);
              } catch {}
              router.push("/cart");
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "Please check your package.",
              );
            }
          }}
        >
          Complete package · {money(p.price)}
        </button>
      </div>
    </main>
  );
}
