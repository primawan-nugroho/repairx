"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { shiftReportEntries } from "@/db/schema";
import { shiftEntryUpdateSchema, shiftReportEntrySchema } from "@/lib/validations";
import { lookupOrder } from "@/lib/shift-report";

async function requireEditor() {
  const session = await auth();
  if (!session || session.user.role === "viewer") {
    throw new Error("Not authorized");
  }
  return session;
}

export async function lookupOrderAction(orderNumber: string) {
  if (!orderNumber) return null;
  return lookupOrder(orderNumber);
}

export async function createShiftReportEntry(formData: FormData) {
  const session = await requireEditor();

  const raw = Object.fromEntries(formData.entries());
  const parsed = shiftReportEntrySchema.parse(raw);

  await db.insert(shiftReportEntries).values({
    ...parsed,
    planMhrs: parsed.planMhrs != null ? String(parsed.planMhrs) : null,
    stamp: parsed.stamp ?? false,
    createdBy: Number(session.user.id),
  });

  revalidatePath("/shift-report");
}

export async function updateShiftReportEntry(id: number, formData: FormData) {
  await requireEditor();

  const raw = Object.fromEntries(formData.entries());
  const parsed = shiftEntryUpdateSchema.parse(raw);

  await db
    .update(shiftReportEntries)
    .set({
      ...parsed,
      planMhrs: parsed.planMhrs != null ? String(parsed.planMhrs) : null,
      stamp: parsed.stamp ?? false,
      updatedAt: new Date(),
    })
    .where(eq(shiftReportEntries.id, id));

  revalidatePath("/shift-report");
}

export async function archiveShiftReportEntry(id: number) {
  await requireEditor();
  await db
    .update(shiftReportEntries)
    .set({ archived: true, updatedAt: new Date() })
    .where(eq(shiftReportEntries.id, id));
  revalidatePath("/shift-report");
}
