import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTenantSession } from "@opero/auth";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@opero/ui";
import { markInvoicePaidAction, cancelInvoiceAction } from "../actions";

const STATUS_LABEL: Record<string, string> = {
  PAID: "Paga",
  OVERDUE: "Atrasada",
  PENDING: "Pendente",
  CANCELED: "Cancelada",
};

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function CobrancaDetailPage({ params }: { params: { id: string } }) {
  const { db } = await requireTenantSession();

  const invoice = await db.invoice.findUnique({
    where: { id: params.id },
    include: { customer: true, serviceOrder: true },
  });

  if (!invoice) notFound();

  const markPaidWithId = markInvoicePaidAction.bind(null, invoice.id);
  const cancelWithId = cancelInvoiceAction.bind(null, invoice.id);

  return (
    <div className="max-w-lg space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cobrança</h1>
        <Badge variant={invoice.status === "PAID" ? "success" : invoice.status === "OVERDUE" ? "destructive" : "outline"}>
          {STATUS_LABEL[invoice.status]}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            <Link href={`/clientes/${invoice.customerId}`} className="hover:underline">
              {invoice.customer.name}
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Valor: <span className="font-semibold">{formatBRL(Number(invoice.amount))}</span></p>
          <p>Vencimento: {new Intl.DateTimeFormat("pt-BR").format(invoice.dueDate)}</p>
          <p>Forma de pagamento: {invoice.paymentMethod ?? "—"}</p>
          {invoice.serviceOrder && (
            <p>
              Ordem de serviço:{" "}
              <Link href={`/ordens-de-servico/${invoice.serviceOrder.id}`} className="text-primary hover:underline">
                ver ordem de serviço
              </Link>
            </p>
          )}
          {invoice.paymentLinkUrl && (
            <p>
              Link de pagamento:{" "}
              <a href={invoice.paymentLinkUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                {invoice.paymentLinkUrl}
              </a>
            </p>
          )}
        </CardContent>
      </Card>

      {invoice.status === "PENDING" && (
        <div className="flex gap-2">
          {invoice.gatewayProvider === "mock" && (
            <form action={markPaidWithId}>
              <Button type="submit">Marcar como paga (teste)</Button>
            </form>
          )}
          <form action={cancelWithId}>
            <Button type="submit" variant="destructive">
              Cancelar cobrança
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
