-- 0004_stamp_bool_and_drop_mhrs.sql assumed "stamp" didn't exist yet and used
-- ADD COLUMN IF NOT EXISTS "stamp" boolean — but a "stamp" column already existed
-- (integer, 0-100, a prior hand-rename of stamp_pct), so that statement was a silent
-- no-op and the column never actually became boolean. Convert it in place instead.
ALTER TABLE "shift_report_entries"
  ALTER COLUMN "stamp" DROP DEFAULT;--> statement-breakpoint
-- Existing data is 0/10/20/40/50/100/200 (legacy 0-100 stamp %, some bad rows over
-- 100) — not a pre-existing 0/1 flag, so >= 100 (fully stamped) is the correct
-- boolean reading, not "<> 0" (which would wrongly mark partial % as stamped).
-- A few rows are NULL; those become NULL booleans here, fixed up below.
ALTER TABLE "shift_report_entries"
  ALTER COLUMN "stamp" TYPE boolean USING ("stamp" >= 100);--> statement-breakpoint
UPDATE "shift_report_entries" SET "stamp" = false WHERE "stamp" IS NULL;--> statement-breakpoint
ALTER TABLE "shift_report_entries"
  ALTER COLUMN "stamp" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "shift_report_entries"
  ALTER COLUMN "stamp" SET NOT NULL;--> statement-breakpoint

ALTER TABLE "daily_menu_entries"
  ALTER COLUMN "stamp" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "daily_menu_entries"
  ALTER COLUMN "stamp" TYPE boolean USING ("stamp" >= 100);--> statement-breakpoint
UPDATE "daily_menu_entries" SET "stamp" = false WHERE "stamp" IS NULL;--> statement-breakpoint
ALTER TABLE "daily_menu_entries"
  ALTER COLUMN "stamp" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "daily_menu_entries"
  ALTER COLUMN "stamp" SET NOT NULL;
