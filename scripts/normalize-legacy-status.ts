import path from "node:path";
import { config } from "dotenv";
import { sql } from "drizzle-orm";
import { forceIpv4 } from "@/lib/force-ipv4";
import { TERMINAL_UIC } from "@/lib/wc-uic-map";

forceIpv4();
config({ path: path.resolve(__dirname, "..", ".env.local") });

// One-time cleanup of the Status column as imported from Main Database.xlsx.
//
// Only two kinds of change are made, both deliberately conservative:
//
// 1. A handful of legacy free-text values that are unambiguous synonyms of a
//    canonical status (see lib/order-status.ts) are rewritten to the canonical
//    spelling — e.g. "w/f BDP" / "wf bdp" both mean the same thing as the canonical
//    "Pending BDP". Values with no confident canonical equivalent (OPEN, PROGRESS,
//    URGENT, TOP URGENT, and the "w/f Slot ..." variants, which don't map cleanly
//    onto the Ready/Pending taxonomy) are left untouched rather than guessed at.
// 2. Every order already sitting in the Kitting/RPC serviceable store gets its
//    status forced to "Ready", mirroring the deriveStatus() rule that now applies
//    automatically to every create/edit (see wc-uic-map.ts) — this brings the
//    ~2,600 legacy rows imported before that rule existed into line with it.
const SYNONYM_MAP: Record<string, string> = {
  Unset: "",
  unset: "",
  "w/f BDP": "Pending BDP",
  "wf bdp": "Pending BDP",
  "w/f Material": "Pending Raw Material",
  "w/f Raw Material": "Pending Raw Material",
  "w/f Task /Decission": "Pending Decision",
  "w/f Tools/Calibration": "Pending Tooling",
  "Ready to load partially": "Partially Ready",
};

async function main() {
  const { db } = await import("@/db");
  const { orders } = await import("@/db/schema");

  const before = await db
    .select({ status: orders.status, n: sql<number>`count(*)` })
    .from(orders)
    .groupBy(orders.status)
    .orderBy(sql`count(*) desc`);
  console.log("Before:", before);

  let synonymsUpdated = 0;
  for (const [legacy, canonical] of Object.entries(SYNONYM_MAP)) {
    const result = await db
      .update(orders)
      .set({ status: canonical || null, updatedAt: new Date() })
      .where(sql`status = ${legacy}`);
    synonymsUpdated += result.rowCount ?? 0;
  }

  const terminalResult = await db
    .update(orders)
    .set({ status: "Ready", updatedAt: new Date() })
    .where(sql`uic_today = ${TERMINAL_UIC} and (status is distinct from 'Ready')`);

  const after = await db
    .select({ status: orders.status, n: sql<number>`count(*)` })
    .from(orders)
    .groupBy(orders.status)
    .orderBy(sql`count(*) desc`);
  console.log("After:", after);

  console.log(
    `Rewrote ${synonymsUpdated} rows to canonical synonyms, forced ${terminalResult.rowCount ?? 0} Kitting/RPC rows to "Ready".`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
