"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-xs uppercase border px-4 py-2 transition-opacity hover:opacity-70"
      style={{ letterSpacing: "0.16em", borderColor: "#111111", color: "#111111" }}
    >
      Salir
    </button>
  );
}
