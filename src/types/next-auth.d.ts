import type { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      email: string;
      fullname: string;
      role: "ADMIN" | "VENDEDOR" | "CLIENTE";
    };
  }

  interface User extends DefaultUser {
    id: string;
    email: string;
    fullname: string;
    role: "ADMIN" | "VENDEDOR" | "CLIENTE";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "VENDEDOR" | "CLIENTE";
    fullname: string;
  }
}

export {};
