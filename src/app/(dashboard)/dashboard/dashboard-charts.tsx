"use client";

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { statusColorKey } from "@/lib/utils";
import { uicColorKey } from "@/lib/wc-uic-map";

// CSS custom properties (see globals.css), used directly as SVG fill values — Recharts
// renders plain SVG, and `fill="var(--status-open)"` resolves live against whichever
// theme is active, so these charts re-color on the light/dark toggle for free with no
// JS theme-mode plumbing (unlike a CSS-in-JS library, which needs its own theme object
// kept in sync — see the reverted MUI attempt this replaced).
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

function EmptyState() {
  return <p className="text-xs text-text-tertiary">No data.</p>;
}

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "var(--surface-solid)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    fontSize: 12,
  },
  labelStyle: { color: "var(--text-primary)" },
};

/** Status/UIC breakdowns are parts-of-a-whole data (they sum to total open orders) —
 * a donut fits that better than a bar list, and unlike a single-series bar chart, Pie
 * supports a distinct color per slice directly via <Cell>. */
export function StatusDonutChart({ rows }: { rows: BarRow[] }) {
  if (rows.length === 0) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={rows} dataKey="count" nameKey="label" innerRadius={55} outerRadius={95} paddingAngle={2} cornerRadius={3}>
          {rows.map((r, i) => (
            <Cell key={`${r.label}-${i}`} fill={STATUS_VARS[statusColorKey(r.label)] ?? "var(--status-open)"} />
          ))}
        </Pie>
        <Tooltip {...TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function UicDonutChart({ rows, uicColorSlugs }: { rows: BarRow[]; uicColorSlugs: Record<string, string> }) {
  if (rows.length === 0) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={rows} dataKey="count" nameKey="label" innerRadius={55} outerRadius={95} paddingAngle={2} cornerRadius={3}>
          {rows.map((r, i) => (
            <Cell key={`${r.label}-${i}`} fill={UIC_VARS[uicColorKey(r.label, uicColorSlugs)] ?? "var(--uic-unmapped)"} />
          ))}
        </Pie>
        <Tooltip {...TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

/** Horizontal bar chart for a non-categorical metric (e.g. average days) — a single
 * accent-colored series since there's no status/UIC semantic to encode, plus an
 * optional unit suffix for the tooltip display (e.g. "d" for days). */
export function MetricBarChart({
  rows,
  unit = "",
}: {
  rows: Array<{ label: string; value: number; sublabel?: string }>;
  unit?: string;
}) {
  if (rows.length === 0) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height={Math.max(140, rows.length * 44)}>
      <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 24 }}>
        <CartesianGrid horizontal={false} stroke="var(--border)" />
        <XAxis type="number" tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
        <YAxis
          type="category"
          dataKey="label"
          width={130}
          tick={{ fontSize: 12, fill: "var(--text-secondary)" }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
        />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v) => `${v}${unit}`} />
        <Bar dataKey="value" fill="var(--accent)" radius={[0, 4, 4, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Weekly intake vs. completed — two series so growth/shrinkage across the trailing
 * weeks is readable from the grouped bars, legend, and hover tooltip together. */
export function ThroughputBarChart({
  weeks,
}: {
  weeks: Array<{ weekLabel: string; intake: number; completed: number }>;
}) {
  if (weeks.length === 0) return <EmptyState />;
  const data = weeks.map((w) => ({ ...w, week: w.weekLabel.slice(5) }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="week" tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
        <Tooltip {...TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }} />
        <Bar dataKey="intake" name="Intake" fill="var(--uic-c)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar dataKey="completed" name="Completed" fill="var(--status-closed)" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
