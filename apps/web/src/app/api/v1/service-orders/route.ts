import { NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-auth";

export async function GET(req: Request) {
  const auth = await authenticateApiKey(req);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const serviceOrders = await auth.db.serviceOrder.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { customer: { select: { id: true, name: true } } },
  });

  return NextResponse.json({
    data: serviceOrders.map((os) => ({
      id: os.id,
      status: os.status,
      totalAmount: Number(os.totalAmount),
      customer: os.customer,
      createdAt: os.createdAt,
    })),
  });
}
