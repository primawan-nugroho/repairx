"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { engineTypes, uicTeams, workCenters } from "@/db/schema";

const CATEGORICAL_SLUGS = ["uic-a", "uic-b", "uic-c", "uic-d", "uic-e", "uic-f", "uic-g", "uic-h", "uic-i", "uic-j"];

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    throw new Error("Not authorized");
  }
  return session;
}

// --- Engine types ---------------------------------------------------------

export async function createEngineType(name: string) {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name is required");

  const [existing] = await db.select({ id: engineTypes.id }).from(engineTypes).where(eq(engineTypes.name, trimmed)).limit(1);
  if (existing) throw new Error(`"${trimmed}" already exists.`);

  const [highest] = await db.select({ n: engineTypes.sortOrder }).from(engineTypes).orderBy(desc(engineTypes.sortOrder)).limit(1);
  await db.insert(engineTypes).values({ name: trimmed, sortOrder: (highest?.n ?? 0) + 1 });
  revalidatePath("/masters");
}

export async function setEngineTypeActive(id: number, active: boolean) {
  await requireAdmin();
  await db.update(engineTypes).set({ active }).where(eq(engineTypes.id, id));
  revalidatePath("/masters");
}

// --- UIC teams --------------------------------------------------------------

/** Next unused color slug (see the 10 "uic-a".."uic-j" categorical hues) — falls
 * back to the first slug if all 10 are already taken, since a badge always needs
 * some color even past the palette's design ceiling. */
async function nextFreeColorSlug(): Promise<string> {
  const rows = await db.select({ colorSlug: uicTeams.colorSlug }).from(uicTeams);
  const used = new Set(rows.map((r) => r.colorSlug));
  return CATEGORICAL_SLUGS.find((s) => !used.has(s)) ?? CATEGORICAL_SLUGS[0]!;
}

export async function createUicTeam(name: string) {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name is required");

  const [existing] = await db.select({ id: uicTeams.id }).from(uicTeams).where(eq(uicTeams.name, trimmed)).limit(1);
  if (existing) throw new Error(`"${trimmed}" already exists.`);

  const colorSlug = await nextFreeColorSlug();
  await db.insert(uicTeams).values({ name: trimmed, colorSlug });
  revalidatePath("/masters");
}

export async function setUicTeamActive(id: number, active: boolean) {
  await requireAdmin();
  await db.update(uicTeams).set({ active }).where(eq(uicTeams.id, id));
  revalidatePath("/masters");
}

/** Marks this team as the one terminal UIC (serviceable store) and clears the flag
 * from every other team — exactly one team can be terminal at a time (see
 * deriveStatus in wc-uic-map.ts), so setting a new one always replaces the old. */
export async function setTerminalUicTeam(id: number) {
  await requireAdmin();
  await db.update(uicTeams).set({ isTerminal: false });
  await db.update(uicTeams).set({ isTerminal: true }).where(eq(uicTeams.id, id));
  revalidatePath("/masters");
}

export async function clearTerminalUicTeam() {
  await requireAdmin();
  await db.update(uicTeams).set({ isTerminal: false });
  revalidatePath("/masters");
}

// --- Work centers ------------------------------------------------------------

export async function createWorkCenter(code: string, uicTeamId: number | null) {
  await requireAdmin();
  const trimmed = code.trim();
  if (!trimmed) throw new Error("Code is required");

  const [existing] = await db.select({ id: workCenters.id }).from(workCenters).where(eq(workCenters.code, trimmed)).limit(1);
  if (existing) throw new Error(`"${trimmed}" already exists.`);

  await db.insert(workCenters).values({ code: trimmed, uicTeamId });
  revalidatePath("/masters");
}

export async function updateWorkCenterUicTeam(id: number, uicTeamId: number | null) {
  await requireAdmin();
  await db.update(workCenters).set({ uicTeamId }).where(eq(workCenters.id, id));
  revalidatePath("/masters");
}

export async function setWorkCenterActive(id: number, active: boolean) {
  await requireAdmin();
  await db.update(workCenters).set({ active }).where(eq(workCenters.id, id));
  revalidatePath("/masters");
}
