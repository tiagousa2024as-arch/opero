import { notFound } from "next/navigation";
import { requireTenantSession } from "@opero/auth";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select } from "@opero/ui";
import { updateTeamMemberAction } from "../actions";

export default async function MembroDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { tempPassword?: string };
}) {
  const { db } = await requireTenantSession();
  const user = await db.user.findUnique({ where: { id: params.id } });
  if (!user) notFound();

  const updateWithId = updateTeamMemberAction.bind(null, user.id);

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>{user.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {searchParams.tempPassword && (
          <p className="rounded-md border bg-muted/40 p-3 text-sm">
            Senha temporária: <code className="rounded bg-background px-1 py-0.5">{searchParams.tempPassword}</code>{" "}
            — compartilhe com {user.name}.
          </p>
        )}
        <form action={updateWithId} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" defaultValue={user.name} required />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user.email} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Função</Label>
            <Select id="role" name="role" defaultValue={user.role}>
              <option value="OWNER">Proprietário</option>
              <option value="ADMIN">Administrador</option>
              <option value="STAFF">Atendente</option>
              <option value="FINANCE">Financeiro</option>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked={user.active} />
            Ativo
          </label>
          <Button type="submit">Salvar</Button>
        </form>
      </CardContent>
    </Card>
  );
}
