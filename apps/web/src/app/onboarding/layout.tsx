const STEPS = [
  { href: "/onboarding/empresa", label: "Empresa" },
  { href: "/onboarding/equipe", label: "Equipe" },
  { href: "/onboarding/plano", label: "Plano" },
  { href: "/onboarding/concluido", label: "Concluído" },
];

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="border-b bg-background">
        <div className="container flex h-14 items-center justify-between">
          <span className="font-bold text-primary">OPERO</span>
          <ol className="hidden gap-6 text-sm text-muted-foreground sm:flex">
            {STEPS.map((step, i) => (
              <li key={step.href}>
                {i + 1}. {step.label}
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className="container flex justify-center py-12">
        <div className="w-full max-w-lg">{children}</div>
      </div>
    </div>
  );
}
