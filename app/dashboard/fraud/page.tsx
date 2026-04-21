"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldAlert, CheckCircle2, AlertTriangle, X, Check,
  ChevronLeft, ChevronRight, TrendingDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getFraudAlerts,
  type FraudAlert,
  type FraudListResponse,
} from "@/lib/api/services/fraud";
import FraudAlertList from "@/components/fraud/FraudAlertList";
import ResolveDialog  from "@/components/fraud/ResolveDialog";
import { useTopNavExtras } from "@/context/TopNavExtrasContext";

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 20;

const STATUS_TABS = [
  { label: "Open",     value: "open"     },
  { label: "Resolved", value: "resolved" },
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
        <p className="text-[10px] font-dm-sans uppercase tracking-[0.08em] text-[#4a4a4a] leading-none mb-1">
          {label}
        </p>
        <p className="font-syne font-bold text-[#f0f0f0] text-[18px] leading-none">{value}</p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FraudPage() {
  const [status,   setStatus]   = useState("open");
  const [page,     setPage]     = useState(1);

  const [selectedAlert,  setSelectedAlert]  = useState<FraudAlert | null>(null);
  const [dialogOpen,     setDialogOpen]     = useState(false);
  const [toast,          setToast]          = useState<ToastState | null>(null);

  const { setExtras, clearExtras } = useTopNavExtras();

  const { data, isLoading, refetch } = useQuery<FraudListResponse>({
    queryKey: ["fraud-alerts", page, status],
    queryFn:  () => getFraudAlerts({
      page,
      per_page: PAGE_LIMIT,
      resolved: status === "resolved",
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

  const handleAction = (alert: FraudAlert) => {
    setSelectedAlert(alert);
    setDialogOpen(true);
  };

  const handleSuccess = () => {
    showToast("Alert resolved successfully.", "success");
    refetch();
  };

  const flags      = data?.flags ?? [];
  const total      = flags.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));
  const rangeStart = (page - 1) * PAGE_LIMIT + 1;
  const rangeEnd   = Math.min(page * PAGE_LIMIT, total);

  const resetPage = () => setPage(1);

  return (
    <div className="space-y-5">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20">
          <ShieldAlert className="w-4 h-4 text-red-400" />
        </div>
        <div>
          <h2 className="font-syne font-bold text-[#f0f0f0] text-xl leading-tight">Fraud Center</h2>
          <p className="text-[11px] font-dm-sans text-[#888888] leading-none mt-0.5">
            {isLoading ? "Loading…" : `${total.toLocaleString()} alert${total !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat
          icon={ShieldAlert}   label="Total Flags"
          value={total}
          iconCls="text-red-400"    bgCls="bg-red-500/10"
        />
        <MiniStat
          icon={AlertTriangle} label="High Severity"
          value={flags.filter(f => f.severity === "high").length}
          iconCls="text-[#f97316]"  bgCls="bg-[rgba(249,115,22,0.1)]"
        />
        <MiniStat
          icon={CheckCircle2}  label="Resolved"
          value={flags.filter(f => f.is_resolved).length}
          iconCls="text-green-400"  bgCls="bg-green-500/10"
        />
        <MiniStat
          icon={TrendingDown}  label="Critical"
          value={flags.filter(f => f.severity === "high" && !f.is_resolved).length}
          iconCls="text-yellow-400" bgCls="bg-yellow-500/10"
        />
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status tabs */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#1a1a1a] border border-[#252525]">
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
              {tab.value === "open" && flags.filter(f => !f.is_resolved).length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] bg-red-500/20 text-red-400 font-semibold">
                  {flags.filter(f => !f.is_resolved).length}
                </span>
              )}
            </button>
          ))}
        </div>

      </div>

      {/* ── Alert list ──────────────────────────────────────────────── */}
      <FraudAlertList
        alerts={flags}
        isLoading={isLoading}
        onAction={handleAction}
      />

      {/* ── Pagination ──────────────────────────────────────────────── */}
      {total > PAGE_LIMIT && (
        <div className="flex items-center justify-between pt-1 px-0.5">
          <span className="text-[12px] font-dm-sans text-[#888888]">
            Showing <span className="text-[#f0f0f0]">{rangeStart}–{rangeEnd}</span> of{" "}
            <span className="text-[#f0f0f0]">{total.toLocaleString()}</span> alerts
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

      {/* ── Resolve dialog ────────────────────────────────── */}
      <ResolveDialog
        alert={selectedAlert}
        open={dialogOpen}
        onOpenChange={(v) => { if (!v) setSelectedAlert(null); setDialogOpen(v); }}
        onSuccess={handleSuccess}
      />

      {/* ── Toast ───────────────────────────────────────────────────── */}
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
