"use client";

import { useState } from "react";
import { Copy, Check, Clock, CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import type { FraudAlert, FraudSeverity } from "@/lib/api/services/fraud";

// ── Config ────────────────────────────────────────────────────────────────────

const SEVERITY_BAR: Record<FraudSeverity, string> = {
  high:   "bg-red-500",
  medium: "bg-[#f97316]",
  low:    "bg-yellow-500",
};

const SEVERITY_BADGE: Record<FraudSeverity, string> = {
  high:   "bg-red-500/10 text-red-400 border-red-500/20",
  medium: "bg-[rgba(249,115,22,0.1)] text-[#f97316] border-[rgba(249,115,22,0.2)]",
  low:    "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

const RESOLVED_PILL = "bg-green-500/10 text-green-400 border-green-500/20";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

function timeAgo(d: string) {
  try { return formatDistanceToNow(new Date(d), { addSuffix: true }); } catch { return "—"; }
}

function safeDate(d: string) {
  try { return format(new Date(d), "MMM d, yyyy · h:mm a"); } catch { return "—"; }
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="flex rounded-xl overflow-hidden border border-[#252525] bg-[#1a1a1a] animate-pulse">
      <div className="w-[3px] shrink-0 bg-[#252525]" />
      <div className="flex-1 p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="h-4 w-40 rounded bg-[#252525]" />
          <div className="h-5 w-14 rounded-full bg-[#252525]" />
        </div>
        <div className="h-3 w-full rounded bg-[#252525]" />
        <div className="h-3 w-3/4 rounded bg-[#252525]" />
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#252525] shrink-0" />
          <div className="h-3 w-32 rounded bg-[#252525]" />
        </div>
        <div className="flex items-center justify-between pt-1">
          <div className="h-3 w-40 rounded bg-[#252525]" />
          <div className="flex gap-2">
            <div className="h-7 w-20 rounded-lg bg-[#252525]" />
            <div className="h-7 w-20 rounded-lg bg-[#252525]" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Alert card ────────────────────────────────────────────────────────────────

function AlertCard({
  alert, onAction,
}: { alert: FraudAlert; onAction: (alert: FraudAlert) => void }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  return (
    <div className="flex rounded-xl overflow-hidden border border-[#252525] bg-[#1a1a1a] hover:border-[rgba(249,115,22,0.2)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.35)] transition-all duration-200 group">
      {/* Left severity bar */}
      <div className={cn("w-[3px] shrink-0", SEVERITY_BAR[alert.severity])} />

      {/* Content */}
      <div className="flex-1 p-5 min-w-0 space-y-3">

        {/* Row 1: severity + resolved badge */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-syne font-bold text-[#f0f0f0] text-[14px] leading-tight capitalize">
            {alert.severity} Severity Flag
          </h3>
          <span className={cn(
            "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-dm-sans font-semibold border uppercase tracking-[0.06em] shrink-0",
            SEVERITY_BADGE[alert.severity]
          )}>
            {alert.severity}
          </span>
        </div>

        {/* Reason */}
        <p className="text-[13px] font-dm-sans text-[#888888] leading-relaxed">
          {alert.reason}
        </p>

        {/* User & TX row */}
        <div className="flex flex-wrap items-center gap-2">
          {alert.user_id && (
            <>
              <span className="text-[10px] font-dm-sans text-[#4a4a4a] uppercase tracking-[0.08em]">User</span>
              <span className="text-[11px] font-mono text-[#888888]">{alert.user_id.slice(0,8)}…</span>
            </>
          )}
          {alert.transaction_id && (
            <>
              <span className="text-[#4a4a4a] select-none">·</span>
              <span className="text-[10px] font-dm-sans text-[#4a4a4a] uppercase tracking-[0.08em]">TX</span>
              <span className="text-[11px] font-mono text-[#888888]">{alert.transaction_id.slice(0,8)}…</span>
              <button
                onClick={() => copyId(alert.transaction_id!)}
                title="Copy TX ID"
                className="flex items-center justify-center w-5 h-5 rounded text-[#4a4a4a] hover:text-[#f97316] transition-colors"
              >
                {copiedId === alert.transaction_id
                  ? <Check className="w-3 h-3 text-green-400" />
                  : <Copy  className="w-3 h-3" />}
              </button>
            </>
          )}
        </div>

        {/* Footer: time + actions */}
        <div className="flex items-center justify-between pt-1 gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#4a4a4a] shrink-0" />
            <span className="text-[11px] font-dm-sans text-[#4a4a4a]">{timeAgo(alert.created_at)}</span>
            <span className="text-[#2d2d2d] select-none">·</span>
            <span className="text-[11px] font-dm-sans text-[#4a4a4a]">{safeDate(alert.created_at)}</span>
          </div>

          {!alert.is_resolved ? (
            <button
              onClick={() => onAction(alert)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-dm-sans font-medium bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/15 transition-colors duration-150"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Resolve
            </button>
          ) : (
            <span className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-dm-sans font-medium border",
              RESOLVED_PILL
            )}>
              <CheckCircle2 className="w-3 h-3" /> Resolved
            </span>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface FraudAlertListProps {
  alerts:    FraudAlert[];
  isLoading: boolean;
  onAction:  (alert: FraudAlert) => void;
}

export default function FraudAlertList({ alerts, isLoading, onAction }: FraudAlertListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[rgba(249,115,22,0.06)] border border-[rgba(249,115,22,0.12)]">
          <ShieldAlert className="w-7 h-7 text-[#2d2d2d]" />
        </div>
        <div className="text-center">
          <p className="font-syne font-bold text-[#f0f0f0] text-[15px] leading-tight">No fraud alerts</p>
          <p className="text-[13px] font-dm-sans text-[#888888] mt-1.5 max-w-[260px] leading-relaxed">
            No alerts match your current filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <AlertCard key={alert.id} alert={alert} onAction={onAction} />
      ))}
    </div>
  );
}
