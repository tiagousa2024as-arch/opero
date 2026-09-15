import Link from "next/link";
import { prisma } from "@opero/database";
import { Badge, Card, CardContent, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@opero/ui";

export default async function AdminTenantsPage() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { users: true, customers: true } } },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Empresas (tenants)</h1>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Usuários</TableHead>
                <TableHead>Clientes</TableHead>
                <TableHead>Criada em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <Link href={`/admin/tenants/${t.id}`} className="font-medium hover:underline">
                      {t.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{t.plan}</Badge>
                  </TableCell>
                  <TableCell>{t._count.users}</TableCell>
                  <TableCell>{t._count.customers}</TableCell>
                  <TableCell>{new Intl.DateTimeFormat("pt-BR").format(t.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
