CREATE TABLE IF NOT EXISTS "daily_menu_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"menu_date" date NOT NULL,
	"shift" "shift" NOT NULL,
	"order_number" varchar(32) NOT NULL,
	"work_center" varchar(16),
	"uic" varchar(32),
	"ops" varchar(32),
	"activity" text,
	"plan_mhrs" numeric(8, 2),
	"consumed_mhrs" numeric(8, 2),
	"manhours" numeric(8, 2),
	"progress_pct" integer,
	"stamp_pct" integer,
	"completeness_status" varchar(32),
	"remark" text,
	"archived" boolean DEFAULT false NOT NULL,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shift_report_entries" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "daily_menu_entries" ADD CONSTRAINT "daily_menu_entries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
