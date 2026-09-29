import type { Metadata } from "next";
import { getDb } from "@/db";
import { formatDateFr, todayIso } from "@/domain/dates";
import { formatPace } from "@/domain/planning/running";
import { GOALS } from "@/domain/sports";
import { AccessBanner } from "@/components/space/access-banner";
import { GenerateButton } from "@/components/space/generate-button";
import { PlanCalendar } from "@/components/space/plan-calendar";
import { Alert, ButtonLink, Card, PageHeader } from "@/components/ui";
import { canGeneratePlan, canViewPlan } from "@/server/access";
import { getActivePlan } from "@/server/plans";
import { requirePageUser } from "@/server/session";
import { loadSpaceState } from "@/server/views";

export const metadata: Metadata = { title: "Mon programme" };

export default async function Page() {
  const user = await requirePageUser("/espace/programme");
  const { sub, pending, access, lastPayment, profile } = await loadSpaceState(user.id);

  if (!canViewPlan(sub)) {
    return (
      <div className="max-w-2xl space-y-6">
        <PageHeader eyebrow="Programme" title="Votre programme vous attend" />
        <AccessBanner access={access} periodEnd={sub?.currentPeriodEnd ?? null} pending={pending} lastPaymentStatus={lastPayment?.status} />
        <Card>
          <p className="leading-relaxed">Le programme personnalisé est réservé aux abonnés. Aucun programme n&apos;est généré ni affiché sans abonnement actif.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <ButtonLink href={profile ? "/espace/recapitulatif" : "/espace/questionnaire"}>{profile ? "Voir mon récapitulatif" : "Remplir le questionnaire"}</ButtonLink>
            <ButtonLink href="/tarifs" variant="secondary">Voir l&apos;offre</ButtonLink>
          </div>
        </Card>
      </div>
    );
  }

  const data = await getActivePlan(getDb(), user.id);
  if (!data) {
    return (
      <div className="max-w-2xl space-y-6">
        <PageHeader eyebrow="Programme" title="Générez votre programme" />
        <Card>
          <p className="mb-5">Votre abonnement est actif. Vérifiez votre récapitulatif puis lancez la génération.</p>
          <GenerateButton subscribed={canGeneratePlan(sub)} hasPlan={false} />
        </Card>
      </div>
    );
  }
  const { plan, weeks, sessions } = data;
  const paces = plan.paces;
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Mon programme" title={`${GOALS[plan.goal].label}`}>
        Du {formatDateFr(plan.startDate, { day: "numeric", month: "long" })} au {formatDateFr(plan.raceDate, { day: "numeric", month: "long", year: "numeric" })} · {weeks.length} semaines
        {paces ? ` · allure facile ${formatPace(paces.easyMin)}–${formatPace(paces.easyMax)} /km` : ""}
      </PageHeader>
      <AccessBanner access={access} periodEnd={sub?.currentPeriodEnd ?? null} pending={pending} lastPaymentStatus={lastPayment?.status} />
      {plan.warnings.map((w) => (
        <Alert key={w.code} tone={w.severity === "critical" ? "critical" : w.severity === "warning" ? "warning" : "info"}>{w.message}</Alert>
      ))}
      <div className="flex flex-wrap gap-3">
        {canGeneratePlan(sub) && <ButtonLink href="/espace/disponibilites" variant="secondary">Modifier mes disponibilités et réajuster</ButtonLink>}
        <ButtonLink href="/espace/recapitulatif" variant="ghost">Changer d&apos;objectif</ButtonLink>
      </div>
      <PlanCalendar
        weeks={weeks}
        sessions={sessions.map((s) => ({ ...s, completedAt: s.completedAt?.toISOString() ?? null }))}
        today={todayIso()}
        readOnly={!canViewPlan(sub)}
      />
      <p className="text-xs text-muted leading-relaxed">
        Ces séances sont des recommandations générales d&apos;entraînement. Adaptez-les à vos sensations et arrêtez-vous en cas de douleur ou de malaise. Runelio ne fournit pas d&apos;avis médical et ne garantit pas le résultat de votre course.
      </p>
    </div>
  );
}
