import type { Metadata } from "next";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { trainingPlan } from "@/db/schema";
import { addDays, DAY_LABELS, diffDays, formatDateFr, mondayOf, todayIso } from "@/domain/dates";
import { assessRealism, computePaces, formatPace } from "@/domain/planning/running";
import { GOALS } from "@/domain/sports";
import { GenerateButton } from "@/components/space/generate-button";
import { AccessBanner } from "@/components/space/access-banner";
import { Alert, ButtonLink, Card, PageHeader } from "@/components/ui";
import { EXPERIENCE_LABELS, formatHms, LEVEL_LABELS, SLOT_LABELS } from "@/lib/labels";
import { canGeneratePlan } from "@/server/access";
import { profileToInput } from "@/server/plans";
import { requirePageUser } from "@/server/session";
import { loadSpaceState } from "@/server/views";

export const metadata: Metadata = { title: "Récapitulatif" };

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:gap-6">
      <dt className="w-56 shrink-0 text-sm text-muted">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}

export default async function Page() {
  const user = await requirePageUser("/espace/recapitulatif");
  const { sub, profile, pending, access, lastPayment } = await loadSpaceState(user.id);
  if (!profile) redirect("/espace/questionnaire");
  const input = profileToInput(profile);
  const start = addDays(todayIso(), 1);
  const race = input.raceDate ?? addDays(mondayOf(start), (input.horizonWeeks ?? 1) * 7 - 1);
  const weeks = Math.floor(diffDays(mondayOf(start), race) / 7) + 1;
  const warnings = race >= start ? assessRealism(input, weeks, computePaces(input)) : [];
  const paces = computePaces(input);
  const subscribed = canGeneratePlan(sub);
  const [plan] = subscribed
    ? await getDb().select({ id: trainingPlan.id }).from(trainingPlan).where(and(eq(trainingPlan.userId, user.id), eq(trainingPlan.status, "active")))
    : [];
  const usable = profile.availableDays.filter((d) => !profile.restDays.includes(d));

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader eyebrow="Avant génération" title="Récapitulatif de votre demande">
        Vérifiez vos réponses. Le programme sera construit uniquement à partir de ces informations.
      </PageHeader>
      <AccessBanner access={access} periodEnd={sub?.currentPeriodEnd ?? null} pending={pending} lastPaymentStatus={lastPayment?.status} />
      {race < start && <Alert tone="critical">La date de course est passée : modifiez le questionnaire.</Alert>}
      {warnings.map((w) => (
        <Alert key={w.code} tone={w.severity === "critical" ? "critical" : w.severity === "warning" ? "warning" : "info"} title={w.severity === "critical" ? "Point d'attention important" : "À noter"}>
          {w.message}
        </Alert>
      ))}
      <Card>
        <dl className="divide-y divide-line">
          <Row k="Objectif" v={GOALS[input.goal].label} />
          <Row k="Échéance" v={input.raceDate ? `Course le ${formatDateFr(input.raceDate, { weekday: "long", day: "numeric", month: "long", year: "numeric" })} (${weeks} semaines)` : `Horizon de ${input.horizonWeeks} semaines`} />
          <Row k="Objectif chronométrique" v={input.targetTimeSec ? formatHms(input.targetTimeSec) : "Aucun — objectif : finir"} />
          <Row k="Niveau" v={LEVEL_LABELS[input.level]} />
          <Row k="Expérience" v={EXPERIENCE_LABELS[input.experience]} />
          <Row k="Volume actuel" v={`${input.runsPerWeek} sortie(s) · ${input.weeklyVolumeKm} km par semaine · plus longue sortie ${input.longestRunKm} km`} />
          <Row k="Résultat de référence" v={input.refDistanceKm ? `${input.refDistanceKm} km en ${formatHms(input.refTimeSec)}${paces ? ` (allure facile estimée ${formatPace(paces.easyMin)}–${formatPace(paces.easyMax)} /km)` : ""}` : "Non renseigné"} />
          <Row
            k="Jours disponibles"
            v={usable.map((d) => `${DAY_LABELS[d]}${profile.timeSlots[String(d)] && profile.timeSlots[String(d)] !== "flexible" ? ` (${SLOT_LABELS[profile.timeSlots[String(d)]].toLowerCase()})` : ""}`).join(", ")}
          />
          <Row k="Jours de repos" v={profile.restDays.length ? profile.restDays.map((d) => DAY_LABELS[d]).join(", ") : "Aucun imposé"} />
          <Row k="Sortie longue" v={profile.longRunDay != null ? DAY_LABELS[profile.longRunDay] : "Choisie par Runelio"} />
          <Row k="Durée maximale" v={`${profile.maxSessionMinutes} minutes par séance`} />
        </dl>
        <ButtonLink href="/espace/questionnaire" variant="secondary" className="mt-4">Modifier mes réponses</ButtonLink>
      </Card>
      <Card className="bg-ink text-white ring-0">
        <h2 className="text-xl font-bold">Prêt ?</h2>
        <p className="mt-2 text-white/75 text-sm leading-relaxed">
          {subscribed
            ? "Votre abonnement est actif : votre programme sera généré immédiatement."
            : "La génération du programme est réservée aux abonnés. Vous verrez le détail de l'offre avant tout paiement."}
        </p>
        <div className="mt-5">
          <GenerateButton subscribed={subscribed} hasPlan={Boolean(plan)} />
        </div>
        <p className="mt-4 text-xs text-white/60">Programme d&apos;entraînement général : il ne constitue pas un avis médical et ne garantit pas le résultat de votre course.</p>
      </Card>
    </div>
  );
}
