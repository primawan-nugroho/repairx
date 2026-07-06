"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { repairPlannerEntries } from "@/db/schema";
import { repairPlannerEntrySchema } from "@/lib/validations";

async function requireEditor() {
  const session = await auth();
  if (!session || session.user.role === "viewer") {
    throw new Error("Not authorized");
  }
  return session;
}

function parseForm(formData: FormData) {
  return repairPlannerEntrySchema.parse(Object.fromEntries(formData.entries()));
}

export async function createRepairPlannerEntry(formData: FormData) {
  await requireEditor();
  const values = parseForm(formData);
  await db.insert(repairPlannerEntries).values(values);
  revalidatePath("/repair-planner");
}

export async function updateRepairPlannerEntry(id: number, formData: FormData) {
  await requireEditor();
  const values = parseForm(formData);
  await db
    .update(repairPlannerEntries)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(repairPlannerEntries.id, id));
  revalidatePath("/repair-planner");
}

export async function archiveRepairPlannerEntry(id: number) {
  await requireEditor();
  await db
    .update(repairPlannerEntries)
    .set({ archived: true, updatedAt: new Date() })
    .where(eq(repairPlannerEntries.id, id));
  revalidatePath("/repair-planner");
}
