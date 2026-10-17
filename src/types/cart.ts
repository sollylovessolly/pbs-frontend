import type { Area, Point } from "react-easy-crop";

export type CartProductType =
  "polaroid" | "photostrip" | "vintage-letter" | "phone-case" | "album";

export type CartItem = {
  id: string;
  packageId?: string;
  packageGroupId?: string;
  productType: CartProductType;
  variantSku?: string;
  availableQuantity?: number | null;
  customization?: Record<string, string>;
  name: string;
  unitPrice: number;
  quantity: number;

  previewUrl: string;
  sourceImageUrl?: string;

  crop?: Point;
  croppedAreaPixels?: Area | null;
  zoom?: number;
  rotation?: number;

  options?: Record<string, string>;

  turnaround: string;
  editHref: string;
  isFast: boolean;
};

export type NewCartItem = Omit<CartItem, "id">;
