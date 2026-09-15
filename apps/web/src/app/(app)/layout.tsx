import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, can, type Resource } from "@opero/auth";
import { prisma } from "@opero/database";
import { AppShell } from "@/components/app-shell";

const ALL_RESOURCES: Resource[] = [
  "clientes",
  "agenda",
  "ordens_de_servico",
  "financeiro",
  "cobrancas",
  "equipe",
  "configuracoes",
  "estoque",
  "filiais",
  "comissoes",
  "integracoes",
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const role = session.user.role as any;
  const allowedResources = new Set(ALL_RESOURCES.filter((r) => can(role, r, "read")));

  const tenant = await prisma.tenant.findUnique({ where: { id: session.user.tenantId } });
  const settings = (tenant?.settings as Record<string, string>) ?? {};

  return (
    <AppShell
      userName={session.user.name}
      tenantName={tenant?.name ?? ""}
      allowedResources={allowedResources}
      brandName={settings.brandName}
      brandLogoUrl={settings.logoUrl}
      primaryColorHex={settings.primaryColorHex}
    >
      {children}
    </AppShell>
  );
}
