import path from "node:path";
import { config } from "dotenv";
import { forceIpv4 } from "@/lib/force-ipv4";

forceIpv4();
config({ path: path.resolve(__dirname, "..", ".env.local") });

// One-time seed: moves the previously-hardcoded engine type list
// (lib/engine-types.ts) and work-center/UIC mapping (lib/wc-uic-map.ts) into the new
// masters tables, preserving every existing color assignment and the Kitting/RPC
// terminal flag exactly as they were in code. Safe to re-run — every insert is
// onConflictDoNothing keyed on the unique name/code.
const ENGINE_TYPES = ["CFM56-3", "CFM56-5B", "CFM56-7B", "GTCP131-9A", "GTCP131-9B", "GTCP331-350C", "GTCP85", "Other"];

const UIC_TEAMS: Array<{ name: string; colorSlug: string; isTerminal?: boolean }> = [
  { name: "TVU-1", colorSlug: "uic-a" },
  { name: "TVP-1/2", colorSlug: "uic-b" },
  { name: "TVP-4", colorSlug: "uic-c" },
  { name: "TCS-3", colorSlug: "uic-d" },
  { name: "TCY-3", colorSlug: "uic-e" },
  { name: "TVU-3", colorSlug: "uic-f" },
  { name: "TVU-4", colorSlug: "uic-g" },
  { name: "Kitting/RPC", colorSlug: "uic-h", isTerminal: true },
  { name: "TCS", colorSlug: "uic-i" },
  { name: "TCW", colorSlug: "uic-j" },
];

const WORK_CENTER_TO_UIC: Record<string, string> = {
  ADU: "TVU-1",
  ADE: "TVP-1/2",
  BL: "TVU-1",
  CC: "TVP-4",
  PT: "TCS-3",
  EP: "TCS-3",
  LB: "TCY-3",
  MC: "TCS-3",
  SP: "TCS-3",
  MN: "TVU-3",
  TS: "TVU-3",
  MR: "TVU-4",
  WD: "TVU-4",
  HT: "TVU-4",
  ND: "TVP-4",
  BR: "TVP-4",
  BC: "TVP-4",
  "SERV/Finish": "Kitting/RPC",
  W303: "TCS",
  WBLG: "TCW",
};

async function main() {
  const { db } = await import("@/db");
  const { engineTypes, uicTeams, workCenters } = await import("@/db/schema");

  await db
    .insert(engineTypes)
    .values(ENGINE_TYPES.map((name, i) => ({ name, sortOrder: i })))
    .onConflictDoNothing();
  console.log(`Seeded ${ENGINE_TYPES.length} engine types.`);

  await db
    .insert(uicTeams)
    .values(UIC_TEAMS.map((t) => ({ name: t.name, colorSlug: t.colorSlug, isTerminal: t.isTerminal ?? false })))
    .onConflictDoNothing();
  console.log(`Seeded ${UIC_TEAMS.length} UIC teams.`);

  const teamRows = await db.select({ id: uicTeams.id, name: uicTeams.name }).from(uicTeams);
  const teamIdByName = new Map(teamRows.map((t) => [t.name, t.id]));

  const workCenterValues = Object.entries(WORK_CENTER_TO_UIC).map(([code, uicName]) => ({
    code,
    uicTeamId: teamIdByName.get(uicName) ?? null,
  }));
  await db.insert(workCenters).values(workCenterValues).onConflictDoNothing();
  console.log(`Seeded ${workCenterValues.length} work centers.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
