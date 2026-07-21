import path from "node:path";
import { config } from "dotenv";
import { forceIpv4 } from "@/lib/force-ipv4";

forceIpv4();
config({ path: path.resolve(__dirname, "..", ".env.local") });

const RPC_NAMES = ["DENNY", "FIRMAN", "GISEL", "SIGIT"];
const EO_NAMES = ["DONY", "HARDHANI", "ADITYA", "DHIMAS", "KIKIN", "SAREZA", "GANJAR", "ADING"];

async function main() {
  const { db } = await import("@/db");
  const { rpcPeople, engineOwners } = await import("@/db/schema");

  await db.insert(rpcPeople).values(RPC_NAMES.map((name) => ({ name }))).onConflictDoNothing();
  console.log(`Seeded ${RPC_NAMES.length} RPC names.`);

  await db.insert(engineOwners).values(EO_NAMES.map((name) => ({ name }))).onConflictDoNothing();
  console.log(`Seeded ${EO_NAMES.length} EO names.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
