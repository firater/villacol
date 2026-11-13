CREATE TYPE "public"."guest_policy_enum" AS ENUM('everyone', 'couples_only', 'families_only', 'no_friend_groups');--> statement-breakpoint
CREATE TYPE "public"."party_type_enum" AS ENUM('couple', 'family', 'friends', 'solo', 'other');--> statement-breakpoint
ALTER TYPE "public"."discount_type_enum" ADD VALUE 'commission_waiver';--> statement-breakpoint
CREATE TABLE "guest_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"villa_id" integer NOT NULL,
	"booking_id" uuid,
	"guest_name" text NOT NULL,
	"locale" "locale_enum" DEFAULT 'en' NOT NULL,
	"stay_check_in" date NOT NULL,
	"stay_check_out" date NOT NULL,
	"guest_count" integer NOT NULL,
	"rating" integer NOT NULL,
	"review_text" text NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guest_reviews_rating_range_check" CHECK ("guest_reviews"."rating" >= 1 AND "guest_reviews"."rating" <= 5),
	CONSTRAINT "guest_reviews_stay_order_check" CHECK ("guest_reviews"."stay_check_out" > "guest_reviews"."stay_check_in"),
	CONSTRAINT "guest_reviews_guest_count_check" CHECK ("guest_reviews"."guest_count" > 0)
);
--> statement-breakpoint
ALTER TABLE "promotions" DROP CONSTRAINT "promotions_value_shape_check";--> statement-breakpoint
ALTER TABLE "villas" ADD COLUMN "cancellation_policy_i18n" jsonb;--> statement-breakpoint
ALTER TABLE "villas" ADD COLUMN "guest_policy" "guest_policy_enum" DEFAULT 'everyone' NOT NULL;--> statement-breakpoint
ALTER TABLE "villas" ADD COLUMN "editor_rating" numeric(3, 1);--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "party_type" "party_type_enum";--> statement-breakpoint
ALTER TABLE "guest_reviews" ADD CONSTRAINT "guest_reviews_villa_id_villas_id_fk" FOREIGN KEY ("villa_id") REFERENCES "public"."villas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_reviews" ADD CONSTRAINT "guest_reviews_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "guest_reviews_villa_published_idx" ON "guest_reviews" USING btree ("villa_id","is_published","created_at");--> statement-breakpoint
CREATE INDEX "guest_reviews_rating_idx" ON "guest_reviews" USING btree ("rating");--> statement-breakpoint
CREATE UNIQUE INDEX "guest_reviews_booking_id_idx" ON "guest_reviews" USING btree ("booking_id") WHERE "guest_reviews"."booking_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "villas" ADD CONSTRAINT "villas_editor_rating_range_check" CHECK ("villas"."editor_rating" IS NULL
        OR ("villas"."editor_rating" >= 1 AND "villas"."editor_rating" <= 10));--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_value_shape_check" CHECK ((
        ("promotions"."discount_type"::text = 'percentage'
          AND "promotions"."percent_bp" IS NOT NULL
          AND "promotions"."fixed_amount_cents" IS NULL
          AND "promotions"."free_nights" IS NULL)
        OR ("promotions"."discount_type"::text = 'fixed_amount'
          AND "promotions"."fixed_amount_cents" IS NOT NULL
          AND "promotions"."percent_bp" IS NULL
          AND "promotions"."free_nights" IS NULL)
        OR ("promotions"."discount_type"::text = 'free_days'
          AND "promotions"."free_nights" IS NOT NULL
          AND "promotions"."free_nights_threshold" IS NOT NULL
          AND "promotions"."percent_bp" IS NULL
          AND "promotions"."fixed_amount_cents" IS NULL)
        OR ("promotions"."discount_type"::text = 'commission_waiver'
          AND "promotions"."fixed_amount_cents" IS NULL
          AND "promotions"."free_nights" IS NULL)
      ));