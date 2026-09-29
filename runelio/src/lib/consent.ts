/**
 * Consentement aux traceurs non essentiels.
 *
 * Runelio n'utilise actuellement AUCUN traceur facultatif : la liste ci-dessous
 * est vide, donc aucun bandeau n'est affiché et rien n'est déposé. Pour ajouter
 * un outil (ex. mesure d'audience), déclarez-le ici et chargez-le uniquement via
 * <ConsentGate category="…"> : il ne s'exécutera qu'après accord explicite.
 */
export type OptionalCategory = { id: string; label: string; description: string; provider: string };

export const OPTIONAL_CATEGORIES: OptionalCategory[] = [];

export const CONSENT_COOKIE = "runelio_consent";
export const CONSENT_VERSION = 1;
/** Durée de conservation du choix : 6 mois (recommandation CNIL). */
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 182;

export type ConsentState = { v: number; date: string; choices: Record<string, boolean> };

export function parseConsent(raw: string | undefined): ConsentState | null {
  if (!raw) return null;
  try {
    const c = JSON.parse(decodeURIComponent(raw)) as ConsentState;
    return c.v === CONSENT_VERSION ? c : null;
  } catch {
    return null;
  }
}
