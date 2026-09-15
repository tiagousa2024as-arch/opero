import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@opero/database";
import { rateLimit } from "@opero/auth";

const schema = z.object({
  companyName: z.string().min(2),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

const DEFAULT_SERVICE_CATEGORIES = [
  { name: "Serviço geral", defaultPrice: 0 },
];

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed } = await rateLimit(`register:${ip}`, 5, 60 * 60);
  if (!allowed) {
    return NextResponse.json({ error: "Muitas tentativas. Tente novamente mais tarde." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }
  const { companyName, name, email, password } = parsed.data;

  const existing = await prisma.user.findFirst({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Este email já está cadastrado." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.tenant.create({
    data: {
      name: companyName,
      plan: "trial",
      users: {
        create: { name, email, passwordHash, role: "OWNER" },
      },
      serviceCategories: { create: DEFAULT_SERVICE_CATEGORIES },
    },
  });

  return NextResponse.json({ ok: true });
}
