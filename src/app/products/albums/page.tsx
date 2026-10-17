import ProductGallery from "@/component/gallery/ProductGallery";
import ProductProvider from "@/component/products/shared/ProductProvider";
import type { Metadata } from "next";

import AlbumProductPage from "@/component/albums/AlbumProductPage";

export const metadata: Metadata = {
  title: "Memory Photo Album | PolaroidsBySolly",
  description:
    "A 15-page keepsake album with 30 pockets for storing up to 30 Polaroid prints.",
};

const AlbumsPage = () => {
  return (
    <ProductProvider category="ALBUM">
      <AlbumProductPage />
      <ProductGallery category="albums" />
    </ProductProvider>
  );
};

export default AlbumsPage;
