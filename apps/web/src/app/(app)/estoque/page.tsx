import Link from "next/link";
import { requireTenantSession } from "@opero/auth";
import { Badge, Button, Card, CardContent, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@opero/ui";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function EstoquePage() {
  const { db } = await requireTenantSession();
  const items = await db.inventoryItem.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Estoque</h1>
        <div className="flex gap-2">
          <Link href="/estoque/movimentacoes">
            <Button variant="outline">Movimentações</Button>
          </Link>
          <Link href="/estoque/novo">
            <Button>Novo item</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Qtd</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum item cadastrado.
                  </TableCell>
                </TableRow>
              )}
              {items.map((item) => {
                const low = Number(item.quantity) <= Number(item.lowStockThreshold);
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Link href={`/estoque/${item.id}`} className="font-medium hover:underline">
                        {item.name}
                      </Link>
                    </TableCell>
                    <TableCell>{item.sku ?? "—"}</TableCell>
                    <TableCell>{Number(item.quantity)}</TableCell>
                    <TableCell>{formatBRL(Number(item.unitPrice))}</TableCell>
                    <TableCell>{low && <Badge variant="warning">Estoque baixo</Badge>}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
