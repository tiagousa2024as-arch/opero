import { requireTenantSession } from "@opero/auth";
import { Button, Card, CardContent, Input, Label } from "@opero/ui";
import { updateEmpresaSettingsAction } from "../actions";

export default async function ConfiguracoesEmpresaPage() {
  const { db, session } = await requireTenantSession();
  const tenant = await db.tenant.findUniqueOrThrow({ where: { id: session.user.tenantId } });

  return (
    <Card className="max-w-lg">
      <CardContent className="p-6">
        <form action={updateEmpresaSettingsAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da empresa</Label>
            <Input id="name" name="name" defaultValue={tenant.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input id="cnpj" name="cnpj" defaultValue={tenant.cnpj ?? ""} />
          </div>
          <Button type="submit">Salvar</Button>
        </form>
      </CardContent>
    </Card>
  );
}
