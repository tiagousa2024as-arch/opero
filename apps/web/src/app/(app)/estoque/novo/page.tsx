import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@opero/ui";
import { createInventoryItemAction } from "../actions";

export default function NovoItemEstoquePage() {
  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Novo item de estoque</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={createInventoryItemAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sku">SKU (opcional)</Label>
            <Input id="sku" name="sku" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="quantity">Qtd inicial</Label>
              <Input id="quantity" name="quantity" type="number" step="0.01" min="0" defaultValue="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitCost">Custo unit.</Label>
              <Input id="unitCost" name="unitCost" type="number" step="0.01" min="0" defaultValue="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Preço de venda</Label>
              <Input id="unitPrice" name="unitPrice" type="number" step="0.01" min="0" defaultValue="0" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lowStockThreshold">Alertar quando estoque for menor que</Label>
            <Input id="lowStockThreshold" name="lowStockThreshold" type="number" step="0.01" min="0" defaultValue="0" />
          </div>
          <Button type="submit" className="w-full">
            Salvar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
