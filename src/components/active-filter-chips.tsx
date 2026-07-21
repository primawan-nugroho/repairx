"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";

const TEXT_KEYS: Record<string, string> = {
  q: "Search",
  orderNumberLike: "Order",
  descriptionLike: "Description",
  serialNumberLike: "Serial number",
  locationLike: "Location",
  remarkLike: "Remark",
};

const MULTI_KEYS: Record<string, string> = {
  engineType: "Engine type",
  workCenter: "Work center",
  uic: "UIC",
  status: "Status",
};

/** Removable chips for every active search/column filter — tells the user at a
 * glance which subset of orders they're looking at, and lets them remove one
 * filter (or one value out of a multi-select filter) without hunting for the
 * column header that set it. Reads/writes the same URL params ColumnFilter and
 * the search form use, so it stays in sync with them for free. */
export function ActiveFilterChips({
  currentSearch,
  basePath,
}: {
  currentSearch: Record<string, string | undefined>;
  basePath: string;
}) {
  const router = useRouter();

  function buildUrl(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { ...currentSearch, ...overrides };
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
    }
    params.delete("page");
    return `${basePath}?${params.toString()}`;
  }

  const chips: Array<{ key: string; label: string; onRemove: () => void }> = [];

  for (const [key, label] of Object.entries(TEXT_KEYS)) {
    const value = currentSearch[key];
    if (!value) continue;
    chips.push({ key, label: `${label}: ${value}`, onRemove: () => router.push(buildUrl({ [key]: undefined })) });
  }

  for (const [key, label] of Object.entries(MULTI_KEYS)) {
    const value = currentSearch[key];
    if (!value) continue;
    const values = value.split(",").filter(Boolean);
    for (const v of values) {
      chips.push({
        key: `${key}:${v}`,
        label: `${label}: ${v}`,
        onRemove: () => {
          const next = values.filter((x) => x !== v).join(",");
          router.push(buildUrl({ [key]: next || undefined }));
        },
      });
    }
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-text-secondary hover:border-border-strong hover:text-text-primary"
        >
          {chip.label}
          <X className="size-3" />
        </button>
      ))}
      <button
        type="button"
        onClick={() => router.push(basePath)}
        className="text-xs text-text-tertiary hover:text-text-primary"
      >
        Clear all
      </button>
    </div>
  );
}
