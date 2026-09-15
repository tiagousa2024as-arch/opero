import { notFound } from "next/navigation";
import { requireTenantSession } from "@opero/auth";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@opero/ui";
import { updateServiceOrderAction, deleteServiceOrderAction } from "../../actions";
import { ServiceOrderForm } from "../../service-order-form";

export default async function EditarOrdemDeServicoPage({ params }: { params: { id: string } }) {
  const { db } = await requireTenantSession();

  const [os, customers, users] = await Promise.all([
    db.serviceOrder.findUnique({ where: { id: params.id }, include: { items: true } }),
    db.customer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.user.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!os) notFound();

  const updateWithId = updateServiceOrderAction.bind(null, os.id);
  const deleteWithId = deleteServiceOrderAction.bind(null, os.id);

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Editar ordem de serviço</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ServiceOrderForm
          action={updateWithId}
          customers={customers}
          users={users}
          defaultValues={{
            customerId: os.customerId,
            assignedUserId: os.assignedUserId,
            scheduledAt: os.scheduledAt,
            notes: os.notes,
            items: os.items.map((i) => ({
              description: i.description,
              quantity: Number(i.quantity),
              unitPrice: Number(i.unitPrice),
              type: i.type,
            })),
          }}
        />
        <form action={deleteWithId} className="border-t pt-4">
          <Button type="submit" variant="destructive" size="sm">
            Excluir ordem de serviço
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
