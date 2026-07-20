import { statusColorKey } from "@/lib/utils";
import { uicColorKey } from "@/lib/wc-uic-map";

// CSS custom properties (see globals.css) — used directly via inline style so these
// simple bars don't need a charting library or Tailwind's generated class list to
// include every status/UIC hue.
const STATUS_VARS: Record<string, string> = {
  "status-open": "var(--status-open)",
  "status-progress": "var(--status-progress)",
  "status-closed": "var(--status-closed)",
  "status-waiting": "var(--status-waiting)",
  "status-urgent": "var(--status-urgent)",
};

const UIC_VARS: Record<string, string> = {
  "uic-a": "var(--uic-a)",
  "uic-b": "var(--uic-b)",
  "uic-c": "var(--uic-c)",
  "uic-d": "var(--uic-d)",
  "uic-e": "var(--uic-e)",
  "uic-f": "var(--uic-f)",
  "uic-g": "var(--uic-g)",
  "uic-h": "var(--uic-h)",
  "uic-i": "var(--uic-i)",
  "uic-j": "var(--uic-j)",
  unmapped: "var(--uic-unmapped)",
};

interface BarRow {
  label: string;
  count: number;
}

function BarList({ rows, colorFor }: { rows: BarRow[]; colorFor: (label: string) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-xs text-text-secondary" title={r.label}>
            {r.label}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full"
              style={{ width: `${(r.count / max) * 100}%`, background: colorFor(r.label) }}
            />
          </div>
          <span className="data-mono w-8 shrink-0 text-right text-xs text-text-secondary">{r.count}</span>
        </div>
      ))}
      {rows.length === 0 && <p className="text-xs text-text-tertiary">No data.</p>}
    </div>
  );
}

export function StatusBarChart({ rows }: { rows: BarRow[] }) {
  return <BarList rows={rows} colorFor={(label) => STATUS_VARS[statusColorKey(label)] ?? "var(--status-open)"} />;
}

export function UicBarChart({ rows, uicColorSlugs }: { rows: BarRow[]; uicColorSlugs: Record<string, string> }) {
  return (
    <BarList rows={rows} colorFor={(label) => UIC_VARS[uicColorKey(label, uicColorSlugs)] ?? "var(--uic-unmapped)"} />
  );
}

/** Same bar-list layout as BarList but for a non-count metric (e.g. average days) —
 * a single neutral accent color since there's no status/UIC semantic to encode, and
 * a caller-supplied formatter for the trailing value label. */
export function MetricBarList({
  rows,
  formatValue = (v) => String(v),
}: {
  rows: Array<{ label: string; value: number; sublabel?: string }>;
  formatValue?: (value: number) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-xs text-text-secondary" title={r.label}>
            {r.label}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </div>
          <span className="data-mono w-16 shrink-0 text-right text-xs text-text-secondary">
            {formatValue(r.value)}
            {r.sublabel && <span className="text-text-tertiary"> {r.sublabel}</span>}
          </span>
        </div>
      ))}
      {rows.length === 0 && <p className="text-xs text-text-tertiary">No data.</p>}
    </div>
  );
}

/** Weekly intake vs. completed pair of bars per week, tallest week normalizing both
 * series so growth/shrinkage is visible at a glance. */
export function ThroughputChart({
  weeks,
}: {
  weeks: Array<{ weekLabel: string; intake: number; completed: number }>;
}) {
  const max = Math.max(1, ...weeks.flatMap((w) => [w.intake, w.completed]));
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-2">
        {weeks.map((w) => (
          <div key={w.weekLabel} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-24 w-full items-end gap-0.5">
              <div
                className="flex-1 rounded-t bg-uic-c"
                style={{ height: `${(w.intake / max) * 100}%` }}
                title={`Intake: ${w.intake}`}
              />
              <div
                className="flex-1 rounded-t bg-status-closed"
                style={{ height: `${(w.completed / max) * 100}%` }}
                title={`Completed: ${w.completed}`}
              />
            </div>
            <span className="data-mono text-[10px] text-text-tertiary">{w.weekLabel.slice(5)}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 text-xs text-text-secondary">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-uic-c" /> Intake
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-status-closed" /> Completed
        </span>
      </div>
    </div>
  );
}
