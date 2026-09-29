import type { Metadata } from "next";
import { getDb } from "@/db";
import { GiveawayAdmin } from "@/components/admin/giveaway-admin";
import { WhopCheck } from "@/components/admin/whop-check";
import { Container, PageHeader } from "@/components/ui";
import { env } from "@/lib/env";
import { listGiveaways } from "@/server/giveaways";
import { requirePageAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Administration", robots: { index: false } };

export default async function Page() {
  await requirePageAdmin();
  const rows = await listGiveaways(getDb());
  const giveaways = rows.map((g) => ({
    ...g,
    startsAt: g.startsAt.toISOString(),
    endsAt: g.endsAt.toISOString(),
    drawAt: g.drawAt.toISOString(),
    legalValidatedAt: g.legalValidatedAt?.toISOString() ?? null,
  }));
  return (
    <Container className="py-10 max-w-4xl space-y-8">
      <PageHeader eyebrow="Administration" title="Pilotage Runelio" />
      <WhopCheck />
      <section>
        <h2 className="text-2xl font-bold mb-4">Cadeaux du mois</h2>
        <GiveawayAdmin giveaways={giveaways} enabled={env().GIVEAWAYS_ENABLED} />
      </section>
    </Container>
  );
}
