"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  CartItem,
  NewCartItem,
} from "@/types/cart";

const CART_STORAGE_KEY = "polaroidsbysolly-cart";

type CartContextValue = {
  items: CartItem[];
  cartCount: number;
  subtotal: number;
  isReady: boolean;

  addItems: (items: NewCartItem[]) => void;

  updateItem: (
    itemId: string,
    updates: Partial<Omit<CartItem, "id">>,
  ) => void;

  updateQuantity: (
    itemId: string,
    quantity: number,
  ) => void;

  removeItem: (itemId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(
  null,
);

type CartProviderProps = {
  children: ReactNode;
};

export const CartProvider = ({
  children,
}: CartProviderProps) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const savedCart = window.localStorage.getItem(
        CART_STORAGE_KEY,
      );

      if (savedCart) {
        const parsedCart = JSON.parse(
          savedCart,
        ) as CartItem[];

        if (Array.isArray(parsedCart)) {
          setItems(parsedCart);
        }
      }
    } catch (error) {
      console.error("Could not load cart:", error);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;

    try {
      window.localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(items),
      );
    } catch (error) {
      console.error("Could not save cart:", error);
    }
  }, [items, isReady]);

  const addItems = (newItems: NewCartItem[]) => {
    const cartItems: CartItem[] = newItems.map(
      (item) => ({
        ...item,
        id: crypto.randomUUID(),
      }),
    );

    setItems((currentItems) => [
      ...currentItems,
      ...cartItems,
    ]);
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

  const updateQuantity = (
    itemId: string,
    quantity: number,
  ) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity: Math.max(1, quantity),
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
    return items.reduce(
      (total, item) => total + item.quantity,
      0,
    );
  }, [items]);

  const subtotal = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total + item.unitPrice * item.quantity,
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

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider",
    );
  }

  return context;
};