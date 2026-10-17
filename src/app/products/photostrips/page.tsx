import ProductGallery from "@/component/gallery/ProductGallery";
import ProductProvider from "@/component/products/shared/ProductProvider";
import type { Metadata } from "next";
import Link from "next/link";

import PhotostripCustomizer from "@/component/products/photostrips/PhotostripCustomizer";
import TornDivider from "@/component/ui/TornDivider";

export const metadata: Metadata = {
  title: "Custom Photostrips | PolaroidsBySolly",
  description:
    "Choose your favourite photostrip designs, upload your photos and create custom print-ready photostrips.",
};

const PhotostripsPage = () => {
  return (
    <main className="min-h-screen bg-cream text-ink">
      <section className="border-b-2 border-ink bg-burgundy text-cream">
        <div className="mx-auto max-w-[1240px] px-5 py-10 md:px-7 md:py-14">
          <div className="mb-4 text-sm font-semibold text-cream/45">
            <Link href="/" className="transition hover:text-cream">
              Home
            </Link>

            <span className="mx-2">/</span>

            <Link href="/products" className="transition hover:text-cream">
              Products
            </Link>

            <span className="mx-2">/</span>

            <span>Photostrips</span>
          </div>

          <span className="inline-flex -rotate-3 rounded-full border-2 border-ink bg-beige px-4 py-1 font-serif text-lg font-bold italic text-ink shadow-[3px_3px_0_#2A211C]">
            tiny strips, big memories
          </span>

          <h1 className="mt-5 font-serif text-4xl font-semibold md:text-5xl">
            Custom Photostrips
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-cream/60">
            Choose one or more designs, add your favourite photos and customise
            each photostrip before sending it to print.
          </p>
        </div>
      </section>

      <TornDivider color="cream" />

      <ProductProvider category="PHOTOSTRIP">
        <PhotostripCustomizer />
      </ProductProvider>
      <ProductGallery category="photostrips" />
    </main>
  );
};

export default PhotostripsPage;
