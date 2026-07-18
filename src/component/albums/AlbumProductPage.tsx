"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  LuArrowRight,
  LuBookOpen,
  LuCheck,
  LuImages,
  LuLayers3,
  LuMinus,
  LuPlus,
  LuShoppingBag,
} from "react-icons/lu";

import { useCart } from "@/context/CartContext";
import type { NewCartItem } from "@/types/cart";

const ALBUM_PRICE = 5000;
const ALBUM_COMPARE_AT_PRICE = 6000;

const ALBUM_IMAGES = [
  {
    id: "cover",
    src: "/images/albums/memory-album-cover.jpg",
    alt: "Memory Photo Album cover",
  },
  {
    id: "open",
    src: "/images/albums/memory-album-open.jpg",
    alt: "Memory Photo Album opened to show its pages",
  },
  {
    id: "pockets",
    src: "/images/albums/memory-album-pockets.jpg",
    alt: "Front and back Polaroid pockets inside the album",
  },
];

type AlbumProductPageProps = {
  inStock?: boolean;
};

const formatPrice = (amount: number) =>
  `₦${amount.toLocaleString("en-NG")}`;

const AlbumProductPage = ({
  inStock = true,
}: AlbumProductPageProps) => {
  const router = useRouter();
  const { addItems } = useCart();

  const [activeImageId, setActiveImageId] = useState(
    ALBUM_IMAGES[0].id,
  );
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] =
    useState(false);

  const activeImage =
    ALBUM_IMAGES.find(
      (image) => image.id === activeImageId,
    ) ?? ALBUM_IMAGES[0];

  const totalPrice = ALBUM_PRICE * quantity;

  const handleAddToCart = () => {
    if (!inStock || isAddingToCart) return;

    setIsAddingToCart(true);

    try {
      const cartItem: NewCartItem = {
        productType: "album",
        name: "Memory Photo Album",
        unitPrice: ALBUM_PRICE,
        quantity,
        previewUrl: ALBUM_IMAGES[0].src,
        options: {
          albumType: "Empty photo album",
          pageCount: "15 pages",
          pocketCount: "30 pockets",
          capacity: "Up to 30 Polaroid prints",
          arrangement: "Front and back pockets",
          originalPrice: formatPrice(
            ALBUM_COMPARE_AT_PRICE,
          ),
        },
        turnaround: "Ready in 24–48hrs",
        editHref: "/products/albums",
        isFast: false,
      };

      addItems([cartItem]);
      router.push("/cart");
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <>
      <main className="px-4 pb-28 pt-6 sm:px-5 md:px-7 md:pb-20 md:pt-10 lg:pt-14">
        <div className="mx-auto max-w-[1240px]">
          <section className="grid items-start gap-7 lg:grid-cols-[minmax(0,1.04fr)_minmax(390px,0.96fr)] lg:gap-12">
            <div className="min-w-0">
              <div className="relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-[18px] border-2 border-ink bg-blush p-5 shadow-[6px_6px_0_#2A211C] sm:min-h-[580px] sm:p-8">
                <div className="absolute left-4 top-4 z-10 -rotate-2 rounded-full border-2 border-ink bg-cream px-3 py-1 text-[10px] font-bold text-burgundy shadow-[2px_2px_0_#2A211C] sm:left-6 sm:top-6 sm:text-xs">
                  SALE
                </div>

                <div className="absolute inset-0 flex items-center justify-center p-10 text-center font-serif text-lg font-semibold text-ink/25">
                  Add your album photo here
                </div>

                <img
                  key={activeImage.id}
                  src={activeImage.src}
                  alt={activeImage.alt}
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                  className="relative z-[1] max-h-[520px] w-full object-contain drop-shadow-[0_14px_14px_rgba(42,33,28,0.18)]"
                />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-3 sm:mt-4">
                {ALBUM_IMAGES.map((image, index) => {
                  const isActive =
                    image.id === activeImage.id;

                  return (
                    <button
                      key={image.id}
                      type="button"
                      aria-label={`View album image ${index + 1}`}
                      aria-pressed={isActive}
                      onClick={() =>
                        setActiveImageId(image.id)
                      }
                      className={[
                        "relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[12px] border-2 bg-beige p-2 transition",
                        isActive
                          ? "border-ink shadow-[3px_3px_0_#2A211C]"
                          : "border-ink/25 hover:border-ink",
                      ].join(" ")}
                    >
                      <span className="absolute inset-0 flex items-center justify-center px-2 text-center text-[9px] font-bold text-ink/25">
                        Album image {index + 1}
                      </span>

                      <img
                        src={image.src}
                        alt=""
                        onError={(event) => {
                          event.currentTarget.style.display =
                            "none";
                        }}
                        className="relative z-[1] h-full w-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="lg:sticky lg:top-6">
              <span className="inline-flex -rotate-2 rounded-full border-2 border-ink bg-blush px-3 py-1 font-handwritten text-sm font-bold text-ink shadow-[2px_2px_0_#2A211C]">
                made for your memories
              </span>

              <h1 className="mt-5 font-serif text-4xl font-semibold leading-[1.05] text-ink sm:text-5xl">
                Memory Photo Album
              </h1>

              <p className="mt-4 max-w-[560px] text-sm leading-6 text-ink/60 sm:text-base sm:leading-7">
                A simple keepsake album for collecting,
                arranging and revisiting your favourite
                Polaroid prints. It arrives empty, so you
                can fill it in your own order.
              </p>

              <div className="mt-6 flex flex-wrap items-end gap-3">
                <p className="font-serif text-4xl font-bold text-burgundy">
                  {formatPrice(ALBUM_PRICE)}
                </p>

                <p className="pb-1 text-base font-bold text-ink/40 line-through decoration-2">
                  {formatPrice(
                    ALBUM_COMPARE_AT_PRICE,
                  )}
                </p>

                <span className="mb-1 rounded-full bg-burgundy px-2.5 py-1 text-[10px] font-bold text-cream">
                  SAVE ₦1,000
                </span>
              </div>

              <div className="mt-7 grid grid-cols-3 gap-2.5 sm:gap-3">
                <article className="rounded-[14px] border-2 border-ink bg-paper p-3 shadow-[3px_3px_0_rgba(42,33,28,0.12)] sm:p-4">
                  <LuBookOpen className="h-5 w-5 text-burgundy" />
                  <p className="mt-3 font-serif text-xl font-bold text-ink">
                    15
                  </p>
                  <p className="mt-0.5 text-[10px] font-semibold text-ink/50 sm:text-xs">
                    Album pages
                  </p>
                </article>

                <article className="rounded-[14px] border-2 border-ink bg-paper p-3 shadow-[3px_3px_0_rgba(42,33,28,0.12)] sm:p-4">
                  <LuLayers3 className="h-5 w-5 text-burgundy" />
                  <p className="mt-3 font-serif text-xl font-bold text-ink">
                    30
                  </p>
                  <p className="mt-0.5 text-[10px] font-semibold text-ink/50 sm:text-xs">
                    Photo pockets
                  </p>
                </article>

                <article className="rounded-[14px] border-2 border-ink bg-paper p-3 shadow-[3px_3px_0_rgba(42,33,28,0.12)] sm:p-4">
                  <LuImages className="h-5 w-5 text-burgundy" />
                  <p className="mt-3 font-serif text-xl font-bold text-ink">
                    30
                  </p>
                  <p className="mt-0.5 text-[10px] font-semibold text-ink/50 sm:text-xs">
                    Polaroid capacity
                  </p>
                </article>
              </div>

              <div className="mt-6 rounded-[14px] border-2 border-ink bg-beige/70 p-4">
                <div className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-burgundy text-cream">
                    <LuCheck className="h-4 w-4" />
                  </span>

                  <div>
                    <p className="text-sm font-bold text-ink">
                      The album arrives empty
                    </p>
                    <p className="mt-1 text-xs leading-5 text-ink/55 sm:text-sm">
                      Each of the 15 pages has a pocket on
                      the front and back, giving you space
                      for up to 30 Polaroids altogether.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-7 flex items-center justify-between gap-4 border-y border-dashed border-ink/25 py-5">
                <div>
                  <p className="text-sm font-bold text-ink">
                    How many albums?
                  </p>
                  <p className="mt-1 text-xs text-ink/50">
                    Each album holds up to 30 prints.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-label="Decrease album quantity"
                    disabled={quantity <= 1}
                    onClick={() =>
                      setQuantity((current) =>
                        Math.max(1, current - 1),
                      )
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink bg-paper disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <LuMinus className="h-4 w-4" />
                  </button>

                  <span className="min-w-6 text-center font-serif text-xl font-bold text-ink">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    aria-label="Increase album quantity"
                    onClick={() =>
                      setQuantity(
                        (current) => current + 1,
                      )
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink bg-paper"
                  >
                    <LuPlus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span
                    className={[
                      "inline-flex items-center gap-2 text-xs font-bold",
                      inStock
                        ? "text-burgundy"
                        : "text-ink/45",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "h-2.5 w-2.5 rounded-full",
                        inStock
                          ? "bg-burgundy"
                          : "bg-ink/30",
                      ].join(" ")}
                    />
                    {inStock
                      ? "In stock"
                      : "Currently unavailable"}
                  </span>

                  <p className="font-serif text-xl font-bold text-burgundy">
                    {formatPrice(totalPrice)}
                  </p>
                </div>

                <button
                  type="button"
                  aria-busy={isAddingToCart}
                  disabled={
                    !inStock || isAddingToCart
                  }
                  onClick={handleAddToCart}
                  className="hidden w-full items-center justify-center rounded-full border-2 border-ink bg-burgundy px-6 py-4 text-sm font-bold text-cream shadow-[4px_4px_0_#2A211C] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 lg:flex"
                >
                  <LuShoppingBag className="mr-2 h-5 w-5" />
                  {isAddingToCart
                    ? "Adding Album…"
                    : inStock
                      ? `Add to Cart — ${formatPrice(totalPrice)}`
                      : "Out of Stock"}
                </button>
              </div>

              <Link
                href="/products/polaroids"
                className="mt-5 inline-flex items-center text-xs font-bold text-burgundy underline decoration-1 underline-offset-4"
              >
                Need prints for it? Create your Polaroids
                <LuArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </div>
          </section>

          <section className="mt-14 overflow-hidden rounded-[18px] border-2 border-ink bg-paper shadow-[5px_5px_0_#2A211C] sm:mt-20">
            <div className="grid md:grid-cols-[0.9fr_1.1fr]">
              <div className="flex items-center justify-center bg-burgundy p-8 text-cream sm:p-12">
                <div className="relative flex h-52 w-40 items-center justify-center rounded-[10px] border-2 border-cream/70 bg-cream/10 shadow-[8px_8px_0_rgba(255,247,237,0.18)]">
                  <span className="absolute -right-10 top-1/2 h-36 w-28 -translate-y-1/2 rounded-[8px] border-2 border-cream/70 bg-cream/10" />
                  <LuBookOpen className="relative z-[1] h-14 w-14" />
                </div>
              </div>

              <div className="p-6 sm:p-9 md:p-12">
                <span className="font-handwritten text-base font-bold text-burgundy">
                  front, back, repeat
                </span>

                <h2 className="mt-3 font-serif text-3xl font-semibold text-ink">
                  One page. Two memories.
                </h2>

                <p className="mt-3 max-w-[560px] text-sm leading-6 text-ink/60">
                  Slide one Polaroid into the front pocket,
                  turn the page and add another at the back.
                  Repeat across all 15 pages to store up to
                  30 prints.
                </p>

                <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                  {[
                    ["15", "pages"],
                    ["2", "pockets each"],
                    ["30", "prints total"],
                  ].map(([value, label]) => (
                    <div
                      key={label}
                      className="rounded-[12px] bg-beige px-2 py-4"
                    >
                      <p className="font-serif text-2xl font-bold text-burgundy">
                        {value}
                      </p>
                      <p className="mt-1 text-[10px] font-semibold text-ink/50 sm:text-xs">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t-2 border-ink bg-cream px-4 py-3 lg:hidden">
        <div className="shrink-0">
          <p className="text-[10px] font-semibold text-ink/55">
            {quantity}{" "}
            {quantity === 1 ? "album" : "albums"}
          </p>

          <p className="font-serif text-base font-bold text-burgundy">
            {formatPrice(totalPrice)}
          </p>
        </div>

        <button
          type="button"
          aria-busy={isAddingToCart}
          disabled={!inStock || isAddingToCart}
          onClick={handleAddToCart}
          className="flex flex-1 items-center justify-center rounded-full border-2 border-ink bg-burgundy px-4 py-3 text-sm font-bold text-cream shadow-[3px_3px_0_#2A211C] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <LuShoppingBag className="mr-2 h-4 w-4" />
          {isAddingToCart
            ? "Adding…"
            : inStock
              ? "Add to Cart"
              : "Out of Stock"}
        </button>
      </div>
    </>
  );
};

export default AlbumProductPage;