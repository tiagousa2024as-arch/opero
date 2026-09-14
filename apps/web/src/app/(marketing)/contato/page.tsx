import { Button, Input, Label, Textarea } from "@opero/ui";

export const metadata = { title: "Contato" };

export default function ContatoPage() {
  return (
    <div className="container max-w-lg py-16">
      <h1 className="text-4xl font-bold">Fale com a gente</h1>
      <p className="mt-4 text-muted-foreground">Dúvidas, sugestões ou quer uma demonstração? Escreva pra gente.</p>
      <form className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="message">Mensagem</Label>
          <Textarea id="message" name="message" rows={5} required />
        </div>
        <Button type="submit" className="w-full">
          Enviar
        </Button>
      </form>
    </div>
  );
}
