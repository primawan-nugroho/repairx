CREATE TABLE IF NOT EXISTS "rpc_people" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(64) NOT NULL UNIQUE,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "engine_owners" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(64) NOT NULL UNIQUE,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
