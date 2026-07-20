"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createUserSchema, resetPasswordSchema, updateUserSchema } from "@/lib/validations";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    throw new Error("Not authorized");
  }
  return session;
}

export async function createUserAction(formData: FormData) {
  await requireAdmin();

  const parsed = createUserSchema.parse(Object.fromEntries(formData.entries()));
  const username = parsed.username.trim().toLowerCase();

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (existing) {
    throw new Error(`Username "${username}" is already taken.`);
  }

  const passwordHash = await hash(parsed.password, 12);

  await db.insert(users).values({
    username,
    passwordHash,
    displayName: parsed.displayName.trim(),
    role: parsed.role,
  });

  revalidatePath("/masters");
}

export async function updateUserAction(formData: FormData) {
  const session = await requireAdmin();

  const parsed = updateUserSchema.parse(Object.fromEntries(formData.entries()));
  const username = parsed.username.trim().toLowerCase();

  if (Number(session.user.id) === parsed.userId && parsed.role !== "admin") {
    throw new Error("You cannot remove your own admin role.");
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  if (existing && existing.id !== parsed.userId) {
    throw new Error(`Username "${username}" is already taken.`);
  }

  await db
    .update(users)
    .set({ username, displayName: parsed.displayName.trim(), role: parsed.role })
    .where(eq(users.id, parsed.userId));

  revalidatePath("/masters");
}

export async function setUserActiveAction(userId: number, active: boolean) {
  const session = await requireAdmin();

  if (Number(session.user.id) === userId && !active) {
    throw new Error("You cannot deactivate your own account.");
  }

  await db.update(users).set({ active }).where(eq(users.id, userId));
  revalidatePath("/masters");
}

export async function resetPasswordAction(formData: FormData) {
  await requireAdmin();

  const parsed = resetPasswordSchema.parse(Object.fromEntries(formData.entries()));
  const passwordHash = await hash(parsed.newPassword, 12);

  await db.update(users).set({ passwordHash }).where(eq(users.id, parsed.userId));
  revalidatePath("/masters");
}
