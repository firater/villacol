-- Required by the gin_trgm_ops indexes on villa_search_documents and
-- search_synonyms below. Drizzle does not track extensions, so these are added
-- by hand and must stay ahead of any index that uses them.
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS unaccent;--> statement-breakpoint
CREATE TYPE "public"."booking_status_enum" AS ENUM('inquiry', 'pending', 'awaiting_payment', 'confirmed', 'cancelled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."calendar_block_source_enum" AS ENUM('admin', 'booking', 'ical');--> statement-breakpoint
CREATE TYPE "public"."contact_status_enum" AS ENUM('new', 'read', 'archived');--> statement-breakpoint
CREATE TYPE "public"."cron_run_status_enum" AS ENUM('running', 'succeeded', 'failed', 'skipped_locked');--> statement-breakpoint
CREATE TYPE "public"."currency_enum" AS ENUM('EUR', 'GBP', 'RUB');--> statement-breakpoint
CREATE TYPE "public"."discount_type_enum" AS ENUM('percentage', 'fixed_amount', 'free_days');--> statement-breakpoint
CREATE TYPE "public"."locale_enum" AS ENUM('en', 'de', 'ru');--> statement-breakpoint
CREATE TYPE "public"."price_cache_source_enum" AS ENUM('cron', 'admin_edit');--> statement-breakpoint
CREATE TYPE "public"."price_cache_window_enum" AS ENUM('min_stay', 'promo_free_days');--> statement-breakpoint
CREATE TYPE "public"."promotion_trigger_enum" AS ENUM('always', 'long_stay', 'last_minute', 'early_bird', 'coupon', 'exit_intent');--> statement-breakpoint
CREATE TYPE "public"."synonym_kind_enum" AS ENUM('location', 'category', 'amenity', 'misc');--> statement-breakpoint
CREATE TYPE "public"."user_role_enum" AS ENUM('admin', 'editor', 'guest');--> statement-breakpoint
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
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "user_role_enum" DEFAULT 'guest' NOT NULL,
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
CREATE TABLE "amenities" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"label_i18n" jsonb NOT NULL,
	"icon" text,
	"group_key" text,
	"is_filterable" boolean DEFAULT true NOT NULL,
	"order_value" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "amenities_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"order_value" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category_translations" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"locale" "locale_enum" NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"meta_title" text,
	"meta_description" text
);
--> statement-breakpoint
CREATE TABLE "features" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"label_i18n" jsonb NOT NULL,
	"icon" text,
	"group_key" text,
	"is_filterable" boolean DEFAULT true NOT NULL,
	"order_value" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "features_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "location_translations" (
	"id" serial PRIMARY KEY NOT NULL,
	"location_id" integer NOT NULL,
	"locale" "locale_enum" NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"meta_title" text,
	"meta_description" text
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer,
	"type" text DEFAULT 'district' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"order_value" integer DEFAULT 0 NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "villa_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"label_i18n" jsonb NOT NULL,
	"description_i18n" jsonb,
	"icon" text,
	"order_value" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "villa_rules_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "villa_amenities" (
	"villa_id" integer NOT NULL,
	"amenity_id" integer NOT NULL,
	"is_highlighted" boolean DEFAULT false NOT NULL,
	CONSTRAINT "villa_amenities_villa_id_amenity_id_pk" PRIMARY KEY("villa_id","amenity_id")
);
--> statement-breakpoint
CREATE TABLE "villa_categories" (
	"villa_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	CONSTRAINT "villa_categories_villa_id_category_id_pk" PRIMARY KEY("villa_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "villa_features" (
	"villa_id" integer NOT NULL,
	"feature_id" integer NOT NULL,
	"is_highlighted" boolean DEFAULT false NOT NULL,
	CONSTRAINT "villa_features_villa_id_feature_id_pk" PRIMARY KEY("villa_id","feature_id")
);
--> statement-breakpoint
CREATE TABLE "villa_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"villa_id" integer NOT NULL,
	"url" text NOT NULL,
	"alt_i18n" jsonb,
	"order_value" integer DEFAULT 0 NOT NULL,
	"is_main" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "villa_rule_links" (
	"villa_id" integer NOT NULL,
	"rule_id" integer NOT NULL,
	CONSTRAINT "villa_rule_links_villa_id_rule_id_pk" PRIMARY KEY("villa_id","rule_id")
);
--> statement-breakpoint
CREATE TABLE "villa_translations" (
	"id" serial PRIMARY KEY NOT NULL,
	"villa_id" integer NOT NULL,
	"locale" "locale_enum" NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"description" text,
	"meta_title" text,
	"meta_description" text
);
--> statement-breakpoint
CREATE TABLE "villas" (
	"id" serial PRIMARY KEY NOT NULL,
	"location_id" integer,
	"ref_code" text NOT NULL,
	"slug" text NOT NULL,
	"capacity" integer DEFAULT 2 NOT NULL,
	"bedrooms" integer DEFAULT 1 NOT NULL,
	"bathrooms" integer DEFAULT 1 NOT NULL,
	"default_min_stay" integer DEFAULT 5 NOT NULL,
	"default_nightly_price_cents" integer,
	"cleaning_fee_cents" integer DEFAULT 0 NOT NULL,
	"deposit_cents" integer DEFAULT 0 NOT NULL,
	"check_in_time" text DEFAULT '16:00' NOT NULL,
	"check_out_time" text DEFAULT '10:00' NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"order_value" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "villas_ref_code_unique" UNIQUE("ref_code"),
	CONSTRAINT "villas_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "promotions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_name_i18n" jsonb NOT NULL,
	"description_i18n" jsonb,
	"discount_type" "discount_type_enum" NOT NULL,
	"trigger_type" "promotion_trigger_enum" DEFAULT 'always' NOT NULL,
	"percent_bp" integer,
	"fixed_amount_cents" integer,
	"free_nights" integer,
	"free_nights_threshold" integer,
	"min_nights" integer,
	"max_nights" integer,
	"last_minute_within_days" integer,
	"early_bird_min_days" integer,
	"code" text,
	"booking_window_start" date,
	"booking_window_end" date,
	"travel_window_start" date,
	"travel_window_end" date,
	"priority_order" integer DEFAULT 100 NOT NULL,
	"is_stackable" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"max_redemptions" integer,
	"redemption_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promotions_value_shape_check" CHECK ((
        ("promotions"."discount_type" = 'percentage'
          AND "promotions"."percent_bp" IS NOT NULL
          AND "promotions"."fixed_amount_cents" IS NULL
          AND "promotions"."free_nights" IS NULL)
        OR ("promotions"."discount_type" = 'fixed_amount'
          AND "promotions"."fixed_amount_cents" IS NOT NULL
          AND "promotions"."percent_bp" IS NULL
          AND "promotions"."free_nights" IS NULL)
        OR ("promotions"."discount_type" = 'free_days'
          AND "promotions"."free_nights" IS NOT NULL
          AND "promotions"."free_nights_threshold" IS NOT NULL
          AND "promotions"."percent_bp" IS NULL
          AND "promotions"."fixed_amount_cents" IS NULL)
      )),
	CONSTRAINT "promotions_trigger_shape_check" CHECK ((
        ("promotions"."trigger_type" = 'always')
        OR ("promotions"."trigger_type" = 'long_stay' AND "promotions"."min_nights" IS NOT NULL)
        OR ("promotions"."trigger_type" = 'last_minute' AND "promotions"."last_minute_within_days" IS NOT NULL)
        OR ("promotions"."trigger_type" = 'early_bird' AND "promotions"."early_bird_min_days" IS NOT NULL)
        OR ("promotions"."trigger_type" IN ('coupon', 'exit_intent') AND "promotions"."code" IS NOT NULL)
      )),
	CONSTRAINT "promotions_percent_bp_range_check" CHECK ("promotions"."percent_bp" IS NULL OR ("promotions"."percent_bp" > 0 AND "promotions"."percent_bp" <= 10000)),
	CONSTRAINT "promotions_positive_amounts_check" CHECK (("promotions"."fixed_amount_cents" IS NULL OR "promotions"."fixed_amount_cents" > 0)
        AND ("promotions"."free_nights" IS NULL OR "promotions"."free_nights" > 0)
        AND ("promotions"."free_nights_threshold" IS NULL OR "promotions"."free_nights_threshold" > 0)),
	CONSTRAINT "promotions_free_nights_below_threshold_check" CHECK ("promotions"."free_nights" IS NULL
        OR "promotions"."free_nights_threshold" IS NULL
        OR "promotions"."free_nights" < "promotions"."free_nights_threshold"),
	CONSTRAINT "promotions_night_range_check" CHECK ("promotions"."min_nights" IS NULL
        OR "promotions"."max_nights" IS NULL
        OR "promotions"."min_nights" <= "promotions"."max_nights")
);
--> statement-breakpoint
CREATE TABLE "villa_promotions" (
	"villa_id" integer NOT NULL,
	"promotion_id" integer NOT NULL,
	"priority_override" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "villa_promotions_villa_id_promotion_id_pk" PRIMARY KEY("villa_id","promotion_id")
);
--> statement-breakpoint
CREATE TABLE "booking_promotions" (
	"booking_id" uuid NOT NULL,
	"promotion_id" integer NOT NULL,
	"discount_cents" integer NOT NULL,
	"step_index" integer NOT NULL,
	CONSTRAINT "booking_promotions_booking_id_promotion_id_pk" PRIMARY KEY("booking_id","promotion_id")
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"villa_id" integer NOT NULL,
	"user_id" text,
	"guest_name" text NOT NULL,
	"guest_email" text NOT NULL,
	"guest_phone" text NOT NULL,
	"guest_address" text,
	"guest_note" text,
	"guest_count" integer NOT NULL,
	"extra_guests" jsonb,
	"check_in" date NOT NULL,
	"check_out" date NOT NULL,
	"night_count" integer NOT NULL,
	"status" "booking_status_enum" DEFAULT 'inquiry' NOT NULL,
	"display_currency" "currency_enum" DEFAULT 'EUR' NOT NULL,
	"display_total_cents" integer NOT NULL,
	"fx_rate_used" numeric(18, 8) DEFAULT '1' NOT NULL,
	"base_total_cents" integer NOT NULL,
	"total_discount_cents" integer DEFAULT 0 NOT NULL,
	"nightly_total_cents" integer NOT NULL,
	"cleaning_fee_cents" integer DEFAULT 0 NOT NULL,
	"deposit_cents" integer DEFAULT 0 NOT NULL,
	"grand_total_cents" integer NOT NULL,
	"price_breakdown" jsonb NOT NULL,
	"terms_accepted_at" timestamp with time zone,
	"contract_accepted_at" timestamp with time zone,
	"payment_provider" text,
	"payment_intent_id" text,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_date_order_check" CHECK ("bookings"."check_out" > "bookings"."check_in"),
	CONSTRAINT "bookings_night_count_check" CHECK ("bookings"."night_count" > 0),
	CONSTRAINT "bookings_guest_count_check" CHECK ("bookings"."guest_count" > 0),
	CONSTRAINT "bookings_nightly_total_check" CHECK ("bookings"."nightly_total_cents" = "bookings"."base_total_cents" - "bookings"."total_discount_cents"),
	CONSTRAINT "bookings_grand_total_check" CHECK ("bookings"."grand_total_cents" = "bookings"."nightly_total_cents" + "bookings"."cleaning_fee_cents"),
	CONSTRAINT "bookings_non_negative_totals_check" CHECK ("bookings"."nightly_total_cents" >= 0 AND "bookings"."total_discount_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "exit_intent_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"promotion_id" integer NOT NULL,
	"visitor_id" text NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"redeemed_at" timestamp with time zone,
	"booking_id" uuid,
	CONSTRAINT "exit_intent_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "villa_calendar" (
	"villa_id" integer NOT NULL,
	"date" date NOT NULL,
	"price_cents" integer,
	"min_stay" integer,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"block_source" "calendar_block_source_enum",
	"booking_id" uuid,
	"note" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "villa_calendar_villa_id_date_pk" PRIMARY KEY("villa_id","date"),
	CONSTRAINT "villa_calendar_price_check" CHECK ("villa_calendar"."price_cents" IS NULL OR "villa_calendar"."price_cents" >= 0),
	CONSTRAINT "villa_calendar_min_stay_check" CHECK ("villa_calendar"."min_stay" IS NULL OR "villa_calendar"."min_stay" > 0),
	CONSTRAINT "villa_calendar_block_source_check" CHECK ("villa_calendar"."is_blocked" = false OR "villa_calendar"."block_source" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "exchange_rates" (
	"base_currency" "currency_enum" DEFAULT 'EUR' NOT NULL,
	"quote_currency" "currency_enum" NOT NULL,
	"rate" numeric(18, 8) NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" text,
	CONSTRAINT "exchange_rates_base_currency_quote_currency_pk" PRIMARY KEY("base_currency","quote_currency"),
	CONSTRAINT "exchange_rates_positive_rate_check" CHECK ("exchange_rates"."rate" > 0)
);
--> statement-breakpoint
CREATE TABLE "similar_villas" (
	"villa_id" integer NOT NULL,
	"similar_villa_id" integer NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"is_manual" boolean DEFAULT false NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "similar_villas_villa_id_similar_villa_id_pk" PRIMARY KEY("villa_id","similar_villa_id"),
	CONSTRAINT "similar_villas_no_self_reference_check" CHECK ("similar_villas"."villa_id" <> "similar_villas"."similar_villa_id")
);
--> statement-breakpoint
CREATE TABLE "villa_price_cache" (
	"villa_id" integer NOT NULL,
	"window_kind" "price_cache_window_enum" NOT NULL,
	"check_in" date NOT NULL,
	"check_out" date NOT NULL,
	"night_count" integer NOT NULL,
	"base_total_cents" integer NOT NULL,
	"total_discount_cents" integer DEFAULT 0 NOT NULL,
	"discounted_total_cents" integer NOT NULL,
	"avg_nightly_cents" integer NOT NULL,
	"min_nightly_cents" integer NOT NULL,
	"max_nightly_cents" integer NOT NULL,
	"cleaning_fee_cents" integer DEFAULT 0 NOT NULL,
	"applied_promotions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"has_active_discount" boolean DEFAULT false NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"computed_by" "price_cache_source_enum" DEFAULT 'cron' NOT NULL,
	"engine_version" integer NOT NULL,
	CONSTRAINT "villa_price_cache_villa_id_window_kind_pk" PRIMARY KEY("villa_id","window_kind"),
	CONSTRAINT "villa_price_cache_night_count_check" CHECK ("villa_price_cache"."night_count" > 0),
	CONSTRAINT "villa_price_cache_date_order_check" CHECK ("villa_price_cache"."check_out" > "villa_price_cache"."check_in"),
	CONSTRAINT "villa_price_cache_discount_math_check" CHECK ("villa_price_cache"."discounted_total_cents" = "villa_price_cache"."base_total_cents" - "villa_price_cache"."total_discount_cents"),
	CONSTRAINT "villa_price_cache_non_negative_check" CHECK ("villa_price_cache"."discounted_total_cents" >= 0 AND "villa_price_cache"."total_discount_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "search_synonyms" (
	"id" serial PRIMARY KEY NOT NULL,
	"locale" "locale_enum" NOT NULL,
	"term" text NOT NULL,
	"canonical_term" text NOT NULL,
	"kind" "synonym_kind_enum" DEFAULT 'misc' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "villa_search_documents" (
	"villa_id" integer NOT NULL,
	"locale" "locale_enum" NOT NULL,
	"document" text NOT NULL,
	"tsv" "tsvector",
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "villa_search_documents_villa_id_locale_pk" PRIMARY KEY("villa_id","locale")
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"message" text NOT NULL,
	"locale" "locale_enum" DEFAULT 'en' NOT NULL,
	"status" "contact_status_enum" DEFAULT 'new' NOT NULL,
	"admin_note" text,
	"visitor_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "deal_reads" (
	"deal_id" integer NOT NULL,
	"visitor_id" text NOT NULL,
	"read_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "deal_reads_deal_id_visitor_id_pk" PRIMARY KEY("deal_id","visitor_id")
);
--> statement-breakpoint
CREATE TABLE "deals" (
	"id" serial PRIMARY KEY NOT NULL,
	"title_i18n" jsonb NOT NULL,
	"body_i18n" jsonb NOT NULL,
	"link" text,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"order_value" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cron_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_name" text NOT NULL,
	"status" "cron_run_status_enum" DEFAULT 'running' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"duration_ms" integer,
	"processed_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"error" text,
	"payload" jsonb
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_translations" ADD CONSTRAINT "category_translations_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_translations" ADD CONSTRAINT "location_translations_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_parent_id_locations_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villa_amenities" ADD CONSTRAINT "villa_amenities_villa_id_villas_id_fk" FOREIGN KEY ("villa_id") REFERENCES "public"."villas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villa_amenities" ADD CONSTRAINT "villa_amenities_amenity_id_amenities_id_fk" FOREIGN KEY ("amenity_id") REFERENCES "public"."amenities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villa_categories" ADD CONSTRAINT "villa_categories_villa_id_villas_id_fk" FOREIGN KEY ("villa_id") REFERENCES "public"."villas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villa_categories" ADD CONSTRAINT "villa_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villa_features" ADD CONSTRAINT "villa_features_villa_id_villas_id_fk" FOREIGN KEY ("villa_id") REFERENCES "public"."villas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villa_features" ADD CONSTRAINT "villa_features_feature_id_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villa_images" ADD CONSTRAINT "villa_images_villa_id_villas_id_fk" FOREIGN KEY ("villa_id") REFERENCES "public"."villas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villa_rule_links" ADD CONSTRAINT "villa_rule_links_villa_id_villas_id_fk" FOREIGN KEY ("villa_id") REFERENCES "public"."villas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villa_rule_links" ADD CONSTRAINT "villa_rule_links_rule_id_villa_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."villa_rules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villa_translations" ADD CONSTRAINT "villa_translations_villa_id_villas_id_fk" FOREIGN KEY ("villa_id") REFERENCES "public"."villas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villas" ADD CONSTRAINT "villas_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villa_promotions" ADD CONSTRAINT "villa_promotions_villa_id_villas_id_fk" FOREIGN KEY ("villa_id") REFERENCES "public"."villas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villa_promotions" ADD CONSTRAINT "villa_promotions_promotion_id_promotions_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_promotions" ADD CONSTRAINT "booking_promotions_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_promotions" ADD CONSTRAINT "booking_promotions_promotion_id_promotions_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_villa_id_villas_id_fk" FOREIGN KEY ("villa_id") REFERENCES "public"."villas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exit_intent_codes" ADD CONSTRAINT "exit_intent_codes_promotion_id_promotions_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exit_intent_codes" ADD CONSTRAINT "exit_intent_codes_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villa_calendar" ADD CONSTRAINT "villa_calendar_villa_id_villas_id_fk" FOREIGN KEY ("villa_id") REFERENCES "public"."villas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villa_calendar" ADD CONSTRAINT "villa_calendar_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "similar_villas" ADD CONSTRAINT "similar_villas_villa_id_villas_id_fk" FOREIGN KEY ("villa_id") REFERENCES "public"."villas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "similar_villas" ADD CONSTRAINT "similar_villas_similar_villa_id_villas_id_fk" FOREIGN KEY ("similar_villa_id") REFERENCES "public"."villas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villa_price_cache" ADD CONSTRAINT "villa_price_cache_villa_id_villas_id_fk" FOREIGN KEY ("villa_id") REFERENCES "public"."villas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villa_search_documents" ADD CONSTRAINT "villa_search_documents_villa_id_villas_id_fk" FOREIGN KEY ("villa_id") REFERENCES "public"."villas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_reads" ADD CONSTRAINT "deal_reads_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "amenities_order_value_idx" ON "amenities" USING btree ("order_value");--> statement-breakpoint
CREATE INDEX "categories_order_value_idx" ON "categories" USING btree ("order_value");--> statement-breakpoint
CREATE UNIQUE INDEX "category_translations_category_locale_idx" ON "category_translations" USING btree ("category_id","locale");--> statement-breakpoint
CREATE UNIQUE INDEX "category_translations_locale_slug_idx" ON "category_translations" USING btree ("locale","slug");--> statement-breakpoint
CREATE INDEX "features_order_value_idx" ON "features" USING btree ("order_value");--> statement-breakpoint
CREATE UNIQUE INDEX "location_translations_location_locale_idx" ON "location_translations" USING btree ("location_id","locale");--> statement-breakpoint
CREATE UNIQUE INDEX "location_translations_locale_slug_idx" ON "location_translations" USING btree ("locale","slug");--> statement-breakpoint
CREATE INDEX "locations_parent_id_idx" ON "locations" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "locations_order_value_idx" ON "locations" USING btree ("order_value");--> statement-breakpoint
CREATE INDEX "villa_rules_order_value_idx" ON "villa_rules" USING btree ("order_value");--> statement-breakpoint
CREATE INDEX "villa_amenities_amenity_id_idx" ON "villa_amenities" USING btree ("amenity_id");--> statement-breakpoint
CREATE INDEX "villa_categories_category_id_idx" ON "villa_categories" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "villa_features_feature_id_idx" ON "villa_features" USING btree ("feature_id");--> statement-breakpoint
CREATE INDEX "villa_images_villa_order_idx" ON "villa_images" USING btree ("villa_id","order_value");--> statement-breakpoint
CREATE INDEX "villa_rule_links_rule_id_idx" ON "villa_rule_links" USING btree ("rule_id");--> statement-breakpoint
CREATE UNIQUE INDEX "villa_translations_villa_locale_idx" ON "villa_translations" USING btree ("villa_id","locale");--> statement-breakpoint
CREATE UNIQUE INDEX "villa_translations_locale_slug_idx" ON "villa_translations" USING btree ("locale","slug");--> statement-breakpoint
CREATE INDEX "villas_location_id_idx" ON "villas" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "villas_order_value_idx" ON "villas" USING btree ("order_value");--> statement-breakpoint
CREATE INDEX "villas_active_order_idx" ON "villas" USING btree ("is_active","order_value");--> statement-breakpoint
CREATE INDEX "villas_capacity_idx" ON "villas" USING btree ("capacity");--> statement-breakpoint
CREATE INDEX "villas_bedrooms_idx" ON "villas" USING btree ("bedrooms");--> statement-breakpoint
CREATE INDEX "promotions_active_priority_idx" ON "promotions" USING btree ("is_active","priority_order");--> statement-breakpoint
CREATE INDEX "promotions_code_idx" ON "promotions" USING btree ("code");--> statement-breakpoint
CREATE INDEX "promotions_trigger_type_idx" ON "promotions" USING btree ("trigger_type");--> statement-breakpoint
CREATE INDEX "villa_promotions_promotion_id_idx" ON "villa_promotions" USING btree ("promotion_id");--> statement-breakpoint
CREATE INDEX "booking_promotions_promotion_id_idx" ON "booking_promotions" USING btree ("promotion_id");--> statement-breakpoint
CREATE INDEX "bookings_villa_dates_idx" ON "bookings" USING btree ("villa_id","check_in","check_out");--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bookings_guest_email_idx" ON "bookings" USING btree ("guest_email");--> statement-breakpoint
CREATE INDEX "bookings_created_at_idx" ON "bookings" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "exit_intent_codes_visitor_id_idx" ON "exit_intent_codes" USING btree ("visitor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "exit_intent_codes_live_per_visitor_idx" ON "exit_intent_codes" USING btree ("visitor_id") WHERE "exit_intent_codes"."redeemed_at" IS NULL;--> statement-breakpoint
CREATE INDEX "villa_calendar_open_nights_idx" ON "villa_calendar" USING btree ("villa_id","date") WHERE "villa_calendar"."is_blocked" = false;--> statement-breakpoint
CREATE INDEX "villa_calendar_date_idx" ON "villa_calendar" USING btree ("date");--> statement-breakpoint
CREATE INDEX "villa_calendar_booking_id_idx" ON "villa_calendar" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "similar_villas_villa_score_idx" ON "similar_villas" USING btree ("villa_id","score");--> statement-breakpoint
CREATE INDEX "villa_price_cache_window_price_idx" ON "villa_price_cache" USING btree ("window_kind","discounted_total_cents");--> statement-breakpoint
CREATE INDEX "villa_price_cache_has_discount_idx" ON "villa_price_cache" USING btree ("has_active_discount");--> statement-breakpoint
CREATE INDEX "villa_price_cache_check_in_idx" ON "villa_price_cache" USING btree ("check_in");--> statement-breakpoint
CREATE UNIQUE INDEX "search_synonyms_locale_term_idx" ON "search_synonyms" USING btree ("locale","term");--> statement-breakpoint
CREATE INDEX "search_synonyms_kind_idx" ON "search_synonyms" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "search_synonyms_term_trgm_idx" ON "search_synonyms" USING gin ("term" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "villa_search_documents_tsv_idx" ON "villa_search_documents" USING gin ("tsv");--> statement-breakpoint
CREATE INDEX "villa_search_documents_trgm_idx" ON "villa_search_documents" USING gin ("document" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "contact_messages_status_created_idx" ON "contact_messages" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "contact_messages_visitor_created_idx" ON "contact_messages" USING btree ("visitor_id","created_at");--> statement-breakpoint
CREATE INDEX "deal_reads_visitor_id_idx" ON "deal_reads" USING btree ("visitor_id");--> statement-breakpoint
CREATE INDEX "deals_active_order_idx" ON "deals" USING btree ("is_active","order_value");--> statement-breakpoint
CREATE INDEX "deals_window_idx" ON "deals" USING btree ("starts_at","ends_at");--> statement-breakpoint
CREATE INDEX "cron_runs_job_started_idx" ON "cron_runs" USING btree ("job_name","started_at");--> statement-breakpoint
CREATE INDEX "cron_runs_status_idx" ON "cron_runs" USING btree ("status");