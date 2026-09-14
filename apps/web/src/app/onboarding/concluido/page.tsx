import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@opero/ui";

export default function OnboardingConcluidoPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tudo pronto! 🎉</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Sua conta OPERO está configurada. Agora é só cadastrar seus primeiros clientes e abrir sua primeira ordem
          de serviço.
        </p>
        <Link href="/dashboard">
          <Button className="w-full">Ir para o painel</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
