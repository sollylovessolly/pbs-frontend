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
  NewOrder,
  Order,
} from "@/types/order";

const ORDER_STORAGE_KEY =
  "polaroidsbysolly-orders";

type OrderContextValue = {
  orders: Order[];
  isReady: boolean;

  addOrder: (order: NewOrder) => Order;

  getOrderByNumber: (
    orderNumber: string,
  ) => Order | undefined;

  getOrdersByPhone: (
    phone: string,
  ) => Order[];

  updateOrder: (
    orderNumber: string,
    updates: Partial<Omit<Order, "id" | "orderNumber">>,
  ) => void;
};

const OrderContext =
  createContext<OrderContextValue | null>(null);

type OrderProviderProps = {
  children: ReactNode;
};

const normalizePhone = (phone: string) => {
  let digits = phone.replace(/\D/g, "");

  if (digits.startsWith("00234")) {
    digits = digits.slice(2);
  }

  if (digits.startsWith("234")) {
    return `0${digits.slice(3)}`;
  }

  if (digits.length === 10 && !digits.startsWith("0")) {
    return `0${digits}`;
  }

  return digits;
};

export const OrderProvider = ({
  children,
}: OrderProviderProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const savedOrders =
        window.localStorage.getItem(
          ORDER_STORAGE_KEY,
        );

      if (savedOrders) {
        const parsedOrders = JSON.parse(
          savedOrders,
        ) as Order[];

        if (Array.isArray(parsedOrders)) {
          setOrders(parsedOrders);
        }
      }
    } catch (error) {
      console.error(
        "Could not load saved orders:",
        error,
      );
    } finally {
      setIsReady(true);
    }
  }, []);

  const saveOrders = (nextOrders: Order[]) => {
    setOrders(nextOrders);

    try {
      window.localStorage.setItem(
        ORDER_STORAGE_KEY,
        JSON.stringify(nextOrders),
      );
    } catch (error) {
      console.error(
        "Could not save orders:",
        error,
      );
    }
  };

  const addOrder = (newOrder: NewOrder) => {
    const order: Order = {
      ...newOrder,
      id: crypto.randomUUID(),
    };

    saveOrders([order, ...orders]);

    return order;
  };

  const updateOrder = (
    orderNumber: string,
    updates: Partial<
      Omit<Order, "id" | "orderNumber">
    >,
  ) => {
    const nextOrders = orders.map((order) =>
      order.orderNumber === orderNumber
        ? {
            ...order,
            ...updates,
          }
        : order,
    );

    saveOrders(nextOrders);
  };

  const getOrderByNumber = (
    orderNumber: string,
  ) => {
    const normalizedOrderNumber =
      orderNumber.trim().toUpperCase();

    return orders.find(
      (order) =>
        order.orderNumber.toUpperCase() ===
        normalizedOrderNumber,
    );
  };

  const getOrdersByPhone = (phone: string) => {
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedPhone) return [];

    return orders.filter(
      (order) =>
        normalizePhone(order.customer.phone) ===
        normalizedPhone,
    );
  };

  const value = useMemo<OrderContextValue>(
    () => ({
      orders,
      isReady,
      addOrder,
      getOrderByNumber,
      getOrdersByPhone,
      updateOrder,
    }),
    [orders, isReady],
  );

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);

  if (!context) {
    throw new Error(
      "useOrders must be used inside OrderProvider",
    );
  }

  return context;
};