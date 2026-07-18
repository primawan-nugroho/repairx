"use client";

import { useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { RepairPlannerEntry } from "@/db/schema";
import { StatusBadge } from "@/components/status-badge";
import { PersonBadge } from "@/components/uic-badge";
import { ColumnFilter } from "@/components/column-filter";
import { formatDate } from "@/lib/utils";
import { PlannerEntryDialog } from "./planner-entry-dialog";

interface FilterOptions {
  engineApu: string[];
  customer: string[];
  engineType: string[];
  serialNumber: string[];
  eo: string[];
  workscope: string[];
  inductionDate: string[];
  rpc1: string[];
  rpc2: string[];
  gate4Status: string[];
  projectStatus: string[];
  remark: string[];
}

export function PlannerTable({
  data,
  canEdit,
  currentSearch,
  filterOptions,
  rpcColorMap,
}: {
  data: RepairPlannerEntry[];
  canEdit: boolean;
  currentSearch: Record<string, string | undefined>;
  filterOptions: FilterOptions;
  rpcColorMap: Record<string, string>;
}) {
  const [editingEntry, setEditingEntry] = useState<RepairPlannerEntry | null>(null);

  const columnHelper = createColumnHelper<RepairPlannerEntry>();

  function headerWithFilter(label: string, filterEl: React.ReactNode) {
    return (
      <span className="inline-flex items-center">
        {label}
        {filterEl}
      </span>
    );
  }

  const columns = [
    columnHelper.accessor("serialNumber", {
      header: () =>
        headerWithFilter(
          "SN",
          <ColumnFilter
            basePath="/repair-planner"
            label="SN"
            paramKey="serialNumber"
            currentSearch={currentSearch}
            type="select"
            options={filterOptions.serialNumber}
          />,
        ),
      cell: (info) => (
        <button
          onClick={() => setEditingEntry(info.row.original)}
          className="data-mono text-accent hover:underline"
        >
          {info.getValue() || "-"}
        </button>
      ),
    }),
    columnHelper.accessor("engineApu", {
      header: () =>
        headerWithFilter(
          "Engine/APU",
          <ColumnFilter
            basePath="/repair-planner"
            label="Engine/APU"
            paramKey="engineApu"
            currentSearch={currentSearch}
            type="select"
            options={filterOptions.engineApu}
          />,
        ),
      cell: (info) => info.getValue() || "-",
    }),
    columnHelper.accessor("customer", {
      header: () =>
        headerWithFilter(
          "Customer",
          <ColumnFilter
            basePath="/repair-planner"
            label="Customer"
            paramKey="customer"
            currentSearch={currentSearch}
            type="select"
            options={filterOptions.customer}
          />,
        ),
    }),
    columnHelper.accessor("engineType", {
      header: () =>
        headerWithFilter(
          "Type",
          <ColumnFilter
            basePath="/repair-planner"
            label="Type"
            paramKey="engineType"
            currentSearch={currentSearch}
            type="select"
            options={filterOptions.engineType}
          />,
        ),
    }),
    columnHelper.accessor("eo", {
      header: () =>
        headerWithFilter(
          "EO",
          <ColumnFilter
            basePath="/repair-planner"
            label="EO"
            paramKey="eo"
            currentSearch={currentSearch}
            type="select"
            options={filterOptions.eo}
          />,
        ),
    }),
    columnHelper.accessor("workscope", {
      header: () =>
        headerWithFilter(
          "Workscope",
          <ColumnFilter
            basePath="/repair-planner"
            label="Workscope"
            paramKey="workscope"
            currentSearch={currentSearch}
            type="select"
            options={filterOptions.workscope}
          />,
        ),
      cell: (info) => <span className="line-clamp-1 max-w-[220px]">{info.getValue() || "-"}</span>,
    }),
    columnHelper.accessor("inductionDate", {
      header: () =>
        headerWithFilter(
          "Induction date",
          <ColumnFilter
            basePath="/repair-planner"
            label="Induction date"
            paramKey="inductionDate"
            currentSearch={currentSearch}
            type="select"
            options={filterOptions.inductionDate}
          />,
        ),
      cell: (info) => <span className="data-mono">{formatDate(info.getValue())}</span>,
    }),
    columnHelper.accessor("rpc1", {
      header: () =>
        headerWithFilter(
          "RPC-1",
          <ColumnFilter
            basePath="/repair-planner"
            label="RPC-1"
            paramKey="rpc1"
            currentSearch={currentSearch}
            type="select"
            options={filterOptions.rpc1}
          />,
        ),
      cell: (info) => <PersonBadge name={info.getValue()} colorMap={rpcColorMap} />,
    }),
    columnHelper.accessor("rpc2", {
      header: () =>
        headerWithFilter(
          "RPC-2",
          <ColumnFilter
            basePath="/repair-planner"
            label="RPC-2"
            paramKey="rpc2"
            currentSearch={currentSearch}
            type="select"
            options={filterOptions.rpc2}
          />,
        ),
      cell: (info) => <PersonBadge name={info.getValue()} colorMap={rpcColorMap} />,
    }),
    columnHelper.accessor("gate4Status", {
      header: () =>
        headerWithFilter(
          "Gate 4",
          <ColumnFilter
            basePath="/repair-planner"
            label="Gate 4"
            paramKey="gate4Status"
            currentSearch={currentSearch}
            type="select"
            options={filterOptions.gate4Status}
          />,
        ),
      cell: (info) => <StatusBadge status={info.getValue()} />,
    }),
    columnHelper.accessor("projectStatus", {
      header: () =>
        headerWithFilter(
          "Project status",
          <ColumnFilter
            basePath="/repair-planner"
            label="Project status"
            paramKey="projectStatus"
            currentSearch={currentSearch}
            type="select"
            options={filterOptions.projectStatus}
          />,
        ),
      cell: (info) => <StatusBadge status={info.getValue()} />,
    }),
    columnHelper.accessor("remark", {
      header: () =>
        headerWithFilter(
          "Remark",
          <ColumnFilter
            basePath="/repair-planner"
            label="Remark"
            paramKey="remark"
            currentSearch={currentSearch}
            type="select"
            options={filterOptions.remark}
          />,
        ),
      cell: (info) => <span className="line-clamp-1 max-w-[200px]">{info.getValue() || "-"}</span>,
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className="max-h-[calc(100vh-260px)] overflow-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-surface">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="whitespace-nowrap border-b border-border bg-surface px-3 py-2.5 text-left text-xs font-medium text-text-secondary"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t border-border hover:bg-surface">
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
                  No entries match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingEntry && (
        <PlannerEntryDialog
          entry={editingEntry}
          canEdit={canEdit}
          onClose={() => setEditingEntry(null)}
          options={{
            engineType: filterOptions.engineType,
            gate4Status: filterOptions.gate4Status,
            projectStatus: filterOptions.projectStatus,
            rpc1: filterOptions.rpc1,
            rpc2: filterOptions.rpc2,
          }}
        />
      )}
    </>
  );
}
