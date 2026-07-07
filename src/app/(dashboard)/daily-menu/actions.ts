"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { dailyMenuEntries } from "@/db/schema";
import { shiftEntryUpdateSchema } from "@/lib/validations";
import { populateDailyMenuFromPreviousShift } from "@/lib/daily-menu";

async function requireEditor() {
  const session = await auth();
  if (!session || session.user.role === "viewer") {
    throw new Error("Not authorized");
  }
  return session;
}

export async function populateDailyMenu(menuDate: string, shift: string) {
  const session = await requireEditor();
  const count = await populateDailyMenuFromPreviousShift(menuDate, shift, Number(session.user.id));
  revalidatePath("/daily-menu");
  return count;
}

export async function updateDailyMenuEntry(id: number, formData: FormData) {
  await requireEditor();

  const raw = Object.fromEntries(formData.entries());
  const parsed = shiftEntryUpdateSchema.parse(raw);

  await db
    .update(dailyMenuEntries)
    .set({
      ...parsed,
      planMhrs: parsed.planMhrs != null ? String(parsed.planMhrs) : null,
      consumedMhrs: parsed.consumedMhrs != null ? String(parsed.consumedMhrs) : null,
      manhours: parsed.manhours != null ? String(parsed.manhours) : null,
      updatedAt: new Date(),
    })
    .where(eq(dailyMenuEntries.id, id));

  revalidatePath("/daily-menu");
}

export async function archiveDailyMenuEntry(id: number) {
  await requireEditor();
  await db
    .update(dailyMenuEntries)
    .set({ archived: true, updatedAt: new Date() })
    .where(eq(dailyMenuEntries.id, id));
  revalidatePath("/daily-menu");
}
