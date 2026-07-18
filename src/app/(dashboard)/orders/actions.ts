"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { orders, repairPlannerEntries } from "@/db/schema";
import { orderSchema } from "@/lib/validations";
import { deriveUic } from "@/lib/wc-uic-map";

function parseOrderForm(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = orderSchema.parse(raw);

  // UIC is always derived from the work center (see wc-uic-map.ts) — never accept a
  // client-submitted UIC, even if the form somehow included one.
  return { ...parsed, uicToday: deriveUic(parsed.mwcToday) ?? parsed.uicToday ?? null };
}

async function requireEditor() {
  const session = await auth();
  if (!session || session.user.role === "viewer") {
    throw new Error("Not authorized");
  }
  return session;
}

export async function upsertOrder(formData: FormData) {
  await requireEditor();

  const values = parseOrderForm(formData);
  const originalOrderNumber = (formData.get("originalOrderNumber") as string | null) || null;

  if (originalOrderNumber && originalOrderNumber !== values.orderNumber) {
    // Order number is being renamed — check the new number isn't already taken by
    // a different order before moving the business key.
    const [existing] = await db
      .select({ orderNumber: orders.orderNumber })
      .from(orders)
      .where(eq(orders.orderNumber, values.orderNumber))
      .limit(1);

    if (existing) {
      throw new Error(`Order ${values.orderNumber} already exists.`);
    }

    await db
      .update(orders)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(orders.orderNumber, originalOrderNumber));
  } else {
    await db
      .insert(orders)
      .values(values)
      .onConflictDoUpdate({
        target: orders.orderNumber,
        set: { ...values, updatedAt: new Date() },
      });
  }

  revalidatePath("/orders");
}

export async function createOrder(formData: FormData) {
  await requireEditor();

  const values = parseOrderForm(formData);
  if (!values.orderNumber) {
    throw new Error("Order number is required");
  }

  const [existing] = await db
    .select({ orderNumber: orders.orderNumber })
    .from(orders)
    .where(eq(orders.orderNumber, values.orderNumber))
    .limit(1);

  if (existing) {
    throw new Error(`Order ${values.orderNumber} already exists.`);
  }

  await db.insert(orders).values(values);

  revalidatePath("/orders");
}

/** Looks up the engine type for a serial number from the Internal Repair Planner —
 * the two boards track the same physical parts, so a serial already registered
 * there can save re-picking the engine type by hand in the Orders dialog. */
export async function lookupEngineTypeBySerial(serialNumber: string) {
  if (!serialNumber.trim()) return null;
  const [match] = await db
    .select({ engineType: repairPlannerEntries.engineType })
    .from(repairPlannerEntries)
    .where(eq(repairPlannerEntries.serialNumber, serialNumber.trim()))
    .orderBy(desc(repairPlannerEntries.id))
    .limit(1);
  return match?.engineType ?? null;
}

export async function archiveOrder(orderNumber: string) {
  await requireEditor();

  await db
    .update(orders)
    .set({ archived: true, updatedAt: new Date() })
    .where(eq(orders.orderNumber, orderNumber));

  revalidatePath("/orders");
}
