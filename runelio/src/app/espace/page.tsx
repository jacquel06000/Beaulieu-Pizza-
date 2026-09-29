import { and, asc, eq, gte } from "drizzle-orm";
import { getDb } from "@/db";
import { trainingPlan, trainingSession } from "@/db/schema";
import { addDays, formatDateFr, todayIso } from "@/domain/dates";
import { GOALS } from "@/domain/sports";
import { AccessBanner } from "@/components/space/access-banner";
import { Badge, ButtonLink, Card, PageHeader } from "@/components/ui";
import { SESSION_STYLE } from "@/lib/labels";
import { canViewPlan } from "@/server/access";
import { requirePageUser } from "@/server/session";
import { loadSpaceState } from "@/server/views";

export default async function Dashboard() {
  const user = await requirePageUser();
  const { sub, profile, pending, access, lastPayment } = await loadSpaceState(user.id);
  let upcoming: (typeof trainingSession.$inferSelect)[] = [];
  let hasPlan = false;
  if (canViewPlan(sub)) {
    const db = getDb();
    const [plan] = await db.select().from(trainingPlan).where(and(eq(trainingPlan.userId, user.id), eq(trainingPlan.status, "active")));
    if (plan) {
      hasPlan = true;
      upcoming = await db
        .select()
        .from(trainingSession)
        .where(and(eq(trainingSession.planId, plan.id), gte(trainingSession.date, todayIso())))
        .orderBy(asc(trainingSession.date))
        .limit(3);
    }
  }
  const steps = [
    { done: true, label: "Compte créé", href: null },
    { done: Boolean(profile), label: "Questionnaire rempli", href: "/espace/questionnaire" },
    { done: access === "active" || access === "canceling" || access === "past_due", label: "Abonnement actif", href: "/espace/abonnement" },
    { done: hasPlan, label: "Programme généré", href: "/espace/recapitulatif" },
  ];
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Mon espace" title={`Bonjour ${user.name} 👋`} />
      <AccessBanner access={access} periodEnd={sub?.currentPeriodEnd ?? null} pending={pending} lastPaymentStatus={lastPayment?.status} />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <h2 className="text-xl font-bold">Prochaines séances</h2>
          {upcoming.length ? (
            <ul className="mt-4 space-y-3">
              {upcoming.map((s) => (
                <li key={s.id} className="flex items-center gap-4 rounded-xl bg-paper p-3">
                  <span className={`rounded-lg px-2 py-1 text-xs font-bold ${SESSION_STYLE[s.type]?.className ?? ""}`}>{formatDateFr(s.date, { weekday: "short", day: "numeric" })}</span>
                  <span className="flex-1">
                    <span className="block font-semibold">{s.title}</span>
                    <span className="text-sm text-muted">{s.durationMin} min{s.distanceKm ? ` · ≈ ${s.distanceKm} km` : ""} · {s.intensity.label}</span>
                  </span>
                  {s.date === todayIso() && <Badge tone="lime">Aujourd&apos;hui</Badge>}
                  {s.date === addDays(todayIso(), 1) && <Badge>Demain</Badge>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-muted">{hasPlan ? "Aucune séance à venir : votre programme est terminé." : "Votre calendrier apparaîtra ici une fois votre programme généré."}</p>
          )}
          <ButtonLink href={hasPlan ? "/espace/programme" : profile ? "/espace/recapitulatif" : "/espace/questionnaire"} className="mt-5">
            {hasPlan ? "Voir mon programme" : profile ? "Voir mon récapitulatif" : "Remplir le questionnaire"}
          </ButtonLink>
        </Card>
        <Card>
          <h2 className="text-xl font-bold">Votre progression</h2>
          <ol className="mt-4 space-y-3">
            {steps.map((s) => (
              <li key={s.label} className="flex items-center gap-3">
                <span aria-hidden className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${s.done ? "bg-lime text-ink" : "bg-ink/5 text-muted"}`}>{s.done ? "✓" : "•"}</span>
                <span className={s.done ? "font-medium" : "text-muted"}>
                  {s.label}
                  <span className="sr-only">{s.done ? " : fait" : " : à faire"}</span>
                </span>
              </li>
            ))}
          </ol>
          {profile && (
            <p className="mt-5 text-sm text-muted">
              Objectif : <strong className="text-ink">{GOALS[profile.goal].label}</strong>
              {profile.raceDate ? ` le ${formatDateFr(profile.raceDate, { day: "numeric", month: "long", year: "numeric" })}` : ` dans ${profile.horizonWeeks} semaines`}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
