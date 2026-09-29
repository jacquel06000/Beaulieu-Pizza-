import { z } from "zod";

const day = z.number().int().min(0).max(6);
const slot = z.enum(["morning", "midday", "evening", "flexible"]);

export const availabilitySchema = z
  .object({
    availableDays: z.array(day).min(2, "Choisissez au moins deux jours disponibles.").max(7),
    restDays: z.array(day).max(5).default([]),
    timeSlots: z.record(z.string().regex(/^[0-6]$/), slot).default({}),
    longRunDay: day.nullable().optional(),
    maxSessionMinutes: z.number().int().min(20, "20 minutes minimum.").max(300),
  })
  .refine((v) => v.availableDays.filter((d) => !v.restDays.includes(d)).length >= 2, {
    message: "Il faut au moins deux jours disponibles qui ne soient pas des jours de repos.",
    path: ["availableDays"],
  });

export const profileSchema = z
  .object({
    goal: z.enum(["5k", "10k", "half", "marathon"]),
    raceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    horizonWeeks: z.number().int().min(2).max(52).nullable().optional(),
    targetTimeSec: z.number().int().min(600).max(8 * 3600).nullable().optional(),
    level: z.enum(["beginner", "intermediate", "advanced"]),
    experience: z.enum(["none", "lt6m", "6to24m", "gt2y"]),
    runsPerWeek: z.number().int().min(0).max(14),
    weeklyVolumeKm: z.number().min(0).max(250),
    longestRunKm: z.number().min(0).max(100),
    refDistanceKm: z.number().min(1).max(42.2).nullable().optional(),
    refTimeSec: z.number().int().min(180).max(8 * 3600).nullable().optional(),
    availableDays: z.array(day).min(2).max(7),
    restDays: z.array(day).max(5).default([]),
    timeSlots: z.record(z.string().regex(/^[0-6]$/), slot).default({}),
    longRunDay: day.nullable().optional(),
    maxSessionMinutes: z.number().int().min(20).max(300),
  })
  .refine((v) => Boolean(v.raceDate) !== Boolean(v.horizonWeeks), {
    message: "Indiquez soit une date de course, soit un horizon de préparation.",
    path: ["raceDate"],
  })
  .refine((v) => Boolean(v.refDistanceKm) === Boolean(v.refTimeSec), {
    message: "Indiquez à la fois la distance et le temps de référence, ou aucun des deux.",
    path: ["refTimeSec"],
  })
  .refine((v) => v.availableDays.filter((d) => !v.restDays.includes(d)).length >= 2, {
    message: "Il faut au moins deux jours disponibles qui ne soient pas des jours de repos.",
    path: ["availableDays"],
  });

export type ProfileInput = z.infer<typeof profileSchema>;
export type AvailabilityInput = z.infer<typeof availabilitySchema>;

export const phoneSchema = z
  .string()
  .trim()
  .max(20)
  .regex(/^\+?[0-9 .-]{6,20}$/, "Numéro de téléphone invalide.")
  .or(z.literal(""));
