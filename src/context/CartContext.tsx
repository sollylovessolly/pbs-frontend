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

const CART_STORAGE_KEY = "polaroidsbysolly-cart";

type CartContextValue = {
  items: CartItem[];
  cartCount: number;
  subtotal: number;
  isReady: boolean;

  addItems: (items: NewCartItem[]) => void;

  updateItem: (itemId: string, updates: Partial<Omit<CartItem, "id">>) => void;

  updateQuantity: (itemId: string, quantity: number) => void;

  removeItem: (itemId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

type CartProviderProps = {
  children: ReactNode;
};

export const CartProvider = ({ children }: CartProviderProps) => {
  const [items, setItems] = useState<CartItem[]>([]);
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
          items.map((item) => ({
            ...item,
            sourceImageUrl: undefined,
            previewUrl: cartPreview(item),
          })),
        ),
      );
    } catch (error) {
      console.error("Could not save cart:", error);
    }
  }, [items, isReady]);

  const addItems = (newItems: NewCartItem[]) => {
    for (const item of newItems) {
      const combined = [...items, ...newItems]
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
      currentItems.filter((item) => item.id !== itemId),
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const cartCount = useMemo(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  const subtotal = useMemo(() => {
    return items.reduce(
      (total, item) => total + item.unitPrice * item.quantity,
      0,
    );
  }, [items]);

  const value: CartContextValue = {
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
