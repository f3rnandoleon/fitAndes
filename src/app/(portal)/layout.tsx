import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import SiteHeader from "@/components/layout/SiteHeader";
import { authOptions } from "@/lib/auth-options";
import PortalSidebar from "@/components/layout/PortalSidebar";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "CLIENTE") redirect("/login");

  const firstName = session.user.fullname?.split(" ")[0] || "Cliente";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader authenticated firstName={firstName} email={session.user.email} />
      <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-6 py-8 lg:py-10 grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-8 lg:gap-12">
        <PortalSidebar />
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
