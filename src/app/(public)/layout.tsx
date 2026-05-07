import { getServerSession } from "next-auth";
import SiteHeader from "@/components/layout/SiteHeader";
import ChatWidgetClient from "@/components/chat/ChatWidgetClient";
import { authOptions } from "@/lib/auth-options";
import { FaWhatsapp } from "react-icons/fa";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const authenticated = Boolean(session && session.user.role === "CLIENTE");
  const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER || "59176574068";
  const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=Hola,%20me%20gustaría%20más%20información.`;

  return (
    <>
      <SiteHeader authenticated={authenticated} fullname={session?.user.fullname} email={session?.user.email} />
      {children}
      <ChatWidgetClient />
      {/* Botón flotante de WhatsApp */}
      <a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110 active:scale-95 sm:bottom-6"
        aria-label="Contactar por WhatsApp"
      >
        <FaWhatsapp size={30} />
      </a>
    </>
  );
}

