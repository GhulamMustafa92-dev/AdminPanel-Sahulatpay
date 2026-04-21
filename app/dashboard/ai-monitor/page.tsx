"use client";

import { useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie,
} from "recharts";
import {
  MessageSquare, Cpu, AlertTriangle, Zap, Bot, Lock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { getAIMonitor, type AIMonitorResponse } from "@/lib/api/services/ai-monitor";
import { useTopNavExtras } from "@/context/TopNavExtrasContext";

// ── Helpers ───────────────────────────────────────────────────────────────────

function errCls(r: number)   { return r < 5 ? "bg-green-500/10 text-green-400 border-green-500/20" : r <= 15 ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"; }
function errTxt(r: number)   { return r < 5 ? "text-green-400" : r <= 15 ? "text-yellow-400" : "text-red-400"; }
function cacheTxt(r: number) { return r >= 80 ? "text-green-400" : r >= 50 ? "text-yellow-400" : "text-[#f97316]"; }
function cacheClr(r: number) { return r >= 80 ? "#22c55e" : r >= 50 ? "#facc15" : "#f97316"; }
function timeAgo(d: string)  { try { return formatDistanceToNow(new Date(d), { addSuffix: true }); } catch { return "—"; } }
function ini(n: string)      { return (n || "?").split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase(); }

const HEALTH_COLORS = ["#22c55e", "#f97316", "#f87171"];

// ── Sub-components ────────────────────────────────────────────────────────────

function MiniStat({ icon: Icon, label, value, iconCls, bgCls, valueCls }:
  { icon: LucideIcon; label: string; value: string | number; iconCls: string; bgCls: string; valueCls?: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-[#1a1a1a] border border-[#252525]">
      <div className={cn("flex items-center justify-center w-9 h-9 rounded-lg shrink-0", bgCls)}>
        <Icon className={cn("w-4 h-4", iconCls)} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-dm-sans uppercase tracking-[0.08em] text-[#4a4a4a] leading-none mb-1 truncate">{label}</p>
        <p className={cn("font-syne font-bold text-[18px] leading-none", valueCls ?? "text-[#f0f0f0]")}>{value}</p>
      </div>
    </div>
  );
}

function HealthTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-[#252525] rounded-xl px-3 py-2 text-[12px] font-dm-sans">
      <p className="text-[#888888] mb-0.5">{label}</p>
      <p className="font-semibold text-[#f0f0f0]">{payload[0].value.toLocaleString()} users</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AIMonitorPage() {
  const { setExtras, clearExtras } = useTopNavExtras();

  const { data, isLoading, refetch } = useQuery<AIMonitorResponse>({
    queryKey: ["ai-monitor"],
    queryFn:  getAIMonitor,
    refetchInterval: 60_000,
  });

  const handleRefetch = useCallback(() => { refetch(); }, [refetch]);
  useEffect(() => { setExtras({ onRefresh: handleRefetch }); return () => clearExtras(); }, [handleRefetch, setExtras, clearExtras]);

  const errRate   = data?.error_rate    ?? 0;
  const cacheRate = data?.cache_hit_rate ?? 0;
  const topUsers  = data?.top_users     ?? [];

  const healthData = [
    { name: "Good", value: data?.health_score_distribution.good ?? 0 },
    { name: "Fair", value: data?.health_score_distribution.fair ?? 0 },
    { name: "Poor", value: data?.health_score_distribution.poor ?? 0 },
  ];

  const pieData = [
    { value: cacheRate },
    { value: Math.max(0, 100 - cacheRate) },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[rgba(249,115,22,0.1)] border border-[rgba(249,115,22,0.2)]">
          <Bot className="w-4 h-4 text-[#f97316]" />
        </div>
        <div>
          <h2 className="font-syne font-bold text-[#f0f0f0] text-xl leading-tight">AI Monitor</h2>
          <p className="text-[11px] font-dm-sans text-[#888888] leading-none mt-0.5">Real-time AI usage & health metrics</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <MiniStat icon={MessageSquare} label="Messages Today"      value={data?.chat_messages_today      ?? "—"} iconCls="text-[#f97316]"  bgCls="bg-[rgba(249,115,22,0.1)]" />
        <MiniStat icon={MessageSquare} label="Messages This Month" value={data?.chat_messages_this_month ?? "—"} iconCls="text-green-400"  bgCls="bg-green-500/10" />
        <MiniStat icon={Cpu}           label="Total API Calls"     value={data?.total_api_calls          != null ? data.total_api_calls.toLocaleString() : "—"} iconCls="text-[#888888]" bgCls="bg-[#252525]" />
        <MiniStat icon={AlertTriangle} label="Error Rate"          value={data ? `${errRate}%` : "—"} iconCls={errTxt(errRate)} bgCls={errRate < 5 ? "bg-green-500/10" : errRate <= 15 ? "bg-yellow-500/10" : "bg-red-500/10"} valueCls={errTxt(errRate)} />
        <MiniStat icon={Zap}           label="Cache Hit Rate"      value={data ? `${cacheRate}%` : "—"} iconCls={cacheTxt(cacheRate)} bgCls={cacheRate >= 80 ? "bg-green-500/10" : cacheRate >= 50 ? "bg-yellow-500/10" : "bg-[rgba(249,115,22,0.1)]"} valueCls={cacheTxt(cacheRate)} />
      </div>

      {/* Error rate badge */}
      {data && (
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-dm-sans text-[#4a4a4a]">Error Rate Status:</span>
          <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-dm-sans font-semibold border", errCls(errRate))}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {errRate < 5 ? "Healthy" : errRate <= 15 ? "Elevated" : "Critical"} — {errRate}%
          </span>
        </div>
      )}

      {/* Top 10 Active AI Users */}
      <div className="rounded-xl border border-[#252525] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#111111] border-b border-[#252525]">
          <div>
            <p className="text-[13px] font-dm-sans font-semibold text-[#f0f0f0]">Top 10 Active AI Users</p>
          </div>
          <span className="text-[10px] font-dm-sans text-[#4a4a4a]">Abuse detection only</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-[#111111] border-b border-[#252525]">
              {["Rank", "User", "Message Count", "Last Active"].map((col, i) => (
                <th key={col} className={cn("py-2.5 text-[10px] font-dm-sans font-semibold uppercase tracking-[0.09em] text-[#4a4a4a]",
                  i === 0 ? "pl-5 pr-3 text-center w-16" : i === 1 ? "px-4 text-left" : "px-4 text-left")}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#252525]">
            {isLoading ? (
              Array.from({ length: 5 }, (_, i) => (
                <tr key={i} className="animate-pulse bg-[#1a1a1a]">
                  <td className="pl-5 pr-3 py-3 text-center"><div className="h-3 w-5 rounded bg-[#252525] mx-auto" /></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-2.5"><div className="w-7 h-7 rounded-full bg-[#252525]" /><div className="space-y-1.5"><div className="h-3 w-24 rounded bg-[#252525]" /><div className="h-2.5 w-16 rounded bg-[#252525]" /></div></div></td>
                  <td className="px-4 py-3"><div className="h-3 w-16 rounded bg-[#252525]" /></td>
                  <td className="px-4 py-3"><div className="h-3 w-20 rounded bg-[#252525]" /></td>
                </tr>
              ))
            ) : topUsers.length === 0 ? (
              <tr><td colSpan={4} className="py-10 text-center bg-[#1a1a1a]">
                <p className="text-[12px] font-dm-sans text-[#4a4a4a]">No usage data available</p>
              </td></tr>
            ) : (
              topUsers.map((u, idx) => (
                <tr key={u.id} className={cn("group hover:bg-[rgba(249,115,22,0.03)] transition-colors", idx % 2 === 1 ? "bg-[rgba(255,255,255,0.012)]" : "bg-[#1a1a1a]")}>
                  <td className="pl-5 pr-3 py-3 text-center">
                    <span className={cn("font-syne font-bold text-[13px]", idx === 0 ? "text-[#f97316]" : idx <= 2 ? "text-[#888888]" : "text-[#4a4a4a]")}>#{idx + 1}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[rgba(249,115,22,0.1)] flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-syne font-bold text-[#f97316] select-none">{ini(u.user_name)}</span>
                      </div>
                      <div>
                        <p className="text-[12px] font-dm-sans font-medium text-[#f0f0f0] truncate max-w-[130px]">{u.user_name}</p>
                        <p className="text-[11px] font-dm-sans text-[#888888]">{u.user_phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="font-syne font-bold text-[13px] text-[#f97316] tabular-nums">{u.message_count.toLocaleString()}</span></td>
                  <td className="px-4 py-3"><span className="text-[11px] font-dm-sans text-[#888888]">{timeAgo(u.last_active)}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="flex items-center gap-2 px-5 py-3 border-t border-[#252525] bg-[#111111]">
          <Lock className="w-3.5 h-3.5 text-[#4a4a4a] shrink-0" />
          <p className="text-[11px] font-dm-sans text-[#4a4a4a]">For abuse detection only — chat content is private and not accessible here.</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Health Score Distribution */}
        <div className="rounded-xl border border-[#252525] bg-[#1a1a1a] p-5">
          <p className="text-[11px] font-dm-sans font-semibold uppercase tracking-[0.1em] text-[#4a4a4a] mb-4">AI Health Score Distribution</p>
          {isLoading ? (
            <div className="h-44 rounded-xl bg-[#252525] animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={176}>
              <BarChart data={healthData} margin={{ top: 4, right: 4, left: -8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#252525" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#888888", fontSize: 12, fontFamily: "var(--font-dm-sans)" }} axisLine={{ stroke: "#252525" }} tickLine={false} />
                <YAxis tick={{ fill: "#4a4a4a", fontSize: 11, fontFamily: "var(--font-dm-sans)" }} axisLine={{ stroke: "#252525" }} tickLine={false} />
                <Tooltip content={<HealthTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={64}>
                  {healthData.map((_, i) => <Cell key={i} fill={HEALTH_COLORS[i]} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Cache Performance Donut */}
        <div className="rounded-xl border border-[#252525] bg-[#1a1a1a] p-5 flex flex-col items-center justify-center gap-4">
          <p className="text-[11px] font-dm-sans font-semibold uppercase tracking-[0.1em] text-[#4a4a4a] self-start">Cache Performance</p>
          {isLoading ? (
            <div className="w-40 h-40 rounded-full bg-[#252525] animate-pulse" />
          ) : (
            <>
              <div className="relative w-[160px] h-[160px]">
                <PieChart width={160} height={160}>
                  <Pie data={pieData} cx={75} cy={75} innerRadius={56} outerRadius={72}
                    startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
                    <Cell fill={cacheClr(cacheRate)} />
                    <Cell fill="#252525" />
                  </Pie>
                </PieChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="font-syne font-bold text-[24px] leading-none" style={{ color: cacheClr(cacheRate) }}>{cacheRate}%</span>
                  <span className="text-[10px] font-dm-sans text-[#4a4a4a] mt-1.5">Hit Rate</span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-[10px] font-dm-sans text-[#4a4a4a] uppercase tracking-[0.07em]">Cache Hits</p>
                  <p className="font-syne font-bold text-[16px] leading-none mt-1" style={{ color: cacheClr(cacheRate) }}>{cacheRate}%</p>
                </div>
                <div className="w-px h-8 bg-[#252525]" />
                <div className="text-center">
                  <p className="text-[10px] font-dm-sans text-[#4a4a4a] uppercase tracking-[0.07em]">Misses</p>
                  <p className="font-syne font-bold text-[16px] leading-none mt-1 text-[#888888]">{Math.max(0, 100 - cacheRate)}%</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
