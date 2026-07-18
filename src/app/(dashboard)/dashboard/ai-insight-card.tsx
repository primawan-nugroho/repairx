"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { generateInsight } from "./actions";

interface AiInsightCardProps {
  initialContent: string | null;
  generatedAt: Date | null;
}

export function AiInsightCard({ initialContent, generatedAt }: AiInsightCardProps) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [generatedAtState, setGeneratedAtState] = useState(generatedAt);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await generateInsight();
        setContent(result);
        setGeneratedAtState(new Date());
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to generate insight.");
      }
    });
  }

  const bottleneckIndex = content?.indexOf("Bottleneck:") ?? -1;
  const briefing = bottleneckIndex > -1 ? content!.slice(0, bottleneckIndex).trim() : content;
  const bottleneck = bottleneckIndex > -1 ? content!.slice(bottleneckIndex + "Bottleneck:".length).trim() : null;

  return (
    <div className="bg-surface-solid flex flex-col gap-3 rounded-lg border border-border p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">AI shift briefing</h2>
          {generatedAtState && (
            <p className="text-xs text-text-tertiary">
              Generated {formatDate(generatedAtState)} at{" "}
              {generatedAtState.toLocaleTimeString("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
        <button
          onClick={handleGenerate}
          disabled={pending}
          className="rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-white disabled:opacity-60"
        >
          {pending ? "Generating…" : content ? "Regenerate" : "Generate insight"}
        </button>
      </div>

      {error && (
        <p className="text-xs text-status-urgent">
          {error} The dashboard&apos;s numbers above are still accurate — this only affects the AI summary.
        </p>
      )}

      {!content && !error && !pending && (
        <p className="text-sm text-text-secondary">
          No briefing yet for this shift. Click &quot;Generate insight&quot; for a short AI summary of what moved,
          what&apos;s stalled, and what to prioritize next.
        </p>
      )}

      {briefing && <p className="whitespace-pre-line text-sm text-text-primary">{briefing}</p>}
      {bottleneck && (
        <p className="rounded-lg bg-status-waiting/10 px-3 py-2 text-sm font-medium text-status-waiting">
          Bottleneck: {bottleneck}
        </p>
      )}
    </div>
  );
}
