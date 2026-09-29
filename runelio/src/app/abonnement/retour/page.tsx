import type { Metadata } from "next";
import { PaymentReturn } from "@/components/space/payment-return";
import { Card, Container } from "@/components/ui";
import { requirePageUser } from "@/server/session";

export const metadata: Metadata = { title: "Paiement", robots: { index: false } };

export default async function Page() {
  await requirePageUser("/abonnement/retour");
  return (
    <Container className="py-16 max-w-lg">
      <Card className="p-8">
        <PaymentReturn />
      </Card>
    </Container>
  );
}
