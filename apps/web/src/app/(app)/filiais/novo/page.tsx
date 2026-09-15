import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@opero/ui";
import { createBranchAction } from "../actions";

export default function NovaFilialPage() {
  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Nova filial</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={createBranchAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input id="address" name="address" />
          </div>
          <Button type="submit" className="w-full">
            Salvar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
