import Link from "next/link";
export default function NotFound() {
  return (
    <section className="bg-cream px-5 py-20 text-center text-ink">
      <h1 className="font-serif text-4xl">This page has wandered off</h1>
      <p className="my-5">Find your next keepsake in the shop.</p>
      <Link href="/products" className="font-bold underline">
        Browse products
      </Link>
    </section>
  );
}
