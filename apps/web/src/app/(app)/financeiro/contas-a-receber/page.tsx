import Link from "next/link";
import { requireTenantSession } from "@opero/auth";
import { Badge, Card, CardContent, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@opero/ui";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function ContasAReceberPage() {
  const { db } = await requireTenantSession();

  const invoices = await db.invoice.findMany({
    where: { status: { in: ["PENDING", "OVERDUE"] } },
    include: { customer: true },
    orderBy: { dueDate: "asc" },
  });

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Nenhuma conta a receber em aberto.
                </TableCell>
              </TableRow>
            )}
            {invoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell>
                  <Link href={`/clientes/${inv.customerId}`} className="hover:underline">
                    {inv.customer.name}
                  </Link>
                </TableCell>
                <TableCell>{new Intl.DateTimeFormat("pt-BR").format(inv.dueDate)}</TableCell>
                <TableCell>{formatBRL(Number(inv.amount))}</TableCell>
                <TableCell>
                  <Badge variant={inv.status === "OVERDUE" ? "destructive" : "outline"}>
                    {inv.status === "OVERDUE" ? "Atrasada" : "Pendente"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
