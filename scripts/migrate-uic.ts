import path from "node:path";
import { config } from "dotenv";
import { sql } from "drizzle-orm";
import { forceIpv4 } from "@/lib/force-ipv4";
import { deriveUic } from "@/lib/wc-uic-map";

forceIpv4();
config({ path: path.resolve(__dirname, "..", ".env.local") });

// One-time migration: recompute uic_today for every order from mwc_today per the
// mapping rule (see wc-uic-map.ts). Orders whose mwc_today is blank or not in the
// mapping keep their existing uic_today untouched — we never null out a value we
// can't confidently derive.
async function main() {
  const { db } = await import("@/db");
  const { orders } = await import("@/db/schema");

  const before = await db
    .select({ uicToday: orders.uicToday, n: sql<number>`count(*)` })
    .from(orders)
    .groupBy(orders.uicToday)
    .orderBy(sql`count(*) desc`);
  console.log("Before:", before);

  const rows = await db.select({ id: orders.id, mwcToday: orders.mwcToday, uicToday: orders.uicToday }).from(orders);

  let updated = 0;
  let skippedUnmapped = 0;
  for (const row of rows) {
    const derived = deriveUic(row.mwcToday);
    if (!derived) {
      skippedUnmapped++;
      continue;
    }
    if (derived === row.uicToday) continue;
    await db.update(orders).set({ uicToday: derived, updatedAt: new Date() }).where(sql`id = ${row.id}`);
    updated++;
  }

  const after = await db
    .select({ uicToday: orders.uicToday, n: sql<number>`count(*)` })
    .from(orders)
    .groupBy(orders.uicToday)
    .orderBy(sql`count(*) desc`);
  console.log("After:", after);

  console.log(`Updated ${updated} rows. Left ${skippedUnmapped} rows untouched (blank/unmapped work center).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
