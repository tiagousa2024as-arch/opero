import Link from "next/link";
import { requireTenantSession } from "@opero/auth";
import { Badge, Button, Card, CardContent, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@opero/ui";
import { markCommissionPaidAction } from "./actions";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function ComissoesPage() {
  const { db } = await requireTenantSession();
  const commissions = await db.commission.findMany({
    include: { user: true, serviceOrder: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const totalPending = commissions.filter((c) => !c.paid).reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Comissões</h1>
        <Card>
          <CardContent className="px-4 py-2 text-sm">
            <span className="text-muted-foreground">A pagar: </span>
            <span className="font-semibold">{formatBRL(totalPending)}</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Funcionário</TableHead>
                <TableHead>Ordem de serviço</TableHead>
                <TableHead>%</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhuma comissão gerada ainda. Configure uma % de comissão em /equipe para gerar automaticamente
                    quando uma ordem de serviço for concluída.
                  </TableCell>
                </TableRow>
              )}
              {commissions.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.user.name}</TableCell>
                  <TableCell>
                    <Link href={`/ordens-de-servico/${c.serviceOrderId}`} className="hover:underline">
                      ver OS
                    </Link>
                  </TableCell>
                  <TableCell>{Number(c.percentage)}%</TableCell>
                  <TableCell>{formatBRL(Number(c.amount))}</TableCell>
                  <TableCell>
                    <Badge variant={c.paid ? "success" : "outline"}>{c.paid ? "Paga" : "Pendente"}</Badge>
                  </TableCell>
                  <TableCell>
                    {!c.paid && (
                      <form action={markCommissionPaidAction.bind(null, c.id)}>
                        <Button type="submit" size="sm" variant="outline">
                          Marcar como paga
                        </Button>
                      </form>
                    )}
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
