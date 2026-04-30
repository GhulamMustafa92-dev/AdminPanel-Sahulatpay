"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Lock, Shield, Search, Download, Loader2, AlertTriangle, Check, X,
  ChevronLeft, ChevronRight, Filter,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  getAuditLog, type AuditLogEntry, type AuditLogResponse,
} from "@/lib/api/services/audit-log";
import { useTopNavExtras } from "@/context/TopNavExtrasContext";

// ── Config ────────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 50;

const ACTION_BADGE: Record<string, { cls: string; label: string }> = {
  kyc_approve:  { cls: "bg-[rgba(249,115,22,0.1)] text-[#f97316] border-[rgba(249,115,22,0.2)]", label: "KYC Approve"  },
  kyc_reject:   { cls: "bg-[rgba(249,115,22,0.1)] text-[#f97316] border-[rgba(249,115,22,0.2)]", label: "KYC Reject"   },
  user_block:   { cls: "bg-red-500/10 text-red-400 border-red-500/20",                            label: "User Block"   },
  user_unblock: { cls: "bg-red-500/10 text-red-400 border-red-500/20",                            label: "User Unblock" },
  tx_reverse:   { cls: "bg-red-500/10 text-red-400 border-red-500/20",                            label: "Tx Reverse"   },
  tx_flag:      { cls: "bg-red-500/10 text-red-400 border-red-500/20",                            label: "Tx Flag"      },
  data_reveal:  { cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",                   label: "Data Reveal"  },
  offer_assign: { cls: "bg-sky-500/10 text-sky-400 border-sky-500/20",                            label: "Offer Assign" },
  login:        { cls: "bg-[#252525] text-[#888888] border-[#2d2d2d]",                            label: "Login"        },
};

const ACTION_TYPE_OPTIONS = [
  { value: "",            label: "All Actions"  },
  { value: "kyc_approve", label: "KYC Approve"  },
  { value: "kyc_reject",  label: "KYC Reject"   },
  { value: "user_block",  label: "User Block"   },
  { value: "user_unblock",label: "User Unblock" },
  { value: "tx_reverse",  label: "Tx Reverse"   },
  { value: "tx_flag",     label: "Tx Flag"      },
  { value: "data_reveal", label: "Data Reveal"  },
  { value: "offer_assign",label: "Offer Assign" },
  { value: "login",       label: "Login"        },
];

const COLS = ["Timestamp", "Admin", "Action Type", "Target ID", "Details / Reason", "Metadata"];

function getBadge(type: string) {
  return ACTION_BADGE[type] ?? {
    cls: "bg-[#252525] text-[#888888] border-[#2d2d2d]",
    label: type.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
  };
}
function safeTs(d: string) { try { return format(new Date(d), "yyyy-MM-dd HH:mm:ss"); } catch { return d; } }
function ini(n: string)    { return (n || "?").split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase(); }

interface ToastState { message: string; type: "success" | "error" }

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AuditLogPage() {
  const [page,          setPage]          = useState(1);
  const [actionFilter,  setActionFilter]  = useState("");
  const [adminInput,    setAdminInput]    = useState("");
  const [debouncedAdmin,setDebouncedAdmin]= useState("");
  const [fromDate,      setFromDate]      = useState("");
  const [toDate,        setToDate]        = useState("");
  const [isExporting,   setIsExporting]   = useState(false);
  const [toast,         setToast]         = useState<ToastState | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedAdmin(adminInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [adminInput]);

  const { setExtras, clearExtras } = useTopNavExtras();
  const queryKey = ["audit-log", page, actionFilter, debouncedAdmin, fromDate, toDate];

  const { data, isLoading, refetch } = useQuery<AuditLogResponse>({
    queryKey,
    queryFn: () => getAuditLog({
      page, per_page: PAGE_LIMIT,
      action_type: actionFilter  || undefined,
      admin_id:    debouncedAdmin || undefined,
      from_date:   fromDate       || undefined,
      to_date:     toDate         || undefined,
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

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const all = await getAuditLog({
        per_page: 10000,
        action_type: actionFilter  || undefined,
        admin_id:    debouncedAdmin || undefined,
        from_date:   fromDate       || undefined,
        to_date:     toDate         || undefined,
      });
      const esc  = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
      const hdrs = COLS.map(esc).join(",");
      const rows = (all.actions ?? []).map(l =>
        [l.created_at, l.admin_id, l.action_type, l.target_user_id ?? l.target_txn_id ?? "", l.reason ?? ""].map(esc).join(","));
      const csv  = [hdrs, ...rows].join("\n");
      const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })), download: `audit_log_${Date.now()}.csv` });
      a.click(); URL.revokeObjectURL(a.href);
      showToast(`Exported ${(all.actions ?? []).length} log entries.`, "success");
    } catch { showToast("Export failed. Please try again.", "error"); }
    finally  { setIsExporting(false); }
  };

  const clearFilters = () => { setActionFilter(""); setAdminInput(""); setFromDate(""); setToDate(""); setPage(1); };
  const hasFilters = actionFilter || debouncedAdmin || fromDate || toDate;
  const logs       = data?.actions ?? [];
  const total      = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  const inputCls = "px-3 py-2 rounded-xl bg-[#1a1a1a] border border-[#252525] text-[12px] font-dm-sans text-[#f0f0f0] placeholder:text-[#4a4a4a] focus:outline-none focus:border-[rgba(249,115,22,0.4)] transition-colors";

  return (
    <div className="space-y-5">
      {/* Immutability banner */}
      <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-[#1a1a1a] border border-[#252525]">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[rgba(249,115,22,0.1)] border border-[rgba(249,115,22,0.2)] shrink-0">
          <Lock className="w-4 h-4 text-[#f97316]" />
        </div>
        <div>
          <p className="text-[13px] font-dm-sans font-semibold text-[#f0f0f0] leading-tight">Audit Log is Immutable — Read Only</p>
          <p className="text-[11px] font-dm-sans text-[#888888] mt-0.5 leading-none">All admin actions are permanently recorded. Entries cannot be edited or deleted.</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[rgba(249,115,22,0.1)] border border-[rgba(249,115,22,0.2)]">
            <Shield className="w-4 h-4 text-[#f97316]" />
          </div>
          <div>
            <h2 className="font-syne font-bold text-[#f0f0f0] text-xl leading-tight">Audit Log</h2>
            <p className="text-[11px] font-dm-sans text-[#888888] leading-none mt-0.5">
              {isLoading ? "Loading…" : `${total.toLocaleString()} log entr${total !== 1 ? "ies" : "y"}`}
            </p>
          </div>
        </div>
        <button onClick={handleExport} disabled={isExporting}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[12px] font-dm-sans font-medium bg-[rgba(249,115,22,0.08)] text-[#f97316] border border-[rgba(249,115,22,0.2)] hover:bg-[rgba(249,115,22,0.12)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          {isExporting ? "Exporting…" : "Export CSV"}
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4a4a4a] pointer-events-none" />
          <input type="text" placeholder="Search admin name…" value={adminInput} onChange={e => setAdminInput(e.target.value)}
            className={cn(inputCls, "pl-8.5 w-[190px]")} />
        </div>
        <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}
          className={cn(inputCls, "[color-scheme:dark] w-[160px]")}>
          {ACTION_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-[#4a4a4a] shrink-0" />
          <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} className={cn(inputCls, "[color-scheme:dark]")} />
          <span className="text-[11px] font-dm-sans text-[#4a4a4a]">—</span>
          <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} className={cn(inputCls, "[color-scheme:dark]")} />
        </div>
        {hasFilters && (
          <button onClick={clearFilters}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-dm-sans font-medium text-red-400 border border-red-500/20 bg-red-500/10 hover:bg-red-500/15 transition-colors">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#252525] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px]">
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
                Array.from({ length: 10 }, (_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="pl-5 pr-4 py-3"><div className="h-3 w-36 rounded bg-[#252525]" /></td>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-[#252525]" /><div className="h-3 w-20 rounded bg-[#252525]" /></div></td>
                    <td className="px-4 py-3"><div className="h-5 w-24 rounded-full bg-[#252525]" /></td>
                    <td className="px-4 py-3"><div className="h-3 w-28 rounded bg-[#252525]" /></td>
                    <td className="px-4 py-3"><div className="h-3 w-32 rounded bg-[#252525]" /></td>
                    <td className="px-4 py-3"><div className="h-3 w-24 rounded bg-[#252525]" /></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr><td colSpan={COLS.length} className="py-20 text-center bg-[#1a1a1a]">
                  <div className="flex flex-col items-center gap-2"><Shield className="w-8 h-8 text-[#2d2d2d]" /><p className="text-[13px] font-dm-sans text-[#888888]">No log entries found</p></div>
                </td></tr>
              ) : (
                logs.map((log: AuditLogEntry, idx) => {
                  const badge = getBadge(log.action_type);
                  return (
                    <tr key={log.id} className={cn("group transition-colors hover:bg-[rgba(249,115,22,0.03)]", idx % 2 === 1 ? "bg-[rgba(255,255,255,0.012)]" : "bg-[#1a1a1a]")}>
                      <td className="pl-5 pr-4 py-3 border-l-2 border-l-transparent group-hover:border-l-[rgba(249,115,22,0.3)] transition-colors">
                        <span className="font-mono text-[11px] text-[#888888] tabular-nums whitespace-nowrap">{safeTs(log.created_at)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[rgba(249,115,22,0.1)] flex items-center justify-center shrink-0">
                            <span className="text-[9px] font-syne font-bold text-[#f97316] select-none">{ini(log.admin_id)}</span>
                          </div>
                          <span className="text-[12px] font-dm-sans font-medium text-[#f0f0f0] truncate max-w-[110px] font-mono text-[11px]">{log.admin_id.slice(0,8)}…</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-dm-sans font-semibold border whitespace-nowrap", badge.cls)}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] text-[#888888] bg-[#111111] px-1.5 py-0.5 rounded border border-[#252525] tabular-nums">{log.target_user_id ?? log.target_txn_id ?? "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[12px] font-dm-sans text-[#888888] max-w-[220px] truncate" title={log.reason ?? ""}>{log.reason || "—"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] text-[#4a4a4a] truncate max-w-[140px] block" title={log.action_metadata ? JSON.stringify(log.action_metadata) : ""}>
                          {log.action_metadata && Object.keys(log.action_metadata).length > 0
                            ? JSON.stringify(log.action_metadata).slice(0, 40) + (JSON.stringify(log.action_metadata).length > 40 ? "…" : "")
                            : "—"}
                        </span>
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
