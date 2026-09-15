import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@opero/auth";

// This back-office is OPERO's own staff tool, not tenant-facing — it has no
// role in the RBAC matrix because it isn't a per-tenant resource. Gate it
// with an explicit allowlist rather than any tenant role until a real
// "OPERO staff" account concept exists (Phase 4 territory).
const ADMIN_EMAILS = (process.env.OPERO_ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();

  if (!email || !ADMIN_EMAILS.includes(email)) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="flex items-center gap-6 border-b bg-background px-6 py-4">
        <span className="font-bold text-primary">OPERO Admin</span>
        <nav className="flex gap-4 text-sm text-muted-foreground">
          <Link href="/admin/tenants" className="hover:text-foreground">
            Empresas
          </Link>
          <Link href="/admin/auditoria" className="hover:text-foreground">
            Auditoria
          </Link>
        </nav>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
