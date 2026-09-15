import { notFound } from "next/navigation";
import { prisma } from "@opero/database";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@opero/ui";
import { approveOrcamentoAction } from "./actions";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function OrcamentoPublicoPage({ params }: { params: { token: string } }) {
  const os = await prisma.serviceOrder.findUnique({
    where: { publicToken: params.token },
    include: { customer: true, items: true },
  });

  if (!os) notFound();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orçamento para {os.customer.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Qtd</TableHead>
              <TableHead>Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {os.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.description}</TableCell>
                <TableCell>{Number(item.quantity)}</TableCell>
                <TableCell>{formatBRL(Number(item.quantity) * Number(item.unitPrice))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <p className="text-right text-lg font-semibold">Total: {formatBRL(Number(os.totalAmount))}</p>

        {os.approvedAt ? (
          <Badge variant="success">Orçamento aprovado</Badge>
        ) : (
          <form action={approveOrcamentoAction.bind(null, params.token)}>
            <Button type="submit" className="w-full">
              Aprovar orçamento
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
