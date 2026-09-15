import Link from "next/link";
import { requireTenantSession } from "@opero/auth";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@opero/ui";
import { updateAppointmentStatusAction, sendReminderAction } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: "Agendado",
  CONFIRMED: "Confirmado",
  COMPLETED: "Concluído",
  NO_SHOW: "Não compareceu",
  CANCELED: "Cancelado",
};

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function AgendaPage({ searchParams }: { searchParams: { date?: string } }) {
  const { db } = await requireTenantSession();

  const anchor = searchParams.date ? new Date(searchParams.date) : new Date();
  const weekStart = startOfWeek(anchor);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const prevWeek = new Date(weekStart);
  prevWeek.setDate(prevWeek.getDate() - 7);
  const nextWeek = new Date(weekStart);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const appointments = await db.appointment.findMany({
    where: { startTime: { gte: weekStart, lt: weekEnd } },
    include: { customer: true, assignedUser: true },
    orderBy: { startTime: "asc" },
  });

  const days = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    return day;
  });

  const dayFormatter = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
  const timeFormatter = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <div className="flex items-center gap-2">
          <Link href={`/agenda?date=${prevWeek.toISOString().slice(0, 10)}`}>
            <Button variant="outline" size="sm">
              ← Semana anterior
            </Button>
          </Link>
          <Link href={`/agenda?date=${nextWeek.toISOString().slice(0, 10)}`}>
            <Button variant="outline" size="sm">
              Próxima semana →
            </Button>
          </Link>
          <Link href="/agenda/novo">
            <Button size="sm">Novo agendamento</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-7">
        {days.map((day) => {
          const dayAppointments = appointments.filter(
            (a) => a.startTime >= day && a.startTime < new Date(day.getTime() + 86400000),
          );
          return (
            <Card key={day.toISOString()}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm capitalize">{dayFormatter.format(day)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-3 pt-0">
                {dayAppointments.length === 0 && <p className="text-xs text-muted-foreground">—</p>}
                {dayAppointments.map((apt) => (
                  <div key={apt.id} className="rounded-md border p-2 text-xs">
                    <p className="font-medium">{timeFormatter.format(apt.startTime)}</p>
                    <Link href={`/clientes/${apt.customerId}`} className="hover:underline">
                      {apt.customer.name}
                    </Link>
                    <div className="mt-1 flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px]">
                        {STATUS_LABEL[apt.status]}
                      </Badge>
                      {apt.status === "SCHEDULED" && (
                        <form action={updateAppointmentStatusAction.bind(null, apt.id, "CONFIRMED")}>
                          <button className="text-primary hover:underline" type="submit">
                            Confirmar
                          </button>
                        </form>
                      )}
                    </div>
                    {apt.customer.phone && (
                      <form action={sendReminderAction.bind(null, apt.id)} className="mt-1">
                        <button className="text-[10px] text-muted-foreground hover:text-primary hover:underline" type="submit">
                          Enviar lembrete por WhatsApp
                        </button>
                      </form>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
