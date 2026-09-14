"use client";

import { useMemo, useState } from "react";
import { Button, Input, Label, Select, Textarea, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@opero/ui";
import { Trash2 } from "lucide-react";

type Item = { description: string; quantity: number; unitPrice: number; type: "SERVICE" | "PART" };

type Option = { id: string; name: string };

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function ServiceOrderForm({
  action,
  customers,
  users,
  defaultValues,
}: {
  action: (formData: FormData) => void;
  customers: Option[];
  users: Option[];
  defaultValues?: {
    customerId?: string;
    assignedUserId?: string | null;
    scheduledAt?: Date | null;
    notes?: string | null;
    items?: Item[];
  };
}) {
  const [items, setItems] = useState<Item[]>(defaultValues?.items?.length ? defaultValues.items : []);
  const [draft, setDraft] = useState<Item>({ description: "", quantity: 1, unitPrice: 0, type: "SERVICE" });

  const total = useMemo(() => items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0), [items]);

  function addItem() {
    if (!draft.description.trim() || draft.quantity <= 0) return;
    setItems((prev) => [...prev, draft]);
    setDraft({ description: "", quantity: 1, unitPrice: 0, type: "SERVICE" });
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const scheduledAtDefault = defaultValues?.scheduledAt
    ? new Date(defaultValues.scheduledAt.getTime() - defaultValues.scheduledAt.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
    : "";

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="itemsJson" value={JSON.stringify(items)} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="customerId">Cliente</Label>
          <Select id="customerId" name="customerId" required defaultValue={defaultValues?.customerId ?? ""}>
            <option value="" disabled>
              Selecione um cliente
            </option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="assignedUserId">Responsável</Label>
          <Select id="assignedUserId" name="assignedUserId" defaultValue={defaultValues?.assignedUserId ?? ""}>
            <option value="">Sem responsável</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="scheduledAt">Agendado para</Label>
          <Input id="scheduledAt" name="scheduledAt" type="datetime-local" defaultValue={scheduledAtDefault} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea id="notes" name="notes" defaultValue={defaultValues?.notes ?? ""} />
      </div>

      <div className="space-y-3 rounded-md border p-4">
        <p className="font-medium">Itens</p>
        {items.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Qtd</TableHead>
                <TableHead>Valor unit.</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, i) => (
                <TableRow key={i}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.type === "PART" ? "Peça" : "Serviço"}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{formatBRL(item.unitPrice)}</TableCell>
                  <TableCell>{formatBRL(item.quantity * item.unitPrice)}</TableCell>
                  <TableCell>
                    <button type="button" onClick={() => removeItem(i)} aria-label="Remover item">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_1fr_auto] sm:items-end">
          <div className="space-y-1">
            <Label htmlFor="draft-description">Descrição</Label>
            <Input
              id="draft-description"
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="draft-type">Tipo</Label>
            <Select
              id="draft-type"
              value={draft.type}
              onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as Item["type"] }))}
            >
              <option value="SERVICE">Serviço</option>
              <option value="PART">Peça</option>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="draft-quantity">Qtd</Label>
            <Input
              id="draft-quantity"
              type="number"
              min={0}
              step="0.01"
              value={draft.quantity}
              onChange={(e) => setDraft((d) => ({ ...d, quantity: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="draft-price">Valor unit.</Label>
            <Input
              id="draft-price"
              type="number"
              min={0}
              step="0.01"
              value={draft.unitPrice}
              onChange={(e) => setDraft((d) => ({ ...d, unitPrice: Number(e.target.value) }))}
            />
          </div>
          <Button type="button" variant="secondary" onClick={addItem}>
            Adicionar
          </Button>
        </div>

        <p className="text-right font-semibold">Total: {formatBRL(total)}</p>
      </div>

      <Button type="submit">Salvar ordem de serviço</Button>
    </form>
  );
}
