import { notFound } from "next/navigation";
import { prisma } from "@opero/database";
import { Card, CardContent, CardHeader, CardTitle } from "@opero/ui";
import { BookingForm } from "./booking-form";

export default async function AgendarPublicoPage({ params }: { params: { token: string } }) {
  const customer = await prisma.customer.findUnique({ where: { publicBookingToken: params.token } });
  if (!customer) notFound();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agendar horário</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">Olá, {customer.name}! Escolha a data e o horário desejado.</p>
        <BookingForm token={params.token} />
      </CardContent>
    </Card>
  );
}
