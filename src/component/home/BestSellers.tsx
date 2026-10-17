"use client";

import PackagePhoto from "@/component/products/PackagePhoto";
import { useEffect, useState } from "react";
import { getProducts } from "@/lib/api";
import type { BackendProduct } from "@/lib/api/types";
import { productAssets, money, available } from "@/lib/commerce/catalogue";
import Image from "next/image";
import Link from "next/link";
import { LuImagePlus, LuPackage, LuTruck } from "react-icons/lu";

import { giftPackages } from "@/lib/commerce/packages";
import Button from "@/component/ui/Button";

const deliveryInfo = [
  {
    icon: <LuPackage aria-hidden="true" />,
    text: "Polaroids & cases ready within 24–48hrs",
  },
  {
    icon: <LuImagePlus aria-hidden="true" />,
    text: "Photostrips take up to 48hrs to process",
  },
  {
    icon: <LuTruck aria-hidden="true" />,
    text: "Delivery across Lagos & nationwide",
  },
];

const BestSellers = () => {
  const [products, setProducts] = useState<BackendProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    getProducts(c.signal)
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((e) => {
        if (!c.signal.aborted) {
          setError(e.message);
          setLoading(false);
        }
      });
    return () => c.abort();
  }, [attempt]);
  const bestSellers = products
    .filter((p) => p.isActive && p.variants.some((v) => v.isActive))
    .slice(0, 2)
    .map((p) => ({
      title: p.name,
      price: `From ${money(Math.min(...p.variants.filter((v) => v.isActive).map((v) => Number(v.sellingPrice))))}`,
      time: p.variants.some(available)
        ? "Made to order"
        : "Currently unavailable",
      href: `/products/${productAssets[p.category].path}`,
      src: productAssets[p.category].image,
      alt: p.name,
      isBestSeller: false,
      compareAt: "",
      packageId: "",
    }));
  bestSellers.push(
    ...[giftPackages[0], giftPackages[2], giftPackages[4]].map((p) => ({
      title: p.name,
      price: money(p.price),
      compareAt: money(p.compareAt),
      time: `${p.occasion} package · premium packaging included`,
      href: `/products/packages/${p.id}`,
      src: "/images/gallery/product-showcase/polaroids-prints.jpeg",
      packageId: p.id,
      alt: `${p.name} gift package`,
      isBestSeller: false,
    })),
  );
  return (
    <>
      <section className="bg-cream py-12 sm:py-16 lg:py-24">
        <div className="mx-auto max-w-site px-4 sm:px-5 md:px-7">
          <div className="mb-7 flex items-center justify-between gap-3 sm:mb-10 lg:mb-12">
            <h2 className="whitespace-nowrap font-display text-[clamp(1.05rem,4.7vw,1.5rem)] font-semibold leading-none tracking-[-0.04em] text-ink sm:text-4xl sm:tracking-tight">
              Bestsellers this month
            </h2>

            <div className="shrink-0">
              <Button href="/products" variant="ghost" size="small">
                <span className="sm:hidden">View all</span>

                <span className="hidden sm:inline">View all products</span>
              </Button>
            </div>
          </div>

          {loading && <p role="status">Loading keepsakes…</p>}
          {error && (
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
          )}
          {!loading && !error && !bestSellers.length && (
            <p>New keepsakes are coming soon.</p>
          )}
          <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-6 lg:grid-cols-5">
            {bestSellers.map((product) => (
              <Link
                key={product.title}
                href={product.href}
                className="group relative block min-w-0"
              >
                {product.isBestSeller && (
                  <span className="absolute -left-1 -top-2 z-20 -rotate-[8deg] rounded-md border-2 border-ink bg-burgundy px-2 py-0.5 font-handwritten text-xs font-bold text-cream sm:-left-2 sm:-top-3 sm:px-3.5 sm:py-1 sm:text-lg">
                    bestseller
                  </span>
                )}

                <div className="rounded-sm border-2 border-ink bg-paper px-2 pb-6 pt-2 shadow-[3px_4px_0_rgba(42,33,28,0.12)] transition-transform duration-150 sm:px-3 sm:pb-10 sm:pt-3 sm:shadow-[5px_6px_0_rgba(42,33,28,0.12)] sm:group-hover:-translate-y-1 sm:group-hover:-rotate-1">
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-beige">
                    {product.packageId ? (
                      <PackagePhoto id={product.packageId} />
                    ) : (
                      <Image
                        src={product.src}
                        alt={product.alt}
                        fill
                        sizes="(max-width: 639px) 50vw, (max-width: 1024px) 50vw, 20vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                  </div>
                </div>

                <div className="px-0.5 pt-3 sm:pt-4">
                  <h3 className="font-display text-sm font-semibold leading-5 text-ink transition-colors group-hover:text-burgundy sm:text-[16px]">
                    {product.title}
                  </h3>

                  <div className="mt-1.5 flex flex-col gap-0.5 sm:mt-2">
                    <span className="font-sans text-xs font-bold text-ink sm:text-[15px]">
                      {product.price}
                      {product.compareAt && (
                        <del className="ml-2 font-normal text-ink/60">
                          {product.compareAt}
                        </del>
                      )}
                    </span>

                    <span className="font-sans text-[10px] text-brown sm:text-[11.5px]">
                      {product.time}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden border-y-2 border-ink bg-ink text-cream">
        {/* Mobile delivery ticker */}
        <div className="delivery-marquee flex py-3 md:hidden">
          <div className="delivery-marquee-track flex w-max shrink-0 items-center">
            {deliveryInfo.map((item) => (
              <div
                key={`first-${item.text}`}
                className="flex shrink-0 items-center gap-2.5 whitespace-nowrap px-5 text-xs font-semibold"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-burgundy">
                  {item.icon}
                </span>

                <span>{item.text}</span>
              </div>
            ))}
          </div>

          <div
            aria-hidden="true"
            className="delivery-marquee-track flex w-max shrink-0 items-center"
          >
            {deliveryInfo.map((item) => (
              <div
                key={`duplicate-${item.text}`}
                className="flex shrink-0 items-center gap-2.5 whitespace-nowrap px-5 text-xs font-semibold"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-burgundy">
                  {item.icon}
                </span>

                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop delivery information */}
        <div className="mx-auto hidden max-w-[1240px] grid-cols-3 gap-6 px-7 py-7 md:grid">
          {deliveryInfo.map((item) => (
            <div
              key={item.text}
              className="flex items-center gap-3 text-sm font-semibold"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-burgundy">
                {item.icon}
              </span>

              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default BestSellers;
