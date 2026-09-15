import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@opero/ui";

const AUDIENCES = [
  "Oficinas mecânicas",
  "Salões de beleza",
  "Clínicas de estética e odontologia",
  "Assistências técnicas",
  "Pet shops",
  "Prestadores de serviço em geral",
];

const FEATURES = [
  { title: "Clientes", desc: "Todo o histórico de cada cliente — atendimentos, ordens de serviço e cobranças — em um só lugar." },
  { title: "Agendamento", desc: "Agenda visual por dia, semana ou mês. Sem mais confusão de horário pelo WhatsApp." },
  { title: "Ordens de Serviço", desc: "Abra, acompanhe e feche ordens de serviço com itens, peças e status claros." },
  { title: "Financeiro", desc: "Fluxo de caixa, contas a pagar e a receber — sem depender de planilha." },
  { title: "Cobrança", desc: "Cobre por Pix, boleto ou cartão com um link e receba a confirmação automaticamente." },
];

export default function HomePage() {
  return (
    <>
      <section className="container py-20 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          Chega de planilha, papel e WhatsApp para gerir seu negócio
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          OPERO reúne clientes, agenda, ordens de serviço, financeiro e cobrança em um único sistema — feito para o
          jeito que o pequeno negócio brasileiro trabalha: no Pix, no WhatsApp e no boca a boca.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/cadastro">
            <Button size="lg">Teste grátis</Button>
          </Link>
          <Link href="/funcionalidades">
            <Button size="lg" variant="outline">
              Ver funcionalidades
            </Button>
          </Link>
        </div>
      </section>

      <section className="border-t bg-muted/30 py-16">
        <div className="container">
          <p className="text-center text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Feito para o seu tipo de negócio
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {AUDIENCES.map((a) => (
              <span key={a} className="rounded-full border bg-background px-4 py-1.5 text-sm">
                {a}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-16">
        <h2 className="text-center text-3xl font-bold">Tudo que você precisa, sem complicação</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title}>
              <CardHeader>
                <CardTitle>{f.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{f.desc}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container pb-20 text-center">
        <h2 className="text-2xl font-bold">Pronto para organizar seu negócio?</h2>
        <p className="mt-2 text-muted-foreground">Comece grátis, sem cartão de crédito.</p>
        <Link href="/cadastro" className="mt-6 inline-block">
          <Button size="lg">Criar minha conta</Button>
        </Link>
      </section>
    </>
  );
}
