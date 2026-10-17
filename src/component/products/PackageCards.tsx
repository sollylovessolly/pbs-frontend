import PackagePhoto from "./PackagePhoto";
import Link from "next/link";
import { giftPackages, packageContents } from "@/lib/commerce/packages";
import { money } from "@/lib/commerce/catalogue";
export default function PackageCards() {
  return (
    <section
      id="packages"
      className="mx-auto max-w-site scroll-mt-24 px-5 py-14"
    >
      <p className="font-handwritten text-xl text-burgundy">
        a little more love, all together
      </p>
      <h2 className="mt-2 font-serif text-4xl">Gift packages</h2>
      <p className="mt-4 max-w-2xl leading-7">
        For anniversaries, birthdays and your favourite person. Personalise
        every keepsake; premium protective packaging is included.
      </p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {giftPackages.map((p) => (
          <article
            key={p.id}
            className="flex flex-col rounded-2xl border-2 border-ink bg-paper p-6 shadow-soft"
          >
            <Link
              href={`/products/packages/${p.id}`}
              aria-label={`View ${p.name} package`}
              className="relative mb-5 block aspect-[4/3] overflow-hidden rounded-xl border-2 border-ink"
            >
              <PackagePhoto id={p.id} />
            </Link>
            <p className="text-sm font-bold text-burgundy">{p.occasion}</p>
            <h3 className="mt-2 font-serif text-2xl">{p.name}</h3>
            <ul className="my-5 flex-1 list-disc space-y-2 pl-5 text-sm">
              {packageContents(p).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p>
              <strong>{money(p.price)}</strong>{" "}
              <del className="ml-2 text-sm text-ink/60">
                {money(p.compareAt)}
              </del>
            </p>
            <Link
              href={`/products/packages/${p.id}`}
              className="mt-5 rounded-full border-2 border-ink bg-burgundy px-4 py-3 text-center font-bold text-cream"
            >
              Personalise package →
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
