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

export function UicBarChart({ rows }: { rows: BarRow[] }) {
  return <BarList rows={rows} colorFor={(label) => UIC_VARS[uicColorKey(label)] ?? "var(--uic-unmapped)"} />;
}
