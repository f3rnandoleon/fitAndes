import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import PortalNavbar from "@/components/layout/PortalNavbar";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "CLIENTE") redirect("/login");

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <PortalNavbar fullname={session.user.fullname} email={session.user.email} />
      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 gap-8">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col gap-1 w-52 shrink-0">
          <SidebarLink href="/portal/dashboard" icon="⬡" label="Dashboard" />
          <SidebarLink href="/portal/pedidos" icon="📦" label="Mis pedidos" />
          <SidebarLink href="/catalogo" icon="◈" label="Catálogo" />
        </aside>
        {/* Content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

function SidebarLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition"
    >
      <span>{icon}</span>
      <span>{label}</span>
    </a>
  );
}