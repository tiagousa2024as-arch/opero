import Link from "next/link";
import { requireTenantSession } from "@opero/auth";
import { Badge, Button, Card, CardContent, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@opero/ui";

const STATUS_VARIANT: Record<string, "success" | "destructive" | "outline"> = {
  PAID: "success",
  OVERDUE: "destructive",
  PENDING: "outline",
  CANCELED: "outline",
};

const STATUS_LABEL: Record<string, string> = {
  PAID: "Paga",
  OVERDUE: "Atrasada",
  PENDING: "Pendente",
  CANCELED: "Cancelada",
};

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function CobrancasPage() {
  const { db } = await requireTenantSession();

  const invoices = await db.invoice.findMany({
    include: { customer: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cobranças</h1>
        <Link href="/cobrancas/novo">
          <Button>Nova cobrança</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhuma cobrança ainda.
                  </TableCell>
                </TableRow>
              )}
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>
                    <Link href={`/cobrancas/${inv.id}`} className="font-medium hover:underline">
                      {inv.customer.name}
                    </Link>
                  </TableCell>
                  <TableCell>{new Intl.DateTimeFormat("pt-BR").format(inv.dueDate)}</TableCell>
                  <TableCell>{formatBRL(Number(inv.amount))}</TableCell>
                  <TableCell>{inv.paymentMethod ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[inv.status]}>{STATUS_LABEL[inv.status]}</Badge>
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
