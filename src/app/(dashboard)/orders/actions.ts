"use server";

import { desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { orders, repairPlannerEntries } from "@/db/schema";
import { orderSchema } from "@/lib/validations";
import { deriveStatus, deriveUic } from "@/lib/wc-uic-map";
import { isEngineType } from "@/lib/engine-types";
import { getMasters, type OrderMasters } from "@/lib/masters";
import type { BulkOrderRow } from "@/lib/bulk-order-parse";

function parseOrderForm(formData: FormData, masters: OrderMasters) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = orderSchema.parse(raw);

  // UIC is always derived from the work center (see wc-uic-map.ts) — never accept a
  // client-submitted UIC, even if the form somehow included one. Status is derived
  // the same way once the part reaches the serviceable store — see deriveStatus.
  const uicToday = deriveUic(parsed.mwcToday, masters.workCenterToUic) ?? parsed.uicToday ?? null;
  return { ...parsed, uicToday, status: deriveStatus(uicToday, parsed.status, masters.terminalUic) };
}

/** completedAt is the source for turnaround-time metrics — stamped the instant an
 * order first reaches the serviceable store, kept stable across later unrelated
 * edits (so re-saving the same order doesn't reset the clock), and cleared if the
 * order is ever routed back out (see terminalUic in lib/masters.ts). */
function computeCompletedAt(
  newUic: string | null,
  previous: { uicToday: string | null; completedAt: Date | null } | undefined,
  terminalUic: string | null,
): Date | null {
  if (!terminalUic || newUic !== terminalUic) return null;
  if (previous?.uicToday === terminalUic && previous.completedAt) return previous.completedAt;
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
  const masters = await getMasters();

  const values = parseOrderForm(formData, masters);
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
      .set({ ...values, completedAt: computeCompletedAt(values.uicToday, existing, masters.terminalUic), updatedAt: new Date() })
      .where(eq(orders.orderNumber, originalOrderNumber));
  } else {
    const [existing] = await db
      .select({ uicToday: orders.uicToday, completedAt: orders.completedAt })
      .from(orders)
      .where(eq(orders.orderNumber, values.orderNumber))
      .limit(1);

    await db
      .insert(orders)
      .values({ ...values, completedAt: computeCompletedAt(values.uicToday, existing, masters.terminalUic) })
      .onConflictDoUpdate({
        target: orders.orderNumber,
        set: { ...values, completedAt: computeCompletedAt(values.uicToday, existing, masters.terminalUic), updatedAt: new Date() },
      });
  }

  revalidatePath("/orders");
  revalidatePath(`/orders/${encodeURIComponent(values.orderNumber)}`);
}

export async function createOrder(formData: FormData) {
  await requireEditor();
  const masters = await getMasters();

  const values = parseOrderForm(formData, masters);
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

  await db.insert(orders).values({ ...values, completedAt: computeCompletedAt(values.uicToday, undefined, masters.terminalUic) });

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
  const masters = await getMasters();

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
    const uicToday = deriveUic(r.workCenter, masters.workCenterToUic) ?? null;
    return {
      orderNumber: r.orderNumber.slice(0, 32),
      description: r.description.trim() || null,
      serialNumber: r.serialNumber.trim().slice(0, 64) || null,
      engineType: isEngineType(r.engineType, masters.engineTypes) ? r.engineType : null,
      dateIn: r.dateIn || null,
      mwcToday: r.workCenter.trim().slice(0, 16) || null,
      uicToday,
      status: deriveStatus(uicToday, null, masters.terminalUic),
      completedAt: computeCompletedAt(uicToday, undefined, masters.terminalUic),
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

/** Bulk status override for a set of selected orders. Doesn't attempt to respect the
 * terminal-UIC auto-status rule (see deriveStatus in wc-uic-map.ts) — a part sitting
 * in the serviceable store will just get its status corrected the next time it's
 * opened in the edit dialog, same as any other manual status edit. */
export async function bulkUpdateOrderStatus(orderNumbers: string[], status: string) {
  await requireEditor();
  const targets = orderNumbers.map((n) => n.trim()).filter(Boolean);
  if (targets.length === 0) return;

  await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(inArray(orders.orderNumber, targets));

  revalidatePath("/orders");
}
