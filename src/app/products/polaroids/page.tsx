import ProductProvider from "@/component/products/shared/ProductProvider";
import Link from "next/link";

import PolaroidCustomizer from "@/component/products/polaroids/PolaroidCustomizer";
import TornDivider from "@/component/ui/TornDivider";

export const metadata = {
  title: "Polaroid Prints | PolaroidsBySolly",
  description:
    "Upload, crop and customise your photos as Polaroid-style prints.",
};

type PolaroidsPageProps = {
  searchParams: Promise<{
    edit?: string | string[];
  }>;
};

const PolaroidsPage = async ({ searchParams }: PolaroidsPageProps) => {
  const params = await searchParams;

  const editItemId = Array.isArray(params.edit) ? params.edit[0] : params.edit;

  return (
    <main className="min-h-screen bg-cream text-ink">
      <section className="border-b-2 border-ink bg-burgundy text-cream pb-15">
        <div className="mx-auto max-w-[1240px] px-5 py-10 md:px-7">
          <div className="mb-4 text-sm font-semibold text-cream/40">
            <Link
              href="/"
              className="hover:text-burgundy-deep transition-colors"
            >
              Home
            </Link>

            <span className="mx-2">/</span>

            <Link href="/products" className="hover:text-burgundy-deep">
              Products
            </Link>

            <span className="mx-2">/</span>
            <span>Polaroid Prints</span>
          </div>

          <h1 className="font-serif text-4xl font-semibold md:text-5xl">
            {editItemId ? "Edit Polaroid Print" : "Polaroid Prints"}
          </h1>

          <p className="mt-3 max-w-xl leading-7 text-cream/60">
            {editItemId
              ? "Adjust the crop, rotation, zoom or quantity for this print."
              : "Upload your favourite photos, adjust the crop and preview each print before adding it to your cart."}
          </p>

          <div className="mt-5 flex flex-wrap gap-5 text-sm font-semibold">
            <span className="font-serif text-xl text-cream">
              Choose your print option below
            </span>

            <span className="text-ink/90">📦 Ready in 24hrs</span>
            <span className="text-ink/90">🔒 Prepared after payment</span>
          </div>
        </div>
      </section>
      <TornDivider color="cream" />

      <ProductProvider category="POLAROID">
        <PolaroidCustomizer editItemId={editItemId ?? null} />
      </ProductProvider>
    </main>
  );
};

export default PolaroidsPage;
