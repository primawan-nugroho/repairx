import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function MastersLoading() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeaderSkeleton />
      <TableSkeleton rows={6} columns={5} />
    </div>
  );
}
