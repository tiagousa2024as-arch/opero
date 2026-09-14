import Link from "next/link";
import { requireTenantSession } from "@opero/auth";
import { Badge, Card, CardContent, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@opero/ui";

export default async function MovimentacoesPage() {
  const { db } = await requireTenantSession();

  const movements = await db.inventoryMovement.findMany({
    include: { inventoryItem: true, relatedServiceOrder: true },
    orderBy: { date: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Movimentações de estoque</h1>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Ordem de serviço</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhuma movimentação ainda.
                  </TableCell>
                </TableRow>
              )}
              {movements.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(m.date)}</TableCell>
                  <TableCell>
                    <Link href={`/estoque/${m.inventoryItemId}`} className="hover:underline">
                      {m.inventoryItem.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={m.type === "IN" ? "success" : "destructive"}>{m.type === "IN" ? "Entrada" : "Saída"}</Badge>
                  </TableCell>
                  <TableCell>{Number(m.quantity)}</TableCell>
                  <TableCell>
                    {m.relatedServiceOrder ? (
                      <Link href={`/ordens-de-servico/${m.relatedServiceOrder.id}`} className="hover:underline">
                        ver OS
                      </Link>
                    ) : (
                      "—"
                    )}
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
