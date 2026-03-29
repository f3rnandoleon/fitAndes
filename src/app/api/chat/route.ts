import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { normalizeMemory } from "@/lib/chat/memory";
import { runChat } from "@/lib/chat/engine";
import type { ChatAttachment, ChatRequest } from "@/lib/chat/types";

function isValidAttachment(value: unknown): value is ChatAttachment {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ChatAttachment>;
  return (
    typeof candidate.mimeType === "string" &&
    candidate.mimeType.startsWith("image/") &&
    typeof candidate.data === "string" &&
    candidate.data.length > 0 &&
    candidate.data.length <= 8_000_000
  );
}

export async function POST(request: Request) {
  let body: ChatRequest | null = null;

  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return NextResponse.json({ message: "Solicitud invalida" }, { status: 400 });
  }

  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json({ message: "El mensaje es obligatorio" }, { status: 400 });
  }

  const attachments = Array.isArray(body.attachments) ? body.attachments.filter(isValidAttachment).slice(0, 1) : [];
  const session = await getServerSession(authOptions);
  const memory = normalizeMemory(body.memory, Boolean(session?.user?.id));

  try {
    const response = await runChat({
      message,
      memory,
      attachments,
      userId: session?.user?.id ?? null,
    });

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      {
        reply: "No pude procesar tu consulta en este momento. Intenta de nuevo en un momento.",
        intent: "fallback",
        memory,
        sourceMode: "rules",
        suggestions: ["Quiero una polera negra", "Mostrar catalogo"],
      },
      { status: 200 },
    );
  }
}

