"use client";

import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface ColumnFilterProps {
  label: string;
  paramKey: string;
  currentSearch: Record<string, string | undefined>;
  type: "select" | "text";
  options?: string[];
}

export function ColumnFilter({ label, paramKey, currentSearch, type, options }: ColumnFilterProps) {
  const router = useRouter();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const currentValue = currentSearch[paramKey] ?? "";
  const selected = useMemo(() => (currentValue ? currentValue.split(",") : []), [currentValue]);
  const [draft, setDraft] = useState<string[]>(selected);
  const [textDraft, setTextDraft] = useState(currentValue);

  const isActive = currentValue.length > 0;
  const filteredOptions = (options ?? []).filter((o) =>
    o.toLowerCase().includes(query.toLowerCase()),
  );

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
    router.push(`/orders?${params.toString()}`);
    setOpen(false);
  }

  function openMenu() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) setPosition({ top: rect.bottom + 4, left: rect.left });
    setDraft(selected);
    setTextDraft(currentValue);
    setQuery("");
    setOpen(true);
  }

  return (
    <span className="relative inline-flex">
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Filter ${label}`}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className={cn(
          "ml-1 rounded px-1 text-[10px]",
          isActive ? "text-accent" : "text-text-tertiary hover:text-text-secondary",
        )}
      >
        ▾
      </button>

      {open &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div
              style={{ position: "fixed", top: position.top, left: position.left }}
              className="vibrancy z-50 w-56 rounded-lg border border-border p-3 shadow-[var(--shadow-popover)]"
            >
              {type === "text" ? (
                <div className="flex flex-col gap-2">
                  <input
                    autoFocus
                    value={textDraft}
                    onChange={(e) => setTextDraft(e.target.value)}
                    placeholder="Contains…"
                    className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-text-primary outline-none focus:border-accent"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") apply(textDraft.trim());
                    }}
                  />
                  <div className="flex justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => apply("")}
                      className="text-xs text-text-secondary hover:text-text-primary"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => apply(textDraft.trim())}
                      className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-white"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search…"
                    className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-text-primary outline-none focus:border-accent"
                  />
                  <div className="flex justify-between text-[11px] text-text-secondary">
                    <button
                      type="button"
                      onClick={() => setDraft(options ?? [])}
                      className="hover:text-text-primary"
                    >
                      Select all
                    </button>
                    <button type="button" onClick={() => setDraft([])} className="hover:text-text-primary">
                      Clear
                    </button>
                  </div>
                  <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
                    {filteredOptions.length === 0 && (
                      <span className="text-xs text-text-tertiary">No values</span>
                    )}
                    {filteredOptions.map((opt) => (
                      <label key={opt} className="flex items-center gap-2 text-xs text-text-primary">
                        <input
                          type="checkbox"
                          checked={draft.includes(opt)}
                          onChange={(e) => {
                            setDraft((d) =>
                              e.target.checked ? [...d, opt] : d.filter((x) => x !== opt),
                            );
                          }}
                        />
                        <span className="truncate">{opt}</span>
                      </label>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => apply(draft.join(","))}
                    className="mt-1 rounded-full bg-accent px-3 py-1 text-xs font-medium text-white"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>
          </>,
          document.body,
        )}
    </span>
  );
}
