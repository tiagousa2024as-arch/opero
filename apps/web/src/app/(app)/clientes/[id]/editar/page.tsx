import { notFound } from "next/navigation";
import { requireTenantSession } from "@opero/auth";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@opero/ui";
import { updateCustomerAction, deleteCustomerAction } from "../../actions";
import { CustomerForm } from "../../customer-form";

export default async function EditarClientePage({ params }: { params: { id: string } }) {
  const { db } = await requireTenantSession();
  const customer = await db.customer.findUnique({ where: { id: params.id } });
  if (!customer) notFound();

  const updateWithId = updateCustomerAction.bind(null, customer.id);
  const deleteWithId = deleteCustomerAction.bind(null, customer.id);

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Editar cliente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <CustomerForm action={updateWithId} defaultValues={customer} />
        <form action={deleteWithId} className="border-t pt-4">
          <Button type="submit" variant="destructive" size="sm">
            Excluir cliente
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
