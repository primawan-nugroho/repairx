CREATE TABLE IF NOT EXISTS "ai_insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"insight_date" date NOT NULL,
	"shift" "shift" NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ai_insights_date_shift_idx" ON "ai_insights" USING btree ("insight_date","shift");
