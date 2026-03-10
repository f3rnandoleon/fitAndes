"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

interface Props {
  fullname: string;
  email: string;
}

export default function PortalNavbar({ fullname, email }: Props) {
  return (
    <header
      className="border-b sticky top-0 z-10"
      style={{ borderColor: "var(--border)", background: "rgba(245,242,238,0.92)", backdropFilter: "blur(6px)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        <Link
          href="/portal/dashboard"
          className="text-lg sm:text-2xl uppercase font-bold"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif", letterSpacing: "0.2em" }}
        >
          ControlVentas
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <p className="text-sm leading-none" style={{ color: "var(--foreground)" }}>{fullname}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>{email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-xs uppercase border px-3 py-1.5 hover:opacity-65 transition-opacity"
            style={{ letterSpacing: "0.12em", borderColor: "#1a1a1a", color: "#1a1a1a" }}
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
