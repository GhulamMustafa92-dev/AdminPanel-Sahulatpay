"use client";

import { formatDistanceToNow } from "date-fns";
import { ClipboardCheck, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KycItem, KycQueueResponse, KycStatus } from "@/lib/api/services/kyc";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string | undefined): string {
  return (name || "?")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function timeAgo(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return "—";
  }
}

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_CFG: Record<KycStatus, { cls: string; label: string; dot: string }> = {
  pending:  { cls: "bg-[rgba(249,115,22,0.12)] text-[#f97316] border-[rgba(249,115,22,0.25)]", label: "Pending",  dot: "bg-[#f97316]" },
  approved: { cls: "bg-green-500/10 text-green-400 border-green-500/20",                        label: "Approved", dot: "bg-green-400" },
  rejected: { cls: "bg-red-500/10 text-red-400 border-red-500/20",                              label: "Rejected", dot: "bg-red-400"   },
};

function StatusBadge({ status }: { status: string | undefined }) {
  const cfg = STATUS_CFG[status as KycStatus] ?? STATUS_CFG.pending;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-dm-sans font-medium border", cfg.cls)}>
      <span className={cn("w-1 h-1 rounded-full shrink-0", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

// ── Queue item ────────────────────────────────────────────────────────────────

function QueueItem({
  item,
  isSelected,
  onClick,
}: {
  item: KycItem;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 px-4 py-3.5 text-left border-l-2 transition-all duration-150",
        "border-b border-[#252525] last:border-b-0",
        isSelected
          ? "border-l-[#f97316] bg-[rgba(249,115,22,0.07)]"
          : "border-l-transparent hover:bg-[rgba(249,115,22,0.03)] hover:border-l-[rgba(249,115,22,0.35)]"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5",
          isSelected
            ? "bg-[rgba(249,115,22,0.2)] border border-[rgba(249,115,22,0.3)]"
            : "bg-[#222222] border border-[#2d2d2d]"
        )}
      >
        <span className={cn("text-[11px] font-syne font-bold select-none", isSelected ? "text-[#f97316]" : "text-[#888888]")}>
          {getInitials(item.user_name ?? item.extracted_name ?? "")}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className={cn("text-[13px] font-dm-sans font-medium leading-tight truncate", isSelected ? "text-[#f0f0f0]" : "text-[#c0c0c0]")}>
            {item.user_name || item.extracted_name || "—"}
          </p>
          <StatusBadge status={item.status ?? "pending"} />
        </div>
        <p className="text-[11px] font-dm-sans text-[#888888] leading-none mb-1.5">
          {item.user_phone || "—"}
        </p>
        <p className="text-[10px] font-dm-sans text-[#4a4a4a]">
          {timeAgo(item.submitted_at)}
        </p>
      </div>
    </button>
  );
}

// ── Skeleton items ────────────────────────────────────────────────────────────

function SkeletonItem() {
  return (
    <div className="flex items-start gap-3 px-4 py-3.5 border-b border-[#252525] last:border-b-0 animate-pulse">
      <div className="w-9 h-9 rounded-full bg-[#252525] shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2 pt-0.5">
        <div className="flex justify-between gap-2">
          <div className="h-3.5 w-28 rounded bg-[#252525]" />
          <div className="h-4 w-14 rounded-full bg-[#252525]" />
        </div>
        <div className="h-3 w-20 rounded bg-[#252525]" />
        <div className="h-2.5 w-16 rounded bg-[#252525]" />
      </div>
    </div>
  );
}

// ── Status filter tabs ────────────────────────────────────────────────────────

const FILTER_TABS: { label: string; value: string }[] = [
  { label: "Pending",  value: "pending"  },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

// ── Main component ────────────────────────────────────────────────────────────

const PAGE_LIMIT = 20;

interface KycQueueProps {
  data: KycQueueResponse | undefined;
  isLoading: boolean;
  selectedId: string | null;
  statusFilter: string;
  page: number;
  onStatusChange: (status: string) => void;
  onPageChange: (page: number) => void;
  onSelect: (item: KycItem) => void;
}

export default function KycQueue({
  data,
  isLoading,
  selectedId,
  statusFilter,
  page,
  onStatusChange,
  onPageChange,
  onSelect,
}: KycQueueProps) {
  const items      = data?.reviews ?? [];
  const total      = data?.total ?? items.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ──────────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-[#252525] shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[rgba(249,115,22,0.1)] border border-[rgba(249,115,22,0.2)]">
          <ClipboardCheck className="w-4 h-4 text-[#f97316]" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-syne font-bold text-[#f0f0f0] text-[14px] leading-tight">KYC Queue</h2>
          <p className="text-[10px] font-dm-sans text-[#888888] leading-none mt-0.5">
            {isLoading ? "Loading…" : `${items.length.toLocaleString()} application${items.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        {isLoading && <Loader2 className="w-4 h-4 text-[#4a4a4a] animate-spin shrink-0" />}
      </div>

      {/* ── Status filter tabs ───────────────────────── */}
      <div className="flex gap-1 p-3 border-b border-[#252525] shrink-0">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onStatusChange(tab.value)}
            className={cn(
              "flex-1 py-1.5 rounded-md text-[11px] font-dm-sans font-medium transition-all duration-150",
              statusFilter === tab.value
                ? "bg-[rgba(249,115,22,0.12)] text-[#f97316] border border-[rgba(249,115,22,0.2)]"
                : "text-[#888888] hover:text-[#f0f0f0] border border-transparent"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── List ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          Array.from({ length: 8 }, (_, i) => <SkeletonItem key={i} />)
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center py-20">
            <ClipboardCheck className="w-8 h-8 text-[#2d2d2d]" />
            <p className="text-[12px] font-dm-sans text-[#888888]">No applications</p>
            <p className="text-[11px] font-dm-sans text-[#4a4a4a]">
              No {statusFilter} KYC applications found
            </p>
          </div>
        ) : (
          items.map((item) => (
            <QueueItem
              key={item.id}
              item={item}
              isSelected={selectedId === item.id}
              onClick={() => onSelect(item)}
            />
          ))
        )}
      </div>

      {/* ── Pagination ───────────────────────────────── */}
      {total > PAGE_LIMIT && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#252525] shrink-0">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="flex items-center justify-center w-7 h-7 rounded-lg border border-[#252525] text-[#888888] bg-[#1a1a1a] hover:text-[#f0f0f0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-dm-sans text-[#888888]"
            >{page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="flex items-center justify-center w-7 h-7 rounded-lg border border-[#252525] text-[#888888] bg-[#1a1a1a] hover:text-[#f0f0f0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
