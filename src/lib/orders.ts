import { and, asc, count, desc, eq, ilike, inArray, isNull, ne, or, SQL } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { TERMINAL_UIC } from "@/lib/wc-uic-map";

export const ORDERS_PAGE_SIZE = 25;

export interface OrdersFilter {
  q?: string;
  engineType?: string[];
  workCenter?: string[];
  uic?: string[];
  status?: string[];
  orderNumberLike?: string;
  descriptionLike?: string;
  serialNumberLike?: string;
  locationLike?: string;
  remarkLike?: string;
  /** Excludes orders already sitting in the Kitting/RPC serviceable store — those
   * are finished, not part of the active work queue most Orders views care about. */
  hideServiceableStore?: boolean;
  page?: number;
  sortBy?: "orderNumber" | "dateIn" | "planFinishDate" | "tier";
  sortDir?: "asc" | "desc";
}

export async function getOrders(filter: OrdersFilter) {
  const page = Math.max(1, filter.page ?? 1);
  const conditions: SQL[] = [eq(orders.archived, false)];

  if (filter.q) {
    const like = `%${filter.q}%`;
    const searchClause = or(
      ilike(orders.orderNumber, like),
      ilike(orders.description, like),
      ilike(orders.serialNumber, like),
      ilike(orders.remark, like),
    );
    if (searchClause) conditions.push(searchClause);
  }
  if (filter.engineType?.length) conditions.push(inArray(orders.engineType, filter.engineType));
  if (filter.workCenter?.length) conditions.push(inArray(orders.mwcToday, filter.workCenter));
  if (filter.uic?.length) conditions.push(inArray(orders.uicToday, filter.uic));
  if (filter.status?.length) conditions.push(inArray(orders.status, filter.status));
  // uicToday <> TERMINAL_UIC alone would silently exclude every order with no UIC
  // yet (SQL NULL <> 'x' is NULL, not true) — those aren't in the store, so keep them.
  if (filter.hideServiceableStore) {
    const notInStore = or(isNull(orders.uicToday), ne(orders.uicToday, TERMINAL_UIC));
    if (notInStore) conditions.push(notInStore);
  }
  if (filter.orderNumberLike) conditions.push(ilike(orders.orderNumber, `%${filter.orderNumberLike}%`));
  if (filter.descriptionLike) conditions.push(ilike(orders.description, `%${filter.descriptionLike}%`));
  if (filter.serialNumberLike) conditions.push(ilike(orders.serialNumber, `%${filter.serialNumberLike}%`));
  if (filter.locationLike) conditions.push(ilike(orders.location, `%${filter.locationLike}%`));
  if (filter.remarkLike) conditions.push(ilike(orders.remark, `%${filter.remarkLike}%`));

  const sortColumn = orders[filter.sortBy ?? "dateIn"];
  const orderClause = filter.sortDir === "asc" ? asc(sortColumn) : desc(sortColumn);

  const where = and(...conditions);

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(orders)
      .where(where)
      .orderBy(orderClause)
      .limit(ORDERS_PAGE_SIZE)
      .offset((page - 1) * ORDERS_PAGE_SIZE),
    db.select({ total: count() }).from(orders).where(where),
  ]);

  return {
    rows,
    total: countResult[0]?.total ?? 0,
    page,
    pageSize: ORDERS_PAGE_SIZE,
  };
}

/** Distinct non-null values for a value-list column, for populating the Excel-style
 * filter checklist. Queried fresh each time rather than cached — fine at this scale
 * (a handful of small GROUP BY queries against ~3k rows). */
export async function getDistinctOrderValues(
  column: "engineType" | "mwcToday" | "uicToday" | "status",
) {
  const rows = await db
    .selectDistinct({ value: orders[column] })
    .from(orders)
    .where(eq(orders.archived, false))
    .orderBy(asc(orders[column]));
  return rows.map((r) => r.value).filter((v): v is string => !!v);
}
