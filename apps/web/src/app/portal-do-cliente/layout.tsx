// Public, unauthenticated pages accessed via a capability token in the URL
// (ServiceOrder.publicToken / Customer.publicBookingToken) — not behind
// the auth middleware, and never renders anything from a Prisma query
// that wasn't itself filtered by that exact token.
export default function PortalDoClienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <header className="border-b bg-background px-6 py-4">
        <span className="text-lg font-bold text-primary">OPERO</span>
      </header>
      <main className="flex flex-1 items-start justify-center p-4 py-12">
        <div className="w-full max-w-lg">{children}</div>
      </main>
    </div>
  );
}
