import { requireTenantSession } from "@opero/auth";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@opero/ui";

export default async function ConfiguracoesPlanoPage() {
  const { db, session } = await requireTenantSession();
  const tenant = await db.tenant.findUniqueOrThrow({ where: { id: session.user.tenantId } });

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Plano atual</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Badge>{tenant.plan}</Badge>
        <p className="text-sm text-muted-foreground">
          A cobrança da assinatura OPERO (diferente das cobranças que você emite para seus clientes em
          /cobrancas) ainda não está automatizada nesta fase — fale com o suporte para alterar seu plano.
        </p>
      </CardContent>
    </Card>
  );
}
