"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { getPackage, packageContents } from "@/lib/commerce/packages";
import { money } from "@/lib/commerce/catalogue";
export default function PackageBuilder({ id }: { id: string }) {
  const p = getPackage(id)!;
  const { items, isReady, bundleItems } = useCart();
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const router = useRouter();
  const links = [
    ["polaroids", `${p.polaroids} Polaroid prints`],
    ["phone-cases", `${p.cases} phone cases (choose Case Only)`],
    ["vintage-letters", "1 vintage letter"],
    ...(p.strips ? [["photostrips", `${p.strips} photostrips`]] : []),
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
        <ul className="my-6 list-disc space-y-2 pl-5">
          {packageContents(p).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <h2 className="mt-10 font-serif text-2xl">1. Create your keepsakes</h2>
        <p className="mt-3 leading-7">
          Use the customisers below and add each finished item to your cart.
          Then return here and select the items to include. The fixed package
          price applies when you complete the package.
        </p>
        <div className="my-5 flex flex-wrap gap-3">
          {links.map(([path, label]) => (
            <Link
              key={path}
              href={`/products/${path}`}
              className="rounded-xl border-2 border-ink bg-paper px-4 py-3 font-bold"
            >
              Create {label} →
            </Link>
          ))}
        </div>
        {p.mini && (
          <p className="text-sm">
            Your free mini photostrip uses the same design as the included
            full-size photostrip.
          </p>
        )}
        <h2 className="mt-10 font-serif text-2xl">2. Complete your package</h2>
        <p className="mt-3">
          Select exactly the quantities listed above. Items outside the package
          keep their normal prices.
        </p>
        {!isReady ? (
          <p className="mt-5">Loading cart…</p>
        ) : !items.filter((i) => !i.packageGroupId).length ? (
          <p className="my-5">
            Your customised keepsakes will appear here after you add them to
            your cart.
          </p>
        ) : (
          <div className="my-5 space-y-3">
            {items
              .filter((i) => !i.packageGroupId)
              .map((item) => (
                <label
                  key={item.id}
                  className="flex items-start gap-3 rounded-xl border-2 border-ink bg-paper p-4"
                >
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
        )}
        <Link href="/cart" className="my-4 inline-block underline">
          View cart / adjust quantities
        </Link>
        {error && (
          <p role="alert" className="my-4 text-burgundy">
            {error}
          </p>
        )}
        <button
          disabled={!isReady || !selected.length}
          className="mt-4 block rounded-full border-2 border-ink bg-burgundy px-6 py-3 font-bold text-cream disabled:opacity-40"
          onClick={() => {
            try {
              bundleItems(id, selected);
              router.push("/cart");
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "Please check your selection.",
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
