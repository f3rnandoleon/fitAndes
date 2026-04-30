import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth-options";
import { CentralApiRole } from "@/lib/central-api";

export type CheckoutAuth = {
  userId: string;
  role: CentralApiRole;
  fullname?: string | null;
  email?: string | null;
  accessToken?: string | null;
};

/**
 * Retrieves the authentication context for the checkout process.
 * Supports both session-based (SSR) and token-based (API) auth.
 */
export async function getCheckoutAuth(request: NextRequest): Promise<CheckoutAuth | null> {
  const session = await getServerSession(authOptions);

  if (session?.user?.id && session.user.role) {
    return {
      userId: session.user.id,
      role: session.user.role,
      fullname: session.user.fullname,
      email: session.user.email,
      accessToken: session.accessToken ?? null,
    };
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token || typeof token.id !== "string" || typeof token.role !== "string") {
    return null;
  }

  return {
    userId: token.id,
    role: token.role as CentralApiRole,
    fullname: typeof token.fullname === "string" ? token.fullname : null,
    email: typeof token.email === "string" ? token.email : null,
    accessToken: typeof token.accessToken === "string" ? token.accessToken : null,
  };
}
