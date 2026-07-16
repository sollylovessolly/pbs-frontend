import Link from "next/link";
import {
  LuImagePlus,
  LuPackage,
  LuTruck,
} from "react-icons/lu";

import ProductsCatalogue from "@/component/products/ProductsCatalogue";
import TornDivider from "@/component/ui/TornDivider";

export const metadata = {
  title: "Products | PolaroidsBySolly",
  description:
    "Turn your favourite photos into polaroids, photostrips, vintage letters, phone cases and albums.",
};

const deliveryInfo = [
  {
    icon: <LuPackage />,
    text: "Polaroids & cases ready within 24–48hrs",
  },
  {
    icon: <LuImagePlus />,
    text: "Photostrips take up to 48hrs to process",
  },
  {
    icon: <LuTruck />,
    text: "Delivery across Lagos & nationwide",
  },
];

const ProductsPage = () => {
  return (
    <main className="bg-cream text-ink">
      {/* Page introduction */}
      <section className="border-b-2 border-ink bg-burgundy text-cream pb-7">
        <div className="mx-auto max-w-[1240px] px-4 py-8 sm:px-5 sm:py-10 md:px-7 md:py-14">
          <div className="mb-4 text-xs font-semibold text-cream/55 sm:mb-5 sm:text-sm">
            <Link
              href="/"
              className="transition hover:text-cream"
            >
              Home
            </Link>

            <span className="mx-2">/</span>

            <span className="text-cream/80">
              Products
            </span>
          </div>

          <span className="inline-flex -rotate-3 rounded-full border-2 border-ink bg-beige px-3 py-1 font-serif text-sm font-bold italic text-ink shadow-[2px_2px_0_#2A211C] sm:px-4 sm:text-lg">
            pick a keepsake
          </span>

          <h1 className="mt-4 max-w-2xl font-serif text-[32px] font-semibold leading-[1.08] tracking-tight sm:mt-5 sm:text-4xl md:text-5xl">
            Every memory, made to hold
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-cream/65 sm:mt-4 sm:text-base sm:leading-7">
            From a single Polaroid to a full album,
            choose what feels right and customise it
            with your own photos.
          </p>
        </div>
      </section>

      <TornDivider color="cream" />

      {/* Interactive product catalogue */}
      <ProductsCatalogue />

      {/* Delivery information */}
      <section className="overflow-hidden border-y-2 border-ink bg-ink text-cream">
  {/* Mobile moving ticker */}
  <div className="delivery-marquee flex py-4 md:hidden">
    <div className="delivery-marquee-track flex w-max shrink-0 items-center">
      {deliveryInfo.map((item) => (
        <div
          key={`first-${item.text}`}
          className="flex shrink-0 items-center gap-2.5 px-5 text-xs font-semibold whitespace-nowrap"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-burgundy">
            {item.icon}
          </span>

          <span>{item.text}</span>
        </div>
      ))}
    </div>

    {/* Duplicate copy for a seamless loop */}
    <div
      aria-hidden="true"
      className="delivery-marquee-track flex w-max shrink-0 items-center"
    >
      {deliveryInfo.map((item) => (
        <div
          key={`duplicate-${item.text}`}
          className="flex shrink-0 items-center gap-2.5 px-5 text-xs font-semibold whitespace-nowrap"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-burgundy">
            {item.icon}
          </span>

          <span>{item.text}</span>
        </div>
      ))}
    </div>
  </div>

  {/* Desktop static version */}
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
    </main>
  );
};

export default ProductsPage;