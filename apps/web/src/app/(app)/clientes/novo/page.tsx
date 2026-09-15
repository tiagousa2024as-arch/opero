import { Card, CardContent, CardHeader, CardTitle } from "@opero/ui";
import { createCustomerAction } from "../actions";
import { CustomerForm } from "../customer-form";

export default function NovoClientePage() {
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Novo cliente</CardTitle>
      </CardHeader>
      <CardContent>
        <CustomerForm action={createCustomerAction} />
      </CardContent>
    </Card>
  );
}
