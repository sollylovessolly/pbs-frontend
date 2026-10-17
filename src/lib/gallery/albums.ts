import data from "@/data/gallery.generated.json";
import type { GalleryAlbum, GalleryPhoto } from "./types";
export type LocalPhoto = GalleryPhoto & { category: string | null };
export type LocalAlbum = Omit<GalleryAlbum, "photos"> & {
  photos: LocalPhoto[];
  cover: LocalPhoto | null;
  photoCount: number;
};
export const galleryAlbums = data as LocalAlbum[];
export const showcasePhotos = (category: string) =>
  galleryAlbums
    .find((a) => a.slug === "product-showcase")
    ?.photos.filter((p) => p.category === category) ?? [];
