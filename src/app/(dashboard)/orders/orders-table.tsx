"use client";

import { useState, useTransition } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { Order } from "@/db/schema";
import { StatusBadge } from "@/components/status-badge";
import { UicBadge, WorkCenterBadge } from "@/components/uic-badge";
import { updateOrderStatus } from "./actions";
import { OrderEditDialog } from "./order-edit-dialog";
import { WorkCenterRoutingPopover } from "./work-center-routing-popover";
import { ColumnFilter } from "./column-filter";

const STATUS_OPTIONS = [
  "OPEN",
  "PROGRESS",
  "URGENT",
  "TOP URGENT",
  "w/f BDP",
  "w/f Material",
  "w/f Tools/Calibration",
  "w/f Slot",
];

function tierAccentVar(tier: number | null | undefined) {
  if (tier === 1) return "var(--status-urgent)";
  if (tier === 2) return "var(--status-waiting)";
  return "var(--status-open)";
}

function StatusEditableCell({ order }: { order: Order }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <StatusBadge status={order.status} />
      <select
        aria-label={`Update status for order ${order.orderNumber}`}
        className="rounded-md bg-surface border border-border px-1.5 py-1 text-xs text-text-secondary disabled:opacity-50"
        disabled={pending}
        defaultValue=""
        onChange={(e) => {
          const value = e.target.value;
          if (!value) return;
          startTransition(() => {
            updateOrderStatus(order.orderNumber, value);
          });
          e.target.value = "";
        }}
      >
        <option value="" disabled>
          Change…
        </option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}

interface FilterOptions {
  engineType: string[];
  workCenter: string[];
  uic: string[];
  status: string[];
}

export function OrdersTable({
  data,
  canEdit,
  currentSearch,
  filterOptions,
}: {
  data: Order[];
  canEdit: boolean;
  currentSearch: Record<string, string | undefined>;
  filterOptions: FilterOptions;
}) {
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [routingOrder, setRoutingOrder] = useState<Order | null>(null);

  const columnHelper = createColumnHelper<Order>();

  function headerWithFilter(label: string, filterEl: React.ReactNode) {
    return (
      <span className="inline-flex items-center">
        {label}
        {filterEl}
      </span>
    );
  }

  const columns = [
    columnHelper.accessor("orderNumber", {
      header: () =>
        headerWithFilter(
          "Order",
          <ColumnFilter
            label="Order"
            paramKey="orderNumberLike"
            currentSearch={currentSearch}
            type="text"
          />,
        ),
      cell: (info) => (
        <button
          onClick={() => setEditingOrder(info.row.original)}
          className="data-mono text-accent hover:underline"
        >
          {info.getValue()}
        </button>
      ),
    }),
    columnHelper.accessor("description", {
      header: () =>
        headerWithFilter(
          "Description",
          <ColumnFilter
            label="Description"
            paramKey="descriptionLike"
            currentSearch={currentSearch}
            type="text"
          />,
        ),
      cell: (info) => (
        <span className="line-clamp-1 max-w-[260px]">{info.getValue() || "-"}</span>
      ),
    }),
    columnHelper.accessor("serialNumber", {
      header: () =>
        headerWithFilter(
          "Serial number",
          <ColumnFilter
            label="Serial number"
            paramKey="serialNumberLike"
            currentSearch={currentSearch}
            type="text"
          />,
        ),
      cell: (info) => <span className="data-mono">{info.getValue() || "-"}</span>,
    }),
    columnHelper.accessor("engineType", {
      header: () =>
        headerWithFilter(
          "Engine type",
          <ColumnFilter
            label="Engine type"
            paramKey="engineType"
            currentSearch={currentSearch}
            type="select"
            options={filterOptions.engineType}
          />,
        ),
    }),
    columnHelper.accessor("mwcToday", {
      header: () =>
        headerWithFilter(
          "Work center",
          <ColumnFilter
            label="Work center"
            paramKey="workCenter"
            currentSearch={currentSearch}
            type="select"
            options={filterOptions.workCenter}
          />,
        ),
      cell: (info) => (
        <WorkCenterBadge
          workCenter={info.getValue()}
          onClick={info.getValue() ? () => setRoutingOrder(info.row.original) : undefined}
        />
      ),
    }),
    columnHelper.accessor("uicToday", {
      header: () =>
        headerWithFilter(
          "UIC",
          <ColumnFilter
            label="UIC"
            paramKey="uic"
            currentSearch={currentSearch}
            type="select"
            options={filterOptions.uic}
          />,
        ),
      cell: (info) => <UicBadge uic={info.getValue()} />,
    }),
    columnHelper.accessor("status", {
      header: () =>
        headerWithFilter(
          "Status",
          <ColumnFilter
            label="Status"
            paramKey="status"
            currentSearch={currentSearch}
            type="select"
            options={filterOptions.status}
          />,
        ),
      cell: (info) => <StatusEditableCell order={info.row.original} />,
    }),
    columnHelper.accessor("location", {
      header: () =>
        headerWithFilter(
          "Location",
          <ColumnFilter
            label="Location"
            paramKey="locationLike"
            currentSearch={currentSearch}
            type="text"
          />,
        ),
      cell: (info) => <span>{info.getValue() || "-"}</span>,
    }),
    columnHelper.accessor("remark", {
      header: () =>
        headerWithFilter(
          "Remark",
          <ColumnFilter
            label="Remark"
            paramKey="remarkLike"
            currentSearch={currentSearch}
            type="text"
          />,
        ),
      cell: (info) => (
        <span className="line-clamp-1 max-w-[220px]">{info.getValue() || "-"}</span>
      ),
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-surface">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-medium text-text-secondary"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-t border-border hover:bg-surface"
                style={{ borderLeft: `2px solid ${tierAccentVar(row.original.tier)}` }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="whitespace-nowrap px-3 py-2.5 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
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
        <OrderEditDialog
          order={editingOrder}
          canEdit={canEdit}
          onClose={() => setEditingOrder(null)}
        />
      )}

      {routingOrder && (
        <WorkCenterRoutingPopover order={routingOrder} onClose={() => setRoutingOrder(null)} />
      )}
    </>
  );
}
