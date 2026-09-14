import Link from "next/link";
import { requireTenantSession } from "@opero/auth";
import { Badge, Button, Card, CardContent, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@opero/ui";
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

export default async function OrdensDeServicoPage({ searchParams }: { searchParams: { status?: string } }) {
  const { db } = await requireTenantSession();
  const status = searchParams.status as ServiceOrderStatus | undefined;

  const orders = await db.serviceOrder.findMany({
    where: status ? { status } : undefined,
    include: { customer: true, assignedUser: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ordens de Serviço</h1>
        <Link href="/ordens-de-servico/nova">
          <Button>Nova ordem de serviço</Button>
        </Link>
      </div>

      <form className="max-w-xs">
        <Select name="status" defaultValue={status ?? ""} onChange={(e) => e.currentTarget.form?.submit()}>
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </form>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criada em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhuma ordem de serviço encontrada.
                  </TableCell>
                </TableRow>
              )}
              {orders.map((os) => (
                <TableRow key={os.id}>
                  <TableCell>
                    <Link href={`/ordens-de-servico/${os.id}`} className="font-medium hover:underline">
                      {os.customer.name}
                    </Link>
                  </TableCell>
                  <TableCell>{os.assignedUser?.name ?? "—"}</TableCell>
                  <TableCell>{formatBRL(Number(os.totalAmount))}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{STATUS_LABEL[os.status]}</Badge>
                  </TableCell>
                  <TableCell>{new Intl.DateTimeFormat("pt-BR").format(os.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
