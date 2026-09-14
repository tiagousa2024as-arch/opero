export const metadata = { title: "Sobre" };

export default function SobrePage() {
  return (
    <div className="container py-16">
      <h1 className="text-4xl font-bold">Sobre a OPERO</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        A OPERO nasceu para resolver um problema simples: pequenos negócios de serviço no Brasil ainda rodam em
        planilha, papel e WhatsApp. Construímos um sistema que funciona do jeito que esses negócios já trabalham —
        com Pix, com celular na mão, sem curva de aprendizado.
      </p>
    </div>
  );
}
