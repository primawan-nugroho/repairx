import { PageHeaderSkeleton, Skeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function ShiftReportLoading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-14 w-32" />
        <Skeleton className="h-14 w-32" />
        <Skeleton className="h-9 w-20 self-end" />
      </div>
      <Skeleton className="h-40 w-full" />
      <div className="flex gap-6 rounded-lg border border-border p-4">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
      </div>
      <TableSkeleton rows={6} columns={9} />
    </div>
  );
}
