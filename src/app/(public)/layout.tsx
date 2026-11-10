import { getServerSession } from "next-auth";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import ChatWidgetClient from "@/components/chat/ChatWidgetClient";
import FloatingWhatsApp from "@/components/layout/FloatingWhatsApp";
import { authOptions } from "@/lib/auth-options";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const authenticated = Boolean(session && session.user.role === "CLIENTE");

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader authenticated={authenticated} fullname={session?.user.fullname} email={session?.user.email} />
      <div className="flex-1">{children}</div>
      <SiteFooter />
      <ChatWidgetClient />
      <FloatingWhatsApp />
    </div>
  );
}
