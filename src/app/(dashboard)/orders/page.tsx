import Link from "next/link";
import { auth } from "@/lib/auth";
import { getDistinctOrderValues, getOrders, ORDERS_PAGE_SIZE, type OrdersFilter } from "@/lib/orders";
import { getMasters } from "@/lib/masters";
import { OrdersTable } from "./orders-table";
import { AddOrderButton } from "./add-order-button";
import { BulkAddOrdersButton } from "./bulk-add-orders-button";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    engineType?: string;
    workCenter?: string;
    uic?: string;
    status?: string;
    orderNumberLike?: string;
    descriptionLike?: string;
    serialNumberLike?: string;
    locationLike?: string;
    remarkLike?: string;
    hideStore?: string;
    page?: string;
    sortBy?: string;
    sortDir?: string;
  }>;
}

function toList(value: string | undefined): string[] | undefined {
  return value ? value.split(",").filter(Boolean) : undefined;
}

const SORTABLE_COLUMNS: NonNullable<OrdersFilter["sortBy"]>[] = [
  "orderNumber",
  "description",
  "serialNumber",
  "engineType",
  "mwcToday",
  "uicToday",
  "status",
  "location",
  "dateIn",
  "planFinishDate",
  "tier",
];

// Validated against the allowlist rather than cast straight through — an unrecognized
// value in the URL would otherwise index the drizzle table object with `undefined`.
function toSortBy(value: string | undefined): OrdersFilter["sortBy"] {
  return SORTABLE_COLUMNS.find((c) => c === value);
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const [session, params] = await Promise.all([auth(), searchParams]);
  const page = Number(params.page ?? "1") || 1;

  const [{ rows, total }, engineTypeOptions, workCenterOptions, uicOptions, statusOptions, masters] =
    await Promise.all([
      getOrders({
        q: params.q,
        engineType: toList(params.engineType),
        workCenter: toList(params.workCenter),
        uic: toList(params.uic),
        status: toList(params.status),
        orderNumberLike: params.orderNumberLike,
        descriptionLike: params.descriptionLike,
        serialNumberLike: params.serialNumberLike,
        locationLike: params.locationLike,
        remarkLike: params.remarkLike,
        hideServiceableStore: params.hideStore === "1",
        sortBy: toSortBy(params.sortBy),
        sortDir: params.sortDir === "asc" ? "asc" : "desc",
        page,
      }),
      getDistinctOrderValues("engineType"),
      getDistinctOrderValues("mwcToday"),
      getDistinctOrderValues("uicToday"),
      getDistinctOrderValues("status"),
      getMasters(),
    ]);

  const totalPages = Math.max(1, Math.ceil(total / ORDERS_PAGE_SIZE));

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { ...params, ...overrides };
    for (const [key, value] of Object.entries(merged)) {
      if (value) next.set(key, value);
    }
    return `/orders?${next.toString()}`;
  };

  const canEdit = session?.user.role !== "viewer";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">Orders</h1>
        <div className="flex items-center gap-4">
          <span className="data-mono text-sm text-text-secondary">{total} total</span>
          {canEdit && (
            <div className="flex items-center gap-2">
              <BulkAddOrdersButton masters={masters} />
              <AddOrderButton masters={masters} />
            </div>
          )}
        </div>
      </div>

      <OrdersTable
        data={rows}
        canEdit={canEdit}
        currentSearch={params}
        filterOptions={{
          engineType: engineTypeOptions,
          workCenter: workCenterOptions,
          uic: uicOptions,
          status: statusOptions,
        }}
        masters={masters}
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
