import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTenantSession } from "@opero/auth";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@opero/ui";
import { updateServiceOrderStatusAction } from "../actions";
import type { ServiceOrderStatus } from "@opero/database";

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Aberta",
  IN_PROGRESS: "Em andamento",
  DONE: "Concluída",
  CANCELED: "Cancelada",
};

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function OrdemDeServicoDetailPage({ params }: { params: { id: string } }) {
  const { db } = await requireTenantSession();

  const os = await db.serviceOrder.findUnique({
    where: { id: params.id },
    include: { customer: true, assignedUser: true, items: true, invoices: true },
  });

  if (!os) notFound();

  const transitions: { status: ServiceOrderStatus; label: string }[] = [
    { status: "OPEN", label: "Aberta" },
    { status: "IN_PROGRESS", label: "Em andamento" },
    { status: "DONE", label: "Concluída" },
    { status: "CANCELED", label: "Cancelar" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            OS de <Link href={`/clientes/${os.customer.id}`} className="hover:underline">{os.customer.name}</Link>
          </h1>
          <p className="text-sm text-muted-foreground">
            Responsável: {os.assignedUser?.name ?? "—"} · Criada em {new Intl.DateTimeFormat("pt-BR").format(os.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/ordens-de-servico/${os.id}/editar`}>
            <Button variant="outline">Editar</Button>
          </Link>
          {os.invoices.length === 0 && (
            <Link href={`/cobrancas/novo?serviceOrderId=${os.id}`}>
              <Button>Gerar cobrança</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {transitions.map((t) => (
          <form key={t.status} action={updateServiceOrderStatusAction.bind(null, os.id, t.status)}>
            <Button type="submit" size="sm" variant={os.status === t.status ? "default" : "outline"}>
              {t.label}
            </Button>
          </form>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Itens</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Qtd</TableHead>
                <TableHead>Valor unit.</TableHead>
                <TableHead>Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {os.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.type === "PART" ? "Peça" : "Serviço"}</TableCell>
                  <TableCell>{Number(item.quantity)}</TableCell>
                  <TableCell>{formatBRL(Number(item.unitPrice))}</TableCell>
                  <TableCell>{formatBRL(Number(item.quantity) * Number(item.unitPrice))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="p-4 text-right font-semibold">Total: {formatBRL(Number(os.totalAmount))}</p>
        </CardContent>
      </Card>

      {os.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Observações</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{os.notes}</CardContent>
        </Card>
      )}

      {os.invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cobrança vinculada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {os.invoices.map((inv) => (
              <Link key={inv.id} href={`/cobrancas/${inv.id}`} className="flex items-center justify-between text-sm hover:underline">
                <span>{formatBRL(Number(inv.amount))}</span>
                <Badge variant="outline">{inv.status}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
