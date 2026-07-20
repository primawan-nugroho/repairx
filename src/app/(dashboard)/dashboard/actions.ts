"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getDashboardSummary } from "@/lib/dashboard";
import { generateAndCacheInsight } from "@/lib/ai-insight";
import { getMasters } from "@/lib/masters";

export async function generateInsight() {
  const session = await auth();
  if (!session) throw new Error("Not authorized");

  const [summary, masters] = await Promise.all([getDashboardSummary(), getMasters()]);
  const content = await generateAndCacheInsight(summary, masters.terminalUic);
  revalidatePath("/dashboard");
  return content;
}
