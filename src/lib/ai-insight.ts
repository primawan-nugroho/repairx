import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { aiInsights } from "@/db/schema";
import type { DashboardSummary } from "@/lib/dashboard";
import { formatDate } from "@/lib/utils";

export async function getCachedInsight(insightDate: string, shift: string) {
  const [row] = await db
    .select()
    .from(aiInsights)
    .where(and(eq(aiInsights.insightDate, insightDate), eq(aiInsights.shift, shift as "AM" | "PM" | "Overtime")))
    .limit(1);
  return row ?? null;
}

function buildPrompt(summary: DashboardSummary, terminalUic: string | null): string {
  const statusLines = summary.statusBreakdown.map((s) => `${s.label}: ${s.count}`).join(", ");
  const uicLines = summary.uicBreakdown.map((u) => `${u.label}: ${u.count}`).join(", ");
  const overdueLines = summary.overdueOrders
    .map((o) => `${o.orderNumber} (Gate 4 target ${formatDate(o.gate4Target)}, status ${o.status ?? "unset"})`)
    .join("; ") || "none";
  const repeatLines =
    summary.repeatOrders.map((o) => `${o.orderNumber} (on ${o.menuDays} daily menus in the last 10 days)`).join("; ") ||
    "none";
  const staleLines =
    summary.staleOrders.map((o) => `${o.orderNumber} (UIC ${o.uicToday ?? "unassigned"})`).join("; ") || "none";
  const terminalLabel = terminalUic ?? "the serviceable-store team";

  return `Shift context: ${summary.shift} shift on ${formatDate(summary.today)}.

Orders open: ${summary.totalOrders} total, of which ${summary.inServiceableStore} are in the ${terminalLabel} serviceable store — meaning the repair is already FINISHED and the part is just awaiting pickup/shipment. ${terminalLabel} is not active work and must never be described as a bottleneck, backlog, or workload; it is excluded from the UIC breakdown below.
By status: ${statusLines || "none"}.
By UIC (active work only, ${terminalLabel} excluded): ${uicLines || "none"}.

Orders past their Gate 4 target date (overdue): ${overdueLines}.

Last completed shift (${summary.lastShift.shift} on ${formatDate(summary.lastShift.date)}): ${summary.lastShift.totalEntries} entries logged, ${summary.lastShift.closedCount} reached Final Confirm.

Today's Daily Menu (${summary.shift} shift) has ${summary.todayMenuCount} entries planned.

Orders carried on 3+ daily menus in the last 10 days without finishing (repeat/stuck candidates): ${repeatLines}.

Orders with no shift-report activity in the last 7 days (excluding completed/cancelled): ${staleLines}.

Internal Repair Planner: ${summary.plannerWip} of ${summary.plannerTotal} jobs still in progress.

Average turnaround time (date in to reaching the serviceable store): ${
    summary.tat.avgDays !== null ? `${summary.tat.avgDays} days (based on ${summary.tat.sampleSize} orders)` : "not enough data yet"
  }.

Write a shift-handover briefing for a production-control supervisor in 4-6 sentences: what moved, what's stalled, which UIC/work team is under the most load, and what should be prioritized on the next shift's Daily Menu. Then on a new line starting exactly with "Bottleneck: " give one specific, single-sentence callout using only the numbers above. Do not invent order numbers, dates, or facts not listed above. Do not use markdown formatting.`;
}

/** Calls Groq's free-tier chat completion API server-side (the key never reaches the
 * browser). Throws on any failure — callers decide how to degrade (see
 * ai-insight-card.tsx, which falls back to the plain computed numbers). */
async function callGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("AI insight is not configured — set GROQ_API_KEY to enable it.");
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a production-control assistant summarizing aviation MRO repair-shop shift data for a shop-floor supervisor. Be concise, factual, and practical. Never invent data not given to you.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 400,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Groq API error ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Groq returned an empty response.");
  return content;
}

export async function generateAndCacheInsight(summary: DashboardSummary, terminalUic: string | null): Promise<string> {
  const content = await callGroq(buildPrompt(summary, terminalUic));

  await db
    .insert(aiInsights)
    .values({ insightDate: summary.today, shift: summary.shift, content })
    .onConflictDoUpdate({
      target: [aiInsights.insightDate, aiInsights.shift],
      set: { content, createdAt: new Date() },
    });

  return content;
}
