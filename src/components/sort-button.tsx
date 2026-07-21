"use client";

import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Cycles a column through asc -> desc -> unsorted on click, driving the `sortBy`/
 * `sortDir` URL params — shared by every sortable table in the app (Orders, Repair
 * Planner), same URL-as-source-of-truth convention already used by ColumnFilter. */
export function SortButton({
  sortKey,
  currentSearch,
  basePath,
  label,
}: {
  sortKey: string;
  currentSearch: Record<string, string | undefined>;
  basePath: string;
  label: string;
}) {
  const router = useRouter();
  const isActive = currentSearch.sortBy === sortKey;
  const activeDir = isActive ? currentSearch.sortDir : undefined;
  const nextDir: "asc" | "desc" | null = !isActive ? "asc" : activeDir === "asc" ? "desc" : null;

  function handleClick() {
    const params = new URLSearchParams(
      Object.entries(currentSearch).filter(([, v]) => v) as [string, string][],
    );
    if (nextDir) {
      params.set("sortBy", sortKey);
      params.set("sortDir", nextDir);
    } else {
      params.delete("sortBy");
      params.delete("sortDir");
    }
    params.delete("page");
    router.push(`${basePath}?${params.toString()}`);
  }

  const Icon = isActive ? (activeDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={
        isActive
          ? `Sorted by ${label} (${activeDir}) — click to ${nextDir ? `sort ${nextDir}` : "clear sort"}`
          : `Sort by ${label}`
      }
      title={isActive ? `Sorted ${activeDir === "asc" ? "ascending" : "descending"}` : "Sort"}
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded hover:bg-muted",
        isActive ? "text-accent" : "text-text-tertiary hover:text-text-secondary",
      )}
    >
      <Icon className="size-3.5" />
    </button>
  );
}
