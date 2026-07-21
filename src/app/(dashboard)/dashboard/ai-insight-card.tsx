"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

  // The prompt asks for "- " bullet lines (see lib/ai-insight.ts). Strip the marker
  // and render as a real list. Falls back to a plain paragraph when the model returns
  // prose anyway or an older cached briefing (written before the bullet format) loads.
  const bullets = (briefing ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^[-•*]\s+/.test(line))
    .map((line) => line.replace(/^[-•*]\s+/, ""));

  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">AI shift briefing</h2>
            {generatedAtState && (
              <p className="text-xs text-text-tertiary">
                Generated {formatDate(generatedAtState)} at{" "}
                {generatedAtState.toLocaleTimeString("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
          <Button onClick={handleGenerate} disabled={pending} size="sm">
            {pending ? "Generating…" : content ? "Regenerate" : "Generate insight"}
          </Button>
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

        {briefing &&
          (bullets.length > 0 ? (
            <ul className="flex flex-col gap-1.5 text-sm text-text-primary">
              {bullets.map((b, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-0.5 text-text-tertiary" aria-hidden>
                    •
                  </span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="whitespace-pre-line text-sm text-text-primary">{briefing}</p>
          ))}
        {bottleneck && (
          <p className="rounded-lg bg-status-waiting/10 px-3 py-2 text-sm font-medium text-status-waiting">
            Bottleneck: {bottleneck}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
