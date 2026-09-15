import { requireTenantSession } from "@opero/auth";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@opero/ui";
import { revokeApiKeyAction, createWebhookAction, deleteWebhookAction } from "./actions";
import { ApiKeyForm } from "./api-key-form";

const AVAILABLE_EVENTS = [
  { value: "service_order.status_changed", label: "Ordem de serviço — status alterado" },
  { value: "invoice.paid", label: "Cobrança — paga" },
];

export default async function ConfiguracoesIntegracoesPage() {
  const { db } = await requireTenantSession();
  const [apiKeys, webhooks] = await Promise.all([
    db.apiKey.findMany({ orderBy: { createdAt: "desc" } }),
    db.webhook.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Chaves de API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ApiKeyForm />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Chave</TableHead>
                <TableHead>Último uso</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell>{key.name}</TableCell>
                  <TableCell>
                    <code className="text-xs">{key.keyPrefix}…</code>
                  </TableCell>
                  <TableCell>{key.lastUsedAt ? new Intl.DateTimeFormat("pt-BR").format(key.lastUsedAt) : "nunca"}</TableCell>
                  <TableCell>
                    <Badge variant={key.revokedAt ? "outline" : "success"}>{key.revokedAt ? "Revogada" : "Ativa"}</Badge>
                  </TableCell>
                  <TableCell>
                    {!key.revokedAt && (
                      <form action={revokeApiKeyAction.bind(null, key.id)}>
                        <Button type="submit" size="sm" variant="ghost">
                          Revogar
                        </Button>
                      </form>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground">
            Use a chave no header <code>Authorization: Bearer &lt;chave&gt;</code> contra <code>/api/v1/customers</code>{" "}
            e <code>/api/v1/service-orders</code>.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhooks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={createWebhookAction} className="space-y-3 rounded-md border p-4">
            <div className="space-y-1">
              <Label htmlFor="url">URL (https://)</Label>
              <Input id="url" name="url" type="url" placeholder="https://seusite.com/webhooks/opero" required />
            </div>
            <div className="space-y-1">
              <Label>Eventos</Label>
              {AVAILABLE_EVENTS.map((e) => (
                <label key={e.value} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name={`event_${e.value}`} />
                  {e.label}
                </label>
              ))}
            </div>
            <Button type="submit" size="sm">
              Adicionar webhook
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>URL</TableHead>
                <TableHead>Eventos</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="max-w-xs truncate">{w.url}</TableCell>
                  <TableCell className="text-xs">{w.events.join(", ")}</TableCell>
                  <TableCell>
                    <form action={deleteWebhookAction.bind(null, w.id)}>
                      <Button type="submit" size="sm" variant="ghost">
                        Remover
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
