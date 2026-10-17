import ProductGallery from "@/component/gallery/ProductGallery";
import ProductProvider from "@/component/products/shared/ProductProvider";
import type { Metadata } from "next";
import Link from "next/link";

import PhoneCaseCustomizer from "@/component/products/phone-cases/PhoneCaseCustomizer";
import TornDivider from "@/component/ui/TornDivider";

export const metadata: Metadata = {
  title: "Polaroid Phone Cases | PolaroidsBySolly",
  description:
    "Create a personalised clear iPhone case with your own custom Polaroid insert.",
};

type PhoneCasesPageProps = {
  searchParams: Promise<{
    edit?: string | string[];
  }>;
};

const PhoneCasesPage = async ({ searchParams }: PhoneCasesPageProps) => {
  const params = await searchParams;

  const editItemId = Array.isArray(params.edit) ? params.edit[0] : params.edit;

  const isEditing = Boolean(editItemId);

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
            <span>Phone Cases</span>
          </div>

          <span className="inline-flex -rotate-3 rounded-full border-2 border-ink bg-beige px-4 py-1 font-serif text-lg font-bold italic text-ink shadow-[3px_3px_0_#2A211C]">
            carry your memories
          </span>

          <h1 className="mt-5 font-serif text-4xl font-semibold md:text-5xl">
            {isEditing ? "Edit Phone Case" : "Polaroid Phone Cases"}
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-cream/60">
            Choose your iPhone model, upload a favourite photo and preview your
            custom Polaroid inside the case.
          </p>
        </div>
      </section>

      <TornDivider color="cream" />

      <ProductProvider category="PHONE_CASE">
        <PhoneCaseCustomizer editItemId={editItemId ?? null} />
      </ProductProvider>
      <ProductGallery category="phone-cases" />
    </main>
  );
};

export default PhoneCasesPage;
