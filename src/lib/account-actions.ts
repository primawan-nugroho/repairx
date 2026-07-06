"use server";

import { eq } from "drizzle-orm";
import { ZodError } from "zod";
import { compare, hash } from "bcryptjs";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { changePasswordSchema } from "@/lib/validations";

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function changeOwnPasswordAction(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Not authorized");

  let parsed;
  try {
    parsed = changePasswordSchema.parse(Object.fromEntries(formData.entries()));
  } catch (e) {
    if (e instanceof ZodError) {
      throw new Error(e.issues[0]?.message ?? "Invalid input.");
    }
    throw e;
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, Number(session.user.id)))
    .limit(1);

  if (!user) throw new Error("User not found");

  const valid = await compare(parsed.currentPassword, user.passwordHash);
  if (!valid) throw new Error("Current password is incorrect.");

  const passwordHash = await hash(parsed.newPassword, 12);
  await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));
}
