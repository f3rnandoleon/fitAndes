import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    const isProtected =
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/pedidos") ||
      pathname.startsWith("/perfil") ||
      pathname.startsWith("/direcciones");

    if (isProtected && token?.role !== "CLIENTE") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/pedidos/:path*", "/perfil/:path*", "/direcciones/:path*"],
};
