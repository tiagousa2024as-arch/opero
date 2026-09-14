"use client";

import { useState } from "react";
import { Button, Input, Label } from "@opero/ui";
import { requestAppointmentAction } from "./actions";

export function BookingForm({ token }: { token: string }) {
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    try {
      await requestAppointmentAction(token, new FormData(e.currentTarget));
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível agendar.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return <p className="text-sm">Solicitação enviada! Em breve a equipe confirma seu horário.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="startTime">Data e horário desejado</Label>
        <Input id="startTime" name="startTime" type="datetime-local" required />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full">
        Solicitar agendamento
      </Button>
    </form>
  );
}
