"use client";

import type { Order } from "@/db/schema";
import type { OrderMasters } from "@/lib/masters";
import { cn } from "@/lib/utils";
import { wcColorKey } from "@/lib/wc-uic-map";

const COLOR_CLASSES: Record<string, string> = {
  "uic-a": "bg-uic-a/15 text-uic-a border-uic-a/30",
  "uic-b": "bg-uic-b/15 text-uic-b border-uic-b/30",
  "uic-c": "bg-uic-c/15 text-uic-c border-uic-c/30",
  "uic-d": "bg-uic-d/15 text-uic-d border-uic-d/30",
  "uic-e": "bg-uic-e/15 text-uic-e border-uic-e/30",
  "uic-f": "bg-uic-f/15 text-uic-f border-uic-f/30",
  "uic-g": "bg-uic-g/15 text-uic-g border-uic-g/30",
  "uic-h": "bg-uic-h/15 text-uic-h border-uic-h/30",
  "uic-i": "bg-uic-i/15 text-uic-i border-uic-i/30",
  "uic-j": "bg-uic-j/15 text-uic-j border-uic-j/30",
  unmapped: "bg-uic-unmapped/15 text-uic-unmapped border-uic-unmapped/30",
};

export function WorkCenterRoutingPopover({
  order,
  masters,
  onClose,
}: {
  order: Order;
  masters: OrderMasters;
  onClose: () => void;
}) {
  const steps = (order.mwcRouting ?? "")
    .split("-")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-surface-solid p-6 shadow-[var(--shadow-popover)]">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="data-mono text-lg font-semibold text-text-primary">
            {order.orderNumber}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full px-2 py-1 text-text-secondary hover:bg-surface"
          >
            ✕
          </button>
        </div>
        <p className="mb-4 text-xs font-medium text-text-secondary">
          MWC process tracking — current work center highlighted
        </p>

        {steps.length === 0 ? (
          <p className="text-sm text-text-secondary">No routing recorded for this order.</p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {steps.map((step, i) => {
              const isCurrent = order.mwcToday === step;
              const colorKey = wcColorKey(step, masters.workCenterToUic, masters.uicColorSlugs);
              return (
                <div key={`${step}-${i}`} className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm font-medium",
                      COLOR_CLASSES[colorKey],
                      isCurrent && "ring-2 ring-current font-semibold",
                    )}
                  >
                    {step}
                  </span>
                  {i < steps.length - 1 && <span className="text-text-tertiary">→</span>}
                </div>
              );
            })}
          </div>
        )}

        {order.mwcRouting?.includes(order.mwcToday ?? "\0") &&
          steps.filter((s) => s === order.mwcToday).length > 1 && (
            <p className="mt-3 text-xs text-text-tertiary">
              This work center repeats in the routing — every occurrence is highlighted since
              the data doesn&rsquo;t record which pass is current.
            </p>
          )}
      </div>
    </div>
  );
}
