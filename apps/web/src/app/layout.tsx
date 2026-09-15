import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: {
    default: "OPERO — Gestão para o seu negócio de serviços",
    template: "%s | OPERO",
  },
  description:
    "Clientes, agendamento, ordens de serviço e financeiro em um só lugar. Feito para oficinas, salões, clínicas e assistências técnicas no Brasil.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
