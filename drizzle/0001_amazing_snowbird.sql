CREATE TABLE IF NOT EXISTS "repair_planner_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"engine_apu" varchar(16),
	"customer" varchar(128),
	"engine_type" varchar(32),
	"serial_number" varchar(64),
	"eo" varchar(64),
	"workscope" varchar(128),
	"induction_date" date,
	"rpc1" varchar(64),
	"rpc2" varchar(64),
	"gate4_status" varchar(32),
	"project_status" varchar(32),
	"remark" text,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
