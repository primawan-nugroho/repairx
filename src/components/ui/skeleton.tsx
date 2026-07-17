import { cn } from "@/lib/utils";

// Simple shimmer surface for route-transition loading states. Used by the
// per-route loading.tsx files under src/app/(dashboard)/*/loading.tsx — Next
// renders these synchronously during a route transition, so the user sees
// instant paint on sidebar clicks instead of a dead page.
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-surface", className)} />;
}

export function TableSkeleton({ rows = 8, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="flex gap-3 border-b border-border bg-surface px-3 py-2.5">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-3 px-3 py-3">
            {Array.from({ length: columns }).map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-8 w-28" />
    </div>
  );
}
