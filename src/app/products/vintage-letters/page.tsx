import type { Metadata } from "next";
import Link from "next/link";

import VintageLetterCustomizer from "@/component/products/vintage-letters/VintageLetterCustomizer";
import TornDivider from "@/component/ui/TornDivider";

export const metadata: Metadata = {
  title: "Vintage Letters | PolaroidsBySolly",
  description:
    "Create a personalised front-and-back vintage letter with your message, chosen design and optional hand-burnt edges.",
};

const VintageLettersPage = () => {
  return (
    <main className="min-h-screen bg-cream text-ink">
      <section className="border-b-2 border-ink bg-burgundy text-cream">
        <div className="mx-auto max-w-[1240px] px-5 py-10 md:px-7 md:py-14">
          <div className="mb-4 text-sm font-semibold text-cream/45">
            <Link
              href="/"
              className="transition hover:text-cream"
            >
              Home
            </Link>

            <span className="mx-2">/</span>

            <Link
              href="/products"
              className="transition hover:text-cream"
            >
              Products
            </Link>

            <span className="mx-2">/</span>

            <span>Vintage Letters</span>
          </div>

          <span className="inline-flex -rotate-3 rounded-full border-2 border-ink bg-beige px-4 py-1 font-serif text-lg font-bold italic text-ink shadow-[3px_3px_0_#2A211C]">
            words worth keeping
          </span>

          <h1 className="mt-5 font-serif text-4xl font-semibold md:text-5xl">
            Vintage Letters
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-cream/60">
            Choose a vintage design, write your message and preview your
            personalised front-and-back letter before we print it.
          </p>
        </div>
      </section>

      <TornDivider color="cream" />

      <VintageLetterCustomizer />
    </main>
  );
};

export default VintageLettersPage;