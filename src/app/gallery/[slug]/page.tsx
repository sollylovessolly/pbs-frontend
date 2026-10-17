import AlbumGallery from "@/component/gallery/AlbumGallery";
export const metadata = { title: "Gallery album | PolaroidsBySolly" };
export default async function AlbumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <AlbumGallery key={slug} slug={slug} />;
}
