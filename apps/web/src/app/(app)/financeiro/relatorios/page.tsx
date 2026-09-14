import { requireTenantSession } from "@opero/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@opero/ui";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function RelatoriosPage() {
  const { db } = await requireTenantSession();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const transactions = await db.transaction.findMany({ where: { date: { gte: startOfMonth } } });

  const byCategory = new Map<string, { income: number; expense: number }>();
  let income = 0;
  let expense = 0;

  for (const t of transactions) {
    const amount = Number(t.amount);
    const entry = byCategory.get(t.category) ?? { income: 0, expense: 0 };
    if (t.type === "INCOME") {
      income += amount;
      entry.income += amount;
    } else {
      expense += amount;
      entry.expense += amount;
    }
    byCategory.set(t.category, entry);
  }

  const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(now);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="capitalize">DRE simplificado — {monthLabel}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Receitas</span>
            <span className="font-medium text-emerald-600">{formatBRL(income)}</span>
          </div>
          <div className="flex justify-between">
            <span>Despesas</span>
            <span className="font-medium text-destructive">{formatBRL(expense)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Resultado</span>
            <span>{formatBRL(income - expense)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Por categoria</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {byCategory.size === 0 && <p className="text-muted-foreground">Sem lançamentos neste mês.</p>}
          {[...byCategory.entries()].map(([category, values]) => (
            <div key={category} className="flex justify-between border-b py-1 last:border-0">
              <span>{category}</span>
              <span>
                {values.income > 0 && <span className="text-emerald-600">+{formatBRL(values.income)}</span>}{" "}
                {values.expense > 0 && <span className="text-destructive">-{formatBRL(values.expense)}</span>}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
