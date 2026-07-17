// Applies a single .sql file (statement by statement, split on the
// `--> statement-breakpoint` marker Drizzle uses) against DATABASE_URL.
// Usage: tsx scripts/apply-sql.ts drizzle/0004_stamp_bool_and_drop_mhrs.sql
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import { forceIpv4 } from "../src/lib/force-ipv4";

forceIpv4();
config({ path: ".env.local" });

async function main() {
  const path = process.argv[2];
  if (!path) throw new Error("Usage: tsx scripts/apply-sql.ts <path.sql>");
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const sql = neon(url);
  const body = readFileSync(path, "utf8");
  const statements = body
    .split(/-->\s*statement-breakpoint/i)
    .map((s) => s.trim())
    .filter(Boolean);

  console.log(`Applying ${statements.length} statement(s) from ${path}`);
  for (const stmt of statements) {
    const first = stmt.split("\n")[0]?.slice(0, 80) ?? "";
    console.log(`  → ${first}${stmt.length > 80 ? "…" : ""}`);
    await sql(stmt);
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
