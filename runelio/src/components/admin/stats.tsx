import type { AdminStats } from "@/server/admin-stats";
import { formatEuros } from "@/lib/config";
import { Card } from "../ui";

function Tile({ label, value, hint, tone = "neutral" }: { label: string; value: string | number; hint?: string; tone?: "neutral" | "good" | "warn" }) {
  const toneCls = tone === "good" ? "text-mint" : tone === "warn" ? "text-warn" : "text-ink";
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-line">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className={`mt-1 font-display text-3xl font-extrabold tabular-nums ${toneCls}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function AdminStatsPanel({ s }: { s: AdminStats }) {
  const conversion = s.withProfile ? Math.round(((s.activeSubscriptions + s.canceling + s.pastDue) / s.withProfile) * 100) : 0;
  return (
    <section aria-labelledby="stats" className="space-y-4">
      <h2 id="stats" className="text-2xl font-bold">Tableau de bord</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Abonnés actifs" value={s.activeSubscriptions} tone="good" hint={`${s.newSubscriptions30d} nouveaux sur 30 j`} />
        <Tile label="Résiliations (30 j)" value={s.cancellations30d} tone={s.cancellations30d ? "warn" : "neutral"} hint={`${s.canceling} résiliation(s) programmée(s)`} />
        <Tile label="Paiements en échec" value={s.pastDue} tone={s.pastDue ? "warn" : "neutral"} hint="Abonnés en période de grâce" />
        <Tile label="Encaissé via Whop (30 j)" value={formatEuros(s.revenue30dCents)} hint={`${s.payments30d} paiement(s), montant brut`} />
        <Tile label="Inscrits" value={s.users} hint={`${s.verifiedUsers} e-mails confirmés`} />
        <Tile label="Nouveaux inscrits" value={s.signups7d} hint={`7 j · ${s.signups30d} sur 30 j`} />
        <Tile label="Questionnaires remplis" value={s.withProfile} hint={`${conversion} % deviennent abonnés`} />
        <Tile label="Séances réalisées (30 j)" value={s.sessionsCompleted30d} hint={`${s.plansGenerated} programmes générés · ${s.reminderOptIns} rappels activés`} />
      </div>
      <Card className="text-xs text-muted">Chiffres calculés à partir de la base Runelio. Le chiffre d&apos;affaires officiel est celui du tableau de bord Whop (revendeur).</Card>
    </section>
  );
}
