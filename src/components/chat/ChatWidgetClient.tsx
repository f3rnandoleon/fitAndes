"use client";

import dynamic from "next/dynamic";

const ChatWidget = dynamic(() => import("@/components/chat/ChatWidget"), {
  ssr: false,
});

/**
 * Client-side wrapper for ChatWidget to enable dynamic loading 
 * with ssr: false from Server Components.
 */
export default function ChatWidgetClient() {
  return <ChatWidget />;
}
