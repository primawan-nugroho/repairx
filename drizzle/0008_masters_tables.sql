CREATE TABLE IF NOT EXISTS "engine_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(32) NOT NULL UNIQUE,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "uic_teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(32) NOT NULL UNIQUE,
	"color_slug" varchar(16) NOT NULL,
	"is_terminal" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "work_centers" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(16) NOT NULL UNIQUE,
	"uic_team_id" integer REFERENCES "uic_teams"("id"),
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
