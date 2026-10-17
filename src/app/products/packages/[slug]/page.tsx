import { notFound } from "next/navigation";
import { getPackage, giftPackages } from "@/lib/commerce/packages";
import PackageBuilder from "@/component/products/PackageBuilder";
export function generateStaticParams() {
  return giftPackages.map((p) => ({ slug: p.id }));
}
export default async function PackagePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!getPackage(slug)) notFound();
  return <PackageBuilder id={slug} />;
}
