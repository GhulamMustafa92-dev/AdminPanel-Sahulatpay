"use client";

import { useState, useMemo } from "react";
import { ChevronsUpDown, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TableColumn<T = Record<string, unknown>> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
}

export interface PaginationState {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
}

export interface DataTableProps<T extends Record<string, unknown> = Record<string, unknown>> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  pagination?: PaginationState;
  onPageChange?: (page: number) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  rowKey?: (row: T, idx: number) => string;
  className?: string;
}

// ── Skeleton rows (orange-shimmer) ────────────────────────────────────────────

const SKEL_WIDTHS = [80, 100, 70, 110, 60, 90];

function SkeletonRows({ count, colCount }: { count: number; colCount: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <tr key={i} className={i % 2 === 1 ? "bg-[rgba(255,255,255,0.012)]" : "bg-[#1a1a1a]"}>
          {Array.from({ length: colCount }, (_, j) => (
            <td key={j} className={cn("py-3.5 animate-pulse", j === 0 ? "pl-5 pr-4" : "px-4")}>
              {j === 0 ? (
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#252525] shrink-0" />
                  <div className="space-y-1.5">
                    <div className="h-3 w-24 rounded bg-[#252525]" />
                    <div className="h-2.5 w-16 rounded bg-[#252525]" />
                  </div>
                </div>
              ) : (
                <div className="h-3 rounded"
                  style={{ width: `${SKEL_WIDTHS[(i + j * 3) % SKEL_WIDTHS.length]}px`, backgroundColor: "rgba(249,115,22,0.07)" }} />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ── DataTable ─────────────────────────────────────────────────────────────────

export function DataTable<T extends Record<string, unknown>>({
  columns, data, loading = false,
  pagination, onPageChange,
  emptyTitle = "No data found", emptyDescription,
  rowKey, className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const cmp = String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? ""), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const getKey = (row: T, idx: number) => rowKey ? rowKey(row, idx) : String(idx);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Table */}
      <div className="rounded-xl border border-[#252525] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Sticky header */}
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#111111] border-b border-[#252525]">
                {columns.map((col, i) => (
                  <th
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                    onClick={() => col.sortable && handleSort(col.key)}
                    className={cn(
                      "py-3 text-[10px] font-dm-sans font-semibold uppercase tracking-[0.09em] text-[#4a4a4a]",
                      i === 0 ? "pl-5 pr-4" : "px-4",
                      col.align === "center" ? "text-center" : col.align === "right" ? "text-right" : "text-left",
                      col.sortable && "cursor-pointer select-none hover:text-[#888888] transition-colors duration-150",
                    )}>
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {col.sortable && (
                        sortKey === col.key
                          ? sortDir === "asc"
                            ? <ChevronUp   className="w-3 h-3 text-[#f97316]" />
                            : <ChevronDown className="w-3 h-3 text-[#f97316]" />
                          : <ChevronsUpDown className="w-3 h-3 opacity-40" />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#252525]">
              {loading ? (
                <SkeletonRows count={8} colCount={columns.length} />
              ) : sortedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="bg-[#1a1a1a]">
                    <div className="flex flex-col items-center justify-center py-16 gap-2">
                      <p className="text-[13px] font-dm-sans text-[#888888]">{emptyTitle}</p>
                      {emptyDescription && (
                        <p className="text-[11px] font-dm-sans text-[#4a4a4a]">{emptyDescription}</p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                sortedData.map((row, idx) => (
                  <tr key={getKey(row, idx)}
                    className={cn(
                      "group transition-colors hover:bg-[rgba(249,115,22,0.04)]",
                      idx % 2 === 1 ? "bg-[rgba(255,255,255,0.012)]" : "bg-[#1a1a1a]",
                    )}>
                    {columns.map((col, j) => (
                      <td key={col.key}
                        className={cn(
                          "py-3.5",
                          j === 0 ? "pl-5 pr-4 border-l-2 border-l-transparent group-hover:border-l-[#f97316] transition-colors duration-150" : "px-4",
                          col.align === "center" ? "text-center" : col.align === "right" ? "text-right" : "text-left",
                        )}>
                        {col.render
                          ? col.render(row[col.key], row)
                          : <span className="text-[12px] font-dm-sans text-[#888888]">{String(row[col.key] ?? "—")}</span>}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.total > pagination.limit && (
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[12px] font-dm-sans text-[#888888]">
            Showing{" "}
            <span className="text-[#f0f0f0]">
              {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{" "}
            of <span className="text-[#f0f0f0]">{pagination.total.toLocaleString()}</span>
          </span>
          <div className="flex items-center gap-2">
            <button disabled={pagination.page <= 1} onClick={() => onPageChange?.(pagination.page - 1)}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#252525] text-[#888888] bg-[#1a1a1a] hover:text-[#f0f0f0] disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1.5 rounded-lg text-[12px] font-dm-sans text-[#f0f0f0] bg-[rgba(249,115,22,0.08)] border border-[rgba(249,115,22,0.15)]">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button disabled={pagination.page >= pagination.totalPages} onClick={() => onPageChange?.(pagination.page + 1)}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#252525] text-[#888888] bg-[#1a1a1a] hover:text-[#f0f0f0] disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
