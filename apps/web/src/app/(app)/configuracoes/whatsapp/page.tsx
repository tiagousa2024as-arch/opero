import { Badge, Card, CardContent, CardHeader, CardTitle } from "@opero/ui";
import { getWhatsAppGateway } from "@opero/notifications";

export default function ConfiguracoesWhatsappPage() {
  const gateway = getWhatsAppGateway();
  const isMock = gateway.provider === "mock";

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>WhatsApp</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <span>Provedor ativo:</span>
          <Badge variant={isMock ? "warning" : "success"}>{gateway.provider}</Badge>
        </div>
        {isMock ? (
          <p className="text-muted-foreground">
            Nenhum provedor de WhatsApp está configurado — os lembretes enviados em /agenda apenas ficam registrados
            no log do servidor, sem enviar mensagem de verdade. Para enviar de verdade, configure{" "}
            <code>WHATSAPP_TOKEN</code> e <code>WHATSAPP_PHONE_NUMBER_ID</code> (API oficial da Meta) nas variáveis de
            ambiente. Isso requer uma conta comercial verificada no WhatsApp Business Platform — veja PART G do
            blueprint para as alternativas de BSP (Z-API, Gupshup, Twilio).
          </p>
        ) : (
          <p className="text-muted-foreground">
            Lembretes de agendamento enviados em /agenda usam este provedor automaticamente.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
