import { prisma } from "@opero/database";
import { Badge, Card, CardContent, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@opero/ui";

export default async function AdminAuditoriaPage({ searchParams }: { searchParams: { tenantId?: string } }) {
  const logs = await prisma.auditLog.findMany({
    where: searchParams.tenantId ? { tenantId: searchParams.tenantId } : undefined,
    include: { tenant: true, user: true },
    orderBy: { timestamp: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Auditoria (todos os tenants)</h1>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quando</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Entidade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(log.timestamp)}</TableCell>
                  <TableCell>{log.tenant.name}</TableCell>
                  <TableCell>{log.user?.name ?? "sistema"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.action}</Badge>
                  </TableCell>
                  <TableCell>
                    {log.entity} <span className="text-xs text-muted-foreground">{log.entityId}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
