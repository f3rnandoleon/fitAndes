"use client";

import { ReservationCartProvider } from "@/components/providers/ReservationCartProvider";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return <ReservationCartProvider>{children}</ReservationCartProvider>;
}
