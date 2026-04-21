"use client";

import { useState } from "react";
import { Eye, Flag, RotateCcw, Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Transaction, TxnStatus, TxnType, TransactionListResponse } from "@/lib/api/services/transactions";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

function fmtRs(n: number) {
  if (n >= 1_000_000) return `Rs. ${(n / 1_000_000).toFixed(2)}M`;
  return `Rs. ${n.toLocaleString()}`;
}

function isCredit(type: TxnType) {
  return type === "receive" || type === "deposit";
}

function fmtAmount(amount: number, type: TxnType) {
  const sign = isCredit(type) ? "+" : "−";
  return `${sign} Rs. ${amount.toLocaleString()}`;
}

function safeDate(d: string) {
  try { return format(new Date(d), "MMM d, yy · h:mm a"); } catch { return "—"; }
}

// ── Badges ────────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<TxnStatus, { cls: string; label: string }> = {
  completed: { cls: "bg-green-500/10 text-green-400 border-green-500/20",           label: "Completed" },
  pending:   { cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",         label: "Pending"   },
  failed:    { cls: "bg-red-500/10 text-red-400 border-red-500/20",                  label: "Failed"    },
  reversed:  { cls: "bg-[rgba(249,115,22,0.1)] text-[#f97316] border-[rgba(249,115,22,0.2)]", label: "Reversed" },
};

const TYPE_CFG: Record<TxnType, { cls: string; label: string }> = {
  send:       { cls: "bg-red-500/10 text-red-400 border-red-500/20",                   label: "Send"       },
  receive:    { cls: "bg-green-500/10 text-green-400 border-green-500/20",              label: "Receive"    },
  deposit:    { cls: "bg-[rgba(249,115,22,0.1)] text-[#f97316] border-[rgba(249,115,22,0.2)]", label: "Deposit" },
  withdrawal: { cls: "bg-[#252525] text-[#888888] border-[#2d2d2d]",                   label: "Withdrawal" },
};

function StatusBadge({ status }: { status: TxnStatus }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending;
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-dm-sans font-medium border", cfg.cls)}>
      {cfg.label}
    </span>
  );
}

function TypeBadge({ type }: { type: TxnType }) {
  const cfg = TYPE_CFG[type] ?? TYPE_CFG.send;
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-dm-sans font-medium border", cfg.cls)}>
      {cfg.label}
    </span>
  );
}

// ── Skeleton row ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-[#252525] animate-pulse">
      <td className="pl-5 pr-4 py-3.5"><div className="h-3 w-24 rounded bg-[#252525]" /></td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#252525] shrink-0" />
          <div className="space-y-1.5">
            <div className="h-3 w-24 rounded bg-[#252525]" />
            <div className="h-2.5 w-16 rounded bg-[#252525]" />
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5"><div className="h-4 w-16 rounded-full bg-[#252525]" /></td>
      <td className="px-4 py-3.5"><div className="h-3.5 w-28 rounded bg-[#252525]" /></td>
      <td className="px-4 py-3.5"><div className="h-3 w-16 rounded bg-[#252525]" /></td>
      <td className="px-4 py-3.5"><div className="h-4 w-20 rounded-full bg-[#252525]" /></td>
      <td className="px-4 py-3.5"><div className="h-3 w-20 rounded bg-[#252525]" /></td>
      <td className="px-4 py-3.5"><div className="h-3 w-28 rounded bg-[#252525]" /></td>
      <td className="pr-5 py-3.5"><div className="h-7 w-20 rounded bg-[#252525] mx-auto" /></td>
    </tr>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

const COLS = ["TX ID", "Sender ID", "Type", "Amount (Rs.)", "Status", "Purpose", "Flagged", "Date", "Actions"];

interface TransactionTableProps {
  data:      TransactionListResponse | undefined;
  isLoading: boolean;
  onView:    (txn: Transaction) => void;
  onFlag:    (txn: Transaction) => void;
  onReverse: (txn: Transaction) => void;
}

export default function TransactionTable({ data, isLoading, onView, onFlag, onReverse }: TransactionTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  const txns = data?.transactions ?? [];

  return (
    <div className="rounded-xl border border-[#252525] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1150px]">

          {/* ── Header ─────────────────────────────────────── */}
          <thead>
            <tr className="bg-[#111111] border-b border-[#252525]">
              {COLS.map((col, i) => (
                <th
                  key={col}
                  className={cn(
                    "py-3 text-[10px] font-dm-sans font-semibold uppercase tracking-[0.09em] text-[#4a4a4a]",
                    i === 0              ? "pl-5 pr-4 text-left"   :
                    i === COLS.length - 1 ? "pr-5 text-center"      : "px-4 text-left"
                  )}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          {/* ── Body ───────────────────────────────────────── */}
          <tbody className="divide-y divide-[#252525]">
            {isLoading ? (
              Array.from({ length: 10 }, (_, i) => <SkeletonRow key={i} />)
            ) : txns.length === 0 ? (
              <tr>
                <td colSpan={COLS.length} className="py-20 text-center bg-[#1a1a1a]">
                  <p className="text-[13px] font-dm-sans text-[#888888]">No transactions found</p>
                  <p className="text-[11px] font-dm-sans text-[#4a4a4a] mt-1">Try adjusting your filters</p>
                </td>
              </tr>
            ) : (
              txns.map((txn, idx) => (
                <tr
                  key={txn.id}
                  className={cn(
                    "group transition-colors duration-100 hover:bg-[rgba(249,115,22,0.04)]",
                    idx % 2 === 1 ? "bg-[rgba(255,255,255,0.012)]" : "bg-[#1a1a1a]"
                  )}
                >
                  {/* TX ID */}
                  <td className="pl-5 pr-4 py-3.5 border-l-2 border-l-transparent group-hover:border-l-[#f97316] transition-colors duration-100">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono text-[#888888] truncate max-w-[96px]">
                        {txn.reference_number || txn.id}
                      </span>
                      <button
                        onClick={() => copyId(txn.reference_number || txn.id)}
                        title="Copy TX ID"
                        className="flex items-center justify-center w-5 h-5 rounded text-[#4a4a4a] hover:text-[#f97316] transition-colors shrink-0"
                      >
                        {copiedId === (txn.reference_number || txn.id)
                          ? <Check className="w-3 h-3 text-green-400" />
                          : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </td>

                  {/* Sender ID */}
                  <td className="px-4 py-3.5">
                    <span className="text-[11px] font-mono text-[#888888] truncate max-w-[96px] block">
                      {txn.sender_id ? txn.sender_id.slice(0, 8) + "…" : "—"}
                    </span>
                  </td>

                  {/* Type */}
                  <td className="px-4 py-3.5"><TypeBadge type={txn.type} /></td>

                  {/* Amount */}
                  <td className="px-4 py-3.5">
                    <span className={cn(
                      "text-[13px] font-syne font-bold tabular-nums",
                      isCredit(txn.type) ? "text-green-400" : "text-red-400"
                    )}>
                      {fmtAmount(txn.amount, txn.type)}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5"><StatusBadge status={txn.status} /></td>

                  {/* Purpose */}
                  <td className="px-4 py-3.5">
                    <span className="text-[12px] font-dm-sans text-[#888888] truncate max-w-[100px] block">
                      {txn.purpose || <span className="text-[#4a4a4a]">—</span>}
                    </span>
                  </td>

                  {/* Flagged */}
                  <td className="px-4 py-3.5">
                    {txn.is_flagged
                      ? <span className="text-[11px] font-dm-sans text-red-400 bg-red-500/10 border border-red-500/20 rounded-full px-2 py-0.5">Flagged</span>
                      : <span className="text-[#4a4a4a] text-[11px]">—</span>}
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3.5">
                    <span className="text-[11px] font-dm-sans text-[#888888] whitespace-nowrap">
                      {safeDate(txn.created_at)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="pr-5 py-3.5">
                    <div className="flex items-center justify-center gap-0.5">
                      <button
                        onClick={() => onView(txn)}
                        title="View details"
                        className="flex items-center justify-center w-7 h-7 rounded-md text-[#888888] hover:bg-[rgba(249,115,22,0.08)] hover:text-[#f97316] transition-colors duration-150"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onFlag(txn)}
                        title="Flag transaction"
                        className="flex items-center justify-center w-7 h-7 rounded-md text-[#888888] hover:bg-yellow-500/10 hover:text-yellow-400 transition-colors duration-150"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                      {txn.status === "completed" && (
                        <button
                          onClick={() => onReverse(txn)}
                          title="Reverse transaction"
                          className="flex items-center justify-center w-7 h-7 rounded-md text-[#888888] hover:bg-[rgba(249,115,22,0.08)] hover:text-[#f97316] transition-colors duration-150"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
