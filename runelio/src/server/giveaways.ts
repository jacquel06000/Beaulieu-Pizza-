/**
 * Cadeaux du mois.
 *
 * Garde-fous : aucun tirage n'est ouvert tant que
 *  1. l'interrupteur global GIVEAWAYS_ENABLED n'est pas activé (après publication
 *     du règlement définitif) ;
 *  2. le lot, sa valeur, la période, les critères, les modalités du tirage et la
 *     version du règlement ne sont pas renseignés ;
 *  3. un administrateur n'a pas attesté la validation juridique pour la France.
 * L'abonnement ne garantit pas de gagner.
 */
import { randomInt } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db";
import { giveaway, giveawayEntry } from "@/db/schema";
import { canGeneratePlan } from "./access";
import { getCurrentSubscription } from "./billing";
import { badRequest, forbidden, notFound } from "./errors";

export const giveawayInputSchema = z
  .object({
    title: z.string().trim().min(3).max(120),
    prizeDescription: z.string().trim().min(3).max(2000),
    prizeValueCents: z.number().int().min(0).max(10_000_00),
    numberOfWinners: z.number().int().min(1).max(100),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    drawAt: z.coerce.date(),
    eligibilityCriteria: z.string().trim().min(10).max(4000),
    drawMethod: z.string().trim().min(10).max(4000),
    rulesVersion: z.string().trim().max(50).nullable().optional(),
  })
  .refine((v) => v.endsAt > v.startsAt, { message: "La fin doit être après le début.", path: ["endsAt"] })
  .refine((v) => v.drawAt >= v.endsAt, { message: "Le tirage doit avoir lieu après la clôture.", path: ["drawAt"] });

export type GiveawayInput = z.infer<typeof giveawayInputSchema>;
export type GiveawayRow = typeof giveaway.$inferSelect;

export function missingForValidation(g: GiveawayRow): string[] {
  const missing: string[] = [];
  if (!g.rulesVersion) missing.push("version du règlement");
  if (!g.prizeDescription) missing.push("description du lot");
  if (!g.eligibilityCriteria) missing.push("critères de participation");
  if (!g.drawMethod) missing.push("modalités du tirage");
  return missing;
}

export async function listGiveaways(db: Db) {
  return db.select().from(giveaway).orderBy(desc(giveaway.startsAt));
}

export async function createGiveaway(db: Db, input: GiveawayInput) {
  const [row] = await db.insert(giveaway).values({ ...input, rulesVersion: input.rulesVersion ?? null }).returning();
  return row;
}

export async function updateGiveaway(db: Db, id: string, input: GiveawayInput) {
  const [g] = await db.select().from(giveaway).where(eq(giveaway.id, id));
  if (!g) throw notFound();
  if (g.status !== "draft" && g.status !== "validated") throw badRequest("Un tirage ouvert ou clos ne peut plus être modifié.");
  // Toute modification annule la validation juridique précédente.
  await db
    .update(giveaway)
    .set({ ...input, rulesVersion: input.rulesVersion ?? null, status: "draft", legalValidatedAt: null, legalValidatedBy: null })
    .where(eq(giveaway.id, id));
}

export async function validateGiveaway(db: Db, id: string, adminId: string, attestation: { legalReviewDone: boolean; rulesPublished: boolean; note: string }) {
  const [g] = await db.select().from(giveaway).where(eq(giveaway.id, id));
  if (!g) throw notFound();
  if (g.status !== "draft") throw badRequest("Seul un brouillon peut être validé.");
  const missing = missingForValidation(g);
  if (missing.length) throw badRequest(`Informations manquantes : ${missing.join(", ")}.`);
  if (!attestation.legalReviewDone || !attestation.rulesPublished) {
    throw badRequest("La validation juridique et la publication du règlement doivent être attestées.");
  }
  await db
    .update(giveaway)
    .set({ status: "validated", legalValidatedAt: new Date(), legalValidatedBy: adminId, legalValidationNote: attestation.note.slice(0, 2000) })
    .where(eq(giveaway.id, id));
}

export async function openGiveaway(db: Db, id: string, enabled: boolean, now = new Date()) {
  if (!enabled) throw forbidden("Les tirages au sort sont désactivés (GIVEAWAYS_ENABLED).");
  const [g] = await db.select().from(giveaway).where(eq(giveaway.id, id));
  if (!g) throw notFound();
  if (g.status !== "validated" || !g.legalValidatedAt) throw badRequest("Le tirage doit être validé avant ouverture.");
  if (now >= g.endsAt) throw badRequest("La période de participation est terminée.");
  await db.update(giveaway).set({ status: "open" }).where(eq(giveaway.id, id));
}

/** Cadeaux visibles par les abonnés : uniquement ceux ouverts ET validés, interrupteur actif. */
export async function visibleGiveaways(db: Db, enabled: boolean) {
  if (!enabled) return [];
  const rows = await db.select().from(giveaway).where(eq(giveaway.status, "open")).orderBy(desc(giveaway.startsAt));
  return rows.filter((g) => g.legalValidatedAt && g.rulesVersion);
}

export async function enterGiveaway(db: Db, userId: string, id: string, enabled: boolean, now = new Date()) {
  if (!enabled) throw forbidden("Aucun tirage au sort n'est ouvert.");
  const sub = await getCurrentSubscription(db, userId);
  if (!canGeneratePlan(sub, now)) throw forbidden("Réservé aux abonnés actifs.");
  const [g] = await db.select().from(giveaway).where(eq(giveaway.id, id));
  if (!g || g.status !== "open" || !g.legalValidatedAt) throw notFound("Tirage introuvable.");
  if (now < g.startsAt || now >= g.endsAt) throw badRequest("La participation n'est pas ouverte à cette date.");
  await db.insert(giveawayEntry).values({ giveawayId: id, userId }).onConflictDoNothing();
}

export async function hasEntered(db: Db, userId: string, id: string) {
  const rows = await db
    .select({ id: giveawayEntry.id })
    .from(giveawayEntry)
    .where(and(eq(giveawayEntry.giveawayId, id), eq(giveawayEntry.userId, userId)));
  return rows.length > 0;
}

/** Tirage aléatoire (générateur cryptographique) après clôture. */
export async function drawGiveaway(db: Db, id: string, enabled: boolean, now = new Date()) {
  if (!enabled) throw forbidden("Les tirages au sort sont désactivés.");
  const [g] = await db.select().from(giveaway).where(eq(giveaway.id, id));
  if (!g) throw notFound();
  if (g.status !== "open" && g.status !== "closed") throw badRequest("Tirage non ouvert.");
  if (now < g.drawAt) throw badRequest("La date du tirage n'est pas encore atteinte.");
  const entries = await db.select().from(giveawayEntry).where(eq(giveawayEntry.giveawayId, id));
  const pool = [...entries];
  const winners: string[] = [];
  while (winners.length < g.numberOfWinners && pool.length) {
    const [w] = pool.splice(randomInt(pool.length), 1);
    winners.push(w.id);
  }
  await db.transaction(async (tx) => {
    for (const w of winners) await tx.update(giveawayEntry).set({ isWinner: true }).where(eq(giveawayEntry.id, w));
    await tx.update(giveaway).set({ status: "drawn" }).where(eq(giveaway.id, id));
  });
  return { participants: entries.length, winners: winners.length };
}
