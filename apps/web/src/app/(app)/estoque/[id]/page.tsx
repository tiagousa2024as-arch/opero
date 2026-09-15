import { notFound } from "next/navigation";
import { requireTenantSession } from "@opero/auth";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@opero/ui";
import { updateInventoryItemAction, adjustStockAction } from "../actions";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function ItemEstoqueDetailPage({ params }: { params: { id: string } }) {
  const { db } = await requireTenantSession();

  const item = await db.inventoryItem.findUnique({
    where: { id: params.id },
    include: { movements: { orderBy: { date: "desc" }, take: 20 } },
  });
  if (!item) notFound();

  const low = Number(item.quantity) <= Number(item.lowStockThreshold);
  const updateWithId = updateInventoryItemAction.bind(null, item.id);
  const adjustWithId = adjustStockAction.bind(null, item.id);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{item.name}</h1>
          {low && <Badge variant="warning">Estoque baixo</Badge>}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Editar</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateWithId} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" name="name" defaultValue={item.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" name="sku" defaultValue={item.sku ?? ""} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="unitCost">Custo unit.</Label>
                  <Input id="unitCost" name="unitCost" type="number" step="0.01" min="0" defaultValue={Number(item.unitCost)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Preço de venda</Label>
                  <Input id="unitPrice" name="unitPrice" type="number" step="0.01" min="0" defaultValue={Number(item.unitPrice)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lowStockThreshold">Alertar quando estoque for menor que</Label>
                <Input
                  id="lowStockThreshold"
                  name="lowStockThreshold"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={Number(item.lowStockThreshold)}
                />
              </div>
              <Button type="submit">Salvar</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Movimentações recentes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Quantidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {item.movements.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Nenhuma movimentação ainda.
                    </TableCell>
                  </TableRow>
                )}
                {item.movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{new Intl.DateTimeFormat("pt-BR").format(m.date)}</TableCell>
                    <TableCell>
                      <Badge variant={m.type === "IN" ? "success" : "destructive"}>{m.type === "IN" ? "Entrada" : "Saída"}</Badge>
                    </TableCell>
                    <TableCell>{Number(m.quantity)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estoque atual: {Number(item.quantity)}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={adjustWithId} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="type">Tipo</Label>
              <Select id="type" name="type" defaultValue="IN">
                <option value="IN">Entrada (compra/ajuste)</option>
                <option value="OUT">Saída (perda/ajuste)</option>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input id="quantity" name="quantity" type="number" step="0.01" min="0.01" required />
            </div>
            <Button type="submit" className="w-full">
              Registrar movimentação
            </Button>
          </form>
          <p className="mt-4 text-xs text-muted-foreground">
            Valor em custo no estoque: {formatBRL(Number(item.quantity) * Number(item.unitCost))}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
