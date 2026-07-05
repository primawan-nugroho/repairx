import path from "node:path";
import fs from "node:fs";
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { forceIpv4 } from "@/lib/force-ipv4";

forceIpv4();
config({ path: path.resolve(__dirname, "..", ".env.local") });

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("Usage: tsx scripts/apply-migration.ts <path-to-sql>");

  const sql = neon(process.env.DATABASE_URL!);
  const raw = fs.readFileSync(path.resolve(file), "utf-8");
  const statements = raw
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const statement of statements) {
    console.log("Executing:", statement.slice(0, 80).replace(/\n/g, " "), "...");
    await sql(statement);
  }
  console.log(`Applied ${statements.length} statements from ${file}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
