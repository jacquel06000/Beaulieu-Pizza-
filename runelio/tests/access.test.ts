import { describe, expect, it } from "vitest";
import { accessState, canGeneratePlan, canViewPlan } from "@/server/access";

const now = new Date("2026-10-01T12:00:00Z");
const future = new Date("2026-10-20T00:00:00Z");
const past = new Date("2026-09-20T00:00:00Z");
const sub = (status: string, cancelAtPeriodEnd = false, currentPeriodEnd: Date | null = future) => ({ status, cancelAtPeriodEnd, currentPeriodEnd });

describe("règles d'accès à l'abonnement", () => {
  it("refuse tout sans abonnement", () => {
    expect(canGeneratePlan(null, now)).toBe(false);
    expect(canViewPlan(undefined, now)).toBe(false);
    expect(accessState(null, now)).toBe("none");
  });
  it("autorise un abonnement actif ou en essai", () => {
    expect(canGeneratePlan(sub("active"), now)).toBe(true);
    expect(canGeneratePlan(sub("trialing"), now)).toBe(true);
  });
  it("résiliation programmée : accès jusqu'à la fin de période seulement", () => {
    expect(canGeneratePlan(sub("canceling", true), now)).toBe(true);
    expect(accessState(sub("active", true), now)).toBe("canceling");
    expect(canGeneratePlan(sub("canceling", true, past), now)).toBe(false);
    expect(canViewPlan(sub("active", true, past), now)).toBe(false);
    expect(accessState(sub("canceling", true, past), now)).toBe("ended");
  });
  it("impayé : consultation seule pendant la période de grâce", () => {
    expect(canViewPlan(sub("past_due"), now)).toBe(true);
    expect(canGeneratePlan(sub("past_due"), now)).toBe(false);
  });
  it.each(["canceled", "expired", "completed", "unresolved", "drafted", "inconnu"])("aucun accès pour %s", (s) => {
    expect(canViewPlan(sub(s), now)).toBe(false);
    expect(canGeneratePlan(sub(s), now)).toBe(false);
  });
});
