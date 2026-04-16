import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type AppRole = "ADMIN" | "VENDEDOR" | "CLIENTE";

type LoginResponse = {
  message?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id?: string;
    email?: string;
    fullname?: string;
    role?: AppRole;
  };
};

function normalizeUser(data: LoginResponse) {
  const user = data.user;
  if (!user?.id || !user.email || !user.fullname || !user.role) return null;

  return {
    id: user.id,
    email: user.email,
    fullname: user.fullname,
    role: user.role,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  };
}

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
  const data = (await res.json().catch(() => null)) as LoginResponse | null;
  if (!res.ok) {
    throw new Error(data?.message ?? "No se pudo iniciar sesion.");
  }

  return data ? normalizeUser(data) : null;
}

function googleAuthErrorMessage(status: number, fallback?: string) {
  if (status === 401) return "No pudimos validar tu cuenta de Google.";
  if (status === 403) return "Tu cuenta no tiene acceso como cliente.";
  if (status === 409) return "Este correo ya esta vinculado con otra cuenta de Google.";
  if (status === 503) return "El acceso con Google no esta configurado en este momento.";
  return fallback ?? "No se pudo continuar con Google.";
}

async function loginWithGoogleIdToken(idToken: string) {
  if (!API_URL) {
    throw new Error("La API central no esta configurada.");
  }

  const res = await fetch(`${API_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ idToken }),
  });

  const data = (await res.json().catch(() => null)) as LoginResponse | null;

  if (!res.ok) {
    throw new Error(googleAuthErrorMessage(res.status, data?.message));
  }

  const user = data ? normalizeUser(data) : null;
  if (!user) {
    throw new Error("La respuesta del login con Google no fue valida.");
  }

  return user;
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

        const user = await loginWithCentralApi(credentials.email, credentials.password);
        if (!user) return null;

        if (user.role !== "CLIENTE") {
          throw new Error("Solo las cuentas de cliente pueden ingresar aqui.");
        }

        return {
          id: user.id,
          email: user.email,
          fullname: user.fullname,
          role: user.role,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
        };
      },
    }),
    CredentialsProvider({
      id: "google-id-token",
      name: "Google",
      credentials: {
        idToken: { label: "Google ID Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.idToken) return null;

        const user = await loginWithGoogleIdToken(credentials.idToken);
        if (user.role !== "CLIENTE") {
          throw new Error("Solo las cuentas de cliente pueden ingresar aqui.");
        }

        return {
          id: user.id,
          email: user.email,
          fullname: user.fullname,
          role: user.role,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.fullname = user.fullname;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.fullname = token.fullname;
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
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
