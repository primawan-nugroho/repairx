import path from "node:path";
import { config } from "dotenv";
import { sql } from "drizzle-orm";
import { forceIpv4 } from "@/lib/force-ipv4";

forceIpv4();
config({ path: path.resolve(__dirname, "..", ".env.local") });

// One-time cleanup after introducing canonical RPC/EO name lists and a fixed
// Gate 4/Project status taxonomy (CLOSED | WIP):
//
// 1. EO/RPC-1/RPC-2 values that case-insensitively match a seeded canonical name
//    (e.g. "Aditya" -> "ADITYA") are rewritten to that exact spelling, so the new
//    dropdowns show them as a real selection instead of a disabled "(not in list)"
//    fallback. Anything that doesn't match any canonical name is left untouched —
//    never guessed at.
// 2. Gate 4 status / Project status: legacy free-text synonyms of "in progress"
//    (OPEN, INPROGRESS, IN PROGRESS, WIP already) become "WIP"; any exact
//    case-insensitive "CLOSED" becomes "CLOSED". Anything else is left alone.
const STATUS_WIP_SYNONYMS = ["open", "inprogress", "in progress", "wip"];

async function main() {
  const { db } = await import("@/db");
  const { repairPlannerEntries, rpcPeople, engineOwners } = await import("@/db/schema");

  const [rpcNames, eoNames] = await Promise.all([
    db.select({ name: rpcPeople.name }).from(rpcPeople),
    db.select({ name: engineOwners.name }).from(engineOwners),
  ]);

  let rpc1Fixed = 0;
  let rpc2Fixed = 0;
  let eoFixed = 0;

  for (const { name } of rpcNames) {
    const r1 = await db
      .update(repairPlannerEntries)
      .set({ rpc1: name, updatedAt: new Date() })
      .where(sql`lower(${repairPlannerEntries.rpc1}) = ${name.toLowerCase()} and ${repairPlannerEntries.rpc1} != ${name}`);
    rpc1Fixed += r1.rowCount ?? 0;

    const r2 = await db
      .update(repairPlannerEntries)
      .set({ rpc2: name, updatedAt: new Date() })
      .where(sql`lower(${repairPlannerEntries.rpc2}) = ${name.toLowerCase()} and ${repairPlannerEntries.rpc2} != ${name}`);
    rpc2Fixed += r2.rowCount ?? 0;
  }

  for (const { name } of eoNames) {
    const r = await db
      .update(repairPlannerEntries)
      .set({ eo: name, updatedAt: new Date() })
      .where(sql`lower(${repairPlannerEntries.eo}) = ${name.toLowerCase()} and ${repairPlannerEntries.eo} != ${name}`);
    eoFixed += r.rowCount ?? 0;
  }

  let gate4Fixed = 0;
  let projectFixed = 0;
  for (const synonym of STATUS_WIP_SYNONYMS) {
    const g = await db
      .update(repairPlannerEntries)
      .set({ gate4Status: "WIP", updatedAt: new Date() })
      .where(sql`lower(${repairPlannerEntries.gate4Status}) = ${synonym} and ${repairPlannerEntries.gate4Status} != 'WIP'`);
    gate4Fixed += g.rowCount ?? 0;

    const p = await db
      .update(repairPlannerEntries)
      .set({ projectStatus: "WIP", updatedAt: new Date() })
      .where(sql`lower(${repairPlannerEntries.projectStatus}) = ${synonym} and ${repairPlannerEntries.projectStatus} != 'WIP'`);
    projectFixed += p.rowCount ?? 0;
  }
  const g2 = await db
    .update(repairPlannerEntries)
    .set({ gate4Status: "CLOSED", updatedAt: new Date() })
    .where(sql`lower(${repairPlannerEntries.gate4Status}) = 'closed' and ${repairPlannerEntries.gate4Status} != 'CLOSED'`);
  gate4Fixed += g2.rowCount ?? 0;
  const p2 = await db
    .update(repairPlannerEntries)
    .set({ projectStatus: "CLOSED", updatedAt: new Date() })
    .where(sql`lower(${repairPlannerEntries.projectStatus}) = 'closed' and ${repairPlannerEntries.projectStatus} != 'CLOSED'`);
  projectFixed += p2.rowCount ?? 0;

  console.log(
    `Normalized rpc1=${rpc1Fixed}, rpc2=${rpc2Fixed}, eo=${eoFixed}, gate4Status=${gate4Fixed}, projectStatus=${projectFixed} rows.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
