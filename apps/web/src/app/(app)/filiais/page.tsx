import Link from "next/link";
import { requireTenantSession } from "@opero/auth";
import { Badge, Button, Card, CardContent, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@opero/ui";

export default async function FiliaisPage() {
  const { db } = await requireTenantSession();
  const branches = await db.branch.findMany({
    include: { _count: { select: { users: true, serviceOrders: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Filiais</h1>
        <Link href="/filiais/novo">
          <Button>Nova filial</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Equipe</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Nenhuma filial cadastrada.
                  </TableCell>
                </TableRow>
              )}
              {branches.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <Link href={`/filiais/${b.id}`} className="font-medium hover:underline">
                      {b.name}
                    </Link>
                  </TableCell>
                  <TableCell>{b.address ?? "—"}</TableCell>
                  <TableCell>{b._count.users}</TableCell>
                  <TableCell>
                    <Badge variant={b.active ? "success" : "outline"}>{b.active ? "Ativa" : "Inativa"}</Badge>
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
