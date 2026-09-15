import { Button, Input, Label, Textarea } from "@opero/ui";
import type { Customer } from "@opero/database";

export function CustomerForm({
  action,
  defaultValues,
}: {
  action: (formData: FormData) => void;
  defaultValues?: Partial<Customer>;
}) {
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" name="name" required defaultValue={defaultValues?.name ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" name="phone" defaultValue={defaultValues?.phone ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={defaultValues?.email ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="document">CPF/CNPJ</Label>
          <Input id="document" name="document" defaultValue={defaultValues?.document ?? ""} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Endereço</Label>
        <Input id="address" name="address" defaultValue={defaultValues?.address ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
        <Input id="tags" name="tags" defaultValue={defaultValues?.tags?.join(", ") ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea id="notes" name="notes" defaultValue={defaultValues?.notes ?? ""} />
      </div>
      <Button type="submit">Salvar</Button>
    </form>
  );
}
