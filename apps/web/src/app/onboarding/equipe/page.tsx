"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select } from "@opero/ui";
import { inviteTeamMemberAction } from "../actions";

export default function OnboardingEquipePage() {
  const [invited, setInvited] = useState<{ email: string; tempPassword: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    try {
      const result = await inviteTeamMemberAction(formData);
      setInvited((prev) => [...prev, result]);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível convidar este membro.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Convide sua equipe (opcional)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
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
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" variant="outline" className="w-full">
            Adicionar membro
          </Button>
        </form>

        {invited.length > 0 && (
          <div className="space-y-2 rounded-md border bg-muted/40 p-4 text-sm">
            <p className="font-medium">Senhas temporárias — compartilhe com sua equipe:</p>
            {invited.map((m) => (
              <p key={m.email}>
                {m.email}: <code className="rounded bg-background px-1 py-0.5">{m.tempPassword}</code>
              </p>
            ))}
          </div>
        )}

        <Link href="/onboarding/plano">
          <Button className="w-full">Continuar</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
