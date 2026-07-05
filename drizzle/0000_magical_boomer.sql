CREATE TYPE "public"."shift" AS ENUM('AM', 'PM', 'Overtime');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'production_control', 'viewer');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" varchar(32) NOT NULL,
	"date_in" date,
	"gate4_target" date,
	"description" text,
	"serial_number" varchar(64),
	"engine_type" varchar(32),
	"mwc_routing" varchar(256),
	"mwc_today" varchar(16),
	"uic_today" varchar(32),
	"plan_finish_date" date,
	"waiting_repair" boolean DEFAULT false NOT NULL,
	"tier" integer,
	"status" varchar(64),
	"remark" text,
	"location" varchar(128),
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shift_report_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_date" date NOT NULL,
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
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(64) NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" varchar(128) NOT NULL,
	"role" "user_role" DEFAULT 'production_control' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shift_report_entries" ADD CONSTRAINT "shift_report_entries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
