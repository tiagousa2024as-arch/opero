import { requireTenantSession } from "@opero/auth";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select } from "@opero/ui";
import { createInvoiceAction } from "../actions";

export default async function NovaCobrancaPage({
  searchParams,
}: {
  searchParams: { serviceOrderId?: string; customerId?: string };
}) {
  const { db } = await requireTenantSession();

  let defaultCustomerId = searchParams.customerId ?? "";
  let defaultAmount = "";

  if (searchParams.serviceOrderId) {
    const os = await db.serviceOrder.findUnique({ where: { id: searchParams.serviceOrderId } });
    if (os) {
      defaultCustomerId = os.customerId;
      defaultAmount = Number(os.totalAmount).toFixed(2);
    }
  }

  const customers = await db.customer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Nova cobrança</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={createInvoiceAction} className="space-y-4">
          {searchParams.serviceOrderId && (
            <input type="hidden" name="serviceOrderId" value={searchParams.serviceOrderId} />
          )}
          <div className="space-y-2">
            <Label htmlFor="customerId">Cliente</Label>
            <Select id="customerId" name="customerId" required defaultValue={defaultCustomerId}>
              <option value="" disabled>
                Selecione um cliente
              </option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Valor</Label>
            <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required defaultValue={defaultAmount} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate">Vencimento</Label>
            <Input id="dueDate" name="dueDate" type="date" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Forma de pagamento</Label>
            <Select id="paymentMethod" name="paymentMethod" defaultValue="PIX">
              <option value="PIX">Pix</option>
              <option value="BOLETO">Boleto</option>
              <option value="CREDIT_CARD">Cartão de crédito</option>
            </Select>
          </div>
          <Button type="submit" className="w-full">
            Gerar cobrança
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
