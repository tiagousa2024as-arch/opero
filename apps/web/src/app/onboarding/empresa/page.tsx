import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select } from "@opero/ui";
import { updateEmpresaAction } from "../actions";

export default function OnboardingEmpresaPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fale um pouco sobre sua empresa</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={updateEmpresaAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da empresa</Label>
            <Input id="name" name="name" required minLength={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ (opcional)</Label>
            <Input id="cnpj" name="cnpj" placeholder="00.000.000/0000-00" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="segment">Segmento</Label>
            <Select id="segment" name="segment" defaultValue="oficina">
              <option value="oficina">Oficina mecânica</option>
              <option value="salao">Salão de beleza</option>
              <option value="clinica_estetica">Clínica de estética</option>
              <option value="clinica_odontologica">Clínica odontológica</option>
              <option value="assistencia_tecnica">Assistência técnica</option>
              <option value="pet_shop">Pet shop</option>
              <option value="outro">Outro prestador de serviço</option>
            </Select>
          </div>
          <Button type="submit" className="w-full">
            Continuar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
