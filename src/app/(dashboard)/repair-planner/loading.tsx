import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function RepairPlannerLoading() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeaderSkeleton />
      <TableSkeleton rows={8} columns={8} />
    </div>
  );
}
