import { and, asc, count, desc, eq, ilike, inArray, or, SQL } from "drizzle-orm";
import { db } from "@/db";
import { repairPlannerEntries } from "@/db/schema";

export const REPAIR_PLANNER_PAGE_SIZE = 30;

export interface RepairPlannerFilter {
  q?: string;
  engineApu?: string[];
  customer?: string[];
  engineType?: string[];
  serialNumber?: string[];
  eo?: string[];
  workscope?: string[];
  inductionDate?: string[];
  rpc1?: string[];
  rpc2?: string[];
  gate4Status?: string[];
  projectStatus?: string[];
  remark?: string[];
  page?: number;
  sortBy?:
    | "serialNumber"
    | "engineApu"
    | "customer"
    | "engineType"
    | "eo"
    | "workscope"
    | "inductionDate"
    | "rpc1"
    | "rpc2"
    | "gate4Status"
    | "projectStatus";
  sortDir?: "asc" | "desc";
}

export async function getRepairPlannerEntries(filter: RepairPlannerFilter) {
  const page = Math.max(1, filter.page ?? 1);
  const conditions: SQL[] = [eq(repairPlannerEntries.archived, false)];

  if (filter.q) {
    const like = `%${filter.q}%`;
    const searchClause = or(
      ilike(repairPlannerEntries.serialNumber, like),
      ilike(repairPlannerEntries.customer, like),
      ilike(repairPlannerEntries.workscope, like),
      ilike(repairPlannerEntries.remark, like),
    );
    if (searchClause) conditions.push(searchClause);
  }
  if (filter.engineApu?.length) conditions.push(inArray(repairPlannerEntries.engineApu, filter.engineApu));
  if (filter.customer?.length) conditions.push(inArray(repairPlannerEntries.customer, filter.customer));
  if (filter.engineType?.length) conditions.push(inArray(repairPlannerEntries.engineType, filter.engineType));
  if (filter.serialNumber?.length)
    conditions.push(inArray(repairPlannerEntries.serialNumber, filter.serialNumber));
  if (filter.eo?.length) conditions.push(inArray(repairPlannerEntries.eo, filter.eo));
  if (filter.workscope?.length) conditions.push(inArray(repairPlannerEntries.workscope, filter.workscope));
  if (filter.inductionDate?.length)
    conditions.push(inArray(repairPlannerEntries.inductionDate, filter.inductionDate));
  if (filter.rpc1?.length) conditions.push(inArray(repairPlannerEntries.rpc1, filter.rpc1));
  if (filter.rpc2?.length) conditions.push(inArray(repairPlannerEntries.rpc2, filter.rpc2));
  if (filter.gate4Status?.length) conditions.push(inArray(repairPlannerEntries.gate4Status, filter.gate4Status));
  if (filter.projectStatus?.length)
    conditions.push(inArray(repairPlannerEntries.projectStatus, filter.projectStatus));
  if (filter.remark?.length) conditions.push(inArray(repairPlannerEntries.remark, filter.remark));

  const where = and(...conditions);

  const sortColumn = repairPlannerEntries[filter.sortBy ?? "inductionDate"];
  const orderClause = filter.sortDir === "asc" ? asc(sortColumn) : desc(sortColumn);

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(repairPlannerEntries)
      .where(where)
      .orderBy(orderClause)
      .limit(REPAIR_PLANNER_PAGE_SIZE)
      .offset((page - 1) * REPAIR_PLANNER_PAGE_SIZE),
    db.select({ total: count() }).from(repairPlannerEntries).where(where),
  ]);

  return {
    rows,
    total: countResult[0]?.total ?? 0,
    page,
    pageSize: REPAIR_PLANNER_PAGE_SIZE,
  };
}

export async function getDistinctRepairPlannerValues(
  column:
    | "engineApu"
    | "customer"
    | "engineType"
    | "serialNumber"
    | "eo"
    | "workscope"
    | "inductionDate"
    | "rpc1"
    | "rpc2"
    | "gate4Status"
    | "projectStatus"
    | "remark",
) {
  const rows = await db
    .selectDistinct({ value: repairPlannerEntries[column] })
    .from(repairPlannerEntries)
    .where(eq(repairPlannerEntries.archived, false))
    .orderBy(asc(repairPlannerEntries[column]));
  return rows.map((r) => r.value).filter((v): v is string => !!v);
}
