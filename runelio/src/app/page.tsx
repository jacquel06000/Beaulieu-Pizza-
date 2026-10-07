import { Badge, ButtonLink, Card, Container } from "@/components/ui";
import { PRICING } from "@/lib/config";

const steps = [
  { n: "1", title: "Créez votre compte gratuit", text: "E-mail et mot de passe suffisent. Le téléphone reste facultatif." },
  { n: "2", title: "Décrivez votre objectif", text: "Distance, date de course, niveau, volume actuel, jours disponibles et durée maximale des séances." },
  { n: "3", title: "Vérifiez le récapitulatif", text: "Relisez vos réponses. Nous vous signalons un objectif ou un délai manifestement irréaliste." },
  { n: "4", title: "Recevez votre programme", text: "Après confirmation du paiement, votre calendrier semaine par semaine apparaît dans votre espace." },
];

const sample = [
  { day: "Mar", type: "Footing facile", meta: "40 min · effort 3–4/10", tone: "bg-mint-soft" },
  { day: "Jeu", type: "Fractionné", meta: "6 × 3 min · effort 8/10", tone: "bg-brand-soft" },
  { day: "Sam", type: "Repos", meta: "Récupération", tone: "bg-ink/5" },
  { day: "Dim", type: "Sortie longue", meta: "1 h 10 · allure conversation", tone: "bg-sky-soft" },
];

const faq = [
  {
    q: "L'inscription est-elle vraiment gratuite ?",
    a: "Oui. Le compte gratuit permet de remplir votre profil et de préparer votre demande. La génération du programme personnalisé nécessite l'abonnement.",
  },
  {
    q: "Puis-je résilier facilement ?",
    a: "Oui, à tout moment depuis votre espace (rubrique Facturation) ou via le lien « Résilier votre abonnement » en bas de chaque page. L'accès reste ouvert jusqu'à la fin de la période déjà payée.",
  },
  {
    q: "Runelio remplace-t-il un avis médical ?",
    a: "Non. Runelio propose des programmes d'entraînement généraux. En cas de doute sur votre santé, de douleur ou de reprise après une blessure, consultez un professionnel de santé.",
  },
  {
    q: "Et le triathlon ?",
    a: "Pas encore : nous ne le proposerons qu'une fois une vraie planification natation, vélo et course à pied disponible.",
  },
];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-40 right-[-10%] size-[520px] rounded-full bg-lime/40 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute top-40 left-[-15%] size-[420px] rounded-full bg-brand/15 blur-3xl" />
        <Container className="relative grid gap-12 py-16 sm:py-24 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <div className="animate-rise">
            <Badge tone="lime" className="mb-5">5 km · 10 km · Semi · Marathon</Badge>
            <h1 className="text-4xl sm:text-6xl font-extrabold leading-[1.05]">
              Votre prochaine course,
              <br />
              <span className="relative inline-block">
                <span className="relative z-10">préparée semaine après semaine.</span>
                <span aria-hidden className="absolute inset-x-0 bottom-1 h-3 bg-brand/30 -z-0 rounded" />
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted leading-relaxed">
              Un programme progressif construit selon votre objectif, votre date de course, votre niveau et le temps dont vous disposez vraiment.
              Des séances claires, une intensité compréhensible, et des semaines qui se réajustent quand la vie s&apos;en mêle.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/inscription" variant="brand" className="px-7 min-h-12 text-base">
                Créer mon compte gratuit
              </ButtonLink>
              <ButtonLink href="/tarifs" variant="secondary" className="min-h-12">
                Voir le tarif
              </ButtonLink>
            </div>
            <p className="mt-4 text-sm text-muted">Inscription gratuite · Abonnement {PRICING.label} {PRICING.frequency}, sans engagement</p>
          </div>

          <Card className="animate-rise [animation-delay:120ms] p-0 overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Exemple de semaine</p>
                <p className="font-display text-lg font-bold">Semaine 6 · Développement</p>
              </div>
              <Badge tone="violet">Objectif 10 km</Badge>
            </div>
            <ul className="divide-y divide-line">
              {sample.map((s) => (
                <li key={s.day} className="flex items-center gap-4 px-5 py-4">
                  <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${s.tone}`}>{s.day}</span>
                  <span>
                    <span className="block font-semibold">{s.type}</span>
                    <span className="block text-sm text-muted">{s.meta}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="px-5 py-3 text-xs text-muted bg-paper">Illustration : votre programme dépend de vos réponses.</p>
          </Card>
        </Container>
      </section>

      <section id="fonctionnement" className="py-16 scroll-mt-20">
        <Container>
          <h2 className="text-3xl sm:text-4xl font-bold max-w-2xl">Simple, transparent, progressif</h2>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <li key={s.n}>
                <Card className="h-full">
                  <span className="flex size-10 items-center justify-center rounded-full bg-ink font-display font-bold text-lime">{s.n}</span>
                  <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted leading-relaxed">{s.text}</p>
                </Card>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="py-16">
        <Container className="grid gap-6 lg:grid-cols-3">
          {[
            { t: "Adapté à votre réalité", d: "Jours disponibles, créneaux, durée maximale et jours de repos sont respectés : aucune séance n'est placée ailleurs.", tone: "bg-sky-soft" },
            { t: "Intensités compréhensibles", d: "Effort sur 10, test de la parole et, si vous avez un chrono de référence, allures estimées au kilomètre.", tone: "bg-brand-soft" },
            { t: "Réajustable", d: "Marquez vos séances réalisées, modifiez vos disponibilités : les semaines à venir sont recalculées.", tone: "bg-lime-soft" },
          ].map((f) => (
            <div key={f.t} className={`rounded-2xl p-6 ${f.tone}`}>
              <h3 className="text-xl font-bold">{f.t}</h3>
              <p className="mt-2 text-ink-soft leading-relaxed">{f.d}</p>
            </div>
          ))}
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <div className="rounded-[2rem] bg-ink px-6 py-12 sm:px-12 text-white grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold">Un seul abonnement, tout compris</h2>
              <p className="mt-3 text-white/75 max-w-lg">Programme personnalisé, calendrier, suivi des séances, et réajustements.</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
              <p className="font-display text-5xl font-extrabold">
                {PRICING.label}
                <span className="text-lg font-semibold text-white/70"> / mois</span>
              </p>
              <p className="mt-2 text-sm text-white/70">Prélevé tous les 30 jours · résiliable à tout moment</p>
              <ButtonLink href="/tarifs" variant="brand" className="mt-5 w-full">Détails de l&apos;offre</ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container className="max-w-3xl">
          <h2 className="text-3xl font-bold">Questions fréquentes</h2>
          <div className="mt-8 space-y-3">
            {faq.map((f) => (
              <details key={f.q} className="group rounded-2xl bg-white p-5 ring-1 ring-line open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {f.q}
                  <span aria-hidden className="text-xl transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-muted leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
