import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db";
import { subscription } from "@/db/schema";
import { HttpError } from "@/server/errors";
import {
  createGiveaway,
  drawGiveaway,
  enterGiveaway,
  openGiveaway,
  updateGiveaway,
  validateGiveaway,
  visibleGiveaways,
} from "@/server/giveaways";
import { createTestDb, createUser, resetDb } from "./helpers";

let db: Db;
const now = new Date("2026-10-10T12:00:00Z");
const input = {
  title: "Paire de chaussures",
  prizeDescription: "Une paire de chaussures de running.",
  prizeValueCents: 12000,
  numberOfWinners: 1,
  startsAt: new Date("2026-10-01T00:00:00Z"),
  endsAt: new Date("2026-10-31T00:00:00Z"),
  drawAt: new Date("2026-11-01T10:00:00Z"),
  eligibilityCriteria: "Abonnés actifs résidant en France.",
  drawMethod: "Tirage aléatoire informatisé parmi les participations valides.",
  rulesVersion: null as string | null,
};
const attest = { legalReviewDone: true, rulesPublished: true, note: "Validé" };

async function expectHttp(p: Promise<unknown>, status: number) {
  await expect(p).rejects.toBeInstanceOf(HttpError);
  await p.catch((e: HttpError) => expect(e.status).toBe(status));
}

beforeAll(async () => {
  db = await createTestDb();
});
beforeEach(async () => {
  await resetDb(db);
  await createUser(db, "admin");
  await createUser(db, "u1");
  await db.insert(subscription).values({ userId: "u1", whopMembershipId: "mem_u1", status: "active", currentPeriodEnd: new Date("2026-12-01T00:00:00Z") });
});

describe("cadeaux du mois : aucun tirage sans règlement validé", () => {
  it("un brouillon sans version de règlement ne peut pas être validé", async () => {
    const g = await createGiveaway(db, input);
    await expectHttp(validateGiveaway(db, g.id, "admin", attest), 400);
  });

  it("la validation exige l'attestation juridique et la publication du règlement", async () => {
    const g = await createGiveaway(db, { ...input, rulesVersion: "v1" });
    await expectHttp(validateGiveaway(db, g.id, "admin", { ...attest, legalReviewDone: false }), 400);
    await expectHttp(validateGiveaway(db, g.id, "admin", { ...attest, rulesPublished: false }), 400);
  });

  it("l'interrupteur global bloque l'ouverture, l'affichage et la participation", async () => {
    const g = await createGiveaway(db, { ...input, rulesVersion: "v1" });
    await validateGiveaway(db, g.id, "admin", attest);
    await expectHttp(openGiveaway(db, g.id, false, now), 403);
    expect(await visibleGiveaways(db, false)).toEqual([]);
    await expectHttp(enterGiveaway(db, "u1", g.id, false, now), 403);
  });

  it("un brouillon non validé ne peut pas être ouvert ni visible", async () => {
    const g = await createGiveaway(db, { ...input, rulesVersion: "v1" });
    await expectHttp(openGiveaway(db, g.id, true, now), 400);
    expect(await visibleGiveaways(db, true)).toEqual([]);
  });

  it("modifier un tirage validé annule la validation", async () => {
    const g = await createGiveaway(db, { ...input, rulesVersion: "v1" });
    await validateGiveaway(db, g.id, "admin", attest);
    await updateGiveaway(db, g.id, { ...input, rulesVersion: "v2" });
    await expectHttp(openGiveaway(db, g.id, true, now), 400);
  });

  it("parcours complet validé : participation réservée aux abonnés, tirage après la date prévue", async () => {
    await createUser(db, "u2");
    const g = await createGiveaway(db, { ...input, rulesVersion: "v1" });
    await validateGiveaway(db, g.id, "admin", attest);
    await openGiveaway(db, g.id, true, now);
    expect(await visibleGiveaways(db, true)).toHaveLength(1);
    await enterGiveaway(db, "u1", g.id, true, now);
    await enterGiveaway(db, "u1", g.id, true, now); // doublon ignoré
    await expectHttp(enterGiveaway(db, "u2", g.id, true, now), 403); // non abonné
    await expectHttp(drawGiveaway(db, g.id, true, now), 400); // trop tôt
    const r = await drawGiveaway(db, g.id, true, new Date("2026-11-02T00:00:00Z"));
    expect(r).toEqual({ participants: 1, winners: 1 });
  });
});
