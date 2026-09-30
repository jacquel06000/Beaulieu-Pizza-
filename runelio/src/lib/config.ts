/**
 * Constantes produit et informations éditeur.
 * Toute valeur marquée « À COMPLÉTER » doit être vérifiée avant la mise en ligne.
 */
export const SITE = {
  name: "Runelio",
  domain: "runelio.fr",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;

export const PUBLISHER = {
  name: "Alexandre Jacquel",
  legalForm: "Entrepreneur individuel (micro-entrepreneur)",
  address: "47 rue Vivienne, 75002 Paris, France",
  siren: "929 658 961",
  siret: "929 658 961 00024",
  email: "jacquelalexandrepro@gmail.com",
  /** Régime fiscal de l'éditeur (franchise en base confirmée par l'éditeur). */
  vatMention: "TVA non applicable, art. 293 B du CGI",
  /** Whop agit comme revendeur (« merchant of record ») : il vend l'abonnement au client, encaisse et facture. */
  reseller: "Whop",
} as const;

export const PRICING = {
  /** Prix affiché (en centimes). Doit correspondre exactement au plan Whop configuré. */
  monthlyPriceCents: 1999,
  currency: "EUR",
  billingPeriodDays: 30,
  label: "19,99 €",
  frequency: "par mois",
} as const;

/** Versions des textes présentés (tracées lors des consentements). */
export const TEXT_VERSIONS = {
  terms: "2026-09-29-projet",
  marketing: "2026-09-29-projet",
} as const;

export function formatEuros(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
