import Link from "next/link";

const TABS = [
  { href: "/configuracoes/empresa", label: "Empresa" },
  { href: "/configuracoes/servicos", label: "Serviços" },
  { href: "/configuracoes/pagamentos", label: "Pagamentos" },
  { href: "/configuracoes/notificacoes", label: "Notificações" },
  { href: "/configuracoes/whatsapp", label: "WhatsApp" },
  { href: "/configuracoes/nota-fiscal", label: "Nota fiscal" },
  { href: "/configuracoes/integracoes", label: "Integrações" },
  { href: "/configuracoes/marca-branca", label: "Marca" },
  { href: "/configuracoes/plano-e-cobranca", label: "Plano e cobrança" },
  { href: "/configuracoes/seguranca", label: "Segurança" },
  { href: "/configuracoes/usuario", label: "Meu perfil" },
];

export default function ConfiguracoesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Configurações</h1>
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
