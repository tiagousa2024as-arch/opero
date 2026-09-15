import { NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-auth";

export async function GET(req: Request) {
  const auth = await authenticateApiKey(req);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const customers = await auth.db.customer.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, name: true, phone: true, email: true, document: true, createdAt: true },
  });

  return NextResponse.json({ data: customers });
}
