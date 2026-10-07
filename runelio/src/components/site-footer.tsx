import Link from "next/link";
import { PUBLISHER } from "@/lib/config";
import { giveawaysEnabled } from "@/lib/env";
import { CookieSettingsButton } from "./cookie-consent";
import { Container, Logo } from "./ui";

const legal = [
  { href: "/legal/mentions-legales", label: "Mentions légales" },
  { href: "/legal/confidentialite", label: "Confidentialité" },
  { href: "/legal/cgu-cgv", label: "CGU / CGV" },
  { href: "/legal/cookies", label: "Cookies" },
];
// Le règlement n'est affiché que lorsque les tirages sont activés.
const giveawayRules = { href: "/legal/reglement-cadeaux", label: "Règlement des cadeaux" };

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-white/60">
      <Container className="py-12 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-muted leading-relaxed">
            Programmes de préparation à la course à pied, du 5 km au marathon. Runelio ne fournit pas d&apos;avis médical et ne garantit pas de résultat en course.
          </p>
        </div>
        <nav aria-label="Informations légales">
          <p className="text-sm font-semibold mb-3">Informations</p>
          <ul className="space-y-2 text-sm">
            {(giveawaysEnabled() ? [...legal, giveawayRules] : legal).map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-muted hover:text-ink">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <CookieSettingsButton className="text-muted hover:text-ink" />
            </li>
          </ul>
        </nav>
        <div>
          <p className="text-sm font-semibold mb-3">Abonnement</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/tarifs" className="text-muted hover:text-ink">Tarif</Link>
            </li>
            <li>
              <Link href="/resiliation" className="font-semibold text-ink underline underline-offset-4">Résilier votre abonnement</Link>
            </li>
            <li>
              <a href={`mailto:${PUBLISHER.email}`} className="text-muted hover:text-ink">Contact</a>
            </li>
          </ul>
        </div>
      </Container>
      <Container className="pb-8 text-xs text-muted">© {new Date().getFullYear()} Runelio — {PUBLISHER.name}, entrepreneur individuel</Container>
    </footer>
  );
}
