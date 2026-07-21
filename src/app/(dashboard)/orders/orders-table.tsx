"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { History, Rows3, Rows4, SlidersHorizontal, ChevronUp, ChevronDown, X } from "lucide-react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type VisibilityState,
  type RowSelectionState,
} from "@tanstack/react-table";
import type { Order } from "@/db/schema";
import type { OrderMasters } from "@/lib/masters";
import { StatusBadge } from "@/components/status-badge";
import { UicBadge, WorkCenterBadge } from "@/components/uic-badge";
import { OrderEditDialog } from "./order-edit-dialog";
import { WorkCenterRoutingPopover } from "./work-center-routing-popover";
import { ColumnFilter } from "@/components/column-filter";
import { SortButton } from "@/components/sort-button";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ORDER_STATUSES } from "@/lib/order-status";
import { useToast } from "@/components/toast";
import { bulkUpdateOrderStatus } from "./actions";
import { cn } from "@/lib/utils";
import { ActiveFilterChips } from "@/components/active-filter-chips";
import { SavedViews } from "@/components/saved-views";

const COLUMN_FILTER_KEYS = [
  "engineType",
  "workCenter",
  "uic",
  "status",
  "orderNumberLike",
  "descriptionLike",
  "serialNumberLike",
  "locationLike",
  "remarkLike",
] as const;

function buildOrdersHref(currentSearch: Record<string, string | undefined>, overrides: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  const merged = { ...currentSearch, ...overrides };
  for (const [key, value] of Object.entries(merged)) {
    if (value) params.set(key, value);
  }
  return `/orders?${params.toString()}`;
}

interface FilterOptions {
  engineType: string[];
  workCenter: string[];
  uic: string[];
  status: string[];
}

// select + orderNumber + description + serialNumber are always shown, always
// first, and pinned via the frozen-column styling below — only the remaining
// columns can be hidden or reordered. Frozen columns can't sensibly be hidden or
// reordered independent of each other (the sticky left-offset math assumes this
// exact order), so they're deliberately excluded from this list.
const REORDERABLE_COLUMNS: Array<{ id: string; label: string }> = [
  { id: "engineType", label: "Engine type" },
  { id: "mwcToday", label: "Work center" },
  { id: "uicToday", label: "UIC" },
  { id: "status", label: "Status" },
  { id: "location", label: "Location" },
  { id: "remark", label: "Remark" },
];

// Pixel widths for the frozen block (select? + orderNumber + description +
// serialNumber), in render order — fixed rather than content-sized so the sticky
// left-offset of each frozen column stays stable across every row regardless of
// content length. orderNumber is sized to its actual content (mono digits + the
// history icon), not padded out further — the space that freed up is handed to
// Description instead. Description's inner clamp (below) is sized to fit inside
// its column net of padding.
const FROZEN_WIDTHS: Record<string, number> = {
  select: 36,
  orderNumber: 140,
  description: 230,
  serialNumber: 120,
};

const DENSITY_KEY = "repairx-orders-density";
const VISIBILITY_KEY = "repairx-orders-column-visibility";
const ORDER_KEY = "repairx-orders-column-order";

export function OrdersTable({
  data,
  canEdit,
  currentSearch,
  filterOptions,
  masters,
}: {
  data: Order[];
  canEdit: boolean;
  currentSearch: Record<string, string | undefined>;
  filterOptions: FilterOptions;
  masters: OrderMasters;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [routingOrder, setRoutingOrder] = useState<Order | null>(null);

  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [movableOrder, setMovableOrder] = useState<string[]>(REORDERABLE_COLUMNS.map((c) => c.id));
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [bulkPending, startBulkTransition] = useTransition();

  // Load saved prefs after mount only — matches the SSR-rendered defaults above so
  // hydration never mismatches (same pattern as ThemeToggle).
  useEffect(() => {
    try {
      const savedDensity = localStorage.getItem(DENSITY_KEY);
      if (savedDensity === "compact" || savedDensity === "comfortable") setDensity(savedDensity);
      const savedVisibility = localStorage.getItem(VISIBILITY_KEY);
      if (savedVisibility) {
        const parsed: VisibilityState = JSON.parse(savedVisibility);
        // Strip any stale keys for columns that are no longer hideable (description/
        // serialNumber moved into the frozen block) — a value saved by an older
        // version of this component could otherwise hide a now-frozen column.
        const hideableIds = new Set(REORDERABLE_COLUMNS.map((c) => c.id));
        const filtered = Object.fromEntries(Object.entries(parsed).filter(([id]) => hideableIds.has(id)));
        setColumnVisibility(filtered);
      }
      const savedOrder = localStorage.getItem(ORDER_KEY);
      if (savedOrder) {
        const parsed: string[] = JSON.parse(savedOrder);
        const validIds = new Set(REORDERABLE_COLUMNS.map((c) => c.id));
        if (parsed.length === validIds.size && parsed.every((id) => validIds.has(id))) {
          setMovableOrder(parsed);
        }
      }
    } catch {
      // Corrupt/unavailable localStorage — fall back to defaults silently.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(DENSITY_KEY, density);
  }, [density]);
  useEffect(() => {
    localStorage.setItem(VISIBILITY_KEY, JSON.stringify(columnVisibility));
  }, [columnVisibility]);
  useEffect(() => {
    localStorage.setItem(ORDER_KEY, JSON.stringify(movableOrder));
  }, [movableOrder]);

  // A fresh page of server data means any prior selection no longer corresponds to
  // visible rows — clear it rather than leaving a stale "N selected" bar around.
  useEffect(() => {
    setRowSelection({});
  }, [data]);

  function moveColumn(id: string, direction: -1 | 1) {
    setMovableOrder((current) => {
      const index = current.indexOf(id);
      const swapWith = index + direction;
      if (swapWith < 0 || swapWith >= current.length) return current;
      const next = [...current];
      const a = next[index]!;
      const b = next[swapWith]!;
      next[index] = b;
      next[swapWith] = a;
      return next;
    });
  }

  const columnHelper = createColumnHelper<Order>();

  function headerWithFilter(label: string, filterEl: React.ReactNode, sortKey?: string) {
    return (
      <span className="inline-flex items-center gap-0.5">
        {label}
        {sortKey && <SortButton sortKey={sortKey} currentSearch={currentSearch} basePath="/orders" label={label} />}
        {filterEl}
      </span>
    );
  }

  const dataColumns = {
    description: columnHelper.accessor("description", {
      header: () =>
        headerWithFilter(
          "Description",
          <ColumnFilter basePath="/orders" label="Description" paramKey="descriptionLike" currentSearch={currentSearch} type="text" />,
          "description",
        ),
      cell: (info) => {
        const value = info.getValue();
        return (
          // Still truncated at 200px net of padding (can't show unlimited text in a
          // fixed-width frozen column), but the native title attribute surfaces the
          // full text as a hover tooltip — the standard, zero-new-dependency way to
          // let long descriptions be read in full without widening the column.
          <span className="line-clamp-1 max-w-[200px]" title={value || undefined}>
            {value || "-"}
          </span>
        );
      },
    }),
    serialNumber: columnHelper.accessor("serialNumber", {
      header: () =>
        headerWithFilter(
          "Serial number",
          <ColumnFilter basePath="/orders" label="Serial number" paramKey="serialNumberLike" currentSearch={currentSearch} type="text" />,
          "serialNumber",
        ),
      cell: (info) => <span className="data-mono">{info.getValue() || "-"}</span>,
    }),
    engineType: columnHelper.accessor("engineType", {
      header: () =>
        headerWithFilter(
          "Engine type",
          <ColumnFilter basePath="/orders" label="Engine type" paramKey="engineType" currentSearch={currentSearch} type="select" options={filterOptions.engineType} />,
          "engineType",
        ),
    }),
    mwcToday: columnHelper.accessor("mwcToday", {
      header: () =>
        headerWithFilter(
          "Work center",
          <ColumnFilter basePath="/orders" label="Work center" paramKey="workCenter" currentSearch={currentSearch} type="select" options={filterOptions.workCenter} />,
          "mwcToday",
        ),
      cell: (info) => (
        <WorkCenterBadge
          workCenter={info.getValue()}
          workCenterToUic={masters.workCenterToUic}
          uicColorSlugs={masters.uicColorSlugs}
          onClick={info.getValue() ? () => setRoutingOrder(info.row.original) : undefined}
        />
      ),
    }),
    uicToday: columnHelper.accessor("uicToday", {
      header: () =>
        headerWithFilter(
          "UIC",
          <ColumnFilter basePath="/orders" label="UIC" paramKey="uic" currentSearch={currentSearch} type="select" options={filterOptions.uic} />,
          "uicToday",
        ),
      cell: (info) => <UicBadge uic={info.getValue()} uicColorSlugs={masters.uicColorSlugs} />,
    }),
    status: columnHelper.accessor("status", {
      header: () =>
        headerWithFilter(
          "Status",
          <ColumnFilter basePath="/orders" label="Status" paramKey="status" currentSearch={currentSearch} type="select" options={filterOptions.status} />,
          "status",
        ),
      cell: (info) => <StatusBadge status={info.getValue()} />,
    }),
    location: columnHelper.accessor("location", {
      header: () =>
        headerWithFilter(
          "Location",
          <ColumnFilter basePath="/orders" label="Location" paramKey="locationLike" currentSearch={currentSearch} type="text" />,
          "location",
        ),
      cell: (info) => <span>{info.getValue() || "-"}</span>,
    }),
    remark: columnHelper.accessor("remark", {
      header: () =>
        headerWithFilter(
          "Remark",
          <ColumnFilter basePath="/orders" label="Remark" paramKey="remarkLike" currentSearch={currentSearch} type="text" />,
        ),
      cell: (info) => {
        const value = info.getValue();
        return (
          <span className="line-clamp-1 max-w-[220px]" title={value || undefined}>
            {value || "-"}
          </span>
        );
      },
    }),
  } as const;

  const columns = useMemo(
    () => [
      ...(canEdit
        ? [
            columnHelper.display({
              id: "select",
              header: ({ table }) => (
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[var(--accent)]"
                  checked={table.getIsAllPageRowsSelected()}
                  ref={(el) => {
                    if (el) el.indeterminate = table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected();
                  }}
                  onChange={table.getToggleAllPageRowsSelectedHandler()}
                  aria-label="Select all rows"
                />
              ),
              cell: ({ row }) => (
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[var(--accent)]"
                  checked={row.getIsSelected()}
                  onChange={row.getToggleSelectedHandler()}
                  aria-label={`Select order ${row.original.orderNumber}`}
                />
              ),
              enableHiding: false,
            }),
          ]
        : []),
      columnHelper.accessor("orderNumber", {
        header: () =>
          headerWithFilter(
            "Order",
            <ColumnFilter basePath="/orders" label="Order" paramKey="orderNumberLike" currentSearch={currentSearch} type="text" />,
            "orderNumber",
          ),
        cell: (info) => (
          <span className="inline-flex items-center gap-1.5">
            <button onClick={() => setEditingOrder(info.row.original)} className="data-mono text-accent hover:underline">
              {info.getValue()}
            </button>
            <Link
              href={`/orders/${encodeURIComponent(info.getValue())}`}
              title="View history"
              aria-label="View history"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-text-tertiary hover:bg-muted hover:text-text-secondary"
            >
              <History className="size-3.5" />
            </Link>
          </span>
        ),
        enableHiding: false,
      }),
      { ...dataColumns.description, enableHiding: false },
      { ...dataColumns.serialNumber, enableHiding: false },
      ...movableOrder.map((id) => dataColumns[id as keyof typeof dataColumns]),
    ],
    // dataColumns is rebuilt every render (closes over per-row state setters); movableOrder/canEdit are the only
    // real drivers of shape, currentSearch/filterOptions/masters drive header/cell content and must stay tracked.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [movableOrder, canEdit, currentSearch, filterOptions, masters],
  );

  // Fixed frozen sequence (select?, orderNumber, description, serialNumber) followed
  // by the user-hideable/reorderable columns — see FROZEN_WIDTHS/REORDERABLE_COLUMNS.
  const frozenOrder = useMemo(() => [...(canEdit ? ["select"] : []), "orderNumber", "description", "serialNumber"], [canEdit]);

  const frozenLeft = useMemo(() => {
    const map: Record<string, number> = {};
    let acc = 0;
    for (const id of frozenOrder) {
      map[id] = acc;
      acc += FROZEN_WIDTHS[id] ?? 0;
    }
    return map;
  }, [frozenOrder]);

  const lastFrozenId = frozenOrder[frozenOrder.length - 1];

  const columnOrder = useMemo(() => [...frozenOrder, ...movableOrder], [frozenOrder, movableOrder]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.orderNumber,
    state: { columnVisibility, columnOrder, rowSelection },
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: canEdit,
  });

  const selectedOrderNumbers = Object.keys(rowSelection).filter((id) => rowSelection[id]);
  const cellPad = density === "compact" ? "py-1" : "py-2.5";
  const anyColumnFilterActive = COLUMN_FILTER_KEYS.some((key) => currentSearch[key]);

  function applyBulkStatus() {
    if (!bulkStatus || selectedOrderNumbers.length === 0) return;
    startBulkTransition(async () => {
      try {
        await bulkUpdateOrderStatus(selectedOrderNumbers, bulkStatus);
        showToast(`Updated ${selectedOrderNumbers.length} order${selectedOrderNumbers.length === 1 ? "" : "s"} to "${bulkStatus}"`);
        setRowSelection({});
        setBulkStatus("");
        router.refresh();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Bulk update failed.", "error");
      }
    });
  }

  const hideStoreActive = currentSearch.hideStore === "1";

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <form className="flex flex-wrap items-center gap-3" action="/orders">
          <input
            type="search"
            name="q"
            defaultValue={currentSearch.q}
            placeholder="Search order #, description, serial, remark…"
            className="h-9 min-w-[240px] flex-1 rounded-lg border border-border bg-surface px-3.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-4 focus:ring-accent-bg"
          />
          <button type="submit" className="h-9 rounded-full bg-accent px-5 text-sm font-medium text-white">
            Search
          </button>
          {anyColumnFilterActive && (
            <Link
              href="/orders"
              className="flex h-9 items-center rounded-full border border-border px-5 text-sm font-medium text-text-secondary hover:text-text-primary"
            >
              Clear column filters
            </Link>
          )}
          <Link
            href={buildOrdersHref(currentSearch, { hideStore: hideStoreActive ? undefined : "1", page: undefined })}
            className={cn(
              "flex h-8 items-center rounded-full border px-3 text-xs font-medium",
              hideStoreActive ? "border-accent bg-accent-bg text-accent" : "border-border text-text-secondary hover:text-text-primary",
            )}
          >
            Hide serviceable store
          </Link>
        </form>

        <SavedViews currentSearch={currentSearch} basePath="/orders" />

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setDensity(density === "compact" ? "comfortable" : "compact")}
            title={density === "compact" ? "Switch to comfortable row height" : "Switch to compact row height"}
            aria-label="Toggle row density"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-text-secondary hover:text-text-primary"
          >
            {density === "compact" ? <Rows4 className="size-4" /> : <Rows3 className="size-4" />}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                title="Columns"
                aria-label="Show/hide and reorder columns"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-text-secondary hover:text-text-primary"
              >
                <SlidersHorizontal className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {movableOrder.map((id, index) => {
                const col = REORDERABLE_COLUMNS.find((c) => c.id === id)!;
                const tableCol = table.getColumn(id);
                return (
                  <DropdownMenuCheckboxItem
                    key={id}
                    checked={tableCol?.getIsVisible() ?? true}
                    onCheckedChange={(checked) => tableCol?.toggleVisibility(!!checked)}
                    onSelect={(e) => e.preventDefault()}
                    className="pr-1"
                  >
                    <span className="flex-1">{col.label}</span>
                    <span className="flex shrink-0 items-center gap-0.5">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveColumn(id, -1);
                        }}
                        aria-label={`Move ${col.label} up`}
                        className="flex h-5 w-5 items-center justify-center rounded text-text-tertiary hover:bg-muted hover:text-text-secondary disabled:opacity-30"
                      >
                        <ChevronUp className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === movableOrder.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveColumn(id, 1);
                        }}
                        aria-label={`Move ${col.label} down`}
                        className="flex h-5 w-5 items-center justify-center rounded text-text-tertiary hover:bg-muted hover:text-text-secondary disabled:opacity-30"
                      >
                        <ChevronDown className="size-3.5" />
                      </button>
                    </span>
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {selectedOrderNumbers.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-accent bg-accent-bg px-3 py-2">
          <span className="text-sm font-medium text-accent">{selectedOrderNumbers.length} selected</span>
          <Select value={bulkStatus} onValueChange={setBulkStatus}>
            <SelectTrigger className="h-8 w-56 text-xs">
              <SelectValue placeholder="Set status to…" />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" size="sm" disabled={!bulkStatus || bulkPending} onClick={applyBulkStatus}>
            {bulkPending ? "Applying…" : "Apply"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setRowSelection({})}>
            <X className="size-3.5" />
            Clear
          </Button>
        </div>
      )}

      <ActiveFilterChips currentSearch={currentSearch} basePath="/orders" />

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-surface">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const id = header.column.id;
                  const isFrozen = id in frozenLeft;
                  return (
                    <th
                      key={header.id}
                      style={
                        isFrozen
                          ? {
                              left: frozenLeft[id],
                              width: FROZEN_WIDTHS[id],
                              minWidth: FROZEN_WIDTHS[id],
                              // Tailwind has no border-r-{token} utility (confirmed: no rule is
                              // generated for it) — inline style is the reliable way to apply a
                              // themed border-right color here.
                              ...(id === lastFrozenId ? { borderRight: "1px solid var(--border-strong)" } : {}),
                            }
                          : undefined
                      }
                      className={cn(
                        "whitespace-nowrap border-b border-border px-3 py-2.5 text-left text-xs font-medium text-text-secondary",
                        isFrozen ? "sticky z-20 bg-frozen-surface" : "bg-surface",
                      )}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, rowIndex) => (
              <tr
                key={row.id}
                className={cn(
                  "group border-t border-border hover:bg-surface",
                  rowIndex % 2 === 1 && "bg-black/[0.015] dark:bg-white/[0.02]",
                )}
              >
                {row.getVisibleCells().map((cell) => {
                  const id = cell.column.id;
                  const isFrozen = id in frozenLeft;
                  return (
                    <td
                      key={cell.id}
                      style={
                        isFrozen
                          ? {
                              left: frozenLeft[id],
                              width: FROZEN_WIDTHS[id],
                              minWidth: FROZEN_WIDTHS[id],
                              ...(id === lastFrozenId ? { borderRight: "1px solid var(--border-strong)" } : {}),
                            }
                          : undefined
                      }
                      className={cn(
                        "whitespace-nowrap px-3 align-middle",
                        cellPad,
                        // Frozen cells stay opaque (never the translucent --surface, which
                        // would let scrolled-under columns bleed through — DESIGN.md's
                        // opaque-over-content rule) but still reproduce the odd-row zebra
                        // stripe at the same intensity step (-alt) so a striped row doesn't
                        // visually split in half at the freeze line.
                        isFrozen &&
                          cn(
                            "sticky z-[1] group-hover:bg-frozen-surface-hover",
                            rowIndex % 2 === 1 ? "bg-frozen-surface-alt" : "bg-frozen-surface",
                          ),
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-text-secondary">
                  No orders match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingOrder && (
        <OrderEditDialog order={editingOrder} canEdit={canEdit} masters={masters} onClose={() => setEditingOrder(null)} />
      )}

      {routingOrder && (
        <WorkCenterRoutingPopover order={routingOrder} masters={masters} onClose={() => setRoutingOrder(null)} />
      )}
    </>
  );
}
