import { Card, CardContent, CardHeader, CardTitle } from "@opero/ui";

export default function ConfiguracoesSegurancaPage() {
  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Segurança</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          Autenticação via email e senha está ativa para todos os usuários. Alterações de status em ordens de
          serviço e exclusões ficam registradas no histórico de auditoria de cada registro.
        </p>
        <p>
          <strong className="text-foreground">SSO/SAML</strong> (login corporativo via Okta, Azure AD, Google
          Workspace etc.) está disponível para contas empresariais mediante configuração de um provedor de
          identidade real — fale com o suporte se sua empresa precisar disso. Não é necessário para o uso normal do
          OPERO.
        </p>
      </CardContent>
    </Card>
  );
}
