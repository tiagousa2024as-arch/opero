import { NextResponse } from "next/server";

// Liveness check for App Runner (infra/lib/compute-stack.ts) — deliberately
// does not touch the database: a transient DB blip should not make App
// Runner think the whole container is unhealthy and cycle it.
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
