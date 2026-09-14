import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@opero/ui";

export const metadata = { title: "Preços" };

const PLANS = [
  { name: "Essencial", price: "R$ 79/mês", desc: "Até 2 usuários", features: ["Clientes e agenda", "Ordens de serviço", "Cobrança via Pix/boleto/cartão"] },
  { name: "Profissional", price: "R$ 149/mês", desc: "Até 5 usuários", features: ["Tudo do Essencial", "Financeiro completo", "Relatórios"] },
  { name: "Negócio", price: "Sob consulta", desc: "Usuários ilimitados", features: ["Tudo do Profissional", "Múltiplas filiais (em breve)", "Suporte prioritário"] },
];

export default function PrecosPage() {
  return (
    <div className="container py-16">
      <h1 className="text-center text-4xl font-bold">Preços simples, sem surpresa</h1>
      <p className="mt-4 text-center text-muted-foreground">Comece grátis por 14 dias, sem cartão de crédito.</p>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => (
          <Card key={plan.name}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <p className="text-2xl font-bold">{plan.price}</p>
              <p className="text-sm text-muted-foreground">{plan.desc}</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {plan.features.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
              <Link href="/cadastro" className="mt-6 block">
                <Button className="w-full">Começar</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
