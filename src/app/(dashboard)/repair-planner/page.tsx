import Link from "next/link";
import { auth } from "@/lib/auth";
import { getDistinctRepairPlannerValues, getRepairPlannerEntries, REPAIR_PLANNER_PAGE_SIZE } from "@/lib/repair-planner";
import { getMasters, getRepairPlannerMasters } from "@/lib/masters";
import { buildPersonColorMap } from "@/lib/utils";
import { PlannerTable } from "./planner-table";
import { AddEntryButton } from "./add-entry-button";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    engineApu?: string;
    customer?: string;
    engineType?: string;
    serialNumber?: string;
    eo?: string;
    workscope?: string;
    inductionDate?: string;
    rpc1?: string;
    rpc2?: string;
    gate4Status?: string;
    projectStatus?: string;
    remark?: string;
    page?: string;
  }>;
}

function toList(value: string | undefined): string[] | undefined {
  return value ? value.split(",").filter(Boolean) : undefined;
}

export default async function RepairPlannerPage({ searchParams }: PageProps) {
  const [session, params] = await Promise.all([auth(), searchParams]);
  const page = Number(params.page ?? "1") || 1;

  const [
    { rows, total },
    engineApuOptions,
    customerOptions,
    engineTypeOptions,
    serialNumberOptions,
    eoOptions,
    workscopeOptions,
    inductionDateOptions,
    rpc1Options,
    rpc2Options,
    gate4Options,
    projectOptions,
    remarkOptions,
    masters,
    plannerMasters,
  ] = await Promise.all([
    getRepairPlannerEntries({
      q: params.q,
      engineApu: toList(params.engineApu),
      customer: toList(params.customer),
      engineType: toList(params.engineType),
      serialNumber: toList(params.serialNumber),
      eo: toList(params.eo),
      workscope: toList(params.workscope),
      inductionDate: toList(params.inductionDate),
      rpc1: toList(params.rpc1),
      rpc2: toList(params.rpc2),
      gate4Status: toList(params.gate4Status),
      projectStatus: toList(params.projectStatus),
      remark: toList(params.remark),
      page,
    }),
    getDistinctRepairPlannerValues("engineApu"),
    getDistinctRepairPlannerValues("customer"),
    getDistinctRepairPlannerValues("engineType"),
    getDistinctRepairPlannerValues("serialNumber"),
    getDistinctRepairPlannerValues("eo"),
    getDistinctRepairPlannerValues("workscope"),
    getDistinctRepairPlannerValues("inductionDate"),
    getDistinctRepairPlannerValues("rpc1"),
    getDistinctRepairPlannerValues("rpc2"),
    getDistinctRepairPlannerValues("gate4Status"),
    getDistinctRepairPlannerValues("projectStatus"),
    getDistinctRepairPlannerValues("remark"),
    getMasters(),
    getRepairPlannerMasters(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / REPAIR_PLANNER_PAGE_SIZE));
  const canEdit = session?.user.role !== "viewer";
  const rpcColorMap = buildPersonColorMap([...rpc1Options, ...rpc2Options]);

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { ...params, ...overrides };
    for (const [key, value] of Object.entries(merged)) {
      if (value) next.set(key, value);
    }
    return `/repair-planner?${next.toString()}`;
  };

  const anyColumnFilterActive = Boolean(
    params.engineApu ||
      params.customer ||
      params.engineType ||
      params.serialNumber ||
      params.eo ||
      params.workscope ||
      params.inductionDate ||
      params.rpc1 ||
      params.rpc2 ||
      params.gate4Status ||
      params.projectStatus ||
      params.remark,
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">Internal repair planner</h1>
        <div className="flex items-center gap-4">
          <span className="data-mono text-sm text-text-secondary">{total} total</span>
          {canEdit && (
            <AddEntryButton
              engineTypes={masters.engineTypes}
              rpcNames={plannerMasters.rpcNames}
              eoNames={plannerMasters.eoNames}
            />
          )}
        </div>
      </div>

      <form className="flex flex-wrap gap-3" action="/repair-planner">
        <input
          type="search"
          name="q"
          defaultValue={params.q}
          placeholder="Search serial, customer, workscope, remark…"
          className="min-w-[280px] flex-1 rounded-lg bg-surface border border-border px-3.5 py-2 text-sm text-text-primary outline-none focus:border-accent focus:ring-4 focus:ring-accent-bg"
        />
        <button
          type="submit"
          className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white"
        >
          Search
        </button>
        {anyColumnFilterActive && (
          <Link
            href="/repair-planner"
            className="rounded-full border border-border px-5 py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
          >
            Clear column filters
          </Link>
        )}
      </form>

      <PlannerTable
        data={rows}
        canEdit={canEdit}
        currentSearch={params}
        rpcColorMap={rpcColorMap}
        filterOptions={{
          engineApu: engineApuOptions,
          customer: customerOptions,
          engineType: engineTypeOptions,
          serialNumber: serialNumberOptions,
          eo: eoOptions,
          workscope: workscopeOptions,
          inductionDate: inductionDateOptions,
          rpc1: rpc1Options,
          rpc2: rpc2Options,
          gate4Status: gate4Options,
          projectStatus: projectOptions,
          remark: remarkOptions,
        }}
        engineTypes={masters.engineTypes}
        rpcNames={plannerMasters.rpcNames}
        eoNames={plannerMasters.eoNames}
      />

      <div className="flex items-center justify-between">
        <Link
          href={buildHref({ page: String(Math.max(1, page - 1)) })}
          className="rounded-full border border-border px-4 py-1.5 text-xs font-medium text-text-secondary aria-disabled:opacity-40"
          aria-disabled={page <= 1}
        >
          Previous
        </Link>
        <span className="data-mono text-xs text-text-secondary">
          Page {page} of {totalPages}
        </span>
        <Link
          href={buildHref({ page: String(Math.min(totalPages, page + 1)) })}
          className="rounded-full border border-border px-4 py-1.5 text-xs font-medium text-text-secondary aria-disabled:opacity-40"
          aria-disabled={page >= totalPages}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
