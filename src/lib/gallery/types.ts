export type GalleryPhoto = {
  id: string;
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  caption: string;
  alt: string;
  featured: boolean;
};
export type GalleryAlbum = {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: "DRAFT" | "PUBLISHED";
  version: number;
  permissionConfirmed: boolean;
  coverPhotoId: string | null;
  photos: GalleryPhoto[];
  updatedAt: string;
};
export type AlbumSummary = {
  id: string;
  slug: string;
  title: string;
  description: string;
  status?: "DRAFT" | "PUBLISHED";
  photoCount: number;
  cover: GalleryPhoto | null;
};
export type GalleryPage = {
  data: AlbumSummary[];
  pagination: {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
  };
};
export type FeaturedPhoto = GalleryPhoto & {
  albumSlug: string;
  albumTitle: string;
};
export const galleryImage = (url: string) =>
  /^https?:\/\//.test(url) || (url.startsWith("/") && !url.startsWith("//"))
    ? url
    : "";
