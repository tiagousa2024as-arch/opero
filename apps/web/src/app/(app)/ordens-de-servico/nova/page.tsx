import { requireTenantSession } from "@opero/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@opero/ui";
import { createServiceOrderAction } from "../actions";
import { ServiceOrderForm } from "../service-order-form";

export default async function NovaOrdemDeServicoPage({ searchParams }: { searchParams: { customerId?: string } }) {
  const { db } = await requireTenantSession();
  const [customers, users] = await Promise.all([
    db.customer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.user.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Nova ordem de serviço</CardTitle>
      </CardHeader>
      <CardContent>
        <ServiceOrderForm
          action={createServiceOrderAction}
          customers={customers}
          users={users}
          defaultValues={{ customerId: searchParams.customerId }}
        />
      </CardContent>
    </Card>
  );
}
