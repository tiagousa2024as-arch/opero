"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@opero/database";

export async function approveOrcamentoAction(token: string) {
  // Scoped entirely by the token itself — there is no session here, so
  // this must never accept anything else as identifying which row to
  // touch. publicToken is unique, so this can only ever match one OS.
  const os = await prisma.serviceOrder.findUnique({ where: { publicToken: token } });
  if (!os) throw new Error("Orçamento não encontrado.");
  if (os.approvedAt) return;

  await prisma.serviceOrder.update({ where: { id: os.id }, data: { approvedAt: new Date() } });
  revalidatePath(`/portal-do-cliente/${token}/orcamento`);
}
