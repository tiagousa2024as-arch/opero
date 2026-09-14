import { requireTenantSession } from "@opero/auth";
import { Button, Card, CardContent, Input, Label } from "@opero/ui";
import { updateUserProfileAction } from "../actions";

export default async function ConfiguracoesUsuarioPage() {
  const { db, session } = await requireTenantSession();
  const user = await db.user.findUniqueOrThrow({ where: { id: session.user.id } });

  return (
    <Card className="max-w-lg">
      <CardContent className="p-6">
        <form action={updateUserProfileAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" defaultValue={user.name} required />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user.email} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova senha (opcional)</Label>
            <Input id="newPassword" name="newPassword" type="password" minLength={8} />
          </div>
          <Button type="submit">Salvar</Button>
        </form>
      </CardContent>
    </Card>
  );
}
