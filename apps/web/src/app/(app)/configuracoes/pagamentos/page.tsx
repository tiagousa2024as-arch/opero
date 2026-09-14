import { Badge, Card, CardContent, CardHeader, CardTitle } from "@opero/ui";
import { getPaymentGateway } from "@/lib/payments";

export default function ConfiguracoesPagamentosPage() {
  const gateway = getPaymentGateway();
  const isMock = gateway.provider === "mock";

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Gateway de pagamento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <span>Provedor ativo:</span>
          <Badge variant={isMock ? "warning" : "success"}>{gateway.provider}</Badge>
        </div>
        {isMock ? (
          <p className="text-muted-foreground">
            Nenhum gateway real está configurado — as cobranças usam um provedor de teste e não recebem pagamentos de
            verdade. Para aceitar Pix, boleto e cartão de verdade, configure <code>ASAAS_API_KEY</code> (ou o gateway
            escolhido) nas variáveis de ambiente e defina <code>PAYMENT_PROVIDER</code>. Isso requer uma conta
            comercial real (CNPJ) no gateway escolhido.
          </p>
        ) : (
          <p className="text-muted-foreground">Cobranças criadas em /cobrancas usam este gateway automaticamente.</p>
        )}
      </CardContent>
    </Card>
  );
}
