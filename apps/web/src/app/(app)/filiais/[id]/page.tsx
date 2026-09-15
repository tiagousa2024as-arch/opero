import { notFound } from "next/navigation";
import { requireTenantSession } from "@opero/auth";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@opero/ui";
import { updateBranchAction } from "../actions";

export default async function FilialDetailPage({ params }: { params: { id: string } }) {
  const { db } = await requireTenantSession();
  const branch = await db.branch.findUnique({
    where: { id: params.id },
    include: { users: true },
  });
  if (!branch) notFound();

  const updateWithId = updateBranchAction.bind(null, branch.id);

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">{branch.name}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Editar</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateWithId} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" defaultValue={branch.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input id="address" name="address" defaultValue={branch.address ?? ""} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="active" defaultChecked={branch.active} />
              Ativa
            </label>
            <Button type="submit">Salvar</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Equipe nesta filial</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {branch.users.length === 0 ? (
            <p className="text-muted-foreground">Nenhum membro da equipe atribuído a esta filial ainda.</p>
          ) : (
            branch.users.map((u) => <p key={u.id}>{u.name}</p>)
          )}
        </CardContent>
      </Card>
    </div>
  );
}
