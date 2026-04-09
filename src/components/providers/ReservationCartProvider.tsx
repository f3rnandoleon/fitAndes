"use client";

import { createContext, useContext, useEffect, useState } from "react";

export interface ReservationItem {
  id: string;
  productoId?: string;
  variantId?: string | null;
  nombre: string;
  modelo?: string;
  imagen?: string | null;
  color: string;
  talla: string;
  cantidad: number;
  precio: number;
  stockDisponible: number;
}

interface ReservationCartContextValue {
  items: ReservationItem[];
  totalItems: number;
  totalAmount: number;
  addItem: (item: ReservationItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, cantidad: number) => void;
  clearCart: () => void;
}

const STORAGE_KEY = "fitandes-reservas";

const ReservationCartContext = createContext<ReservationCartContextValue | null>(null);

function mergeItem(items: ReservationItem[], item: ReservationItem): ReservationItem[] {
  const existing = items.find((current) => current.id === item.id);
  if (!existing) return [...items, item];

  return items.map((current) =>
    current.id === item.id
      ? {
          ...current,
          cantidad: Math.min(current.cantidad + item.cantidad, current.stockDisponible),
        }
      : current,
  );
}

export function ReservationCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ReservationItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setLoaded(true);
        return;
      }

      const parsed = JSON.parse(raw) as ReservationItem[];
      setItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      setItems([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  const value: ReservationCartContextValue = {
    items,
    totalItems: items.reduce((sum, item) => sum + item.cantidad, 0),
    totalAmount: items.reduce((sum, item) => sum + item.cantidad * item.precio, 0),
    addItem: (item) => setItems((current) => mergeItem(current, item)),
    removeItem: (id) => setItems((current) => current.filter((item) => item.id !== id)),
    updateQuantity: (id, cantidad) =>
      setItems((current) =>
        current
          .map((item) =>
            item.id === id
              ? {
                  ...item,
                  cantidad: Math.max(1, Math.min(cantidad, item.stockDisponible)),
                }
              : item,
          )
          .filter((item) => item.cantidad > 0),
      ),
    clearCart: () => setItems([]),
  };

  return <ReservationCartContext.Provider value={value}>{children}</ReservationCartContext.Provider>;
}

export function useReservationCart() {
  const context = useContext(ReservationCartContext);

  if (!context) {
    throw new Error("useReservationCart must be used within ReservationCartProvider");
  }

  return context;
}
