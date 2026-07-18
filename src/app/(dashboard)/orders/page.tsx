import Link from "next/link";
import { auth } from "@/lib/auth";
import { getDistinctOrderValues, getOrders, ORDERS_PAGE_SIZE } from "@/lib/orders";
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
    page?: string;
  }>;
}

function toList(value: string | undefined): string[] | undefined {
  return value ? value.split(",").filter(Boolean) : undefined;
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const [session, params] = await Promise.all([auth(), searchParams]);
  const page = Number(params.page ?? "1") || 1;

  const [{ rows, total }, engineTypeOptions, workCenterOptions, uicOptions, statusOptions] =
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
        page,
      }),
      getDistinctOrderValues("engineType"),
      getDistinctOrderValues("mwcToday"),
      getDistinctOrderValues("uicToday"),
      getDistinctOrderValues("status"),
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
  const anyColumnFilterActive = Boolean(
    params.engineType ||
      params.workCenter ||
      params.uic ||
      params.status ||
      params.orderNumberLike ||
      params.descriptionLike ||
      params.serialNumberLike ||
      params.locationLike ||
      params.remarkLike,
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">Orders</h1>
        <div className="flex items-center gap-4">
          <span className="data-mono text-sm text-text-secondary">{total} total</span>
          {canEdit && (
            <div className="flex items-center gap-2">
              <BulkAddOrdersButton />
              <AddOrderButton />
            </div>
          )}
        </div>
      </div>

      <form className="flex flex-wrap gap-3" action="/orders">
        <input
          type="search"
          name="q"
          defaultValue={params.q}
          placeholder="Search order #, description, serial, remark…"
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
            href="/orders"
            className="rounded-full border border-border px-5 py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
          >
            Clear column filters
          </Link>
        )}
      </form>

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
