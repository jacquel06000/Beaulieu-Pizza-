ALTER TABLE "user_preference" ADD COLUMN "last_seen_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_preference" ADD COLUMN "inactivity_warned_at" timestamp with time zone;