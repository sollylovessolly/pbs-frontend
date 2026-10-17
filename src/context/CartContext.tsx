"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { CartItem, NewCartItem } from "@/types/cart";

import { restoreCart, cartPreview } from "@/lib/commerce/cart";

import { cartSubtotal, validatePackageItems } from "@/lib/commerce/packages";

const CART_STORAGE_KEY = "polaroidsbysolly-cart";

type CartContextValue = {
  items: CartItem[];
  draftItems: CartItem[];
  removeDraftStep: (draftId: string, productType: string) => void;
  cartCount: number;
  subtotal: number;
  isReady: boolean;

  addItems: (items: NewCartItem[]) => void;

  updateItem: (itemId: string, updates: Partial<Omit<CartItem, "id">>) => void;

  updateQuantity: (itemId: string, quantity: number) => void;

  removeItem: (itemId: string) => void;
  clearCart: () => void;
  bundleItems: (packageId: string, itemIds: string[]) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

type CartProviderProps = {
  children: ReactNode;
};

export const CartProvider = ({ children }: CartProviderProps) => {
  const [allItems, setItems] = useState<CartItem[]>([]);
  const items = useMemo(
    () => allItems.filter((i) => !i.packageDraftId),
    [allItems],
  );
  const draftItems = useMemo(
    () => allItems.filter((i) => !!i.packageDraftId),
    [allItems],
  );
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const savedCart = window.localStorage.getItem(CART_STORAGE_KEY);

      if (savedCart) {
        const parsedCart = restoreCart(JSON.parse(savedCart));

        if (Array.isArray(parsedCart)) {
          queueMicrotask(() => setItems(parsedCart));
        }
      }
    } catch (error) {
      console.error("Could not load cart:", error);
    } finally {
      queueMicrotask(() => setIsReady(true));
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;

    try {
      window.localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(
          allItems.map((item) => ({
            ...item,
            sourceImageUrl: undefined,
            previewUrl: cartPreview(item),
          })),
        ),
      );
    } catch (error) {
      console.error("Could not save cart:", error);
    }
  }, [allItems, isReady]);

  const addItems = (newItems: NewCartItem[]) => {
    for (const item of newItems) {
      const combined = [...allItems, ...newItems]
        .filter((i) => i.variantSku === item.variantSku)
        .reduce((sum, i) => sum + i.quantity, 0);
      if (
        !item.variantSku ||
        (item.availableQuantity != null && combined > item.availableQuantity)
      )
        throw new Error(
          "The requested quantity is unavailable. Please reduce your selection.",
        );
    }
    const cartItems: CartItem[] = newItems.map((item) => ({
      ...item,
      id: crypto.randomUUID(),
    }));

    setItems((currentItems) => [...currentItems, ...cartItems]);
  };

  const updateItem = (
    itemId: string,
    updates: Partial<Omit<CartItem, "id">>,
  ) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              ...updates,
            }
          : item,
      ),
    );
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    const target = allItems.find((i) => i.id === itemId);
    if (target?.packageGroupId || target?.packageDraftId) return;
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity: Number.isFinite(quantity)
                ? Math.max(
                    1,
                    Math.min(
                      Math.floor(quantity),
                      item.availableQuantity == null
                        ? Infinity
                        : Math.max(
                            1,
                            item.availableQuantity -
                              currentItems
                                .filter(
                                  (other) =>
                                    other.id !== itemId &&
                                    other.variantSku === item.variantSku,
                                )
                                .reduce(
                                  (sum, other) => sum + other.quantity,
                                  0,
                                ),
                          ),
                    ),
                  )
                : item.quantity,
            }
          : item,
      ),
    );
  };

  const removeItem = (itemId: string) => {
    setItems((currentItems) =>
      currentItems.filter((item) => {
        const group = currentItems.find((i) => i.id === itemId)?.packageGroupId;
        return group ? item.packageGroupId !== group : item.id !== itemId;
      }),
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const cartCount = useMemo(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  const subtotal = useMemo(() => {
    return cartSubtotal(items);
  }, [items]);

  const bundleItems = (packageId: string, itemIds: string[]) => {
    const selected = allItems.filter((i) => itemIds.includes(i.id));
    validatePackageItems(packageId, selected);
    const packageGroupId = crypto.randomUUID();
    setItems((current) =>
      current.map((i) =>
        itemIds.includes(i.id)
          ? {
              ...i,
              packageId,
              packageGroupId,
              packageDraftId: undefined,
              packageDraftTemplateId: undefined,
            }
          : i,
      ),
    );
  };

  const removeDraftStep = (draftId: string, productType: string) =>
    setItems((current) =>
      current.filter(
        (i) => !(i.packageDraftId === draftId && i.productType === productType),
      ),
    );

  const value: CartContextValue = {
    draftItems,
    removeDraftStep,
    bundleItems,
    items,
    cartCount,
    subtotal,
    isReady,
    addItems,
    updateItem,
    updateQuantity,
    removeItem,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
};
