"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";

interface Props {
  fullname: string;
  email: string;
}

export default function PortalNavbar({ fullname, email }: Props) {
  return (
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link href="/portal/dashboard" className="flex items-center gap-2 text-amber-400 font-bold text-lg">
          <span className="text-2xl">◈</span>
          <span>ControlVentas</span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-gray-200 leading-none">{fullname}</p>
            <p className="text-xs text-gray-500 mt-0.5">{email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-xs text-gray-500 hover:text-red-400 border border-gray-700 hover:border-red-400/30 px-3 py-1.5 rounded-lg transition"
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}