"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useReservationCart } from "@/components/providers/ReservationCartProvider";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import logo from "../../../public/fitAndes.png";

interface Props {
  authenticated?: boolean;
  fullname?: string | null;
  firstName?: string | null;
  email?: string | null;
}

const NAV_LINKS = [
  { label: "Inicio", href: "/" },
  { label: "Catálogo", href: "/catalogo" },
  { label: "Selección", href: "/#seleccion" },
  { label: "Nuevo", href: "/#nuevo" },
];

export default function SiteHeader({ authenticated = false, fullname, firstName: firstNameProp, email }: Props) {
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

  const firstName = firstNameProp || fullname?.split(" ")[0] || "Usuario";

  return (
    <header
      className="sticky top-0 z-40 border-b border-border bg-white/80 backdrop-blur-md"
    >
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        <div className="grid min-h-[78px] grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 sm:min-h-[82px] md:grid-cols-[1fr_auto_1fr] md:gap-4">
          <div className="flex items-center">
            <nav className="hidden md:flex items-center gap-6 text-[11px] uppercase tracking-[0.18em] text-muted">
              {NAV_LINKS.map((item) => (
                <Link key={item.label} href={item.href} className="transition-opacity hover:opacity-55 ">
                  {item.label}
                </Link>
              ))}
            </nav>


          </div>

          <div className="flex justify-center md:justify-self-center">
            <Link
              href="/"

              className="text-lg uppercase font-bold sm:text-xl md:text-2xl text-foreground"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif", letterSpacing: "0.24em" }}
            >
              <Image
                src={logo}
                alt="FitAndes"
                width={400}
                height={150}
                sizes="100vw"
                className="pointer-events-none object-cover object-center lg:object-right"
              />
            </Link>
          </div>

          <div className="flex items-center justify-end gap-2 sm:gap-3">
            <div className="relative" ref={cartRef}>
              <button
                type="button"
                onClick={() => setCartOpen((current) => !current)}
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors hover:bg-background sm:h-11 sm:w-11 text-foreground"
                aria-label="Ver reservas"
              >
                <CartIcon />
                {totalItems > 0 && (
                  <span className="absolute -right-1 -top-1 min-w-5 h-5 px-1 rounded-full text-[10px] flex items-center justify-center bg-foreground text-background">
                    {totalItems}
                  </span>
                )}
              </button>

              {cartOpen && (
                <div className="absolute -right-12 sm:right-0 mt-3 w-[calc(100vw-2rem)] sm:w-[360px] border border-border bg-white shadow-[0_24px_50px_rgba(0,0,0,0.08)] rounded-[var(--radius-md)] overflow-hidden">
                  <div className="px-4 py-4 border-b border-border sm:px-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-subtle">
                        Reservas
                      </p>
                      {items.length > 0 ? (
                        <span className="text-[11px] text-muted">
                          {formatPrice(totalAmount)}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {items.length === 0 ? (
                    <div className="px-4 py-8 sm:px-5">
                      <p className="text-sm text-muted">
                        Aún no agregaste productos a tu reserva.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="max-h-[60vh] overflow-y-auto">
                        {items.map((item) => (
                          <div key={item.id} className="px-4 py-4 border-b border-surface-soft sm:px-5">
                            <div className="flex gap-3">
                              <div className="relative h-20 w-16 shrink-0 overflow-hidden border border-border bg-background">
                                {item.imagen ? <Image src={item.imagen} alt={item.nombre} fill unoptimized sizes="64px" className="object-cover" /> : null}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm uppercase leading-snug text-foreground">
                                  {item.nombre}
                                </p>
                                <p className="text-[11px] uppercase mt-1 tracking-[0.08em] text-subtle">
                                  {item.color} / {item.talla}
                                </p>
                                <div className="mt-3 flex items-center justify-between gap-3">
                                  <p className="text-sm text-foreground">
                                    {formatPrice(item.precio)}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => removeItem(item.id)}
                                    className="text-[11px] uppercase transition-opacity hover:opacity-60 tracking-[0.12em] text-subtle"
                                  >
                                    Quitar
                                  </button>
                                </div>
                                <div className="mt-3 flex items-center justify-between gap-3">
                                  <div className="flex items-center border border-border">
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
                                  <span className="text-[11px] text-subtle">
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
                                Iniciar sesión
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
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors hover:bg-background sm:h-11 sm:w-11 text-foreground"
                aria-label="Abrir menú de usuario"
              >
                <UserIcon />
              </button>

              {userOpen && (
                <div className="absolute right-0 mt-3 w-[min(100vw-1rem,280px)] border border-border bg-white shadow-[0_24px_50px_rgba(0,0,0,0.08)] rounded-[var(--radius-md)] overflow-hidden">
                  <div className="px-5 py-4 border-b border-border">
                    <p className="text-sm text-foreground">
                      {authenticated ? firstName : "Mi cuenta"}
                    </p>
                    <p className="text-[11px] mt-1 uppercase tracking-[0.12em] text-subtle">
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
                          className="w-full text-left px-5 py-3 text-xs uppercase transition-colors hover:bg-background tracking-[0.14em] text-muted"
                        >
                          Salir
                        </button>
                      </>
                    ) : (
                      <>
                        <HeaderLink href="/login" label="Iniciar sesión" />
                        <HeaderLink href="/registro" label="Registrarse" />
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <nav className="md:hidden flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide" aria-label="Accesos rápidos">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="whitespace-nowrap rounded-full border border-border px-4 py-2 text-[10px] uppercase transition-colors hover:bg-white active:scale-95 tracking-[0.14em] text-muted bg-white/60 shadow-sm"
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
      className="block px-5 py-3 text-xs uppercase transition-colors hover:bg-background tracking-[0.14em] text-muted"
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
