import { Badge, Card, CardContent, CardHeader, CardTitle } from "@opero/ui";
import { getNfeProvider } from "@/lib/nfe";

export default function ConfiguracoesNotaFiscalPage() {
  const nfe = getNfeProvider();
  const isMock = nfe.provider === "mock";

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Nota fiscal (NFS-e)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <span>Provedor ativo:</span>
          <Badge variant={isMock ? "warning" : "success"}>{nfe.provider}</Badge>
        </div>
        {isMock ? (
          <p className="text-muted-foreground">
            Nenhum provedor de nota fiscal está configurado — o botão &ldquo;Emitir nota fiscal&rdquo; em uma cobrança
            paga só simula a emissão. Para emitir NFS-e de verdade, configure <code>NFE_API_KEY</code> e defina{" "}
            <code>NFE_PROVIDER=focusnfe</code>. Isso requer conta com um provedor de nota fiscal e o cadastro
            municipal da empresa (inscrição municipal, regime tributário) — ainda não coletado no onboarding. Veja
            PART G do blueprint para as alternativas (Focus NFe, NFE.io, eNotas).
          </p>
        ) : (
          <p className="text-muted-foreground">
            Cobranças pagas em /cobrancas podem emitir nota fiscal usando este provedor.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
