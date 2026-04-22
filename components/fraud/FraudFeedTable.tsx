"use client";

import { Clock, Brain, ShieldOff, AlertTriangle, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { FraudFeedItem, FraudSeverity } from "@/lib/api/services/fraud";

// ── Config ────────────────────────────────────────────────────────────────────

const SEVERITY_BAR: Record<string, string> = {
  critical: "bg-red-500",
  high:     "bg-red-400",
  medium:   "bg-[#f97316]",
  low:      "bg-yellow-500",
};

const SEVERITY_BADGE: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  high:     "bg-red-500/10 text-red-400 border-red-500/20",
  medium:   "bg-[rgba(249,115,22,0.1)] text-[#f97316] border-[rgba(249,115,22,0.2)]",
  low:      "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

const DS_RECOMMENDATION_BADGE: Record<string, string> = {
  allow: "bg-green-500/10 text-green-400 border-green-500/20",
  hold:  "bg-[rgba(249,115,22,0.1)] text-[#f97316] border-[rgba(249,115,22,0.2)]",
  block: "bg-red-500/10 text-red-400 border-red-500/20",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(d: string) {
  try { return formatDistanceToNow(new Date(d), { addSuffix: true }); } catch { return "—"; }
}

function scoreColor(score?: number | null) {
  if (score == null) return "text-[#4a4a4a]";
  if (score >= 75)   return "text-red-400";
  if (score >= 40)   return "text-[#f97316]";
  return "text-green-400";
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex rounded-xl overflow-hidden border border-[#252525] bg-[#1a1a1a] animate-pulse">
      <div className="w-[3px] shrink-0 bg-[#252525]" />
      <div className="flex-1 p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="h-4 w-32 rounded bg-[#252525]" />
          <div className="h-5 w-16 rounded-full bg-[#252525]" />
        </div>
        <div className="h-3 w-full rounded bg-[#252525]" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-8 rounded-lg bg-[#252525]" />
          <div className="h-8 rounded-lg bg-[#252525]" />
          <div className="h-8 rounded-lg bg-[#252525]" />
        </div>
      </div>
    </div>
  );
}

// ── Feed item card ────────────────────────────────────────────────────────────

function FeedCard({ item }: { item: FraudFeedItem }) {
  const sev = item.severity as string;
  return (
    <div className="flex rounded-xl overflow-hidden border border-[#252525] bg-[#1a1a1a] hover:border-[rgba(249,115,22,0.2)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.35)] transition-all duration-200">
      {/* Severity bar */}
      <div className={cn("w-[3px] shrink-0", SEVERITY_BAR[sev] ?? "bg-[#252525]")} />

      <div className="flex-1 p-5 min-w-0 space-y-3">
        {/* Row 1: title + severity badge */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-syne font-bold text-[#f0f0f0] text-[14px] leading-tight capitalize">
            {sev} Severity — Auto-flagged
          </h3>
          <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-dm-sans font-semibold border uppercase tracking-[0.06em] shrink-0", SEVERITY_BADGE[sev] ?? "bg-[#252525] text-[#888888] border-[#252525]")}>
            {item.severity}
          </span>
        </div>

        {/* Reason */}
        <p className="text-[13px] font-dm-sans text-[#888888] leading-relaxed">{item.reason}</p>

        {/* AI Scores grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
          {/* Amount */}
          {item.amount != null && (
            <div className="flex flex-col gap-0.5 px-3 py-2.5 rounded-lg bg-[#111111] border border-[#252525]">
              <span className="text-[9px] font-dm-sans uppercase tracking-[0.09em] text-[#4a4a4a]">Amount</span>
              <span className="font-syne font-bold text-[13px] text-[#f0f0f0]">Rs. {item.amount.toLocaleString()}</span>
            </div>
          )}

          {/* Rule-based Fraud Score */}
          <div className="flex flex-col gap-0.5 px-3 py-2.5 rounded-lg bg-[#111111] border border-[#252525]">
            <span className="text-[9px] font-dm-sans uppercase tracking-[0.09em] text-[#4a4a4a]">Rule Score</span>
            <span className={cn("font-syne font-bold text-[13px]", scoreColor(item.fraud_score))}>
              {item.fraud_score != null ? item.fraud_score : "—"}
              <span className="text-[10px] font-dm-sans font-normal text-[#4a4a4a] ml-0.5">/100</span>
            </span>
          </div>

          {/* DeepSeek AI Score */}
          <div className="flex flex-col gap-0.5 px-3 py-2.5 rounded-lg bg-[#111111] border border-[#252525]">
            <div className="flex items-center gap-1">
              <Brain className="w-2.5 h-2.5 text-[#4a4a4a]" />
              <span className="text-[9px] font-dm-sans uppercase tracking-[0.09em] text-[#4a4a4a]">DeepSeek Score</span>
            </div>
            <span className={cn("font-syne font-bold text-[13px]", scoreColor(item.deepseek_score))}>
              {item.deepseek_score != null ? item.deepseek_score : <span className="text-[#4a4a4a] text-[11px] font-normal font-dm-sans">Pending</span>}
              {item.deepseek_score != null && <span className="text-[10px] font-dm-sans font-normal text-[#4a4a4a] ml-0.5">/100</span>}
            </span>
          </div>
        </div>

        {/* Footer: DeepSeek recommendation + user risk + time */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* DeepSeek recommendation */}
            {item.deepseek_recommendation && (
              <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-dm-sans font-semibold border capitalize", DS_RECOMMENDATION_BADGE[item.deepseek_recommendation] ?? "bg-[#252525] text-[#888888] border-[#252525]")}>
                <Brain className="w-3 h-3" />
                AI: {item.deepseek_recommendation}
              </span>
            )}
            {/* User risk score */}
            {item.user_risk_score != null && (
              <span className="text-[11px] font-dm-sans text-[#4a4a4a]">
                User Risk: <span className={cn("font-semibold", scoreColor(item.user_risk_score))}>{item.user_risk_score}</span>
              </span>
            )}
            {/* Hold expires */}
            {item.hold_expires_at && item.txn_status === "under_review" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-dm-sans text-[#f97316] bg-[rgba(249,115,22,0.08)] border border-[rgba(249,115,22,0.15)]">
                <Clock className="w-2.5 h-2.5" /> Hold expires {timeAgo(item.hold_expires_at)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#4a4a4a] shrink-0" />
            <span className="text-[11px] font-dm-sans text-[#4a4a4a]">{timeAgo(item.created_at)}</span>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface FraudFeedTableProps {
  items:     FraudFeedItem[];
  isLoading: boolean;
}

export default function FraudFeedTable({ items, isLoading }: FraudFeedTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => <SkeletonRow key={i} />)}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20">
          <CheckCircle2 className="w-7 h-7 text-green-400" />
        </div>
        <div className="text-center">
          <p className="font-syne font-bold text-[#f0f0f0] text-[15px] leading-tight">No active fraud signals</p>
          <p className="text-[13px] font-dm-sans text-[#888888] mt-1.5 max-w-[260px] leading-relaxed">
            No auto-flagged transactions in the last 24 hours.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <FeedCard key={item.flag_id} item={item} />
      ))}
    </div>
  );
}
