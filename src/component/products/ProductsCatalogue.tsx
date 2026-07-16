"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type ProductCategory =
  | "all"
  | "prints"
  | "strips"
  | "letters"
  | "cases"
  | "albums";

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

const filters: {
  label: string;
  value: ProductCategory;
}[] = [
  {
    label: "All",
    value: "all",
  },
  {
    label: "Polaroid Prints",
    value: "prints",
  },
  {
    label: "Photostrips",
    value: "strips",
  },
  {
    label: "Vintage Letters",
    value: "letters",
  },
  {
    label: "Phone Cases",
    value: "cases",
  },
  {
    label: "Albums",
    value: "albums",
  },
];

const products: Product[] = [
  {
    id: "polaroid-prints",
    category: "prints",
    title: "Polaroid Prints",
    description:
      "The classic frame, filled with your favourite moment. Upload a photo and preview it instantly.",
    price: "from ₦2,500",
    turnaround: "Ready in 24hrs",
    href: "/products/polaroids",
    image: "/images/categories/polaroid-prints.jpg",
    buttonText: "Customize Polaroids",
    isBestSeller: true,
  },
  {
    id: "photostrips",
    category: "strips",
    title: "Photostrips",
    description:
      "Two to four photos in one strip. Pick a template for birthdays, besties or soft love.",
    price: "from ₦3,000",
    turnaround: "Up to 48hrs",
    href: "/products/photostrips",
    image: "/images/categories/photo-strips.jpg",
    buttonText: "Choose a Template",
  },
  {
    id: "vintage-letters",
    category: "letters",
    title: "Vintage Letters",
    description:
      "Write what you would never text and turn it into something made to be held.",
    price: "from ₦4,000",
    turnaround: "Ready in 48hrs",
    href: "/products/vintage-letters",
    image: "/images/categories/vintage-letter.jpg",
    buttonText: "Create a Letter",
  },
  {
    id: "phone-cases",
    category: "cases",
    title: "Polaroid Phone Cases",
    description:
      "Carry the memory every day with your photo printed onto a phone case.",
    price: "from ₦8,000",
    turnaround: "Ready in 48hrs",
    href: "/products/phone-cases",
    image: "/images/categories/polaroid-phonecase.jpeg",
    buttonText: "View Cases",
    isBestSeller: true,
  },
  {
    id: "photo-albums",
    category: "albums",
    title: "Photo Albums",
    description:
      "A whole story, bound. Made for anniversaries, graduations and special moments.",
    price: "from ₦15,000",
    turnaround: "Ready in 3–5 days",
    href: "/products/albums",
    image: "/images/categories/photo-album.jpg",
    buttonText: "View Albums",
  },
];

const ProductsCatalogue = () => {
  const [activeCategory, setActiveCategory] =
    useState<ProductCategory>("all");

  const visibleProducts =
    activeCategory === "all"
      ? products
      : products.filter(
          (product) =>
            product.category === activeCategory,
        );

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
              const isActive =
                activeCategory === filter.value;

              return (
                <button
                  key={filter.value}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() =>
                    setActiveCategory(filter.value)
                  }
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
                    <span className="sm:hidden">
                      View
                    </span>

                    <span className="hidden sm:inline">
                      {product.buttonText}
                    </span>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductsCatalogue;