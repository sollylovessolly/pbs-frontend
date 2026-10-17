import Link from "next/link";
import { policies } from "./policies";

export default function PolicyPage({
  policy,
}: {
  policy: keyof typeof policies;
}) {
  const content = policies[policy];
  return (
    <main className="bg-cream px-4 py-10 text-ink sm:px-6 sm:py-16">
      <article className="mx-auto max-w-3xl rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_#2A211C] sm:p-10">
        <Link
          href="/"
          className="text-sm font-semibold text-burgundy underline"
        >
          ← Back to the shop
        </Link>
        <h1 className="mt-6 font-serif text-4xl sm:text-5xl">
          {content.title}
        </h1>
        <p className="mt-3 text-sm text-ink/65">
          Last updated: 21 September 2026
        </p>
        {content.intro.length > 0 && (
          <div className="mt-7 space-y-4 rounded-xl border border-burgundy/20 bg-blush/30 p-5 leading-7">
            {content.intro.map((text) => (
              <p key={text}>{text}</p>
            ))}
          </div>
        )}
        <div className="mt-8 space-y-8">
          {content.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-serif text-2xl">{section.heading}</h2>
              <div className="mt-3 space-y-4 leading-7">
                {section.paragraphs.map((text) => (
                  <p key={text}>{text}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 border-t border-ink/20 pt-5 text-sm font-semibold text-burgundy">
          <a href="https://wa.me/2347088694074" className="underline">
            Contact us on WhatsApp
          </a>
          <a
            href="mailto:polaroidsbysolly@gmail.com"
            className="break-all underline"
          >
            polaroidsbysolly@gmail.com
          </a>
          <Link
            href={policy === "privacy" ? "/terms" : "/privacy"}
            className="underline"
          >
            {policy === "privacy" ? "Terms of order" : "Privacy policy"}
          </Link>
        </div>
      </article>
    </main>
  );
}
