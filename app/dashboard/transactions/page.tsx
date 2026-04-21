"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search, X, ArrowLeftRight, ChevronLeft, ChevronRight,
  ChevronDown, Check, AlertTriangle, TrendingUp, Clock, XCircle, RotateCcw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { format } from "date-fns";
import { Dialog } from "radix-ui";
import { cn } from "@/lib/utils";
import {
  getTransactions,
  type Transaction,
  type TransactionListResponse,
} from "@/lib/api/services/transactions";
import TransactionTable from "@/components/transactions/TransactionTable";
import ReversalDialog   from "@/components/transactions/ReversalDialog";
import FlagDialog       from "@/components/transactions/FlagDialog";
import { useTopNavExtras } from "@/context/TopNavExtrasContext";

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 25;

const STATUS_TABS = [
  { label: "All",       value: ""          },
  { label: "Completed", value: "completed" },
  { label: "Pending",   value: "pending"   },
  { label: "Failed",    value: "failed"    },
  { label: "Reversed",  value: "reversed"  },
];

// ── Toast ─────────────────────────────────────────────────────────────────────

interface ToastState { message: string; type: "success" | "error" }

// ── Mini stat card ────────────────────────────────────────────────────────────

function MiniStat({
  icon: Icon, label, value, iconCls, bgCls,
}: { icon: LucideIcon; label: string; value: string | number; iconCls: string; bgCls: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-[#1a1a1a] border border-[#252525]">
      <div className={cn("flex items-center justify-center w-9 h-9 rounded-lg shrink-0", bgCls)}>
        <Icon className={cn("w-4 h-4", iconCls)} />
      </div>
      <div>
        <p className="text-[10px] font-dm-sans uppercase tracking-[0.08em] text-[#4a4a4a] leading-none mb-1">{label}</p>
        <p className="font-syne font-bold text-[#f0f0f0] text-[18px] leading-none">{value}</p>
      </div>
    </div>
  );
}

// ── Detail dialog ─────────────────────────────────────────────────────────────

const OVERLAY_CLS =
  "fixed inset-0 z-50 bg-black/70 backdrop-blur-sm " +
  "data-[state=open]:animate-in data-[state=closed]:animate-out " +
  "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200";

const CONTENT_CLS =
  "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 " +
  "w-[460px] max-w-[calc(100vw-2rem)] bg-[#111111] border border-[#252525] " +
  "rounded-2xl shadow-2xl p-6 " +
  "data-[state=open]:animate-in data-[state=closed]:animate-out " +
  "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 " +
  "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200";

function fmtRs(n: number) { return `Rs. ${n.toLocaleString()}`; }
function safeDate(d: string) {
  try { return format(new Date(d), "MMM d, yyyy · h:mm a"); } catch { return "—"; }
}

function DetailDialog({ txn, open, onOpenChange }: { txn: Transaction | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  if (!txn) return null;
  const rows: [string, string][] = [
    ["TX ID",      txn.reference_number || txn.id],
    ["Type",       txn.type.charAt(0).toUpperCase() + txn.type.slice(1)],
    ["Amount",     fmtRs(txn.amount)],
    ["Fee",        txn.fee != null && txn.fee > 0 ? fmtRs(txn.fee) : "—"],
    ["Status",     txn.status.charAt(0).toUpperCase() + txn.status.slice(1)],
    ["Purpose",    txn.purpose || "—"],
    ["Sender ID",  txn.sender_id    || "—"],
    ["Recipient",  txn.recipient_id || "—"],
    ["Flagged",    txn.is_flagged ? "Yes" : "No"],
    ["Date",       safeDate(txn.created_at)],
  ];
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={OVERLAY_CLS} />
        <Dialog.Content className={CONTENT_CLS} aria-describedby="detail-desc">
          <div className="flex items-start justify-between mb-5">
            <div>
              <Dialog.Title className="font-syne font-bold text-[#f0f0f0] text-[16px] leading-tight">
                Transaction Details
              </Dialog.Title>
              <Dialog.Description id="detail-desc" className="text-[12px] font-dm-sans text-[#888888] mt-0.5">
                Full record overview
              </Dialog.Description>
            </div>
            <Dialog.Close className="flex items-center justify-center w-8 h-8 rounded-lg text-[#4a4a4a] hover:text-[#888888] hover:bg-[#222222] transition-colors">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>
          <div className="space-y-2">
            {rows.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-[#1a1a1a] border border-[#252525]">
                <span className="text-[10px] font-dm-sans text-[#4a4a4a] uppercase tracking-[0.07em]">{label}</span>
                <span className={cn(
                  "text-[12px] font-dm-sans leading-tight max-w-[240px] text-right truncate",
                  label === "TX ID" ? "font-mono text-[#888888]" : "text-[#f0f0f0]"
                )}>{value}</span>
              </div>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TransactionsPage() {
  const [search,    setSearch]    = useState("");
  const [status,    setStatus]    = useState("");
  const [txnType,   setTxnType]   = useState("");
  const [fromDate,  setFromDate]  = useState("");
  const [toDate,    setToDate]    = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [page,      setPage]      = useState(1);

  const [viewTxn,    setViewTxn]    = useState<Transaction | null>(null);
  const [flagTxn,    setFlagTxn]    = useState<Transaction | null>(null);
  const [reverseTxn, setReverseTxn] = useState<Transaction | null>(null);
  const [toast,      setToast]      = useState<ToastState | null>(null);

  const { setExtras, clearExtras } = useTopNavExtras();

  const { data, isLoading, refetch } = useQuery<TransactionListResponse>({
    queryKey: ["transactions", page, status],
    queryFn: () => getTransactions({
      page,
      per_page: PAGE_LIMIT,
      status:   status || undefined,
    }),
    placeholderData: (prev) => prev,
    refetchInterval: 15_000,
  });

  const handleRefetch = useCallback(() => { refetch(); }, [refetch]);

  useEffect(() => {
    setExtras({ onRefresh: handleRefetch });
    return () => clearExtras();
  }, [handleRefetch, setExtras, clearExtras]);

  const showToast = useCallback((message: string, type: ToastState["type"]) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  }, []);

  const resetPage = () => setPage(1);

  const total      = data?.total      ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));
  const rangeStart = (page - 1) * PAGE_LIMIT + 1;
  const rangeEnd   = Math.min(page * PAGE_LIMIT, total);

  const clearFilters = () => {
    setSearch(""); setStatus(""); setTxnType(""); setFromDate(""); setToDate("");
    setMinAmount(""); setMaxAmount(""); setPage(1);
  };

  const hasFilters = search || status || txnType || fromDate || toDate || minAmount || maxAmount;

  return (
    <div className="space-y-5">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[rgba(249,115,22,0.1)] border border-[rgba(249,115,22,0.2)]">
          <ArrowLeftRight className="w-4 h-4 text-[#f97316]" />
        </div>
        <div>
          <h2 className="font-syne font-bold text-[#f0f0f0] text-xl leading-tight">Transactions</h2>
          <p className="text-[11px] font-dm-sans text-[#888888] leading-none mt-0.5">
            {isLoading ? "Loading…" : `${total.toLocaleString()} record${total !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat icon={TrendingUp}  label="Total Records"   value={data?.total ?? "—"} iconCls="text-[#f97316]" bgCls="bg-[rgba(249,115,22,0.1)]" />
        <MiniStat icon={ArrowLeftRight} label="Current Page"  value={data?.page  ?? "—"} iconCls="text-green-400"  bgCls="bg-green-500/10"  />
        <MiniStat icon={Clock}        label="Page Size"        value={PAGE_LIMIT}          iconCls="text-yellow-400" bgCls="bg-yellow-500/10" />
        <MiniStat icon={XCircle}      label="Flagged"          value={data?.transactions?.filter(t => t.is_flagged).length ?? "—"} iconCls="text-red-400" bgCls="bg-red-500/10" />
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Row 1: Search + Status tabs + Type */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4a4a] pointer-events-none" />
            <input
              type="text"
              placeholder="Search by TX ID or phone…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPage(); }}
              className="w-full pl-9 pr-8 py-2.5 rounded-lg bg-[#1a1a1a] border border-[#252525] text-[13px] font-dm-sans text-[#f0f0f0] placeholder:text-[#4a4a4a] focus:outline-none focus:border-[rgba(249,115,22,0.4)] transition-colors duration-150"
            />
            {search && (
              <button onClick={() => { setSearch(""); resetPage(); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#4a4a4a] hover:text-[#888888] transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status tabs */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#1a1a1a] border border-[#252525] flex-wrap">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => { setStatus(tab.value); resetPage(); }}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[11px] font-dm-sans font-medium transition-all duration-150",
                  status === tab.value
                    ? "bg-[rgba(249,115,22,0.12)] text-[#f97316] border border-[rgba(249,115,22,0.2)]"
                    : "text-[#888888] hover:text-[#f0f0f0] border border-transparent"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Type dropdown */}
          <div className="relative">
            <select
              value={txnType}
              onChange={(e) => { setTxnType(e.target.value); resetPage(); }}
              className="appearance-none pl-3.5 pr-8 py-2.5 rounded-lg bg-[#1a1a1a] border border-[#252525] text-[13px] font-dm-sans text-[#f0f0f0] focus:outline-none focus:border-[rgba(249,115,22,0.4)] transition-colors cursor-pointer"
            >
              <option value="">All Types</option>
              <option value="send">Send</option>
              <option value="receive">Receive</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#888888] pointer-events-none" />
          </div>
        </div>

        {/* Row 2: Date range + Amount range + Clear */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-dm-sans text-[#4a4a4a] whitespace-nowrap">From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); resetPage(); }}
              className="px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#252525] text-[12px] font-dm-sans text-[#f0f0f0] focus:outline-none focus:border-[rgba(249,115,22,0.4)] transition-colors [color-scheme:dark]"
            />
            <span className="text-[11px] font-dm-sans text-[#4a4a4a]">To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); resetPage(); }}
              className="px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#252525] text-[12px] font-dm-sans text-[#f0f0f0] focus:outline-none focus:border-[rgba(249,115,22,0.4)] transition-colors [color-scheme:dark]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-dm-sans text-[#4a4a4a] whitespace-nowrap">Rs.</span>
            <input
              type="number"
              placeholder="Min"
              value={minAmount}
              onChange={(e) => { setMinAmount(e.target.value); resetPage(); }}
              className="w-24 px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#252525] text-[12px] font-dm-sans text-[#f0f0f0] placeholder:text-[#4a4a4a] focus:outline-none focus:border-[rgba(249,115,22,0.4)] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-[11px] font-dm-sans text-[#4a4a4a]">–</span>
            <input
              type="number"
              placeholder="Max"
              value={maxAmount}
              onChange={(e) => { setMaxAmount(e.target.value); resetPage(); }}
              className="w-24 px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#252525] text-[12px] font-dm-sans text-[#f0f0f0] placeholder:text-[#4a4a4a] focus:outline-none focus:border-[rgba(249,115,22,0.4)] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-dm-sans text-[#888888] border border-[#252525] bg-[#1a1a1a] hover:text-[#f0f0f0] hover:border-[#2d2d2d] transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear filters
            </button>
          )}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <TransactionTable
        data={data}
        isLoading={isLoading}
        onView={(txn) => setViewTxn(txn)}
        onFlag={(txn) => setFlagTxn(txn)}
        onReverse={(txn) => setReverseTxn(txn)}
      />

      {/* ── Pagination ──────────────────────────────────────────────────── */}
      {total > PAGE_LIMIT && (
        <div className="flex items-center justify-between pt-1 px-0.5">
          <span className="text-[12px] font-dm-sans text-[#888888]">
            Showing <span className="text-[#f0f0f0]">{rangeStart}–{rangeEnd}</span> of{" "}
            <span className="text-[#f0f0f0]">{total.toLocaleString()}</span> transactions
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#252525] text-[#888888] bg-[#1a1a1a] hover:text-[#f0f0f0] hover:border-[#2d2d2d] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1.5 rounded-lg text-[12px] font-dm-sans text-[#f0f0f0] bg-[rgba(249,115,22,0.08)] border border-[rgba(249,115,22,0.15)]">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#252525] text-[#888888] bg-[#1a1a1a] hover:text-[#f0f0f0] hover:border-[#2d2d2d] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Dialogs ─────────────────────────────────────────────────────── */}
      <DetailDialog
        txn={viewTxn}
        open={!!viewTxn}
        onOpenChange={(v) => { if (!v) setViewTxn(null); }}
      />
      <FlagDialog
        txn={flagTxn}
        open={!!flagTxn}
        onOpenChange={(v) => { if (!v) setFlagTxn(null); }}
        onSuccess={() => { showToast("Transaction flagged for review.", "success"); refetch(); }}
      />
      <ReversalDialog
        txn={reverseTxn}
        open={!!reverseTxn}
        onOpenChange={(v) => { if (!v) setReverseTxn(null); }}
        onSuccess={() => { showToast("Transaction reversed successfully.", "success"); refetch(); }}
      />

      {/* ── Toast ───────────────────────────────────────────────────────── */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3.5 rounded-xl border shadow-2xl",
          "font-dm-sans text-[13px] max-w-sm transition-all duration-300",
          toast.type === "success"
            ? "bg-[#0b1a0b] border-green-500/30 text-green-400"
            : "bg-[#1a0b0b] border-red-500/30 text-red-400"
        )}>
          {toast.type === "success"
            ? <Check className="w-4 h-4 shrink-0" />
            : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => setToast(null)} className="opacity-50 hover:opacity-100 transition-opacity ml-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
