import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const PROTECTED_PREFIXES = [
  "/onboarding",
  "/dashboard",
  "/clientes",
  "/agenda",
  "/ordens-de-servico",
  "/financeiro",
  "/cobrancas",
  "/equipe",
  "/configuracoes",
  "/admin",
  "/estoque",
  "/filiais",
  "/comissoes",
];

export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isProtected = PROTECTED_PREFIXES.some((p) => req.nextUrl.pathname.startsWith(p));
        if (!isProtected) return true;
        return Boolean(token);
      },
    },
    pages: {
      signIn: "/login",
    },
  },
);

export const config = {
  matcher: [
    "/onboarding/:path*",
    "/dashboard/:path*",
    "/clientes/:path*",
    "/agenda/:path*",
    "/ordens-de-servico/:path*",
    "/financeiro/:path*",
    "/cobrancas/:path*",
    "/equipe/:path*",
    "/configuracoes/:path*",
    "/admin/:path*",
    "/estoque/:path*",
    "/filiais/:path*",
    "/comissoes/:path*",
  ],
};
