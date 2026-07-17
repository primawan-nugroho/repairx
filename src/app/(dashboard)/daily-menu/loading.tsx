import { PageHeaderSkeleton, Skeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function DailyMenuLoading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <Skeleton className="h-4 w-96" />
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-14 w-32" />
        <Skeleton className="h-14 w-32" />
        <Skeleton className="h-9 w-20 self-end" />
      </div>
      <Skeleton className="h-40 w-full" />
      <TableSkeleton rows={6} columns={9} />
    </div>
  );
}
