import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@opero/database";
import { z } from "zod";
import { rateLimit } from "./rate-limit";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      tenantId: string;
      name: string;
      email: string;
      role: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    tenantId?: string;
    role?: string;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        // Keyed by email (not IP — NextAuth v4's authorize() doesn't
        // reliably surface the caller's IP behind a load balancer without
        // extra wiring) so repeated guesses against one account are
        // throttled regardless of how many IPs they come from.
        const { allowed } = await rateLimit(`login:${email.toLowerCase()}`, 10, 15 * 60);
        if (!allowed) return null;

        // Email is unique per tenant, not globally — a user identifies
        // their tenant implicitly through which (email, password) pair
        // matches. Multiple tenants sharing an email address is a rare
        // edge case we accept for Phase 1.
        const candidates = await prisma.user.findMany({
          where: { email, active: true },
        });

        for (const candidate of candidates) {
          if (candidate.passwordHash && (await bcrypt.compare(password, candidate.passwordHash))) {
            return {
              id: candidate.id,
              tenantId: candidate.tenantId,
              name: candidate.name,
              email: candidate.email,
              role: candidate.role,
            } as any;
          }
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = (user as any).id;
        token.tenantId = (user as any).tenantId;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId && token.tenantId && token.role) {
        session.user.id = token.userId;
        session.user.tenantId = token.tenantId;
        session.user.role = token.role;
      }
      return session;
    },
  },
};
