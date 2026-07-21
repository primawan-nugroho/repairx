"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ListFilter } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ColumnFilterProps {
  label: string;
  paramKey: string;
  currentSearch: Record<string, string | undefined>;
  type: "select" | "text";
  options?: string[];
  basePath: string;
}

export function ColumnFilter({ label, paramKey, currentSearch, type, options, basePath }: ColumnFilterProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const currentValue = currentSearch[paramKey] ?? "";
  const selected = useMemo(() => (currentValue ? currentValue.split(",") : []), [currentValue]);
  const [draft, setDraft] = useState<string[]>(selected);
  const [textDraft, setTextDraft] = useState(currentValue);

  const isActive = currentValue.length > 0;
  const filteredOptions = (options ?? []).filter((o) => o.toLowerCase().includes(query.toLowerCase()));

  function apply(nextValue: string) {
    const params = new URLSearchParams(
      Object.entries(currentSearch).filter(([, v]) => v) as [string, string][],
    );
    if (nextValue) {
      params.set(paramKey, nextValue);
    } else {
      params.delete(paramKey);
    }
    params.delete("page");
    router.push(`${basePath}?${params.toString()}`);
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setDraft(selected);
          setTextDraft(currentValue);
          setQuery("");
        }
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Filter ${label}`}
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded",
            isActive
              ? "bg-accent-bg text-accent"
              : "text-text-tertiary hover:bg-muted hover:text-text-secondary",
          )}
        >
          <ListFilter className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        {type === "text" ? (
          <div className="flex flex-col gap-2">
            <Input
              autoFocus
              value={textDraft}
              onChange={(e) => setTextDraft(e.target.value)}
              placeholder="Contains…"
              className="h-8 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") apply(textDraft.trim());
              }}
            />
            <div className="flex justify-between gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => apply("")}>
                Clear
              </Button>
              <Button type="button" size="sm" onClick={() => apply(textDraft.trim())}>
                Apply
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="h-8 text-xs"
            />
            <div className="flex justify-between text-[11px] text-text-secondary">
              <button type="button" onClick={() => setDraft(options ?? [])} className="hover:text-text-primary">
                Select all
              </button>
              <button type="button" onClick={() => setDraft([])} className="hover:text-text-primary">
                Clear
              </button>
            </div>
            <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
              {filteredOptions.length === 0 && <span className="text-xs text-text-tertiary">No values</span>}
              {filteredOptions.map((opt) => (
                <label key={opt} className="flex items-center gap-2 text-xs text-text-primary">
                  <input
                    type="checkbox"
                    checked={draft.includes(opt)}
                    onChange={(e) => {
                      setDraft((d) => (e.target.checked ? [...d, opt] : d.filter((x) => x !== opt)));
                    }}
                  />
                  <span className="truncate">{opt}</span>
                </label>
              ))}
            </div>
            <Button type="button" size="sm" className="mt-1" onClick={() => apply(draft.join(","))}>
              Apply
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
