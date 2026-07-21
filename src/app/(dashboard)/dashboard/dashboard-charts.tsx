"use client";

import { useTheme } from "@mui/material/styles";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";
import { statusColorKey } from "@/lib/utils";
import { uicColorKey } from "@/lib/wc-uic-map";
import { STATUS_COLORS, UIC_COLORS } from "@/lib/mui-theme";

interface BarRow {
  label: string;
  count: number;
}

const STATUS_KEY_TO_COLOR_FIELD: Record<string, keyof (typeof STATUS_COLORS)["light"]> = {
  "status-open": "open",
  "status-progress": "progress",
  "status-closed": "closed",
  "status-waiting": "waiting",
  "status-urgent": "urgent",
};

// uic-a..uic-j map 1:1 to UIC_COLORS' array order (see mui-theme.ts).
const UIC_SLUGS = ["uic-a", "uic-b", "uic-c", "uic-d", "uic-e", "uic-f", "uic-g", "uic-h", "uic-i", "uic-j"];

function EmptyState() {
  return <p className="text-xs text-text-tertiary">No data.</p>;
}

/** Status/UIC breakdowns are parts-of-a-whole data (they sum to total open orders),
 * which is what a donut is for — and unlike BarChart, PieChart supports a distinct
 * color per slice natively (see PieValueType.color), matching this app's semantic
 * status/categorical-UIC palettes without the multi-series-with-nulls workaround
 * BarChart would need for per-bar color. */
export function StatusDonutChart({ rows }: { rows: BarRow[] }) {
  const theme = useTheme();
  const palette = STATUS_COLORS[theme.palette.mode];
  if (rows.length === 0) return <EmptyState />;

  // Some legacy rows have NULL status, others an empty string — both render as the
  // "Unset" label (see dashboard.ts's `r.label || "Unset"` fallback), so the label
  // alone isn't a unique id here. Index-suffix it rather than fixing the underlying
  // query, since these genuinely are two distinct DB groups that happen to share a
  // display label.
  const data = rows.map((r, i) => ({
    id: `${r.label}-${i}`,
    label: r.label,
    value: r.count,
    color: palette[STATUS_KEY_TO_COLOR_FIELD[statusColorKey(r.label)] ?? "open"],
  }));

  return (
    <PieChart
      series={[{ data, innerRadius: 45, paddingAngle: 1.5, cornerRadius: 3 }]}
      height={260}
    />
  );
}

export function UicDonutChart({ rows, uicColorSlugs }: { rows: BarRow[]; uicColorSlugs: Record<string, string> }) {
  const theme = useTheme();
  const palette = UIC_COLORS[theme.palette.mode];
  if (rows.length === 0) return <EmptyState />;

  const data = rows.map((r, i) => {
    const slug = uicColorKey(r.label, uicColorSlugs);
    const index = UIC_SLUGS.indexOf(slug);
    return {
      id: `${r.label}-${i}`,
      label: r.label,
      value: r.count,
      color: index >= 0 ? palette[index]! : theme.palette.text.secondary,
    };
  });

  return (
    <PieChart
      series={[{ data, innerRadius: 45, paddingAngle: 1.5, cornerRadius: 3 }]}
      height={260}
    />
  );
}

/** Horizontal bar chart for a non-categorical metric (e.g. average days) — a single
 * accent-colored series since there's no status/UIC semantic to encode here, plus an
 * optional unit suffix for the tooltip/axis value display (e.g. "d" for days). Takes
 * a plain string rather than a formatter function — this component is a Client
 * Component (needs useTheme) rendered from the Dashboard's Server Component page, and
 * functions can't be passed across that boundary. */
export function MetricBarChart({
  rows,
  unit = "",
}: {
  rows: Array<{ label: string; value: number; sublabel?: string }>;
  unit?: string;
}) {
  const theme = useTheme();
  if (rows.length === 0) return <EmptyState />;

  // MUI X ellipsis-truncates band-axis labels based on the y-axis's own `width`
  // (not the chart's margin.left, which only affects layout, not the label-fit
  // calculation) — size it to the longest label rather than a fixed guess, since
  // this component serves both short buckets ("0-30d") and longer ones ("Unknown
  // intake").
  const leftMargin = Math.max(90, Math.max(...rows.map((r) => r.label.length)) * 7 + 24);

  return (
    <BarChart
      layout="horizontal"
      height={Math.max(140, rows.length * 44)}
      series={[
        {
          data: rows.map((r) => r.value),
          color: theme.palette.primary.main,
          valueFormatter: (v) => (v == null ? "" : `${v}${unit}`),
        },
      ]}
      yAxis={[{ scaleType: "band", data: rows.map((r) => r.label), width: leftMargin }]}
      grid={{ vertical: true }}
      hideLegend
      margin={{ left: leftMargin }}
    />
  );
}

/** Weekly intake vs. completed — two series so growth/shrinkage across the trailing
 * weeks is readable from the grouped bars, legend, and hover tooltip together. */
export function ThroughputBarChart({
  weeks,
}: {
  weeks: Array<{ weekLabel: string; intake: number; completed: number }>;
}) {
  const theme = useTheme();
  const uicPalette = UIC_COLORS[theme.palette.mode];
  const statusPalette = STATUS_COLORS[theme.palette.mode];
  if (weeks.length === 0) return <EmptyState />;

  return (
    <BarChart
      height={260}
      series={[
        { data: weeks.map((w) => w.intake), label: "Intake", color: uicPalette[2] },
        { data: weeks.map((w) => w.completed), label: "Completed", color: statusPalette.closed },
      ]}
      xAxis={[{ scaleType: "band", data: weeks.map((w) => w.weekLabel.slice(5)) }]}
      grid={{ horizontal: true }}
    />
  );
}
