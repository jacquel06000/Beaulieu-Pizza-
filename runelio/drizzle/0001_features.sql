CREATE TABLE "user_preference" (
	"user_id" text PRIMARY KEY NOT NULL,
	"reminder_email" boolean DEFAULT false NOT NULL,
	"calendar_token" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_preference_calendar_token_unique" UNIQUE("calendar_token")
);
--> statement-breakpoint
ALTER TABLE "training_session" ADD COLUMN "feeling" text;--> statement-breakpoint
ALTER TABLE "training_session" ADD COLUMN "original_date" date;--> statement-breakpoint
ALTER TABLE "training_session" ADD COLUMN "reminder_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_preference" ADD CONSTRAINT "user_preference_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;