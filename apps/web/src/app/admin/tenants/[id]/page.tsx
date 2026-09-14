import { notFound } from "next/navigation";
import { prisma } from "@opero/database";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@opero/ui";

export default async function AdminTenantDetailPage({ params }: { params: { id: string } }) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: params.id },
    include: {
      users: true,
      _count: { select: { customers: true, serviceOrders: true, invoices: true } },
    },
  });

  if (!tenant) notFound();

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{tenant.name}</h1>
        <Badge>{tenant.plan}</Badge>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Clientes</p>
            <p className="text-xl font-bold">{tenant._count.customers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Ordens de serviço</p>
            <p className="text-xl font-bold">{tenant._count.serviceOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Cobranças</p>
            <p className="text-xl font-bold">{tenant._count.invoices}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usuários</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {tenant.users.map((u) => (
            <p key={u.id}>
              {u.name} — {u.email} ({u.role})
            </p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
