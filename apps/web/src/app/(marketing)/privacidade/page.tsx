export const metadata = { title: "Privacidade" };

export default function PrivacidadePage() {
  return (
    <div className="container max-w-3xl py-16 prose">
      <h1 className="text-4xl font-bold">Política de Privacidade</h1>
      <p className="mt-4 text-muted-foreground">
        Tratamos dados pessoais de clientes e usuários em conformidade com a Lei Geral de Proteção de Dados (LGPD).
        Coletamos apenas os dados necessários para a prestação do serviço (nome, contato, CPF/CNPJ quando aplicável),
        armazenamos com controles de acesso por empresa (tenant) e oferecemos a qualquer titular a possibilidade de
        solicitar a exportação ou exclusão de seus dados através do suporte.
      </p>
    </div>
  );
}
