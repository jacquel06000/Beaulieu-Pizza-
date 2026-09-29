import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { assertSameOrigin, handle } from "@/server/api";
import { cancelSubscription } from "@/server/billing";
import { layoutEmail, sendMail } from "@/server/mailer";
import { requireApiUser } from "@/server/session";
import { whopGateway } from "@/server/whop";

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  const u = await requireApiUser();
  const r = await cancelSubscription(getDb(), whopGateway, u.id);
  if (!r.alreadyCanceled) {
    const end = r.currentPeriodEnd
      ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" }).format(r.currentPeriodEnd)
      : "la fin de la période en cours";
    // Confirmation de résiliation (date de prise d'effet), exigée pour la résiliation en ligne.
    await sendMail({
      to: u.email,
      subject: "Runelio — confirmation de résiliation",
      ...layoutEmail(
        "Votre résiliation est enregistrée",
        `Votre abonnement Runelio ne sera pas renouvelé. Vous conservez l'accès jusqu'au ${end}, date de prise d'effet de la résiliation. Aucun nouveau prélèvement ne sera effectué.`,
      ),
    }).catch((e) => console.error("[mail] confirmation résiliation", e));
  }
  return NextResponse.json(r);
});
