import { requireTenantSession } from "@opero/auth";
import { Button, Card, CardContent, Input, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@opero/ui";
import { createServiceCategoryAction, deleteServiceCategoryAction } from "../actions";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function ConfiguracoesServicosPage() {
  const { db } = await requireTenantSession();
  const categories = await db.serviceCategory.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serviço</TableHead>
                <TableHead>Preço padrão</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{formatBRL(Number(c.defaultPrice))}</TableCell>
                  <TableCell>
                    <form action={deleteServiceCategoryAction.bind(null, c.id)}>
                      <Button type="submit" variant="ghost" size="sm">
                        Excluir
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-4">
          <p className="font-medium">Novo serviço</p>
          <form action={createServiceCategoryAction} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="defaultPrice">Preço padrão</Label>
              <Input id="defaultPrice" name="defaultPrice" type="number" step="0.01" min="0" defaultValue="0" />
            </div>
            <Button type="submit" className="w-full">
              Adicionar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
