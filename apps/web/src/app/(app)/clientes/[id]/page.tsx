import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTenantSession } from "@opero/auth";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@opero/ui";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const OS_STATUS_LABEL: Record<string, string> = {
  OPEN: "Aberta",
  IN_PROGRESS: "Em andamento",
  DONE: "Concluída",
  CANCELED: "Cancelada",
};

const INVOICE_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendente",
  PAID: "Paga",
  OVERDUE: "Atrasada",
  CANCELED: "Cancelada",
};

export default async function ClienteDetailPage({ params }: { params: { id: string } }) {
  const { db } = await requireTenantSession();

  const customer = await db.customer.findUnique({
    where: { id: params.id },
    include: {
      serviceOrders: { orderBy: { createdAt: "desc" }, take: 20 },
      invoices: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  if (!customer) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          <p className="text-sm text-muted-foreground">
            {customer.phone ?? "sem telefone"} · {customer.email ?? "sem email"}
          </p>
        </div>
        <Link href={`/clientes/${customer.id}/editar`}>
          <Button variant="outline">Editar</Button>
        </Link>
      </div>

      {customer.tags.length > 0 && (
        <div className="flex gap-2">
          {customer.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {customer.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Observações</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{customer.notes}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ordens de serviço</CardTitle>
        </CardHeader>
        <CardContent>
          {customer.serviceOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma ordem de serviço ainda.</p>
          ) : (
            <ul className="divide-y">
              {customer.serviceOrders.map((os) => (
                <li key={os.id} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/ordens-de-servico/${os.id}`} className="hover:underline">
                    {formatBRL(Number(os.totalAmount))} —{" "}
                    {new Intl.DateTimeFormat("pt-BR").format(os.createdAt)}
                  </Link>
                  <Badge variant="outline">{OS_STATUS_LABEL[os.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cobranças</CardTitle>
        </CardHeader>
        <CardContent>
          {customer.invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma cobrança ainda.</p>
          ) : (
            <ul className="divide-y">
              {customer.invoices.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/cobrancas/${inv.id}`} className="hover:underline">
                    {formatBRL(Number(inv.amount))} — vence em {new Intl.DateTimeFormat("pt-BR").format(inv.dueDate)}
                  </Link>
                  <Badge variant={inv.status === "PAID" ? "success" : inv.status === "OVERDUE" ? "destructive" : "outline"}>
                    {INVOICE_STATUS_LABEL[inv.status]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
