"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { rpcPeople, engineOwners } from "@/db/schema";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    throw new Error("Not authorized");
  }
  return session;
}

// --- RPC (repair production control) ----------------------------------------

export async function createRpcPerson(name: string) {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name is required");

  const [existing] = await db.select({ id: rpcPeople.id }).from(rpcPeople).where(eq(rpcPeople.name, trimmed)).limit(1);
  if (existing) throw new Error(`"${trimmed}" already exists.`);

  await db.insert(rpcPeople).values({ name: trimmed });
  revalidatePath("/masters");
  revalidatePath("/repair-planner");
}

export async function updateRpcPerson(id: number, name: string) {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name is required");

  const [existing] = await db.select({ id: rpcPeople.id }).from(rpcPeople).where(eq(rpcPeople.name, trimmed)).limit(1);
  if (existing && existing.id !== id) throw new Error(`"${trimmed}" already exists.`);

  await db.update(rpcPeople).set({ name: trimmed }).where(eq(rpcPeople.id, id));
  revalidatePath("/masters");
  revalidatePath("/repair-planner");
}

export async function deleteRpcPerson(id: number) {
  await requireAdmin();
  await db.delete(rpcPeople).where(eq(rpcPeople.id, id));
  revalidatePath("/masters");
  revalidatePath("/repair-planner");
}

// --- EO (engine owner) --------------------------------------------------------

export async function createEngineOwner(name: string) {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name is required");

  const [existing] = await db.select({ id: engineOwners.id }).from(engineOwners).where(eq(engineOwners.name, trimmed)).limit(1);
  if (existing) throw new Error(`"${trimmed}" already exists.`);

  await db.insert(engineOwners).values({ name: trimmed });
  revalidatePath("/masters");
  revalidatePath("/repair-planner");
}

export async function updateEngineOwner(id: number, name: string) {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Name is required");

  const [existing] = await db.select({ id: engineOwners.id }).from(engineOwners).where(eq(engineOwners.name, trimmed)).limit(1);
  if (existing && existing.id !== id) throw new Error(`"${trimmed}" already exists.`);

  await db.update(engineOwners).set({ name: trimmed }).where(eq(engineOwners.id, id));
  revalidatePath("/masters");
  revalidatePath("/repair-planner");
}

export async function deleteEngineOwner(id: number) {
  await requireAdmin();
  await db.delete(engineOwners).where(eq(engineOwners.id, id));
  revalidatePath("/masters");
  revalidatePath("/repair-planner");
}
