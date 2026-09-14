import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select } from "@opero/ui";
import { createTeamMemberAction } from "../actions";

export default function NovoMembroPage() {
  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Novo membro da equipe</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={createTeamMemberAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Função</Label>
            <Select id="role" name="role" defaultValue="STAFF">
              <option value="ADMIN">Administrador</option>
              <option value="STAFF">Atendente</option>
              <option value="FINANCE">Financeiro</option>
            </Select>
          </div>
          <Button type="submit" className="w-full">
            Adicionar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
