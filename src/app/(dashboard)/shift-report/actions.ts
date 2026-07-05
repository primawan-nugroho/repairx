"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { shiftReportEntries } from "@/db/schema";
import { shiftReportEntrySchema } from "@/lib/validations";
import { lookupOrder } from "@/lib/shift-report";

export async function lookupOrderAction(orderNumber: string) {
  if (!orderNumber) return null;
  return lookupOrder(orderNumber);
}

export async function createShiftReportEntry(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role === "viewer") {
    throw new Error("Not authorized");
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = shiftReportEntrySchema.parse(raw);

  await db.insert(shiftReportEntries).values({
    ...parsed,
    planMhrs: parsed.planMhrs != null ? String(parsed.planMhrs) : null,
    consumedMhrs: parsed.consumedMhrs != null ? String(parsed.consumedMhrs) : null,
    manhours: parsed.manhours != null ? String(parsed.manhours) : null,
    createdBy: Number(session.user.id),
  });

  revalidatePath("/shift-report");
}
