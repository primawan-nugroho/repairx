-- Backfill columns for databases where daily_menu_entries existed before the
-- stamp/updated_at fields were introduced. IF NOT EXISTS keeps this safe to rerun.
ALTER TABLE "daily_menu_entries" ADD COLUMN IF NOT EXISTS "stamp_pct" integer;--> statement-breakpoint
ALTER TABLE "daily_menu_entries" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "shift_report_entries" ADD COLUMN IF NOT EXISTS "stamp_pct" integer;--> statement-breakpoint
ALTER TABLE "shift_report_entries" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now() NOT NULL;
