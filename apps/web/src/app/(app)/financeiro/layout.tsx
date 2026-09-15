import Link from "next/link";

const TABS = [
  { href: "/financeiro/fluxo-de-caixa", label: "Fluxo de caixa" },
  { href: "/financeiro/contas-a-pagar", label: "Contas a pagar" },
  { href: "/financeiro/contas-a-receber", label: "Contas a receber" },
  { href: "/financeiro/relatorios", label: "Relatórios" },
];

export default function FinanceiroLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Financeiro</h1>
      <div className="flex flex-wrap gap-2 border-b pb-2">
        {TABS.map((tab) => (
          <Link key={tab.href} href={tab.href} className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
            {tab.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
