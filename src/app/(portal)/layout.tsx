import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import PortalNavbar from "@/components/layout/PortalNavbar";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "CLIENTE") redirect("/login");

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col">
      <PortalNavbar fullname={session.user.fullname} email={session.user.email} />
      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 gap-8">
        <aside className="hidden md:flex flex-col gap-1 w-56 shrink-0">
          <SidebarLink href="/portal/dashboard" icon="⬡" label="Dashboard" />
          <SidebarLink href="/portal/pedidos" icon="📦" label="Mis pedidos" />
          <SidebarLink href="/catalogo" icon="◈" label="Catalogo" />
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

function SidebarLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 text-sm border transition-colors hover:bg-[var(--surface)]"
      style={{ borderColor: "var(--border)", color: "var(--muted)" }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
