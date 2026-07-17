import { PageHeaderSkeleton, Skeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function OrdersLoading() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeaderSkeleton />
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-9 min-w-[280px] flex-1" />
        <Skeleton className="h-9 w-24" />
      </div>
      <TableSkeleton rows={10} columns={9} />
    </div>
  );
}
