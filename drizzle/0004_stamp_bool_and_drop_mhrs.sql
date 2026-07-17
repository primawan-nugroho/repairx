-- Drop Consumed mhrs / Manhours (no longer tracked in the UI) and replace the
-- 0-100 stamp_pct with a boolean stamp flag. IF EXISTS / IF NOT EXISTS guards
-- keep this safe to re-run on Neon environments that may or may not have the
-- pre-existing columns (see 0003_backfill_report_columns.sql — some rows there
-- were also gated behind IF NOT EXISTS).
ALTER TABLE "shift_report_entries" DROP COLUMN IF EXISTS "stamp_pct";--> statement-breakpoint
ALTER TABLE "shift_report_entries" DROP COLUMN IF EXISTS "consumed_mhrs";--> statement-breakpoint
ALTER TABLE "shift_report_entries" DROP COLUMN IF EXISTS "manhours";--> statement-breakpoint
ALTER TABLE "shift_report_entries" ADD COLUMN IF NOT EXISTS "stamp" boolean DEFAULT false NOT NULL;--> statement-breakpoint

ALTER TABLE "daily_menu_entries" DROP COLUMN IF EXISTS "stamp_pct";--> statement-breakpoint
ALTER TABLE "daily_menu_entries" DROP COLUMN IF EXISTS "consumed_mhrs";--> statement-breakpoint
ALTER TABLE "daily_menu_entries" DROP COLUMN IF EXISTS "manhours";--> statement-breakpoint
ALTER TABLE "daily_menu_entries" ADD COLUMN IF NOT EXISTS "stamp" boolean DEFAULT false NOT NULL;
