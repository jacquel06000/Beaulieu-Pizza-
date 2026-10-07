import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { EnterGiveaway } from "@/components/space/enter-giveaway";
import { Alert, Badge, ButtonLink, Card, PageHeader } from "@/components/ui";
import { formatEuros } from "@/lib/config";
import { giveawaysEnabled } from "@/lib/env";
import { canGeneratePlan } from "@/server/access";
import { hasEntered, visibleGiveaways } from "@/server/giveaways";
import { requirePageUser } from "@/server/session";
import { formatDateLong, loadSpaceState } from "@/server/views";

export const metadata: Metadata = { title: "Cadeaux du mois" };

export default async function Page() {
  // Masquée tant que les tirages ne sont pas activés (règlement non validé).
  if (!giveawaysEnabled()) notFound();
  const user = await requirePageUser("/espace/cadeaux");
  const { sub } = await loadSpaceState(user.id);
  const subscriber = canGeneratePlan(sub);
  const db = getDb();
  const list = subscriber ? await visibleGiveaways(db, giveawaysEnabled()) : [];
  const entered = await Promise.all(list.map((g) => hasEntered(db, user.id, g.id)));
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader eyebrow="Réservé aux abonnés" title="Cadeaux du mois">
        Chaque mois, des lots peuvent être attribués par tirage au sort entre les participants, selon un règlement publié.
      </PageHeader>
      <Alert tone="info">L&apos;abonnement ne garantit pas de gagner. Les gagnants sont désignés par tirage au sort, dans les conditions du règlement applicable.</Alert>
      {!subscriber ? (
        <Card>
          <p>Cette page est réservée aux abonnés actifs.</p>
          <ButtonLink href="/tarifs" className="mt-4">Voir l&apos;offre</ButtonLink>
        </Card>
      ) : list.length === 0 ? (
        <Card className="text-center py-10">
          <p className="font-display text-2xl font-bold">Aucun tirage en cours</p>
          <p className="mt-2 text-muted">Les cadeaux du mois seront annoncés ici dès que leur règlement sera publié.</p>
        </Card>
      ) : (
        list.map((g, i) => (
          <Card key={g.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="text-xl font-bold">{g.title}</h2>
              <Badge tone="lime">Valeur : {formatEuros(g.prizeValueCents)}</Badge>
            </div>
            <p className="mt-2 text-ink-soft">{g.prizeDescription}</p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-muted">Participation</dt><dd>du {formatDateLong(g.startsAt)} au {formatDateLong(g.endsAt)}</dd></div>
              <div><dt className="text-muted">Tirage</dt><dd>le {formatDateLong(g.drawAt)} · {g.numberOfWinners} gagnant(s)</dd></div>
              <div className="sm:col-span-2"><dt className="text-muted">Qui peut participer</dt><dd>{g.eligibilityCriteria}</dd></div>
              <div className="sm:col-span-2"><dt className="text-muted">Modalités du tirage</dt><dd>{g.drawMethod}</dd></div>
            </dl>
            <div className="mt-5"><EnterGiveaway id={g.id} entered={entered[i]} /></div>
          </Card>
        ))
      )}
    </div>
  );
}
