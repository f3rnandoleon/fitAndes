"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";

export interface ReservationItem {
  id: string;
  productoId?: string;
  variantId?: string | null;
  cartItemId?: string;
  nombre: string;
  modelo?: string;
  imagen?: string | null;
  color: string;
  colorSecundario?: string | null;
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
          precio: item.precio,
          stockDisponible: item.stockDisponible,
          cartItemId: item.cartItemId || current.cartItemId,
          cantidad: Math.min(current.cantidad + item.cantidad, item.stockDisponible),
        }
      : current,
  );
}

export function ReservationCartProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<ReservationItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const isAuthenticated = status === "authenticated" && session?.user?.role === "CLIENTE";
  const syncedRef = useRef(false);

  // 1. Carga inicial desde localStorage
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

  // 2. Persistencia en localStorage
  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  // 3. Sincronización bidireccional con backend al iniciar sesión
  useEffect(() => {
    if (!loaded || !isAuthenticated || syncedRef.current) return;
    syncedRef.current = true;

    async function syncWithServer() {
      try {
        const res = await fetch("/api/cart", { cache: "no-store" });
        if (!res.ok) return;

        const serverCart = await res.json();
        const serverItems = Array.isArray(serverCart?.items) ? (serverCart.items as ReservationItem[]) : [];

        // Fusión inteligente: Si hay ítems locales que no están en el servidor, agregarlos
        const localItems = [...items];
        for (const localItem of localItems) {
          const existsOnServer = serverItems.some((s) => s.id === localItem.id);
          if (!existsOnServer && localItem.productoId) {
            void fetch("/api/cart/items", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(localItem),
            });
            serverItems.push(localItem);
          }
        }

        if (serverItems.length > 0) {
          setItems(serverItems);
        }
      } catch {
        // En caso de falla de red, mantiene el carrito local sin interrumpir al usuario
      }
    }

    void syncWithServer();
  }, [loaded, isAuthenticated, items]);

  const value: ReservationCartContextValue = {
    items,
    totalItems: items.reduce((sum, item) => sum + item.cantidad, 0),
    totalAmount: items.reduce((sum, item) => sum + item.cantidad * item.precio, 0),
    addItem: (item) => {
      setItems((current) => mergeItem(current, item));

      if (isAuthenticated) {
        void fetch("/api/cart/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
      }
    },
    removeItem: (id) => {
      const itemToRemove = items.find((item) => item.id === id);
      setItems((current) => current.filter((item) => item.id !== id));

      if (isAuthenticated && itemToRemove?.cartItemId) {
        void fetch(`/api/cart/items/${itemToRemove.cartItemId}`, {
          method: "DELETE",
        });
      }
    },
    updateQuantity: (id, cantidad) => {
      const itemToUpdate = items.find((item) => item.id === id);
      const newQuantity = Math.max(1, Math.min(cantidad, itemToUpdate?.stockDisponible ?? 99));

      setItems((current) =>
        current
          .map((item) =>
            item.id === id
              ? {
                  ...item,
                  cantidad: newQuantity,
                }
              : item,
          )
          .filter((item) => item.cantidad > 0),
      );

      if (isAuthenticated && itemToUpdate?.cartItemId) {
        void fetch(`/api/cart/items/${itemToUpdate.cartItemId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cantidad: newQuantity }),
        });
      }
    },
    clearCart: () => {
      setItems([]);
      if (isAuthenticated) {
        void fetch("/api/cart", { method: "DELETE" });
      }
    },
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
