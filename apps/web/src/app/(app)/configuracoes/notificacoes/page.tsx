import { requireTenantSession } from "@opero/auth";
import { Button, Card, CardContent } from "@opero/ui";
import { updateNotificationSettingsAction } from "../actions";

export default async function ConfiguracoesNotificacoesPage() {
  const { db, session } = await requireTenantSession();
  const tenant = await db.tenant.findUniqueOrThrow({ where: { id: session.user.tenantId } });
  const settings = (tenant.settings as Record<string, unknown>) ?? {};

  return (
    <Card className="max-w-lg">
      <CardContent className="space-y-4 p-6">
        <form action={updateNotificationSettingsAction} className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="emailReminders" defaultChecked={Boolean(settings.emailReminders)} />
            Lembretes de agendamento por email
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="whatsappReminders" defaultChecked={Boolean(settings.whatsappReminders)} />
            Lembretes de agendamento por WhatsApp
          </label>
          <Button type="submit">Salvar</Button>
        </form>
      </CardContent>
    </Card>
  );
}
