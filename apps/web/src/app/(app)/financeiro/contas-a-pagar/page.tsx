import { requireTenantSession } from "@opero/auth";
import { Button, Card, CardContent, Input, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@opero/ui";
import { createTransactionAction } from "../actions";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function ContasAPagarPage() {
  const { db } = await requireTenantSession();
  const now = new Date();

  const expenses = await db.transaction.findMany({
    where: { type: "EXPENSE", date: { gte: now } },
    orderBy: { date: "asc" },
  });

  const createExpense = createTransactionAction.bind(null, "EXPENSE");

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vencimento</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Nenhuma conta a pagar em aberto.
                  </TableCell>
                </TableRow>
              )}
              {expenses.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{new Intl.DateTimeFormat("pt-BR").format(e.date)}</TableCell>
                  <TableCell>{e.category}</TableCell>
                  <TableCell>{e.description ?? "—"}</TableCell>
                  <TableCell>{formatBRL(Number(e.amount))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-4">
          <p className="font-medium">Nova conta a pagar</p>
          <form action={createExpense} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="category">Categoria</Label>
              <Input id="category" name="category" required placeholder="Aluguel, fornecedor..." />
            </div>
            <div className="space-y-1">
              <Label htmlFor="amount">Valor</Label>
              <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="date">Vencimento</Label>
              <Input id="date" name="date" type="date" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="description">Descrição</Label>
              <Input id="description" name="description" />
            </div>
            <Button type="submit" className="w-full">
              Adicionar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
