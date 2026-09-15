"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@opero/ui";
import { cn } from "@opero/ui";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Wrench,
  Wallet,
  Receipt,
  UsersRound,
  Settings,
  LogOut,
  Menu,
  Boxes,
  Building2,
  Percent,
} from "lucide-react";
import { useState } from "react";
import { hexToHslTriplet } from "@/lib/hex-to-hsl";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard, resource: null },
  { href: "/clientes", label: "Clientes", icon: Users, resource: "clientes" },
  { href: "/agenda", label: "Agenda", icon: CalendarDays, resource: "agenda" },
  { href: "/ordens-de-servico", label: "Ordens de Serviço", icon: Wrench, resource: "ordens_de_servico" },
  { href: "/estoque", label: "Estoque", icon: Boxes, resource: "estoque" },
  { href: "/financeiro/fluxo-de-caixa", label: "Financeiro", icon: Wallet, resource: "financeiro" },
  { href: "/cobrancas", label: "Cobranças", icon: Receipt, resource: "cobrancas" },
  { href: "/filiais", label: "Filiais", icon: Building2, resource: "filiais" },
  { href: "/comissoes", label: "Comissões", icon: Percent, resource: "comissoes" },
  { href: "/equipe", label: "Equipe", icon: UsersRound, resource: "equipe" },
  { href: "/configuracoes/empresa", label: "Configurações", icon: Settings, resource: "configuracoes" },
] as const;

export function AppShell({
  children,
  userName,
  tenantName,
  allowedResources,
  brandName,
  brandLogoUrl,
  primaryColorHex,
}: {
  children: React.ReactNode;
  userName: string;
  tenantName: string;
  allowedResources: Set<string>;
  brandName?: string;
  brandLogoUrl?: string;
  primaryColorHex?: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = NAV_ITEMS.filter((item) => !item.resource || allowedResources.has(item.resource));
  const displayName = brandName || "OPERO";
  const primaryHsl = primaryColorHex ? hexToHslTriplet(primaryColorHex) : null;

  const brandMark = brandLogoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- tenant-supplied external URL, not a local asset Next can optimize
    <img src={brandLogoUrl} alt={displayName} className="h-6 max-w-[8rem] object-contain" />
  ) : (
    <span className="font-bold text-primary">{displayName}</span>
  );

  const nav = (
    <nav className="flex flex-col gap-1 p-3">
      {items.map((item) => {
        const active = pathname.startsWith(item.href.split("/").slice(0, 2).join("/"));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div
      className="flex min-h-screen flex-col md:flex-row"
      style={primaryHsl ? ({ "--primary": primaryHsl, "--ring": primaryHsl } as React.CSSProperties) : undefined}
    >
      <aside className="hidden w-64 shrink-0 border-r bg-background md:block">
        <div className="flex h-14 items-center border-b px-4">{brandMark}</div>
        {nav}
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b bg-background px-4">
          <div className="flex items-center gap-2 md:hidden">
            <button onClick={() => setMobileOpen((v) => !v)} aria-label="Abrir menu">
              <Menu className="h-5 w-5" />
            </button>
            {brandMark}
          </div>
          <div className="hidden text-sm text-muted-foreground md:block">{tenantName}</div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm sm:inline">{userName}</span>
            <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: "/login" })} aria-label="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {mobileOpen && (
          <div className="border-b bg-background md:hidden">{nav}</div>
        )}

        <main className="flex-1 bg-muted/20 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
