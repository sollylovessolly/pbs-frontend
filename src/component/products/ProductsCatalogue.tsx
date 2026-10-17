"use client";

import PackageCards from "./PackageCards";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { productAssets, available } from "@/lib/commerce/catalogue";
import { getProducts } from "@/lib/api";
import type { BackendProduct } from "@/lib/api/types";

type ProductCategory =
  "packages" | "all" | "prints" | "strips" | "letters" | "cases" | "albums";

type Product = {
  id: string;
  category: Exclude<ProductCategory, "all">;
  title: string;
  description: string;
  price: string;
  turnaround: string;
  href: string;
  image: string;
  buttonText: string;
  isBestSeller?: boolean;
};

const categoryByBackendCategory: Record<
  BackendProduct["category"],
  Exclude<ProductCategory, "all">
> = {
  POLAROID: "prints",
  PHOTOSTRIP: "strips",
  VINTAGE_LETTER: "letters",
  PHONE_CASE: "cases",
  ALBUM: "albums",
};

const buttonTextByCategory: Record<Exclude<ProductCategory, "all">, string> = {
  packages: "Personalise Package",
  prints: "Customize Polaroids",
  strips: "Choose a Template",
  letters: "Create a Letter",
  cases: "View Cases",
  albums: "View Albums",
};

const filters: {
  label: string;
  value: ProductCategory;
}[] = [
  { label: "All", value: "all" },
  { label: "Polaroid Prints", value: "prints" },
  { label: "Photostrips", value: "strips" },
  { label: "Vintage Letters", value: "letters" },
  { label: "Phone Cases", value: "cases" },
  { label: "Albums", value: "albums" },
  { label: "Packages", value: "packages" },
];

const toProductCard = (product: BackendProduct): Product | null => {
  const category = categoryByBackendCategory[product.category];
  const variants = product.variants.filter((variant) => variant.isActive);

  if (!product.isActive || !category || variants.length === 0) {
    return null;
  }

  const firstAvailableVariant = [...variants].sort(
    (a, b) => Number(a.sellingPrice) - Number(b.sellingPrice),
  )[0];

  return {
    id: product.id,
    category,
    title: product.name,
    description: product.description,
    price: `from ₦${Number(firstAvailableVariant.sellingPrice).toLocaleString(
      "en-NG",
    )}`,
    turnaround: "Made to order",
    href: `/products/${productAssets[product.category].path}`,
    image:
      productAssets[product.category].image ??
      "/images/gallery/product-showcase/polaroids-prints.jpeg",
    buttonText: variants.some(available)
      ? buttonTextByCategory[category]
      : "Currently unavailable",
    isBestSeller: category === "prints",
  };
};

const ProductsCatalogue = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<ProductCategory>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProducts = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await getProducts();
      setProducts(
        response
          .map(toProductCard)
          .filter((product): product is Product => Boolean(product)),
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "We could not load products right now.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isActive = true;

    void getProducts()
      .then((response) => {
        if (!isActive) return;

        setProducts(
          response
            .map(toProductCard)
            .filter((product): product is Product => Boolean(product)),
        );
      })
      .catch((loadError: unknown) => {
        if (!isActive) return;

        setError(
          loadError instanceof Error
            ? loadError.message
            : "We could not load products right now.",
        );
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const visibleProducts =
    activeCategory === "all"
      ? products
      : products.filter((product) => product.category === activeCategory);

  return (
    <section className="px-4 pb-16 pt-8 sm:px-5 sm:pb-20 sm:pt-10 md:px-7 md:pb-24 md:pt-14">
      <div className="mx-auto max-w-[1240px]">
        {/* Filters */}
        <div className="-mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-5 sm:px-5 md:mx-0 md:px-0">
          <div
            aria-label="Filter products"
            className="flex w-max items-center gap-2 sm:flex-wrap sm:gap-3"
          >
            {filters.map((filter) => {
              const isActive = activeCategory === filter.value;

              return (
                <button
                  key={filter.value}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveCategory(filter.value)}
                  className={[
                    "shrink-0 whitespace-nowrap rounded-full border-2 border-ink",
                    "px-3 py-2 text-xs font-bold",
                    "shadow-[2px_2px_0_#2A211C]",
                    "transition duration-150",
                    "sm:px-5 sm:py-2.5 sm:text-sm",
                    isActive
                      ? "bg-burgundy text-cream"
                      : "bg-paper text-ink hover:bg-beige",
                  ].join(" ")}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product cards */}
        {activeCategory !== "packages" &&
          (isLoading ? (
            <p role="status" className="py-10">
              Loading keepsakes…
            </p>
          ) : error ? (
            <div role="alert" className="my-8 border-2 border-ink bg-paper p-6">
              <p>{error}</p>
              <button
                type="button"
                onClick={() => void loadProducts()}
                className="mt-4 font-bold underline"
              >
                Try again
              </button>
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="mt-8 border-2 border-ink bg-paper p-8 text-center shadow-[4px_4px_0_#2A211C]">
              <p className="font-serif text-xl font-semibold">
                No keepsakes available in this category yet.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-5 lg:grid-cols-3 lg:gap-7">
              {visibleProducts.map((product) => (
                <article
                  key={product.id}
                  className="group flex min-w-0 overflow-hidden rounded-[14px] border-2 border-ink bg-paper shadow-[0_4px_0_rgba(42,33,28,0.08)] transition duration-200 sm:rounded-[18px] sm:shadow-[0_6px_0_rgba(42,33,28,0.08)] sm:hover:-translate-y-1"
                >
                  <div className="flex min-w-0 w-full flex-col">
                    {/* Product image */}
                    <div className="relative p-2.5 pb-1.5 sm:p-5 sm:pb-2">
                      {product.isBestSeller && (
                        <span className="absolute left-1 top-1 z-10 -rotate-6 rounded-full border-2 border-ink bg-burgundy px-2 py-0.5 font-serif text-[10px] font-bold italic text-cream sm:px-4 sm:py-1 sm:text-base">
                          bestseller
                        </span>
                      )}

                      <div className="relative aspect-[4/5] overflow-hidden rounded-[9px] border-2 border-ink bg-beige shadow-[2px_3px_0_rgba(42,33,28,0.14)] sm:aspect-square sm:rounded-lg sm:shadow-[4px_5px_0_rgba(42,33,28,0.14)]">
                        <Image
                          src={product.image}
                          alt={product.title}
                          fill
                          sizes="(max-width: 639px) 50vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition duration-500 group-hover:scale-[1.03]"
                        />
                      </div>
                    </div>

                    {/* Product information */}
                    <div className="flex min-w-0 flex-1 flex-col px-2.5 pb-3 pt-2.5 sm:px-5 sm:pb-5 sm:pt-4">
                      <h2 className="font-serif text-[15px] font-semibold leading-5 sm:text-xl">
                        {product.title}
                      </h2>

                      <p className="mt-1.5 line-clamp-2 flex-1 text-[11px] leading-4 text-ink/65 sm:mt-2 sm:line-clamp-3 sm:text-sm sm:leading-6">
                        {product.description}
                      </p>

                      <div className="mt-3 border-t border-dashed border-ink/25 pt-3 sm:mt-5 sm:pt-4">
                        <p className="text-xs font-bold leading-4 sm:text-base">
                          {product.price}
                        </p>

                        <p className="mt-1 text-[10px] font-medium leading-4 text-ink/55 sm:text-xs">
                          {product.turnaround}
                        </p>
                      </div>

                      <Link
                        href={product.href}
                        className="mt-3 flex w-full min-w-0 items-center justify-center rounded-full border-2 border-ink bg-burgundy px-2 py-2 text-center text-[11px] font-bold text-cream shadow-[2px_2px_0_#2A211C] transition active:translate-x-px active:translate-y-px active:shadow-none sm:mt-5 sm:px-5 sm:py-3 sm:text-sm sm:shadow-[4px_4px_0_#2A211C]"
                      >
                        <span className="sm:hidden">View</span>

                        <span className="hidden sm:inline">
                          {product.buttonText}
                        </span>
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ))}
        {(activeCategory === "packages" || activeCategory === "all") && (
          <PackageCards embedded />
        )}
      </div>
    </section>
  );
};

export default ProductsCatalogue;
