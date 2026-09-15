export const metadata = { title: "Financeiro" };

export default function FinanceiroPage() {
  return (
    <div className="container py-16">
      <h1 className="text-4xl font-bold">Financeiro</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Veja seu fluxo de caixa, contas a pagar e a receber sem precisar de planilha. Cada cobrança paga vira um
        lançamento automaticamente.
      </p>
    </div>
  );
}
