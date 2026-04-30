import { getServerSession } from "next-auth";
import SiteHeader from "@/components/layout/SiteHeader";
import ChatWidgetClient from "@/components/chat/ChatWidgetClient";
import { authOptions } from "@/lib/auth-options";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const authenticated = Boolean(session && session.user.role === "CLIENTE");

  return (
    <>
      <SiteHeader authenticated={authenticated} fullname={session?.user.fullname} email={session?.user.email} />
      {children}
      <ChatWidgetClient />
    </>
  );
}

