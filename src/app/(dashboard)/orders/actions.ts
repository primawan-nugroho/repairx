"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { orderSchema } from "@/lib/validations";
import { deriveUic } from "@/lib/wc-uic-map";

export async function updateOrderStatus(orderNumber: string, status: string) {
  const session = await auth();
  if (!session || session.user.role === "viewer") {
    throw new Error("Not authorized");
  }

  await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.orderNumber, orderNumber));

  revalidatePath("/orders");
}

function parseOrderForm(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = orderSchema.parse({
    ...raw,
    waitingRepair: raw.planFinishDate === "WR" || raw.waitingRepair === "on",
    planFinishDate: raw.planFinishDate === "WR" ? null : raw.planFinishDate || null,
  });

  // UIC is always derived from the work center (see wc-uic-map.ts) — never accept a
  // client-submitted UIC, even if the form somehow included one.
  return { ...parsed, uicToday: deriveUic(parsed.mwcToday) ?? parsed.uicToday ?? null };
}

export async function upsertOrder(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role === "viewer") {
    throw new Error("Not authorized");
  }

  const values = parseOrderForm(formData);

  await db
    .insert(orders)
    .values(values)
    .onConflictDoUpdate({
      target: orders.orderNumber,
      set: { ...values, updatedAt: new Date() },
    });

  revalidatePath("/orders");
}

export async function createOrder(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role === "viewer") {
    throw new Error("Not authorized");
  }

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
