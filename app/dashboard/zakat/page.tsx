"use client";

import { useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { HandCoins, Users, Calendar, TrendingUp, Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getZakatStats, type ZakatStatsResponse } from "@/lib/api/services/zakat";
import { useTopNavExtras } from "@/context/TopNavExtrasContext";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtRs(n: number) { return `Rs. ${n.toLocaleString()}`; }

// ── Custom tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-[#252525] rounded-xl px-3.5 py-2.5 shadow-xl">
      <p className="text-[10px] font-dm-sans uppercase tracking-[0.08em] text-[#4a4a4a] mb-1">{label}</p>
      <p className="text-[13px] font-dm-sans font-semibold text-[#f97316]">{fmtRs(payload[0].value)}</p>
    </div>
  );
}

// ── MiniStat ──────────────────────────────────────────────────────────────────

function MiniStat({ icon: Icon, label, value, iconCls, bgCls }:
  { icon: LucideIcon; label: string; value: string | number; iconCls: string; bgCls: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-[#1a1a1a] border border-[#252525]">
      <div className={cn("flex items-center justify-center w-10 h-10 rounded-xl shrink-0", bgCls)}>
        <Icon className={cn("w-5 h-5", iconCls)} />
      </div>
      <div>
        <p className="text-[10px] font-dm-sans uppercase tracking-[0.08em] text-[#4a4a4a] leading-none mb-1.5">{label}</p>
        <p className="font-syne font-bold text-[#f0f0f0] text-[20px] leading-none">{value}</p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ZakatPage() {
  const { setExtras, clearExtras } = useTopNavExtras();

  const { data, isLoading, refetch } = useQuery<ZakatStatsResponse>({
    queryKey: ["zakat-stats"],
    queryFn:  getZakatStats,
    refetchInterval: 15_000,
  });

  const handleRefetch = useCallback(() => { refetch(); }, [refetch]);
  useEffect(() => { setExtras({ onRefresh: handleRefetch }); return () => clearExtras(); }, [handleRefetch, setExtras, clearExtras]);

  const monthly = data?.monthly_data ?? [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[rgba(249,115,22,0.1)] border border-[rgba(249,115,22,0.2)]">
          <HandCoins className="w-4 h-4 text-[#f97316]" />
        </div>
        <div>
          <h2 className="font-syne font-bold text-[#f0f0f0] text-xl leading-tight">Zakat Statistics</h2>
          <p className="text-[11px] font-dm-sans text-[#888888] leading-none mt-0.5">Aggregate analytics — read only</p>
        </div>
      </div>

      {/* Note card */}
      <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-[rgba(249,115,22,0.06)] border border-[rgba(249,115,22,0.15)]">
        <Info className="w-4 h-4 text-[#f97316] shrink-0 mt-0.5" />
        <p className="text-[13px] font-dm-sans text-[#888888] leading-relaxed">
          <span className="text-[#f97316] font-medium">Zakat is personal</span> — no approve/reject actions available. This page shows read-only aggregate collection data only. Individual user zakat records are not accessible.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat icon={HandCoins}  label="Total Zakat Paid (Rs.)"   value={data?.total_zakat_paid      != null ? fmtRs(data.total_zakat_paid) : "—"} iconCls="text-[#f97316]"  bgCls="bg-[rgba(249,115,22,0.1)]" />
        <MiniStat icon={Users}      label="Users Paid This Year"     value={data?.users_paid_this_year  ?? "—"} iconCls="text-green-400"  bgCls="bg-green-500/10" />
        <MiniStat icon={Calendar}   label="This Month's Collection"  value={data?.this_month_collection != null ? fmtRs(data.this_month_collection) : "—"} iconCls="text-yellow-400" bgCls="bg-yellow-500/10" />
        <MiniStat icon={TrendingUp} label="Avg Per User (Rs.)"       value={data?.avg_per_user          != null ? fmtRs(data.avg_per_user) : "—"} iconCls="text-[#f97316]"  bgCls="bg-[rgba(249,115,22,0.1)]" />
      </div>

      {/* Monthly volume chart */}
      <div className="rounded-xl border border-[#252525] bg-[#1a1a1a] p-5">
        <p className="text-[11px] font-dm-sans font-semibold uppercase tracking-[0.1em] text-[#4a4a4a] mb-4">Monthly Collection Volume</p>
        {isLoading ? (
          <div className="h-64 rounded-xl bg-[#252525] animate-pulse" />
        ) : monthly.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-[13px] font-dm-sans text-[#4a4a4a]">No monthly data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={256}>
            <BarChart data={monthly} margin={{ top: 4, right: 4, left: 8, bottom: 4 }}>
              <defs>
                <linearGradient id="zakatGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f97316" stopOpacity={0.95} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.35} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#252525" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: "#4a4a4a", fontSize: 11, fontFamily: "var(--font-dm-sans)" }}
                axisLine={{ stroke: "#252525" }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}k` : String(v)}
                tick={{ fill: "#4a4a4a", fontSize: 11, fontFamily: "var(--font-dm-sans)" }}
                axisLine={{ stroke: "#252525" }}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(249,115,22,0.06)" }} />
              <Bar dataKey="amount" fill="url(#zakatGrad)" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
