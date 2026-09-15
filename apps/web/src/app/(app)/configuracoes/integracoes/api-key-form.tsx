"use client";

import { useState } from "react";
import { Button, Input, Label } from "@opero/ui";
import { createApiKeyAction } from "./actions";

export function ApiKeyForm() {
  const [newKey, setNewKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    try {
      const { plaintextKey } = await createApiKeyAction(new FormData(e.currentTarget));
      setNewKey(plaintextKey);
      e.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar a chave.");
    }
  }

  return (
    <div className="space-y-3">
      {newKey && (
        <div className="rounded-md border bg-muted/40 p-3 text-sm">
          <p className="font-medium">Copie sua chave agora — ela não será mostrada novamente:</p>
          <code className="mt-1 block break-all rounded bg-background px-2 py-1">{newKey}</code>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label htmlFor="name">Nome da chave</Label>
          <Input id="name" name="name" placeholder="ex: Integração com meu ERP" required />
        </div>
        <Button type="submit">Gerar chave</Button>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
