"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Landmark, TrendingUp, Percent, CalendarClock, ArrowLeftRight,
  Search, Download, Check, AlertTriangle, X, ChevronLeft, ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import {
  getHighYieldDeposits,
  type HighYieldDeposit, type HighYieldStatus, type HighYieldResponse,
} from "@/lib/api/services/high-yield";
import { useTopNavExtras } from "@/context/TopNavExtrasContext";

// ── Config ────────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 25;

const STATUS_CFG: Record<HighYieldStatus, { cls: string; label: string }> = {
  active:    { cls: "bg-[rgba(249,115,22,0.1)] text-[#f97316] border-[rgba(249,115,22,0.2)]", label: "Active"    },
  matured:   { cls: "bg-green-500/10 text-green-400 border-green-500/20",                      label: "Matured"   },
  withdrawn: { cls: "bg-[#252525] text-[#888888] border-[#2d2d2d]",                            label: "Withdrawn" },
};

const FILTER_TABS = [
  { label: "All",       value: ""          },
  { label: "Active",    value: "active"    },
  { label: "Matured",   value: "matured"   },
  { label: "Withdrawn", value: "withdrawn" },
];

const COLS = ["User", "Amount (Rs.)", "Interest Rate %", "Period (days)", "Maturity Date", "Status", "Interest Earned (Rs.)"];

function safeDate(d: string) { try { return format(new Date(d), "MMM d, yyyy"); } catch { return "—"; } }
function fmtRs(n: number)    { return `Rs. ${n.toLocaleString()}`; }
function ini(name: string)   { return (name || "?").split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase(); }

function isExpiringSoon(dateStr: string): boolean {
  try {
    const d    = new Date(dateStr);
    const now  = new Date();
    const diff = differenceInDays(d, now);
    return diff >= 0 && diff <= 7;
  } catch { return false; }
}

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

interface ToastState { message: string; type: "success" | "error" }

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HighYieldPage() {
  const [page,          setPage]          = useState(1);
  const [statusFilter,  setStatusFilter]  = useState("");
  const [searchInput,   setSearchInput]   = useState("");
  const [debouncedSrch, setDebouncedSrch] = useState("");
  const [toast,         setToast]         = useState<ToastState | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSrch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { setExtras, clearExtras } = useTopNavExtras();
  const queryKey = ["high-yield", page, statusFilter, debouncedSrch];

  const { data, isLoading, refetch } = useQuery<HighYieldResponse>({
    queryKey,
    queryFn: () => getHighYieldDeposits({
      page, per_page: PAGE_LIMIT,
      status: statusFilter || undefined,
      search: debouncedSrch || undefined,
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

  const handleExport = () => {
    if (!data?.deposits.length) { showToast("No data to export.", "error"); return; }
    const esc = (v: string | number | null) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = data.deposits.map(d =>
      [d.user_name, d.user_phone, d.amount, `${d.interest_rate}%`, d.period_days, d.maturity_date, d.status, d.interest_earned].map(esc).join(","));
    const csv = [COLS.map(esc).join(","), ...rows].join("\n");
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })), download: `high_yield_${Date.now()}.csv` });
    a.click(); URL.revokeObjectURL(a.href);
  };

  const deposits   = data?.deposits ?? [];
  const total      = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));
  const maturing7  = data?.maturing_in_7_days ?? 0;
  const maturing7Rs = data?.maturing_in_7_days_amount;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[rgba(249,115,22,0.1)] border border-[rgba(249,115,22,0.2)]">
          <Landmark className="w-4 h-4 text-[#f97316]" />
        </div>
        <div>
          <h2 className="font-syne font-bold text-[#f0f0f0] text-xl leading-tight">High-Yield Deposits</h2>
          <p className="text-[11px] font-dm-sans text-[#888888] leading-none mt-0.5">
            {isLoading ? "Loading…" : `${total.toLocaleString()} deposit${total !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat icon={TrendingUp}    label="Total Deposits (Rs.)"    value={data?.total_deposits       != null ? fmtRs(data.total_deposits) : "—"} iconCls="text-green-400"  bgCls="bg-green-500/10" />
        <MiniStat icon={Percent}       label="Interest Owed (Rs.)"     value={data?.total_interest_owed  != null ? fmtRs(data.total_interest_owed) : "—"} iconCls="text-[#f97316]" bgCls="bg-[rgba(249,115,22,0.1)]" />
        <MiniStat icon={CalendarClock} label="Maturing in 7 Days"      value={data?.maturing_in_7_days   ?? "—"} iconCls="text-yellow-400" bgCls="bg-yellow-500/10" />
        <MiniStat icon={ArrowLeftRight} label="Early Withdrawals / Mo" value={data?.early_withdrawals_this_month ?? "—"} iconCls="text-[#f97316]"  bgCls="bg-[rgba(249,115,22,0.1)]" />
      </div>

      {/* Maturity alert banner */}
      {maturing7 > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[rgba(249,115,22,0.08)] border border-[rgba(249,115,22,0.25)]">
          <AlertTriangle className="w-4 h-4 text-[#f97316] shrink-0" />
          <p className="text-[13px] font-dm-sans text-[#f97316]">
            <span className="font-semibold">{maturing7}</span> {maturing7 === 1 ? "deposit is" : "deposits are"} maturing within 7 days
            {maturing7Rs != null && <span> — <span className="font-semibold">{fmtRs(maturing7Rs)}</span> total</span>}
            {" "}— contact depositors to arrange renewal or withdrawal.
          </p>
        </div>
      )}

      {/* Filter bar */}
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
          <input type="text" placeholder="Search name or phone…" value={searchInput} onChange={e => setSearchInput(e.target.value)}
            className="pl-8.5 pr-3.5 py-2 rounded-xl bg-[#1a1a1a] border border-[#252525] text-[12px] font-dm-sans text-[#f0f0f0] placeholder:text-[#4a4a4a] focus:outline-none focus:border-[rgba(249,115,22,0.4)] transition-colors w-[210px]" />
        </div>
        <button onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-dm-sans font-medium bg-[#1a1a1a] text-[#888888] border border-[#252525] hover:text-[#f0f0f0] hover:border-[#2d2d2d] transition-colors">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#252525] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-[#111111] border-b border-[#252525]">
                {COLS.map((col, i) => (
                  <th key={col} className={cn("py-3 text-[10px] font-dm-sans font-semibold uppercase tracking-[0.09em] text-[#4a4a4a]",
                    i === 0 ? "pl-5 pr-4 text-left" : "px-4 text-left")}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#252525]">
              {isLoading ? (
                Array.from({ length: 8 }, (_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="pl-5 pr-4 py-3.5"><div className="flex items-center gap-2.5"><div className="w-7 h-7 rounded-full bg-[#252525] shrink-0" /><div className="space-y-1.5"><div className="h-3 w-24 rounded bg-[#252525]" /><div className="h-2.5 w-16 rounded bg-[#252525]" /></div></div></td>
                    {Array.from({ length: 6 }, (_, j) => <td key={j} className="px-4 py-3.5"><div className="h-3.5 rounded bg-[#252525]" style={{ width: "80px" }} /></td>)}
                  </tr>
                ))
              ) : deposits.length === 0 ? (
                <tr><td colSpan={COLS.length} className="py-20 text-center bg-[#1a1a1a]">
                  <div className="flex flex-col items-center gap-2"><Landmark className="w-8 h-8 text-[#2d2d2d]" /><p className="text-[13px] font-dm-sans text-[#888888]">No deposits found</p></div>
                </td></tr>
              ) : (
                deposits.map((dep: HighYieldDeposit, idx) => {
                  const expiring = isExpiringSoon(dep.maturity_date);
                  return (
                    <tr key={dep.id} className={cn("group transition-colors hover:bg-[rgba(249,115,22,0.04)]", idx % 2 === 1 ? "bg-[rgba(255,255,255,0.012)]" : "bg-[#1a1a1a]")}>
                      <td className="pl-5 pr-4 py-3.5 border-l-2 border-l-transparent group-hover:border-l-[#f97316] transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[rgba(249,115,22,0.1)] flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-syne font-bold text-[#f97316] select-none">{ini(dep.user_name)}</span>
                          </div>
                          <div>
                            <p className="text-[12px] font-dm-sans font-medium text-[#f0f0f0] truncate max-w-[120px]">{dep.user_name || "—"}</p>
                            <p className="text-[11px] font-dm-sans text-[#888888]">{dep.user_phone || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5"><span className="text-[12px] font-dm-sans font-medium tabular-nums text-[#f0f0f0]">{fmtRs(dep.amount)}</span></td>
                      <td className="px-4 py-3.5"><span className="text-[12px] font-dm-sans font-semibold tabular-nums text-green-400">{dep.interest_rate}%</span></td>
                      <td className="px-4 py-3.5"><span className="text-[12px] font-dm-sans text-[#888888] tabular-nums">{dep.period_days} days</span></td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {expiring && <span className="w-1.5 h-1.5 rounded-full bg-[#f97316] shrink-0 animate-pulse" />}
                          <span className={cn("text-[11px] font-dm-sans tabular-nums", expiring ? "text-[#f97316] font-semibold" : "text-[#888888]")}>
                            {safeDate(dep.maturity_date)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-dm-sans font-medium border",
                          STATUS_CFG[dep.status]?.cls ?? STATUS_CFG.active.cls)}>
                          {STATUS_CFG[dep.status]?.label ?? dep.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5"><span className="text-[12px] font-dm-sans font-medium tabular-nums text-green-400">{fmtRs(dep.interest_earned)}</span></td>
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

      {toast && (
        <div className={cn("fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3.5 rounded-xl border shadow-2xl font-dm-sans text-[13px] max-w-sm",
          toast.type === "success" ? "bg-[#0b1a0b] border-green-500/30 text-green-400" : "bg-[#1a0b0b] border-red-500/30 text-red-400")}>
          {toast.type === "success" ? <Check className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => setToast(null)} className="opacity-50 hover:opacity-100 transition-opacity ml-1"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
    </div>
  );
}
