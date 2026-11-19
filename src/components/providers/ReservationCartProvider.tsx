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
  precioLista?: number | null;
  stockDisponible: number;
}

interface ReservationCartContextValue {
  items: ReservationItem[];
  totalItems: number;
  totalAmount: number;
  cuponCodigo: string | null;
  setCuponCodigo: (codigo: string | null) => void;
  addItem: (item: ReservationItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, cantidad: number) => void;
  clearCart: () => void;
}

const STORAGE_KEY = "fitandes-reservas";
const COUPON_STORAGE_KEY = "fitandes-cupon";

const ReservationCartContext = createContext<ReservationCartContextValue | null>(null);

function mergeItem(items: ReservationItem[], item: ReservationItem): ReservationItem[] {
  const existing = items.find((current) => current.id === item.id);
  if (!existing) return [...items, item];

  return items.map((current) =>
    current.id === item.id
      ? {
          ...current,
          precio: item.precio,
          precioLista: item.precioLista ?? current.precioLista ?? null,
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
  const [cuponCodigo, setCuponCodigoState] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const isAuthenticated = status === "authenticated" && session?.user?.role === "CLIENTE";
  const syncedRef = useRef(false);

  // 1. Carga inicial desde localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ReservationItem[];
        setItems(Array.isArray(parsed) ? parsed : []);
      }

      const rawCoupon = window.localStorage.getItem(COUPON_STORAGE_KEY);
      if (rawCoupon && rawCoupon.trim()) {
        setCuponCodigoState(rawCoupon.trim().toUpperCase());
      }
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

  useEffect(() => {
    if (!loaded) return;
    if (cuponCodigo && cuponCodigo.trim()) {
      window.localStorage.setItem(COUPON_STORAGE_KEY, cuponCodigo.trim().toUpperCase());
    } else {
      window.localStorage.removeItem(COUPON_STORAGE_KEY);
    }
  }, [cuponCodigo, loaded]);

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

        if (typeof serverCart?.cuponCodigo === "string" && serverCart.cuponCodigo.trim()) {
          setCuponCodigoState(serverCart.cuponCodigo.trim().toUpperCase());
        }

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

  const setCuponCodigo = (codigo: string | null) => {
    const normalized = codigo && codigo.trim() ? codigo.trim().toUpperCase() : null;
    setCuponCodigoState(normalized);
  };

  const value: ReservationCartContextValue = {
    items,
    totalItems: items.reduce((sum, item) => sum + item.cantidad, 0),
    totalAmount: items.reduce((sum, item) => sum + item.cantidad * item.precio, 0),
    cuponCodigo,
    setCuponCodigo,
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
      setCuponCodigoState(null);
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
