-- Passage de Whop à Stripe (aucune donnée de production à migrer).
ALTER TABLE "subscription" RENAME COLUMN "whop_membership_id" TO "stripe_subscription_id";--> statement-breakpoint
ALTER TABLE "subscription" RENAME COLUMN "whop_plan_id" TO "stripe_price_id";--> statement-breakpoint
ALTER TABLE "subscription" RENAME CONSTRAINT "subscription_whop_membership_id_unique" TO "subscription_stripe_subscription_id_unique";--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "checkout_attempt" RENAME COLUMN "whop_checkout_configuration_id" TO "stripe_checkout_session_id";--> statement-breakpoint
ALTER TABLE "checkout_attempt" RENAME COLUMN "purchase_url" TO "checkout_url";--> statement-breakpoint
ALTER TABLE "checkout_attempt" RENAME CONSTRAINT "checkout_attempt_whop_checkout_configuration_id_unique" TO "checkout_attempt_stripe_checkout_session_id_unique";--> statement-breakpoint
ALTER TABLE "payment" RENAME COLUMN "whop_membership_id" TO "stripe_subscription_id";
