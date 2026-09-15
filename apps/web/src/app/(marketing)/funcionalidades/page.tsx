import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@opero/ui";

const FEATURES = [
  { href: "/funcionalidades/agendamento", title: "Agendamento", desc: "Agenda visual por dia, semana ou mês, com confirmação de horário." },
  { href: "/funcionalidades/ordens-de-servico", title: "Ordens de Serviço", desc: "Abra, acompanhe itens e peças, e feche ordens de serviço com clareza." },
  { href: "/funcionalidades/financeiro", title: "Financeiro", desc: "Fluxo de caixa, contas a pagar e a receber em tempo real." },
];

export const metadata = { title: "Funcionalidades" };

export default function FuncionalidadesPage() {
  return (
    <div className="container py-16">
      <h1 className="text-4xl font-bold">Funcionalidades</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Um sistema único para cuidar de clientes, agenda, ordens de serviço, financeiro e cobrança.
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <Link key={f.href} href={f.href}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>{f.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{f.desc}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
