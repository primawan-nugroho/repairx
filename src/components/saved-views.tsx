"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Trash2, Plus } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SavedView {
  name: string;
  search: string;
}

/** localStorage-only — per-device, per-browser presets. No DB table for this since
 * it's a personal convenience (each user's own "my filtered view"), not shared team
 * state like Masters data. */
function storageKey(basePath: string) {
  return `repairx-saved-views:${basePath}`;
}

export function SavedViews({
  currentSearch,
  basePath,
}: {
  currentSearch: Record<string, string | undefined>;
  basePath: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [views, setViews] = useState<SavedView[]>([]);
  const [name, setName] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(basePath));
      if (raw) setViews(JSON.parse(raw));
    } catch {
      // Corrupt/unavailable localStorage — start empty.
    }
    // basePath is static per page instance, intentionally excluded from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persist(next: SavedView[]) {
    setViews(next);
    localStorage.setItem(storageKey(basePath), JSON.stringify(next));
  }

  function currentQueryString() {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(currentSearch)) {
      if (value && key !== "page") params.set(key, value);
    }
    return params.toString();
  }

  function saveCurrent() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const search = currentQueryString();
    persist([...views.filter((v) => v.name !== trimmed), { name: trimmed, search }]);
    setName("");
  }

  function remove(viewName: string) {
    persist(views.filter((v) => v.name !== viewName));
  }

  const hasActiveFilters = currentQueryString().length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Saved views"
          aria-label="Saved views"
          className="flex h-9 items-center gap-1.5 rounded-full border border-border px-3.5 text-sm font-medium text-text-secondary hover:text-text-primary"
        >
          <Bookmark className="size-3.5" />
          Views{views.length > 0 && ` (${views.length})`}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-text-secondary">Saved views</span>
          {views.length === 0 && <p className="text-xs text-text-tertiary">No saved views yet.</p>}
          <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
            {views.map((v) => (
              <div key={v.name} className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 hover:bg-muted">
                <button
                  type="button"
                  onClick={() => {
                    router.push(`${basePath}${v.search ? `?${v.search}` : ""}`);
                    setOpen(false);
                  }}
                  className="flex-1 truncate text-left text-sm text-text-primary"
                >
                  {v.name}
                </button>
                <button
                  type="button"
                  onClick={() => remove(v.name)}
                  aria-label={`Delete ${v.name}`}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-text-tertiary hover:bg-muted hover:text-status-urgent"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t border-border pt-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name this view…"
              disabled={!hasActiveFilters}
              className="h-8 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") saveCurrent();
              }}
            />
            <Button type="button" size="sm" disabled={!name.trim() || !hasActiveFilters} onClick={saveCurrent}>
              <Plus className="size-3.5" />
              Save
            </Button>
          </div>
          {!hasActiveFilters && (
            <p className="text-[11px] text-text-tertiary">Apply a filter or search first to save it as a view.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
