export type Review = {
  id: string;
  displayName: string;
  rating: number;
  text: string;
  createdAt: string;
  photos: Array<{ id: string; url: string; thumbnailUrl: string }>;
  verifiedPurchase: boolean;
};
export type ReviewPage = {
  data: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
export type AdminReview = Review & {
  status: "PENDING" | "PUBLISHED" | "REJECTED";
  version: number;
  phone: string;
  orderNumber: string | null;
  publicationConsent: boolean;
  moderationReason: string | null;
};
