CREATE TYPE "public"."checkout_status" AS ENUM('created', 'completed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."giveaway_status" AS ENUM('draft', 'validated', 'open', 'closed', 'drawn');--> statement-breakpoint
CREATE TYPE "public"."plan_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."race_goal" AS ENUM('5k', '10k', 'half', 'marathon', 'tri_sprint', 'tri_olympic', 'tri_70_3', 'ironman');--> statement-breakpoint
CREATE TYPE "public"."runner_level" AS ENUM('beginner', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."running_experience" AS ENUM('none', 'lt6m', '6to24m', 'gt2y');--> statement-breakpoint
CREATE TYPE "public"."sport" AS ENUM('running', 'triathlon');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_rate_limit" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"window_start" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checkout_attempt" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"whop_checkout_configuration_id" text NOT NULL,
	"purchase_url" text NOT NULL,
	"status" "checkout_status" DEFAULT 'created' NOT NULL,
	"immediate_execution_consent_at" timestamp with time zone NOT NULL,
	"terms_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "checkout_attempt_whop_checkout_configuration_id_unique" UNIQUE("whop_checkout_configuration_id")
);
--> statement-breakpoint
CREATE TABLE "consent_log" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"purpose" text NOT NULL,
	"granted" boolean NOT NULL,
	"text_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "giveaway" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"prize_description" text NOT NULL,
	"prize_value_cents" integer NOT NULL,
	"number_of_winners" integer DEFAULT 1 NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"draw_at" timestamp with time zone NOT NULL,
	"eligibility_criteria" text NOT NULL,
	"draw_method" text NOT NULL,
	"rules_version" text,
	"legal_validated_at" timestamp with time zone,
	"legal_validated_by" text,
	"legal_validation_note" text,
	"status" "giveaway_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "giveaway_entry" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"giveaway_id" text NOT NULL,
	"user_id" text NOT NULL,
	"is_winner" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" text NOT NULL,
	"year" integer NOT NULL,
	"sequence" integer NOT NULL,
	"payment_id" text NOT NULL,
	"user_id" text,
	"customer_email" text NOT NULL,
	"customer_name" text NOT NULL,
	"description" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" text NOT NULL,
	"vat_mention" text NOT NULL,
	"issued_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoice_number_unique" UNIQUE("number"),
	CONSTRAINT "invoice_payment_id_unique" UNIQUE("payment_id")
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"whop_membership_id" text,
	"status" text NOT NULL,
	"amount_cents" integer,
	"currency" text,
	"billing_reason" text,
	"failure_message" text,
	"paid_at" timestamp with time zone,
	"last_event_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan_week" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" text NOT NULL,
	"week_index" integer NOT NULL,
	"start_date" date NOT NULL,
	"phase" text NOT NULL,
	"focus" text NOT NULL,
	"target_volume_km" real NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL,
	CONSTRAINT "rate_limit_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "runner_profile" (
	"user_id" text PRIMARY KEY NOT NULL,
	"sport" "sport" DEFAULT 'running' NOT NULL,
	"goal" "race_goal" NOT NULL,
	"race_date" date,
	"horizon_weeks" integer,
	"target_time_sec" integer,
	"level" "runner_level" NOT NULL,
	"experience" "running_experience" NOT NULL,
	"runs_per_week" integer DEFAULT 0 NOT NULL,
	"weekly_volume_km" real DEFAULT 0 NOT NULL,
	"longest_run_km" real DEFAULT 0 NOT NULL,
	"ref_distance_km" real,
	"ref_time_sec" integer,
	"available_days" jsonb NOT NULL,
	"time_slots" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"long_run_day" integer,
	"max_session_minutes" integer NOT NULL,
	"rest_days" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"whop_membership_id" text NOT NULL,
	"whop_plan_id" text,
	"status" text NOT NULL,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"current_period_end" timestamp with time zone,
	"last_event_at" timestamp with time zone,
	"canceled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_whop_membership_id_unique" UNIQUE("whop_membership_id")
);
--> statement-breakpoint
CREATE TABLE "training_plan" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"sport" "sport" DEFAULT 'running' NOT NULL,
	"goal" "race_goal" NOT NULL,
	"status" "plan_status" DEFAULT 'active' NOT NULL,
	"start_date" date NOT NULL,
	"race_date" date NOT NULL,
	"input_snapshot" jsonb NOT NULL,
	"warnings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"paces" jsonb,
	"generator_version" text NOT NULL,
	"adjusted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_session" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" text NOT NULL,
	"week_index" integer NOT NULL,
	"date" date NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"duration_min" integer NOT NULL,
	"distance_km" real,
	"intensity" jsonb NOT NULL,
	"instructions" text NOT NULL,
	"structure" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"phone" text,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_event" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'received' NOT NULL,
	"error" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_attempt" ADD CONSTRAINT "checkout_attempt_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_log" ADD CONSTRAINT "consent_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "giveaway_entry" ADD CONSTRAINT "giveaway_entry_giveaway_id_giveaway_id_fk" FOREIGN KEY ("giveaway_id") REFERENCES "public"."giveaway"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "giveaway_entry" ADD CONSTRAINT "giveaway_entry_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_payment_id_payment_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_week" ADD CONSTRAINT "plan_week_plan_id_training_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."training_plan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runner_profile" ADD CONSTRAINT "runner_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_plan" ADD CONSTRAINT "training_plan_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_session" ADD CONSTRAINT "training_session_plan_id_training_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."training_plan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "checkout_attempt_user_idx" ON "checkout_attempt" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "consent_log_user_idx" ON "consent_log" USING btree ("user_id","purpose");--> statement-breakpoint
CREATE UNIQUE INDEX "giveaway_entry_unique" ON "giveaway_entry" USING btree ("giveaway_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_year_seq_idx" ON "invoice" USING btree ("year","sequence");--> statement-breakpoint
CREATE INDEX "payment_user_idx" ON "payment" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "plan_week_idx" ON "plan_week" USING btree ("plan_id","week_index");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscription_user_idx" ON "subscription" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "training_plan_user_idx" ON "training_plan" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "training_session_plan_date_idx" ON "training_session" USING btree ("plan_id","date");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");