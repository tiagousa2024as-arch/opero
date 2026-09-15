import { requireTenantSession } from "@opero/auth";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select } from "@opero/ui";
import { createAppointmentAction } from "../actions";

export default async function NovoAgendamentoPage() {
  const { db } = await requireTenantSession();
  const [customers, users] = await Promise.all([
    db.customer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.user.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Novo agendamento</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={createAppointmentAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerId">Cliente</Label>
            <Select id="customerId" name="customerId" required defaultValue="">
              <option value="" disabled>
                Selecione um cliente
              </option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="assignedUserId">Responsável</Label>
            <Select id="assignedUserId" name="assignedUserId" defaultValue="">
              <option value="">Sem responsável</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startTime">Início</Label>
              <Input id="startTime" name="startTime" type="datetime-local" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Fim</Label>
              <Input id="endTime" name="endTime" type="datetime-local" required />
            </div>
          </div>
          <Button type="submit" className="w-full">
            Agendar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
