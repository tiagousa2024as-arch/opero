import { Button, Card, CardContent, CardHeader, CardTitle } from "@opero/ui";
import { selectPlanoAction } from "../actions";

const PLANS = [
  { id: "essencial", name: "Essencial", price: "R$ 79/mês" },
  { id: "profissional", name: "Profissional", price: "R$ 149/mês" },
  { id: "trial", name: "Continuar no teste grátis", price: "14 dias" },
];

export default function OnboardingPlanoPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Escolha seu plano</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {PLANS.map((plan) => (
          <form key={plan.id} action={selectPlanoAction}>
            <input type="hidden" name="plan" value={plan.id} />
            <Button type="submit" variant={plan.id === "trial" ? "outline" : "default"} className="w-full justify-between">
              <span>{plan.name}</span>
              <span className="text-xs opacity-80">{plan.price}</span>
            </Button>
          </form>
        ))}
      </CardContent>
    </Card>
  );
}
