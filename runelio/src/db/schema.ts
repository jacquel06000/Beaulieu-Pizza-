/**
 * Schéma de base de données Runelio (PostgreSQL, Drizzle ORM).
 *
 * Les tables `user`, `session`, `account`, `verification` et `rate_limit`
 * suivent le modèle attendu par Better Auth (clés JS en camelCase).
 * Les autres tables portent la logique métier.
 */
import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

/* ------------------------------------------------------------------ */
/* Authentification (Better Auth)                                      */
/* ------------------------------------------------------------------ */

export const userRole = pgEnum("user_role", ["user", "admin"]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  /** Facultatif. */
  phone: text("phone"),
  role: userRole("role").notNull().default("user"),
  /** Déclaration « 18 ans ou plus » cochée à l'inscription (date = createdAt). */
  adult: boolean("adult").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    /** Empreinte (hash scrypt) calculée par Better Auth — jamais le mot de passe en clair. */
    password: text("password"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

export const rateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

/* ------------------------------------------------------------------ */
/* Profil coureur et demande de programme                              */
/* ------------------------------------------------------------------ */

/**
 * Discipline : seule `running` est planifiable. `triathlon` est prévu dans
 * le modèle pour une évolution future mais n'est exposé nulle part tant
 * qu'aucun planificateur natation/vélo/course n'existe.
 */
export const sport = pgEnum("sport", ["running", "triathlon"]);
export const raceGoal = pgEnum("race_goal", [
  "5k",
  "10k",
  "half",
  "marathon",
  // Réservés à une évolution future — non proposés dans l'interface.
  "tri_sprint",
  "tri_olympic",
  "tri_70_3",
  "ironman",
]);
export const runnerLevel = pgEnum("runner_level", [
  "beginner",
  "intermediate",
  "advanced",
]);
export const runningExperience = pgEnum("running_experience", [
  "none",
  "lt6m",
  "6to24m",
  "gt2y",
]);

export type TimeSlot = "morning" | "midday" | "evening" | "flexible";

export const runnerProfile = pgTable("runner_profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  sport: sport("sport").notNull().default("running"),
  goal: raceGoal("goal").notNull(),
  /** Date de la course (si connue). */
  raceDate: date("race_date", { mode: "string" }),
  /** Horizon de préparation en semaines (si pas de date). */
  horizonWeeks: integer("horizon_weeks"),
  /** Objectif chronométrique facultatif, en secondes. */
  targetTimeSec: integer("target_time_sec"),
  level: runnerLevel("level").notNull(),
  experience: runningExperience("experience").notNull(),
  runsPerWeek: integer("runs_per_week").notNull().default(0),
  weeklyVolumeKm: real("weekly_volume_km").notNull().default(0),
  longestRunKm: real("longest_run_km").notNull().default(0),
  /** Résultat de référence facultatif : distance (km) et temps (s). */
  refDistanceKm: real("ref_distance_km"),
  refTimeSec: integer("ref_time_sec"),
  /** Jours disponibles : 0 = lundi … 6 = dimanche. */
  availableDays: jsonb("available_days").$type<number[]>().notNull(),
  /** Créneau préféré par jour disponible. */
  timeSlots: jsonb("time_slots")
    .$type<Record<string, TimeSlot>>()
    .notNull()
    .default({}),
  /** Jour préféré pour la sortie longue (0–6), facultatif. */
  longRunDay: integer("long_run_day"),
  maxSessionMinutes: integer("max_session_minutes").notNull(),
  /** Jours de repos imposés : 0 = lundi … 6 = dimanche. */
  restDays: jsonb("rest_days").$type<number[]>().notNull().default([]),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/* ------------------------------------------------------------------ */
/* Abonnement (Whop) et paiements                                      */
/* ------------------------------------------------------------------ */

/**
 * Statuts Whop d'une membership (API v1) : trialing, active, past_due,
 * completed, canceled, expired, unresolved, drafted, canceling.
 */
export const subscription = pgTable(
  "subscription",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    whopMembershipId: text("whop_membership_id").notNull().unique(),
    whopPlanId: text("whop_plan_id"),
    status: text("status").notNull(),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    /** Horodatage Whop du dernier événement appliqué (ordre des webhooks). */
    lastEventAt: timestamp("last_event_at", { withTimezone: true }),
    canceledAt: timestamp("canceled_at", { withTimezone: true }),
    /** Échéance pour laquelle le rappel de renouvellement a été envoyé (art. L215-1 C. conso.). */
    renewalReminderFor: timestamp("renewal_reminder_for", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("subscription_user_idx").on(t.userId)],
);

export const checkoutStatus = pgEnum("checkout_status", [
  "created",
  "completed",
  "expired",
]);

/** Sessions de paiement ouvertes par l'utilisateur (pour suivre les paiements en attente). */
export const checkoutAttempt = pgTable(
  "checkout_attempt",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    whopCheckoutConfigurationId: text("whop_checkout_configuration_id")
      .notNull()
      .unique(),
    purchaseUrl: text("purchase_url").notNull(),
    status: checkoutStatus("status").notNull().default("created"),
    /** Demande d'exécution immédiate + reconnaissance (rétractation). */
    immediateExecutionConsentAt: timestamp("immediate_execution_consent_at", {
      withTimezone: true,
    }).notNull(),
    termsVersion: text("terms_version").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("checkout_attempt_user_idx").on(t.userId)],
);

export const payment = pgTable(
  "payment",
  {
    /** Identifiant Whop `pay_…`. */
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    whopMembershipId: text("whop_membership_id"),
    /** Dernier événement reçu : succeeded, failed, pending, canceled, … */
    status: text("status").notNull(),
    /** Montant en centimes, tel que communiqué par Whop (si disponible). */
    amountCents: integer("amount_cents"),
    currency: text("currency"),
    billingReason: text("billing_reason"),
    failureMessage: text("failure_message"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    lastEventAt: timestamp("last_event_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("payment_user_idx").on(t.userId)],
);

/**
 * Factures émises par l'éditeur (numérotation continue).
 * Désactivées par défaut (INVOICES_ENABLED) tant que le rôle fiscal de
 * Whop (vendeur direct ou « merchant of record ») n'est pas vérifié.
 */
export const invoice = pgTable(
  "invoice",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    number: text("number").notNull().unique(),
    year: integer("year").notNull(),
    sequence: integer("sequence").notNull(),
    paymentId: text("payment_id")
      .notNull()
      .unique()
      .references(() => payment.id, { onDelete: "restrict" }),
    /** Pas de clé étrangère : la facture doit être conservée 10 ans même si le compte est supprimé. */
    userId: text("user_id"),
    customerEmail: text("customer_email").notNull(),
    customerName: text("customer_name").notNull(),
    description: text("description").notNull(),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull(),
    vatMention: text("vat_mention").notNull(),
    issuedAt: timestamp("issued_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("invoice_year_seq_idx").on(t.year, t.sequence)],
);

/** Journal des webhooks reçus — clé = identifiant `webhook-id` (idempotence). */
export const webhookEvent = pgTable("webhook_event", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  status: text("status").notNull().default("received"),
  error: text("error"),
  receivedAt: timestamp("received_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});

/* ------------------------------------------------------------------ */
/* Programmes d'entraînement                                           */
/* ------------------------------------------------------------------ */

export const planStatus = pgEnum("plan_status", ["active", "archived"]);

export type PlanWarning = {
  code: string;
  severity: "info" | "warning" | "critical";
  message: string;
};

export const trainingPlan = pgTable(
  "training_plan",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sport: sport("sport").notNull().default("running"),
    goal: raceGoal("goal").notNull(),
    status: planStatus("status").notNull().default("active"),
    startDate: date("start_date", { mode: "string" }).notNull(),
    raceDate: date("race_date", { mode: "string" }).notNull(),
    /** Copie des réponses utilisées pour générer le programme. */
    inputSnapshot: jsonb("input_snapshot").notNull(),
    warnings: jsonb("warnings").$type<PlanWarning[]>().notNull().default([]),
    /** Allures estimées (s/km) si un résultat de référence est connu. */
    paces: jsonb("paces").$type<Record<string, number> | null>(),
    generatorVersion: text("generator_version").notNull(),
    adjustedAt: timestamp("adjusted_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("training_plan_user_idx").on(t.userId)],
);

export const planWeek = pgTable(
  "plan_week",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    planId: text("plan_id")
      .notNull()
      .references(() => trainingPlan.id, { onDelete: "cascade" }),
    weekIndex: integer("week_index").notNull(),
    startDate: date("start_date", { mode: "string" }).notNull(),
    phase: text("phase").notNull(),
    focus: text("focus").notNull(),
    targetVolumeKm: real("target_volume_km").notNull(),
  },
  (t) => [uniqueIndex("plan_week_idx").on(t.planId, t.weekIndex)],
);

export const trainingSession = pgTable(
  "training_session",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    planId: text("plan_id")
      .notNull()
      .references(() => trainingPlan.id, { onDelete: "cascade" }),
    weekIndex: integer("week_index").notNull(),
    date: date("date", { mode: "string" }).notNull(),
    type: text("type").notNull(),
    title: text("title").notNull(),
    durationMin: integer("duration_min").notNull(),
    distanceKm: real("distance_km"),
    /** Intensité compréhensible : effort /10, test de la parole, allure éventuelle. */
    intensity: jsonb("intensity")
      .$type<{ rpe: string; label: string; talk: string; pace?: string }>()
      .notNull(),
    instructions: text("instructions").notNull(),
    structure: jsonb("structure").$type<string[]>().notNull().default([]),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    /** Ressenti déclaré : easy | ok | hard | too_hard (aucune donnée de santé). */
    feeling: text("feeling"),
    /** Date initialement prévue si la séance a été déplacée. */
    originalDate: date("original_date", { mode: "string" }),
    /** Rappel e-mail envoyé (idempotence). */
    reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("training_session_plan_date_idx").on(t.planId, t.date)],
);

/** Préférences de l'utilisateur (hors Better Auth). */
export const userPreference = pgTable("user_preference", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  /** Rappel par e-mail la veille d'une séance (désactivé par défaut). */
  reminderEmail: boolean("reminder_email").notNull().default(false),
  /** Jeton secret de l'abonnement agenda (URL .ics privée). */
  calendarToken: text("calendar_token").unique(),
  /** Dernière activité connue (mise à jour au plus une fois par jour). */
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  /** Avertissement de suppression pour inactivité envoyé le… */
  inactivityWarnedAt: timestamp("inactivity_warned_at", { withTimezone: true }),
  updatedAt: updatedAt(),
});

/* ------------------------------------------------------------------ */
/* Consentements                                                       */
/* ------------------------------------------------------------------ */

/** Journal (append-only) des consentements facultatifs. */
export const consentLog = pgTable(
  "consent_log",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** Ex. `marketing_email`. */
    purpose: text("purpose").notNull(),
    granted: boolean("granted").notNull(),
    /** Version du texte présenté. */
    textVersion: text("text_version").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("consent_log_user_idx").on(t.userId, t.purpose)],
);

/* ------------------------------------------------------------------ */
/* Cadeaux du mois                                                     */
/* ------------------------------------------------------------------ */

export const giveawayStatus = pgEnum("giveaway_status", [
  "draft",
  "validated",
  "open",
  "closed",
  "drawn",
]);

export const giveaway = pgTable("giveaway", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  prizeDescription: text("prize_description").notNull(),
  prizeValueCents: integer("prize_value_cents").notNull(),
  numberOfWinners: integer("number_of_winners").notNull().default(1),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  drawAt: timestamp("draw_at", { withTimezone: true }).notNull(),
  eligibilityCriteria: text("eligibility_criteria").notNull(),
  drawMethod: text("draw_method").notNull(),
  /** Version du règlement applicable, une fois rédigé et validé. */
  rulesVersion: text("rules_version"),
  /** Validation juridique explicite (France) par un administrateur. */
  legalValidatedAt: timestamp("legal_validated_at", { withTimezone: true }),
  legalValidatedBy: text("legal_validated_by"),
  legalValidationNote: text("legal_validation_note"),
  status: giveawayStatus("status").notNull().default("draft"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const giveawayEntry = pgTable(
  "giveaway_entry",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    giveawayId: text("giveaway_id")
      .notNull()
      .references(() => giveaway.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    isWinner: boolean("is_winner").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("giveaway_entry_unique").on(t.giveawayId, t.userId)],
);

/* ------------------------------------------------------------------ */
/* Anti-abus applicatif (routes hors Better Auth)                      */
/* ------------------------------------------------------------------ */

export const appRateLimit = pgTable("app_rate_limit", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
});

/* ------------------------------------------------------------------ */

export const userRelations = relations(user, ({ one, many }) => ({
  profile: one(runnerProfile),
  subscriptions: many(subscription),
  plans: many(trainingPlan),
}));
export const runnerProfileRelations = relations(runnerProfile, ({ one }) => ({
  user: one(user, { fields: [runnerProfile.userId], references: [user.id] }),
}));
export const subscriptionRelations = relations(subscription, ({ one }) => ({
  user: one(user, { fields: [subscription.userId], references: [user.id] }),
}));
export const trainingPlanRelations = relations(
  trainingPlan,
  ({ one, many }) => ({
    user: one(user, { fields: [trainingPlan.userId], references: [user.id] }),
    weeks: many(planWeek),
    sessions: many(trainingSession),
  }),
);
export const planWeekRelations = relations(planWeek, ({ one }) => ({
  plan: one(trainingPlan, {
    fields: [planWeek.planId],
    references: [trainingPlan.id],
  }),
}));
export const trainingSessionRelations = relations(
  trainingSession,
  ({ one }) => ({
    plan: one(trainingPlan, {
      fields: [trainingSession.planId],
      references: [trainingPlan.id],
    }),
  }),
);
