"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Lock, CheckCircle2, XCircle, ShieldAlert, Search, ChevronLeft, ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  getLoginAudit,
  type LoginAuditEntry,
  type LoginAuditResponse,
} from "@/lib/api/services/audit-log";
import { useTopNavExtras } from "@/context/TopNavExtrasContext";

// ── Constants ──────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 50;

const SUCCESS_OPTIONS = [
  { label: "All",     value: "all"     },
  { label: "Success", value: "success" },
  { label: "Failed",  value: "failed"  },
] as const;

type SuccessFilter = "all" | "success" | "failed";

const FAILURE_REASON_BADGE: Record<string, string> = {
  wrong_password: "bg-red-500/10 text-red-400 border-red-500/20",
  account_locked: "bg-red-500/10 text-red-400 border-red-500/20",
  invalid_otp:    "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

// ── Mini stat card ─────────────────────────────────────────────────────────────

function MiniStat({
  icon: Icon, label, value, iconCls, bgCls,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  iconCls: string;
  bgCls: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-[#1a1a1a] border border-[#252525]">
      <div className={cn("flex items-center justify-center w-9 h-9 rounded-lg shrink-0", bgCls)}>
        <Icon className={cn("w-4 h-4", iconCls)} />
      </div>
      <div>
        <p className="text-[10px] font-dm-sans uppercase tracking-[0.08em] text-[#4a4a4a] leading-none mb-1">
          {label}
        </p>
        <p className="font-syne font-bold text-[#f0f0f0] text-[18px] leading-none">{value}</p>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function safeDate(d?: string) {
  if (!d) return "—";
  try { return format(new Date(d), "MMM d, yyyy · h:mm a"); } catch { return "—"; }
}

function trunc(str: string | undefined, len: number) {
  if (!str) return "—";
  return str.length > len ? str.slice(0, len) + "…" : str;
}

function getFailureBadgeCls(reason: string) {
  return (
    FAILURE_REASON_BADGE[reason] ??
    "bg-[#252525] text-[#888888] border-[#333333]"
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LoginAuditPage() {
  const [page,          setPage]          = useState(1);
  const [phoneSearch,   setPhoneSearch]   = useState("");
  const [successFilter, setSuccessFilter] = useState<SuccessFilter>("all");

  const { setExtras, clearExtras } = useTopNavExtras();

  // Derive the boolean param for the API
  const successParam: boolean | undefined =
    successFilter === "success" ? true :
    successFilter === "failed"  ? false :
    undefined;

  const { data, isLoading, refetch } = useQuery<LoginAuditResponse>({
    queryKey: ["login-audit", page, successFilter],
    queryFn: () =>
      getLoginAudit({
        page,
        per_page: PAGE_LIMIT,
        ...(successParam !== undefined ? { success: successParam } : {}),
      }),
    placeholderData: (prev) => prev,
    refetchInterval: 30_000,
  });

  const handleRefetch = useCallback(() => { refetch(); }, [refetch]);

  useEffect(() => {
    setExtras({ onRefresh: handleRefetch });
    return () => clearExtras();
  }, [handleRefetch, setExtras, clearExtras]);

  // ── Derived / client-side filtering ───────────────────────────────────────

  const allAttempts: LoginAuditEntry[] = data?.attempts ?? [];

  // Client-side phone filter applied on top of the server-side success filter
  const filtered = useMemo(() => {
    const q = phoneSearch.trim().toLowerCase();
    if (!q) return allAttempts;
    return allAttempts.filter((a) =>
      a.phone_number.toLowerCase().includes(q)
    );
  }, [allAttempts, phoneSearch]);

  const total          = data?.total ?? 0;
  const totalPages     = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  // Stats are computed from the current page's raw (unfiltered by phone) data
  const successCount   = allAttempts.filter(a => a.success).length;
  const failedCount    = allAttempts.filter(a => !a.success).length;
  const uniqueReasons  = new Set(
    allAttempts.filter(a => a.failure_reason).map(a => a.failure_reason)
  ).size;

  const inputCls =
    "h-9 px-3 rounded-lg bg-[#1a1a1a] border border-[#252525] text-[12px] font-dm-sans " +
    "text-[#f0f0f0] placeholder:text-[#4a4a4a] focus:outline-none " +
    "focus:border-[rgba(249,115,22,0.4)] transition-colors duration-150";

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <Lock className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <h2 className="font-syne font-bold text-[#f0f0f0] text-xl leading-tight">
            Login Audit
          </h2>
          <p className="text-[11px] font-dm-sans text-[#888888] leading-none mt-0.5">
            Security trail of all authentication attempts
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat
          icon={Lock}          label="Total Attempts"
          value={total.toLocaleString()}
          iconCls="text-blue-400"   bgCls="bg-blue-500/10"
        />
        <MiniStat
          icon={CheckCircle2}  label="Successful"
          value={successCount}
          iconCls="text-green-400"  bgCls="bg-green-500/10"
        />
        <MiniStat
          icon={XCircle}       label="Failed"
          value={failedCount}
          iconCls="text-red-400"    bgCls="bg-red-500/10"
        />
        <MiniStat
          icon={ShieldAlert}   label="Unique Fail Reasons"
          value={uniqueReasons}
          iconCls="text-yellow-400" bgCls="bg-yellow-500/10"
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3">

        {/* Phone search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4a4a4a] pointer-events-none" />
          <input
            type="text"
            value={phoneSearch}
            onChange={(e) => { setPhoneSearch(e.target.value); setPage(1); }}
            placeholder="Search by phone…"
            className={cn(inputCls, "pl-8 w-52")}
          />
        </div>

        {/* Success / Failed filter tabs */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#1a1a1a] border border-[#252525]">
          {SUCCESS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setSuccessFilter(opt.value); setPage(1); }}
              className={cn(
                "px-3 py-1.5 rounded-md text-[11px] font-dm-sans font-medium transition-all duration-150",
                successFilter === opt.value
                  ? "bg-[rgba(249,115,22,0.12)] text-[#f97316] border border-[rgba(249,115,22,0.2)]"
                  : "text-[#888888] hover:text-[#f0f0f0] border border-transparent"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Live indicator */}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-[11px] font-dm-sans text-[#4a4a4a]">
            Live · refreshes every 30s
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#252525] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#111111] border-b border-[#252525]">
              {[
                "Phone Number",
                "IP Address",
                "Device Fingerprint",
                "Result",
                "Failure Reason",
                "Timestamp",
              ].map((col, i) => (
                <th
                  key={col}
                  className={cn(
                    "py-2.5 text-[10px] font-dm-sans font-semibold uppercase tracking-[0.09em] text-[#4a4a4a]",
                    i === 0 ? "pl-5 pr-3 text-left" : "px-4 text-left"
                  )}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#252525]">
            {isLoading ? (
              Array.from({ length: 8 }, (_, i) => (
                <tr key={i} className="animate-pulse bg-[#1a1a1a]">
                  {Array.from({ length: 6 }, (_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-3 rounded bg-[#252525]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center bg-[#1a1a1a]">
                  <Lock className="w-8 h-8 text-[#252525] mx-auto mb-3" />
                  <p className="text-[12px] font-dm-sans text-[#4a4a4a]">
                    {phoneSearch
                      ? `No login attempts found matching "${phoneSearch}".`
                      : "No login attempts found for the selected filter."
                    }
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((entry, idx) => (
                <tr
                  key={entry.id}
                  className={cn(
                    "group transition-colors",
                    entry.success
                      ? "hover:bg-green-500/[0.02]"
                      : "hover:bg-red-500/[0.02]",
                    idx % 2 === 1 ? "bg-[rgba(255,255,255,0.012)]" : "bg-[#1a1a1a]"
                  )}
                >
                  {/* Phone Number */}
                  <td className="pl-5 pr-3 py-3">
                    <span className="font-mono text-[12px] text-[#f0f0f0]">
                      {entry.phone_number}
                    </span>
                  </td>

                  {/* IP Address */}
                  <td className="px-4 py-3">
                    <span className="font-mono text-[12px] text-[#888888]">
                      {entry.ip_address ?? "—"}
                    </span>
                  </td>

                  {/* Device Fingerprint */}
                  <td className="px-4 py-3">
                    <span className="font-mono text-[12px] text-[#888888]">
                      {trunc(entry.device_fingerprint, 12)}
                    </span>
                  </td>

                  {/* Success badge */}
                  <td className="px-4 py-3">
                    {entry.success ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-dm-sans font-semibold border bg-green-500/10 text-green-400 border-green-500/20">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Success
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-dm-sans font-semibold border bg-red-500/10 text-red-400 border-red-500/20">
                        <XCircle className="w-2.5 h-2.5" />
                        Failed
                      </span>
                    )}
                  </td>

                  {/* Failure Reason */}
                  <td className="px-4 py-3">
                    {entry.failure_reason ? (
                      <span
                        className={cn(
                          "inline-flex px-2 py-0.5 rounded-full text-[10px] font-dm-sans font-semibold border capitalize",
                          getFailureBadgeCls(entry.failure_reason)
                        )}
                      >
                        {entry.failure_reason.replace(/_/g, " ")}
                      </span>
                    ) : (
                      <span className="text-[11px] font-dm-sans text-[#4a4a4a]">—</span>
                    )}
                  </td>

                  {/* Timestamp */}
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-dm-sans text-[#888888]">
                      {safeDate(entry.created_at)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > PAGE_LIMIT && (
        <div className="flex items-center justify-between px-0.5 pt-1">
          <span className="text-[12px] font-dm-sans text-[#888888]">
            Page{" "}
            <span className="text-[#f0f0f0]">{page}</span>
            {" "}of{" "}
            <span className="text-[#f0f0f0]">{totalPages}</span>
            {" · "}
            <span className="text-[#f0f0f0]">{total.toLocaleString()}</span>
            {" "}total attempts
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#252525] text-[#888888] bg-[#1a1a1a] hover:text-[#f0f0f0] hover:border-[#2d2d2d] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1.5 rounded-lg text-[12px] font-dm-sans text-[#f0f0f0] bg-blue-500/5 border border-blue-500/20">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#252525] text-[#888888] bg-[#1a1a1a] hover:text-[#f0f0f0] hover:border-[#2d2d2d] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
