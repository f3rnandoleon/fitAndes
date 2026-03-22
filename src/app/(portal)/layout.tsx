import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import SiteHeader from "@/components/layout/SiteHeader";
import { authOptions } from "@/lib/auth-options";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "CLIENTE") redirect("/login");

  return (
    <div className="min-h-screen bg-[#fbf9f5] text-[#111111] flex flex-col">
      <SiteHeader authenticated fullname={session.user.fullname} email={session.user.email} />
      <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 py-8 lg:py-10 grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-8 lg:gap-12">
        <aside className="flex lg:flex-col gap-3 lg:gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
          <SidebarLink href="/dashboard" label="Dashboard" />
          <SidebarLink href="/pedidos" label="Mis pedidos" />
          <SidebarLink href="/catalogo" label="Catalogo" />
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}

function SidebarLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="shrink-0 border px-4 py-3 text-xs uppercase transition-colors hover:bg-white"
      style={{ borderColor: "#ece6dc", letterSpacing: "0.16em", color: "#5f564e", background: "rgba(255,255,255,0.72)" }}
    >
      {label}
    </Link>
  );
}
