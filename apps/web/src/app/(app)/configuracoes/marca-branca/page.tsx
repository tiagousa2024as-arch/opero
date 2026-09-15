import { requireTenantSession } from "@opero/auth";
import { Button, Card, CardContent, Input, Label } from "@opero/ui";
import { updateBrandingAction } from "./actions";

export default async function ConfiguracoesMarcaBrancaPage() {
  const { db, session } = await requireTenantSession();
  const tenant = await db.tenant.findUniqueOrThrow({ where: { id: session.user.tenantId } });
  const settings = (tenant.settings as Record<string, string>) ?? {};

  return (
    <Card className="max-w-lg">
      <CardContent className="space-y-4 p-6">
        <p className="text-sm text-muted-foreground">
          Personalize o nome e a cor exibidos para sua equipe dentro do painel. Isso não afeta o domínio nem o
          e-mail — white-label completo (domínio próprio) é uma decisão de infraestrutura separada.
        </p>
        <form action={updateBrandingAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brandName">Nome exibido</Label>
            <Input id="brandName" name="brandName" defaultValue={settings.brandName ?? ""} placeholder="OPERO" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="primaryColorHex">Cor principal</Label>
            <Input
              id="primaryColorHex"
              name="primaryColorHex"
              type="text"
              defaultValue={settings.primaryColorHex ?? ""}
              placeholder="#1D4ED8"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="logoUrl">URL do logo (opcional)</Label>
            <Input id="logoUrl" name="logoUrl" type="url" defaultValue={settings.logoUrl ?? ""} />
          </div>
          <Button type="submit">Salvar</Button>
        </form>
      </CardContent>
    </Card>
  );
}
