"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="bg-cream px-5 py-20 text-center text-ink">
      <h1 className="font-serif text-4xl">Something went wrong</h1>
      <p className="my-5">Please try loading this page again.</p>
      <button
        onClick={reset}
        className="rounded-full border-2 border-ink bg-burgundy px-6 py-3 font-bold text-cream"
      >
        Try again
      </button>
    </section>
  );
}
