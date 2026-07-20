import { cache } from "react";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { engineTypes, uicTeams, workCenters } from "@/db/schema";

export interface OrderMasters {
  engineTypes: string[];
  /** Active work center code -> its UIC team's name. Only covers work centers whose
   * team is also active — a deactivated team's work centers derive nothing rather
   * than silently pointing at a retired team. */
  workCenterToUic: Record<string, string>;
  /** UIC team name -> one of the 10 categorical "uic-a".."uic-j" badge color slugs. */
  uicColorSlugs: Record<string, string>;
  /** The UIC team name that means "finished, in the serviceable store" (see
   * deriveStatus in wc-uic-map.ts), or null if no team is currently flagged
   * terminal. */
  terminalUic: string | null;
}

/** Loads all master data in one shot and shapes it for the rest of the app. Cheap at
 * this scale (three small tables) — cached per request via React's `cache()` so
 * multiple Server Components in the same render tree share one set of queries rather
 * than each re-querying. */
export const getMasters = cache(async (): Promise<OrderMasters> => {
  const [engineTypeRows, uicTeamRows, workCenterRows] = await Promise.all([
    db.select({ name: engineTypes.name }).from(engineTypes).where(eq(engineTypes.active, true)).orderBy(asc(engineTypes.sortOrder)),
    db.select().from(uicTeams).where(eq(uicTeams.active, true)),
    db.select({ code: workCenters.code, uicTeamId: workCenters.uicTeamId }).from(workCenters).where(eq(workCenters.active, true)),
  ]);

  const uicNameById = new Map(uicTeamRows.map((t) => [t.id, t.name]));
  const uicColorSlugs: Record<string, string> = {};
  let terminalUic: string | null = null;
  for (const t of uicTeamRows) {
    uicColorSlugs[t.name] = t.colorSlug;
    if (t.isTerminal) terminalUic = t.name;
  }

  const workCenterToUic: Record<string, string> = {};
  for (const wc of workCenterRows) {
    const uicName = wc.uicTeamId != null ? uicNameById.get(wc.uicTeamId) : undefined;
    if (uicName) workCenterToUic[wc.code] = uicName;
  }

  return {
    engineTypes: engineTypeRows.map((r) => r.name),
    workCenterToUic,
    uicColorSlugs,
    terminalUic,
  };
});

/** Every UIC team and work center including inactive ones, for the Masters admin
 * page — the active-only getMasters() above is for the rest of the app's dropdowns
 * and derivation logic. */
export async function getAllMastersForAdmin() {
  const [allEngineTypes, allUicTeams, allWorkCenters] = await Promise.all([
    db.select().from(engineTypes).orderBy(asc(engineTypes.sortOrder)),
    db.select().from(uicTeams).orderBy(asc(uicTeams.name)),
    db.select().from(workCenters).orderBy(asc(workCenters.code)),
  ]);
  return { engineTypes: allEngineTypes, uicTeams: allUicTeams, workCenters: allWorkCenters };
}
