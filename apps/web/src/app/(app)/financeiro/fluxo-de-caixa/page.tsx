import { requireTenantSession } from "@opero/auth";
import { Badge, Card, CardContent, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@opero/ui";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function FluxoDeCaixaPage() {
  const { db } = await requireTenantSession();

  const transactions = await db.transaction.findMany({ orderBy: { date: "desc" }, take: 200 });

  const totalIncome = transactions.filter((t) => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Entradas</p>
            <p className="text-xl font-bold text-emerald-600">{formatBRL(totalIncome)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Saídas</p>
            <p className="text-xl font-bold text-destructive">{formatBRL(totalExpense)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Saldo</p>
            <p className="text-xl font-bold">{formatBRL(balance)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum lançamento ainda.
                  </TableCell>
                </TableRow>
              )}
              {transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{new Intl.DateTimeFormat("pt-BR").format(t.date)}</TableCell>
                  <TableCell>{t.category}</TableCell>
                  <TableCell>{t.description ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={t.type === "INCOME" ? "success" : "destructive"}>
                      {t.type === "INCOME" ? "Entrada" : "Saída"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatBRL(Number(t.amount))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
