"use client";

import { SessionProvider } from "next-auth/react";
import { ReservationCartProvider } from "@/components/providers/ReservationCartProvider";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ReservationCartProvider>{children}</ReservationCartProvider>
    </SessionProvider>
  );
}
