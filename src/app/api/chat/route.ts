import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { runChat } from "@/lib/chat/engine";
import { normalizeMemory } from "@/lib/chat/memory";
import { checkRateLimit, resolveRequestIp } from "@/lib/rate-limit";
import { firstZodIssueMessage } from "@/lib/schemas/common";
import { chatRequestSchema } from "@/lib/schemas/chat.schema";

const CHAT_RATE_LIMIT = 20;
const CHAT_RATE_LIMIT_WINDOW_MS = 60_000;

export async function POST(request: NextRequest) {
  const ip = resolveRequestIp(request);
  const rateLimit = checkRateLimit(`chat:${ip}`, CHAT_RATE_LIMIT, CHAT_RATE_LIMIT_WINDOW_MS);

  if (!rateLimit.ok) {
    return NextResponse.json(
      { message: "Demasiadas solicitudes. Intentalo nuevamente en un momento." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
          "X-RateLimit-Limit": String(rateLimit.limit),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
        },
      },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ message: "Solicitud invalida" }, { status: 400 });
  }

  const parsedBody = chatRequestSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return NextResponse.json({ message: firstZodIssueMessage(parsedBody.error) }, { status: 400 });
  }

  const body = parsedBody.data;
  const session = await getServerSession(authOptions);
  const memory = normalizeMemory(body.memory, Boolean(session?.user?.id));

  try {
    const response = await runChat({
      message: body.message.trim(),
      memory,
      attachments: body.attachments ?? [],
      auth: {
        userId: session?.user?.id ?? null,
        accessToken: session?.accessToken ?? null,
      },
    });

    return NextResponse.json(response, {
      headers: {
        "X-RateLimit-Limit": String(rateLimit.limit),
        "X-RateLimit-Remaining": String(rateLimit.remaining),
      },
    });
  } catch {
    return NextResponse.json(
      {
        reply: "No pude procesar tu consulta en este momento. Intenta de nuevo en un momento.",
        intent: "fallback",
        memory,
        sourceMode: "rules",
        suggestions: ["Quiero una polera negra", "Mostrar catalogo"],
      },
      {
        status: 200,
        headers: {
          "X-RateLimit-Limit": String(rateLimit.limit),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
        },
      },
    );
  }
}
