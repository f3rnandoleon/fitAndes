import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type AppRole = "ADMIN" | "VENDEDOR" | "CLIENTE";

type LoginResponse = {
  user?: {
    id?: string;
    email?: string;
    fullname?: string;
    role?: AppRole;
  };
};

async function loginWithCentralApi(email: string, password: string) {
  if (!API_URL) return null;

  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      email,
      password,
    }),
  });
  if (!res.ok) return null;

  const data = (await res.json()) as LoginResponse;
  const user = data.user;
  if (!user) return null;

  if (!user.id || !user.email || !user.fullname || !user.role) return null;

  return {
    id: user.id,
    email: user.email,
    fullname: user.fullname,
    role: user.role,
  };
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const user = await loginWithCentralApi(credentials.email, credentials.password);
          if (!user) return null;

          if (user.role !== "CLIENTE") return null;

          return {
            id: user.id,
            email: user.email,
            fullname: user.fullname,
            role: user.role,
          };
        } catch {
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.fullname = user.fullname;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.fullname = token.fullname;
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24,
  },

  secret: process.env.NEXTAUTH_SECRET,
};
