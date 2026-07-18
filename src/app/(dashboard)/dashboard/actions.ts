"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getDashboardSummary } from "@/lib/dashboard";
import { generateAndCacheInsight } from "@/lib/ai-insight";

export async function generateInsight() {
  const session = await auth();
  if (!session) throw new Error("Not authorized");

  const summary = await getDashboardSummary();
  const content = await generateAndCacheInsight(summary);
  revalidatePath("/dashboard");
  return content;
}
