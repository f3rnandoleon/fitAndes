"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useReservationCart } from "@/components/providers/ReservationCartProvider";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/Button";

interface Props {
  authenticated?: boolean;
  fullname?: string | null;
  email?: string | null;
}

const NAV_LINKS = [
  { label: "Inicio", href: "/" },
  { label: "Catalogo", href: "/catalogo" },
  { label: "Seleccion", href: "/#seleccion" },
  { label: "Nuevo", href: "/#nuevo" },
];

export default function SiteHeader({ authenticated = false, fullname, email }: Props) {
  const pathname = usePathname();
  const { items, totalAmount, totalItems, removeItem, updateQuantity } = useReservationCart();
  const [userOpen, setUserOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const userRef = useRef<HTMLDivElement | null>(null);
  const cartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as Node;
      if (userRef.current && !userRef.current.contains(target)) setUserOpen(false);
      if (cartRef.current && !cartRef.current.contains(target)) setCartOpen(false);
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    setUserOpen(false);
    setCartOpen(false);
  }, [pathname]);

  if (pathname === "/login" || pathname === "/registro") return null;

  const firstName = fullname?.split(" ")[0] ?? "Usuario";

  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{
        borderColor: "#ece6dc",
        background: "rgba(251,249,245,0.96)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        <div className="grid min-h-[78px] grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 sm:min-h-[82px] md:grid-cols-[1fr_auto_1fr] md:gap-4">
          <div className="flex items-center">
            <nav className="hidden md:flex items-center gap-6 text-[11px] uppercase" style={{ letterSpacing: "0.18em", color: "#5f564e" }}>
              {NAV_LINKS.map((item) => (
                <Link key={item.label} href={item.href} className="transition-opacity hover:opacity-55">
                  {item.label}
                </Link>
              ))}
            </nav>

            <Link
              href="/catalogo"
              className="inline-flex items-center rounded-full border px-3 py-2 text-[10px] uppercase md:hidden"
              style={{ letterSpacing: "0.16em", borderColor: "#ddd5cb", color: "#5f564e", background: "rgba(255,255,255,0.78)" }}
            >
              Ver catalogo
            </Link>
          </div>

          <div className="flex justify-center md:justify-self-center">
            <Link
              href="/"
              className="text-lg uppercase font-bold sm:text-xl md:text-2xl"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif", letterSpacing: "0.24em", color: "#111111" }}
            >
              FitAndes
            </Link>
          </div>

          <div className="flex items-center justify-end gap-2 sm:gap-3">
            <div className="relative" ref={cartRef}>
              <button
                type="button"
                onClick={() => setCartOpen((current) => !current)}
                className="relative flex h-10 w-10 items-center justify-center rounded-full border transition-colors hover:bg-white sm:h-11 sm:w-11"
                style={{ borderColor: "#ddd5cb", color: "#111111" }}
                aria-label="Ver reservas"
              >
                <CartIcon />
                {totalItems > 0 && (
                  <span className="absolute -right-1 -top-1 min-w-5 h-5 px-1 rounded-full text-[10px] flex items-center justify-center bg-[#111111] text-white">
                    {totalItems}
                  </span>
                )}
              </button>

              {cartOpen && (
                <div className="absolute right-0 mt-3 w-[min(100vw-1rem,360px)] border bg-white shadow-[0_24px_50px_rgba(17,17,17,0.08)]" style={{ borderColor: "#ece6dc" }}>
                  <div className="px-4 py-4 border-b sm:px-5" style={{ borderColor: "#ece6dc" }}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs uppercase" style={{ letterSpacing: "0.16em", color: "#8f8478" }}>
                        Reservas
                      </p>
                      {items.length > 0 ? (
                        <span className="text-[11px]" style={{ color: "#5f564e" }}>
                          {formatPrice(totalAmount)}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {items.length === 0 ? (
                    <div className="px-4 py-8 sm:px-5">
                      <p className="text-sm" style={{ color: "#5f564e" }}>
                        Aun no agregaste productos a tu reserva.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="max-h-[60vh] overflow-y-auto">
                        {items.map((item) => (
                          <div key={item.id} className="px-4 py-4 border-b sm:px-5" style={{ borderColor: "#f1ebe3" }}>
                            <div className="flex gap-3">
                              <div className="relative h-20 w-16 shrink-0 overflow-hidden border" style={{ borderColor: "#ece6dc", background: "#f6f1ea" }}>
                                {item.imagen ? <Image src={item.imagen} alt={item.nombre} fill unoptimized sizes="64px" className="object-cover" /> : null}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm uppercase leading-snug" style={{ color: "#111111" }}>
                                  {item.nombre}
                                </p>
                                <p className="text-[11px] uppercase mt-1" style={{ letterSpacing: "0.08em", color: "#8f8478" }}>
                                  {item.color} / {item.talla}
                                </p>
                                <div className="mt-3 flex items-center justify-between gap-3">
                                  <p className="text-sm" style={{ color: "#111111" }}>
                                    {formatPrice(item.precio)}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => removeItem(item.id)}
                                    className="text-[11px] uppercase transition-opacity hover:opacity-60"
                                    style={{ letterSpacing: "0.12em", color: "#8f8478" }}
                                  >
                                    Quitar
                                  </button>
                                </div>
                                <div className="mt-3 flex items-center justify-between gap-3">
                                  <div className="flex items-center border" style={{ borderColor: "#ddd5cb" }}>
                                    <button
                                      type="button"
                                      onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                                      className="px-3 py-1 text-sm"
                                    >
                                      -
                                    </button>
                                    <span className="px-3 py-1 text-sm">{item.cantidad}</span>
                                    <button
                                      type="button"
                                      onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                                      className="px-3 py-1 text-sm"
                                    >
                                      +
                                    </button>
                                  </div>
                                  <span className="text-[11px]" style={{ color: "#8f8478" }}>
                                    {formatPrice(item.precio * item.cantidad)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="px-4 py-4 bg-surface/30 sm:px-5">
                        <div className="flex items-center justify-between text-sm mb-4">
                          <span className="text-muted">Total reservado</span>
                          <strong className="text-foreground font-medium">{formatPrice(totalAmount)}</strong>
                        </div>
                        <div className="grid gap-3">
                          <Link href="/checkout" className="w-full">
                            <Button variant="primary" size="md" className="w-full">
                              Finalizar compra
                            </Button>
                          </Link>
                          {authenticated ? (
                            <Link href="/pedidos" className="w-full">
                              <Button variant="secondary" size="md" className="w-full bg-white">
                                Ver pedidos
                              </Button>
                            </Link>
                          ) : (
                            <Link href="/login?callbackUrl=%2Fcheckout" className="w-full">
                              <Button variant="secondary" size="md" className="w-full bg-white">
                                Iniciar sesion
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="relative" ref={userRef}>
              <button
                type="button"
                onClick={() => setUserOpen((current) => !current)}
                className="flex h-10 w-10 items-center justify-center rounded-full border transition-colors hover:bg-white sm:h-11 sm:w-11"
                style={{ borderColor: "#ddd5cb", color: "#111111" }}
                aria-label="Abrir menu de usuario"
              >
                <UserIcon />
              </button>

              {userOpen && (
                <div className="absolute right-0 mt-3 w-[min(100vw-1rem,280px)] border bg-white shadow-[0_24px_50px_rgba(17,17,17,0.08)]" style={{ borderColor: "#ece6dc" }}>
                  <div className="px-5 py-4 border-b" style={{ borderColor: "#ece6dc" }}>
                    <p className="text-sm" style={{ color: "#111111" }}>
                      {authenticated ? firstName : "Mi cuenta"}
                    </p>
                    <p className="text-[11px] mt-1 uppercase" style={{ letterSpacing: "0.12em", color: "#8f8478" }}>
                      {authenticated ? email ?? "Cliente FitAndes" : "Accede o crea tu cuenta"}
                    </p>
                  </div>

                  <div className="py-2">
                    {authenticated ? (
                      <>
                        <HeaderLink href="/dashboard#perfil" label="Ver perfil" />
                        <HeaderLink href="/dashboard" label="Panel" />
                        <HeaderLink href="/pedidos" label="Pedidos" />
                        <button
                          type="button"
                          onClick={() => signOut({ callbackUrl: "/" })}
                          className="w-full text-left px-5 py-3 text-xs uppercase transition-colors hover:bg-[#f8f4ee]"
                          style={{ letterSpacing: "0.14em", color: "#5f564e" }}
                        >
                          Salir
                        </button>
                      </>
                    ) : (
                      <>
                        <HeaderLink href="/login" label="Iniciar sesion" />
                        <HeaderLink href="/registro" label="Registrar" />
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <nav className="md:hidden flex items-center gap-2 overflow-x-auto pb-4" aria-label="Accesos rapidos">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="whitespace-nowrap rounded-full border px-3 py-2 text-[10px] uppercase transition-colors hover:bg-white"
              style={{ letterSpacing: "0.14em", color: "#5f564e", borderColor: "#ddd5cb", background: "rgba(255,255,255,0.62)" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

function HeaderLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block px-5 py-3 text-xs uppercase transition-colors hover:bg-[#f8f4ee]"
      style={{ letterSpacing: "0.14em", color: "#5f564e" }}
    >
      {label}
    </Link>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M3 4h2l2.2 10.2a1 1 0 0 0 1 .8H18a1 1 0 0 0 1-.8L21 7H7" />
    </svg>
  );
}
