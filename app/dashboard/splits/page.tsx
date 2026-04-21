"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog } from "radix-ui";
import {
  SplitSquareHorizontal, Layers, Wallet, Clock, Flag,
  Search, Download, Check, AlertTriangle, X, Loader2,
  ChevronLeft, ChevronRight, Filter,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  getSplits, flagSplit,
  type Split, type SplitStatus, type SplitType, type SplitsResponse,
} from "@/lib/api/services/splits";
import { useTopNavExtras } from "@/context/TopNavExtrasContext";

// ── Config ────────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 25;

const TYPE_CFG: Record<SplitType, { cls: string; label: string }> = {
  equal:      { cls: "bg-sky-500/10 text-sky-400 border-sky-500/20",                          label: "Equal"      },
  custom:     { cls: "bg-purple-500/10 text-purple-400 border-purple-500/20",                  label: "Custom"     },
  percentage: { cls: "bg-[rgba(249,115,22,0.1)] text-[#f97316] border-[rgba(249,115,22,0.2)]", label: "Percentage" },
};

const STATUS_CFG: Record<SplitStatus, { cls: string; label: string }> = {
  completed: { cls: "bg-green-500/10 text-green-400 border-green-500/20",                      label: "Completed" },
  pending:   { cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",                   label: "Pending"   },
  partial:   { cls: "bg-[rgba(249,115,22,0.1)] text-[#f97316] border-[rgba(249,115,22,0.2)]", label: "Partial"   },
};

const FILTER_TABS = [
  { label: "All",       value: ""          },
  { label: "Pending",   value: "pending"   },
  { label: "Partial",   value: "partial"   },
  { label: "Completed", value: "completed" },
];

const COLS = ["Creator", "Title", "Amount (Rs.)", "Type", "Participants", "Status", "Created", "Actions"];

const OVERLAY_CLS = "fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200";
const CONTENT_CLS = "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[440px] max-w-[calc(100vw-2rem)] bg-[#111111] border border-[#252525] rounded-2xl shadow-2xl p-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200";

function safeDate(d: string) { try { return format(new Date(d), "MMM d, yyyy"); } catch { return "—"; } }
function fmtRs(n: number)    { return `Rs. ${n.toLocaleString()}`; }
function ini(name: string)   { return (name || "?").split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase(); }

// ── MiniStat ──────────────────────────────────────────────────────────────────

function MiniStat({ icon: Icon, label, value, iconCls, bgCls }:
  { icon: LucideIcon; label: string; value: string | number; iconCls: string; bgCls: string }) {
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

// ── FlagDialog ────────────────────────────────────────────────────────────────

function FlagDialog({ open, onOpenChange, target, onConfirm, isPending, submitError }:
  { open: boolean; onOpenChange: (v: boolean) => void; target: Split | null; onConfirm: (r: string) => void; isPending: boolean; submitError: string | null }) {
  const [reason, setReason] = useState("");
  const [err,    setErr]    = useState("");
  useEffect(() => { if (open) { setReason(""); setErr(""); } }, [open]);
  const handleSubmit = () => {
    const t = reason.trim();
    if (t.length < 10) { setErr("Reason must be at least 10 characters."); return; }
    onConfirm(t);
  };
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={OVERLAY_CLS} />
        <Dialog.Content className={CONTENT_CLS} aria-describedby="flag-desc">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20">
              <Flag className="w-6 h-6 text-red-400" />
            </div>
            <Dialog.Close className="flex items-center justify-center w-8 h-8 rounded-lg text-[#4a4a4a] hover:text-[#888888] hover:bg-[#222222] transition-colors">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>
          <Dialog.Title className="font-syne font-bold text-[#f0f0f0] text-[16px] leading-tight mb-1">
            Flag Split for Fraud Review
          </Dialog.Title>
          <Dialog.Description id="flag-desc" className="text-[13px] font-dm-sans text-[#888888] leading-relaxed mb-3">
            {target ? (
              <>Flagging <span className="text-[#f0f0f0] font-medium">&ldquo;{target.title}&rdquo;</span> — a fraud flag will be created on <span className="text-[#f0f0f0] font-medium">{target.creator_name}</span>&apos;s account.</>
            ) : "A fraud flag will be created on the creator's account."}
          </Dialog.Description>
          <textarea value={reason} onChange={e => { setReason(e.target.value); setErr(""); }}
            placeholder="e.g. Suspicious high-value split activity with unrelated accounts…" rows={4}
            className={cn("w-full px-3.5 py-3 rounded-xl bg-[#1a1a1a] border text-[13px] font-dm-sans text-[#f0f0f0] placeholder:text-[#4a4a4a] resize-none focus:outline-none focus:border-[rgba(249,115,22,0.4)] transition-colors leading-relaxed",
              err ? "border-red-500/50" : "border-[#252525]")} />
          <div className="flex items-center justify-between mt-1.5 px-0.5">
            {err ? <p className="text-[11px] font-dm-sans text-red-400">{err}</p> : <p className="text-[11px] font-dm-sans text-[#4a4a4a]">Min. 10 characters</p>}
            <p className={cn("text-[11px] font-dm-sans", reason.length < 10 ? "text-[#4a4a4a]" : "text-[#888888]")}>{reason.length} chars</p>
          </div>
          {submitError && (
            <div className="flex items-center gap-2 mt-3 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-[12px] font-dm-sans text-red-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />{submitError}
            </div>
          )}
          <div className="flex gap-3 mt-5">
            <Dialog.Close className="flex-1 px-4 py-2.5 rounded-xl text-[13px] font-dm-sans font-medium text-[#888888] border border-[#252525] bg-[#1a1a1a] hover:bg-[#222222] hover:text-[#f0f0f0] transition-colors">
              Cancel
            </Dialog.Close>
            <button onClick={handleSubmit} disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-dm-sans font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Flag className="w-4 h-4" /> Submit Flag</>}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface ToastState { message: string; type: "success" | "error" }

export default function SplitsPage() {
  const [page,         setPage]         = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput,  setSearchInput]  = useState("");
  const [debouncedSrch,setDebouncedSrch]= useState("");
  const [fromDate,     setFromDate]     = useState("");
  const [toDate,       setToDate]       = useState("");
  const [minAmtInput,  setMinAmtInput]  = useState("");
  const [maxAmtInput,  setMaxAmtInput]  = useState("");
  const [minAmount,    setMinAmount]    = useState<number | undefined>();
  const [maxAmount,    setMaxAmount]    = useState<number | undefined>();
  const [flagOpen,     setFlagOpen]     = useState(false);
  const [flagTarget,   setFlagTarget]   = useState<Split | null>(null);
  const [flagErrMsg,   setFlagErrMsg]   = useState<string | null>(null);
  const [flaggedIds,   setFlaggedIds]   = useState<Set<string>>(new Set());
  const [toast,        setToast]        = useState<ToastState | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSrch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const t = setTimeout(() => {
      setMinAmount(minAmtInput ? Number(minAmtInput) : undefined);
      setMaxAmount(maxAmtInput ? Number(maxAmtInput) : undefined);
      setPage(1);
    }, 600);
    return () => clearTimeout(t);
  }, [minAmtInput, maxAmtInput]);

  const { setExtras, clearExtras } = useTopNavExtras();
  const queryKey = ["splits", page, statusFilter, debouncedSrch, fromDate, toDate, minAmount, maxAmount];

  const { data, isLoading, refetch } = useQuery<SplitsResponse>({
    queryKey,
    queryFn: () => getSplits({
      page, per_page: PAGE_LIMIT,
      status:     statusFilter || undefined,
      search:     debouncedSrch || undefined,
      from_date:  fromDate || undefined,
      to_date:    toDate || undefined,
      min_amount: minAmount,
      max_amount: maxAmount,
    }),
    placeholderData: (prev) => prev,
    refetchInterval: 15_000,
  });

  const handleRefetch = useCallback(() => { refetch(); }, [refetch]);
  useEffect(() => { setExtras({ onRefresh: handleRefetch }); return () => clearExtras(); }, [handleRefetch, setExtras, clearExtras]);

  const showToast = useCallback((message: string, type: ToastState["type"]) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  }, []);

  const flagMutation = useMutation({
    mutationFn: ({ split_id, reason }: { split_id: string; reason: string }) => flagSplit(split_id, reason),
    onSuccess: () => {
      if (flagTarget) {
        setFlaggedIds(prev => new Set(prev).add(flagTarget.id));
        showToast(`Split flagged — fraud flag created for ${flagTarget.creator_name}.`, "success");
      }
      setFlagOpen(false);
      setFlagErrMsg(null);
      refetch();
    },
    onError: () => setFlagErrMsg("Failed to flag split. Please try again."),
  });

  const handleExport = () => {
    if (!data?.splits.length) { showToast("No data to export.", "error"); return; }
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = data.splits.map(s =>
      [s.creator_name, s.creator_phone, s.title, s.total_amount, s.split_type, s.participants_count, s.status, s.created_at].map(esc).join(","));
    const csv = [COLS.slice(0, -1).map(esc).join(","), ...rows].join("\n");
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })), download: `splits_${Date.now()}.csv` });
    a.click(); URL.revokeObjectURL(a.href);
  };

  const clearDateAmount = () => {
    setFromDate(""); setToDate(""); setMinAmtInput(""); setMaxAmtInput("");
    setMinAmount(undefined); setMaxAmount(undefined); setPage(1);
  };
  const hasExtraFilters = fromDate || toDate || minAmtInput || maxAmtInput;
  const splits     = data?.splits ?? [];
  const total      = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  const inputCls = "px-3 py-2 rounded-xl bg-[#1a1a1a] border border-[#252525] text-[12px] font-dm-sans text-[#f0f0f0] placeholder:text-[#4a4a4a] focus:outline-none focus:border-[rgba(249,115,22,0.4)] transition-colors";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[rgba(249,115,22,0.1)] border border-[rgba(249,115,22,0.2)]">
          <SplitSquareHorizontal className="w-4 h-4 text-[#f97316]" />
        </div>
        <div>
          <h2 className="font-syne font-bold text-[#f0f0f0] text-xl leading-tight">Splits Monitor</h2>
          <p className="text-[11px] font-dm-sans text-[#888888] leading-none mt-0.5">
            {isLoading ? "Loading…" : `${total.toLocaleString()} split${total !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat icon={Layers}   label="Total Splits"         value={data?.total_splits        ?? "—"} iconCls="text-[#f97316]"  bgCls="bg-[rgba(249,115,22,0.1)]" />
        <MiniStat icon={Wallet}   label="Total Settled (Rs.)"  value={data?.total_settled        != null ? fmtRs(data.total_settled) : "—"} iconCls="text-green-400"  bgCls="bg-green-500/10" />
        <MiniStat icon={Clock}    label="Pending Settlements"  value={data?.pending_settlements  ?? "—"} iconCls="text-yellow-400" bgCls="bg-yellow-500/10" />
        <MiniStat icon={Flag}     label="Flagged This Month"   value={data?.flagged_this_month   ?? "—"} iconCls="text-red-400"    bgCls="bg-red-500/10" />
      </div>

      {/* Filter bar — row 1: tabs + search + export */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#1a1a1a] border border-[#252525]">
          {FILTER_TABS.map(tab => (
            <button key={tab.value} onClick={() => { setStatusFilter(tab.value); setPage(1); }}
              className={cn("px-3 py-1.5 rounded-md text-[11px] font-dm-sans font-medium transition-all duration-150 border",
                statusFilter === tab.value
                  ? "bg-[rgba(249,115,22,0.12)] text-[#f97316] border-[rgba(249,115,22,0.2)]"
                  : "text-[#888888] hover:text-[#f0f0f0] border-transparent")}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4a4a4a] pointer-events-none" />
          <input type="text" placeholder="Search creator name or phone…" value={searchInput} onChange={e => setSearchInput(e.target.value)}
            className={cn(inputCls, "pl-8.5 w-[220px]")} />
        </div>
        <button onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-dm-sans font-medium bg-[#1a1a1a] text-[#888888] border border-[#252525] hover:text-[#f0f0f0] hover:border-[#2d2d2d] transition-colors">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* Filter bar — row 2: date + amount range */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-[#4a4a4a] shrink-0" />
          <span className="text-[11px] font-dm-sans text-[#4a4a4a]">Date:</span>
          <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} className={cn(inputCls, "[color-scheme:dark]")} />
          <span className="text-[11px] font-dm-sans text-[#4a4a4a]">—</span>
          <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} className={cn(inputCls, "[color-scheme:dark]")} />
        </div>
        <div className="flex items-center gap-1.5 ml-2">
          <span className="text-[11px] font-dm-sans text-[#4a4a4a]">Amount:</span>
          <input type="number" placeholder="Min Rs." value={minAmtInput} onChange={e => setMinAmtInput(e.target.value)} className={cn(inputCls, "w-[100px]")} />
          <span className="text-[11px] font-dm-sans text-[#4a4a4a]">—</span>
          <input type="number" placeholder="Max Rs." value={maxAmtInput} onChange={e => setMaxAmtInput(e.target.value)} className={cn(inputCls, "w-[100px]")} />
        </div>
        {hasExtraFilters && (
          <button onClick={clearDateAmount}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-dm-sans font-medium text-red-400 border border-red-500/20 bg-red-500/10 hover:bg-red-500/15 transition-colors">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#252525] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-[#111111] border-b border-[#252525]">
                {COLS.map((col, i) => (
                  <th key={col} className={cn("py-3 text-[10px] font-dm-sans font-semibold uppercase tracking-[0.09em] text-[#4a4a4a]",
                    i === 0 ? "pl-5 pr-4 text-left" : i === COLS.length - 1 ? "px-4 text-center" : "px-4 text-left")}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#252525]">
              {isLoading ? (
                Array.from({ length: 8 }, (_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="pl-5 pr-4 py-3.5"><div className="flex items-center gap-2.5"><div className="w-7 h-7 rounded-full bg-[#252525] shrink-0" /><div className="space-y-1.5"><div className="h-3 w-24 rounded bg-[#252525]" /><div className="h-2.5 w-16 rounded bg-[#252525]" /></div></div></td>
                    {Array.from({ length: 6 }, (_, j) => <td key={j} className="px-4 py-3.5"><div className="h-3.5 rounded bg-[#252525]" style={{ width: "80px" }} /></td>)}
                    <td className="px-4 py-3.5 text-center"><div className="h-7 w-7 rounded-lg bg-[#252525] mx-auto" /></td>
                  </tr>
                ))
              ) : splits.length === 0 ? (
                <tr><td colSpan={COLS.length} className="py-20 text-center bg-[#1a1a1a]">
                  <div className="flex flex-col items-center gap-2"><SplitSquareHorizontal className="w-8 h-8 text-[#2d2d2d]" /><p className="text-[13px] font-dm-sans text-[#888888]">No splits found</p></div>
                </td></tr>
              ) : (
                splits.map((s: Split, idx) => {
                  const isFlagged = s.is_flagged || flaggedIds.has(s.id);
                  return (
                    <tr key={s.id} className={cn("group transition-colors hover:bg-[rgba(249,115,22,0.04)]", idx % 2 === 1 ? "bg-[rgba(255,255,255,0.012)]" : "bg-[#1a1a1a]", isFlagged && "opacity-70")}>
                      <td className="pl-5 pr-4 py-3.5 border-l-2 border-l-transparent group-hover:border-l-[#f97316] transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[rgba(249,115,22,0.1)] flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-syne font-bold text-[#f97316] select-none">{ini(s.creator_name)}</span>
                          </div>
                          <div>
                            <p className="text-[12px] font-dm-sans font-medium text-[#f0f0f0] truncate max-w-[110px]">{s.creator_name || "—"}</p>
                            <p className="text-[11px] font-dm-sans text-[#888888]">{s.creator_phone || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5"><p className="text-[12px] font-dm-sans font-medium text-[#f0f0f0] truncate max-w-[140px]">{s.title}</p></td>
                      <td className="px-4 py-3.5"><span className="text-[12px] font-dm-sans font-medium tabular-nums text-[#f97316]">{fmtRs(s.total_amount)}</span></td>
                      <td className="px-4 py-3.5">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-dm-sans font-medium border",
                          TYPE_CFG[s.split_type]?.cls ?? TYPE_CFG.equal.cls)}>
                          {TYPE_CFG[s.split_type]?.label ?? s.split_type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5"><span className="text-[12px] font-dm-sans text-[#888888] tabular-nums">{s.participants_count}</span></td>
                      <td className="px-4 py-3.5">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-dm-sans font-medium border",
                          STATUS_CFG[s.status]?.cls ?? STATUS_CFG.pending.cls)}>
                          {STATUS_CFG[s.status]?.label ?? s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5"><span className="text-[11px] font-dm-sans text-[#888888] tabular-nums">{safeDate(s.created_at)}</span></td>
                      <td className="px-4 py-3.5 text-center">
                        {isFlagged ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-dm-sans font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                            <Flag className="w-3 h-3" /> Flagged
                          </span>
                        ) : (
                          <button onClick={() => { setFlagTarget(s); setFlagOpen(true); }}
                            title="Flag this split"
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-[#252525] bg-[#1a1a1a] text-[#4a4a4a] hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/10 transition-all duration-150">
                            <Flag className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {total > PAGE_LIMIT && (
        <div className="flex items-center justify-between pt-1 px-0.5">
          <span className="text-[12px] font-dm-sans text-[#888888]">
            Showing <span className="text-[#f0f0f0]">{(page - 1) * PAGE_LIMIT + 1}–{Math.min(page * PAGE_LIMIT, total)}</span> of <span className="text-[#f0f0f0]">{total.toLocaleString()}</span>
          </span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#252525] text-[#888888] bg-[#1a1a1a] hover:text-[#f0f0f0] disabled:opacity-40 disabled:cursor-not-allowed transition-all"><ChevronLeft className="w-4 h-4" /></button>
            <span className="px-3 py-1.5 rounded-lg text-[12px] font-dm-sans text-[#f0f0f0] bg-[rgba(249,115,22,0.08)] border border-[rgba(249,115,22,0.15)]">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#252525] text-[#888888] bg-[#1a1a1a] hover:text-[#f0f0f0] disabled:opacity-40 disabled:cursor-not-allowed transition-all"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={cn("fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3.5 rounded-xl border shadow-2xl font-dm-sans text-[13px] max-w-sm",
          toast.type === "success" ? "bg-[#0b1a0b] border-green-500/30 text-green-400" : "bg-[#1a0b0b] border-red-500/30 text-red-400")}>
          {toast.type === "success" ? <Check className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => setToast(null)} className="opacity-50 hover:opacity-100 transition-opacity ml-1"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <FlagDialog
        open={flagOpen}
        onOpenChange={setFlagOpen}
        target={flagTarget}
        onConfirm={(reason) => flagTarget && flagMutation.mutate({ split_id: flagTarget.split_id, reason })}
        isPending={flagMutation.isPending}
        submitError={flagErrMsg}
      />
    </div>
  );
}
