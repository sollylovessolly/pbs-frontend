import Link from "next/link";
export const metadata = { title: "Delivery | PolaroidsBySolly" };
export default function DeliveryPage() {
  return (
    <main className="bg-cream px-5 py-14 text-ink">
      <section className="mx-auto max-w-2xl rounded-2xl border-2 border-ink bg-paper p-6 sm:p-10">
        <h1 className="font-serif text-4xl">Delivery information</h1>
        <p className="mt-5 leading-7">
          Your keepsakes are prepared after payment. Check each product for its
          preparation time; delivery starts once your order is ready.
        </p>
        <p className="mt-4 leading-7">
          Choose your state at checkout to see available delivery options and
          fees. Arrival time depends on your location.
        </p>
        <p className="mt-4 leading-7">
          If your state is not listed,{" "}
          <a className="underline" href="https://wa.me/2347088694074">
            contact us on WhatsApp
          </a>{" "}
          for help before ordering.
        </p>
        <Link
          href="/track-order"
          className="mt-6 inline-block font-bold text-burgundy underline"
        >
          Track your order
        </Link>
      </section>
    </main>
  );
}
