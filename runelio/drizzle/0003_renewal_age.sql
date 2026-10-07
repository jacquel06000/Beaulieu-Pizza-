ALTER TABLE "subscription" ADD COLUMN "renewal_reminder_for" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "adult" boolean DEFAULT false NOT NULL;