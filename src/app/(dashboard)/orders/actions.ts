"use server";

import { desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { orders, repairPlannerEntries } from "@/db/schema";
import { orderSchema } from "@/lib/validations";
import { deriveStatus, deriveUic, TERMINAL_UIC } from "@/lib/wc-uic-map";
import { isEngineType } from "@/lib/engine-types";
import type { BulkOrderRow } from "@/lib/bulk-order-parse";

function parseOrderForm(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = orderSchema.parse(raw);

  // UIC is always derived from the work center (see wc-uic-map.ts) — never accept a
  // client-submitted UIC, even if the form somehow included one. Status is derived
  // the same way once the part reaches the Kitting/RPC serviceable store — see
  // deriveStatus.
  const uicToday = deriveUic(parsed.mwcToday) ?? parsed.uicToday ?? null;
  return { ...parsed, uicToday, status: deriveStatus(uicToday, parsed.status) };
}

/** completedAt is the source for turnaround-time metrics — stamped the instant an
 * order first reaches the serviceable store, kept stable across later unrelated
 * edits (so re-saving the same order doesn't reset the clock), and cleared if the
 * order is ever routed back out of Kitting/RPC (see TERMINAL_UIC in wc-uic-map.ts). */
function computeCompletedAt(
  newUic: string | null,
  previous: { uicToday: string | null; completedAt: Date | null } | undefined,
): Date | null {
  if (newUic !== TERMINAL_UIC) return null;
  if (previous?.uicToday === TERMINAL_UIC && previous.completedAt) return previous.completedAt;
  return new Date();
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
      .select({ orderNumber: orders.orderNumber, uicToday: orders.uicToday, completedAt: orders.completedAt })
      .from(orders)
      .where(eq(orders.orderNumber, originalOrderNumber))
      .limit(1);

    const [taken] = await db
      .select({ orderNumber: orders.orderNumber })
      .from(orders)
      .where(eq(orders.orderNumber, values.orderNumber))
      .limit(1);

    if (taken) {
      throw new Error(`Order ${values.orderNumber} already exists.`);
    }

    await db
      .update(orders)
      .set({ ...values, completedAt: computeCompletedAt(values.uicToday, existing), updatedAt: new Date() })
      .where(eq(orders.orderNumber, originalOrderNumber));
  } else {
    const [existing] = await db
      .select({ uicToday: orders.uicToday, completedAt: orders.completedAt })
      .from(orders)
      .where(eq(orders.orderNumber, values.orderNumber))
      .limit(1);

    await db
      .insert(orders)
      .values({ ...values, completedAt: computeCompletedAt(values.uicToday, existing) })
      .onConflictDoUpdate({
        target: orders.orderNumber,
        set: { ...values, completedAt: computeCompletedAt(values.uicToday, existing), updatedAt: new Date() },
      });
  }

  revalidatePath("/orders");
  revalidatePath(`/orders/${encodeURIComponent(values.orderNumber)}`);
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

  await db.insert(orders).values({ ...values, completedAt: computeCompletedAt(values.uicToday, undefined) });

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

/** Checks which of the given order numbers already exist (any archived state) —
 * used by the bulk-add dialog to warn about duplicates before the user hits Save,
 * ahead of the authoritative check createOrdersBulk does at insert time. */
export async function checkExistingOrderNumbers(orderNumbers: string[]) {
  const trimmed = orderNumbers.map((n) => n.trim()).filter(Boolean);
  if (trimmed.length === 0) return [];
  const rows = await db
    .select({ orderNumber: orders.orderNumber })
    .from(orders)
    .where(inArray(orders.orderNumber, trimmed));
  return rows.map((r) => r.orderNumber);
}

/** Bulk-inserts orders parsed from a pasted Excel block or typed into the grid.
 * Skips (never overwrites) rows whose order number is blank, repeated within the
 * batch, or already exists in the DB — the single INSERT only ever contains rows
 * safe to insert, so one bad row can't fail the whole batch. */
export async function createOrdersBulk(rows: BulkOrderRow[]) {
  await requireEditor();

  const seen = new Set<string>();
  const candidates = rows
    .map((r) => ({ ...r, orderNumber: r.orderNumber.trim() }))
    .filter((r) => {
      if (!r.orderNumber || seen.has(r.orderNumber)) return false;
      seen.add(r.orderNumber);
      return true;
    });

  if (candidates.length === 0) {
    return { insertedOrderNumbers: [], skippedOrderNumbers: rows.map((r) => r.orderNumber.trim()) };
  }

  const existing = await db
    .select({ orderNumber: orders.orderNumber })
    .from(orders)
    .where(inArray(orders.orderNumber, candidates.map((r) => r.orderNumber)));
  const existingSet = new Set(existing.map((e) => e.orderNumber));

  const toInsert = candidates.filter((r) => !existingSet.has(r.orderNumber));
  const skipped = rows
    .map((r) => r.orderNumber.trim())
    .filter((n) => !toInsert.some((r) => r.orderNumber === n));

  if (toInsert.length === 0) {
    return { insertedOrderNumbers: [], skippedOrderNumbers: skipped };
  }

  const values = toInsert.map((r) => {
    const uicToday = deriveUic(r.workCenter) ?? null;
    return {
      orderNumber: r.orderNumber.slice(0, 32),
      description: r.description.trim() || null,
      serialNumber: r.serialNumber.trim().slice(0, 64) || null,
      engineType: isEngineType(r.engineType) ? r.engineType : null,
      dateIn: r.dateIn || null,
      mwcToday: r.workCenter.trim().slice(0, 16) || null,
      uicToday,
      status: deriveStatus(uicToday, null),
      completedAt: computeCompletedAt(uicToday, undefined),
      location: r.location.trim().slice(0, 128) || null,
      remark: r.remark.trim() || null,
    };
  });

  await db.insert(orders).values(values);
  revalidatePath("/orders");

  return { insertedOrderNumbers: toInsert.map((r) => r.orderNumber), skippedOrderNumbers: skipped };
}

export async function archiveOrder(orderNumber: string) {
  await requireEditor();

  await db
    .update(orders)
    .set({ archived: true, updatedAt: new Date() })
    .where(eq(orders.orderNumber, orderNumber));

  revalidatePath("/orders");
}
