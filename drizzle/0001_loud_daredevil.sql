CREATE TABLE "booking_access_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "booking_access_sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "booking_otp_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"email" text NOT NULL,
	"code_hash" text NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"locked_until" timestamp with time zone,
	"consumed_at" timestamp with time zone,
	CONSTRAINT "booking_otp_challenges_max_attempts_check" CHECK ("booking_otp_challenges"."max_attempts" > 0),
	CONSTRAINT "booking_otp_challenges_attempt_count_check" CHECK ("booking_otp_challenges"."attempt_count" >= 0)
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "access_token" text;--> statement-breakpoint
UPDATE "bookings" SET "access_token" = replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '') WHERE "access_token" IS NULL;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "access_token" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "booking_access_sessions" ADD CONSTRAINT "booking_access_sessions_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_otp_challenges" ADD CONSTRAINT "booking_otp_challenges_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booking_access_sessions_booking_id_idx" ON "booking_access_sessions" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "booking_access_sessions_expires_at_idx" ON "booking_access_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "booking_otp_challenges_live_idx" ON "booking_otp_challenges" USING btree ("booking_id") WHERE "booking_otp_challenges"."consumed_at" IS NULL;--> statement-breakpoint
CREATE INDEX "booking_otp_challenges_booking_id_idx" ON "booking_otp_challenges" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "booking_otp_challenges_expires_at_idx" ON "booking_otp_challenges" USING btree ("expires_at");--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_access_token_unique" UNIQUE("access_token");