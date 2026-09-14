import { requireTenantSession } from "@opero/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@opero/ui";
import Link from "next/link";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function DashboardPage() {
  const { db } = await requireTenantSession();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const [monthlyRevenue, openServiceOrders, overdueInvoices, todaysAppointments] = await Promise.all([
    db.transaction.aggregate({
      where: { type: "INCOME", date: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    db.serviceOrder.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    db.invoice.count({ where: { status: "PENDING", dueDate: { lt: now } } }),
    db.appointment.findMany({
      where: { startTime: { gte: startOfToday, lt: endOfToday } },
      include: { customer: true },
      orderBy: { startTime: "asc" },
    }),
  ]);

  const kpis = [
    { label: "Receita do mês", value: formatBRL(Number(monthlyRevenue._sum.amount ?? 0)) },
    { label: "Ordens de serviço abertas", value: openServiceOrders },
    { label: "Cobranças em atraso", value: overdueInvoices },
    { label: "Agendamentos hoje", value: todaysAppointments.length },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Painel</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{kpi.value}</CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agenda de hoje</CardTitle>
        </CardHeader>
        <CardContent>
          {todaysAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum agendamento para hoje.</p>
          ) : (
            <ul className="divide-y">
              {todaysAppointments.map((apt) => (
                <li key={apt.id} className="flex items-center justify-between py-2 text-sm">
                  <span>{apt.customer.name}</span>
                  <span className="text-muted-foreground">
                    {new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(apt.startTime)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/agenda" className="mt-4 inline-block text-sm text-primary hover:underline">
            Ver agenda completa →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
