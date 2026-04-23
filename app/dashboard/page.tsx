"use client";

import { useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Users, ArrowLeftRight, DollarSign, Zap, Activity, Clock } from "lucide-react";
import { useState } from "react";
import { getDashboardStats } from "@/lib/api/services/dashboard";
import { useTopNavExtras } from "@/context/TopNavExtrasContext";
import StatCard from "@/components/dashboard/StatCard";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import type { TimeRange } from "@/components/dashboard/TimeRangeSelector";

// ── Format helpers ───────────────────────────────────────────────────────────
function fmtCount(n?: number): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}
function fmtRs(n?: number): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `Rs. ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `Rs. ${(n / 1_000).toFixed(0)}K`;
  return `Rs. ${n.toLocaleString()}`;
}

// ── Deterministic sparklines per card ────────────────────────────────────────
const SPARKS = {
  users:   [55, 68, 72, 65, 80, 88, 92],
  tx:      [42, 68, 45, 82, 56, 91, 74],
  vol:     [120, 180, 145, 210, 175, 220, 195],
  today:   [30, 45, 28, 60, 42, 55, 70],
  active:  [65, 70, 68, 75, 72, 80, 85],
  pending: [12, 8, 15, 10, 18, 14, 9],
};

const RANGE_DAYS: Record<TimeRange, number> = { "7D": 7, "30D": 30, "90D": 90 };

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("7D");
  const { setExtras, clearExtras } = useTopNavExtras();

  const days = RANGE_DAYS[timeRange];

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["dashboard", days],
    queryFn:  () => getDashboardStats(days),
    refetchInterval: 15_000,
  });

  const handleRefetch = useCallback(() => { refetch(); }, [refetch]);

  // ── Sync TopNav extras ───────────────────────────────────────────────────
  useEffect(() => {
    setExtras({
      showLive: true,
      lastUpdated: data ? format(new Date(), "h:mm aa").toLowerCase() : undefined,
      onRefresh: handleRefetch,
    });
  }, [data, handleRefetch, setExtras]);

  useEffect(() => () => clearExtras(), [clearExtras]);

  // ── Derive sparklines from real time_series data ─────────────────────────
  const volSpark = data?.time_series?.map(p => p.value) ?? [];
  const calcTrendPct = (series: number[]) => {
    if (series.length < 2) return undefined;
    const mid = Math.floor(series.length / 2);
    const a = series.slice(0, mid).reduce((s, x) => s + x, 0) / mid;
    const b = series.slice(mid).reduce((s, x) => s + x, 0) / (series.length - mid);
    return a === 0 ? undefined : Math.round(((b - a) / a) * 100);
  };
  const volTrendPct = calcTrendPct(volSpark);

  // ── Stat card definitions ────────────────────────────────────────────────
  const CARDS = [
    {
      icon: Users,          value: fmtCount(data?.total_users),
      label: "Total Users",          sublabel: "Registered accounts",
      spark: volSpark,      trend: undefined,   delay: 0,
    },
    {
      icon: ArrowLeftRight, value: fmtCount(data?.total_transactions),
      label: "Total Transactions",   sublabel: "All time",
      spark: volSpark,      trend: undefined,   delay: 60,
    },
    {
      icon: DollarSign,     value: fmtRs(data?.total_volume_pkr),
      label: "Total Volume",         sublabel: "Completed transactions",
      spark: volSpark,      trend: volTrendPct != null ? { pct: volTrendPct } : undefined, delay: 120,
    },
    {
      icon: Zap,            value: fmtCount(data?.open_fraud_alerts),
      label: "Open Fraud Alerts",    sublabel: "Unresolved flags",
      spark: [],            trend: undefined,   delay: 180,
    },
    {
      icon: Activity,       value: fmtCount(data?.active_users),
      label: "Active Users",         sublabel: "Active accounts",
      spark: [],            trend: undefined,   delay: 240,
    },
    {
      icon: Clock,          value: fmtCount(data?.kyc_queue),
      label: "KYC Queue",            sublabel: "Pending verification",
      spark: [],            trend: undefined,   delay: 300,
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Stat cards grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {CARDS.map(({ icon, value, label, sublabel, spark, trend, delay }) => (
          <StatCard
            key={label}
            icon={icon}
            value={value}
            label={label}
            sublabel={sublabel}
            sparkline={spark}
            trend={trend}
            loading={isLoading}
            delay={delay}
          />
        ))}
      </div>

      {/* ── Charts ──────────────────────────────────────────────────────── */}
      <DashboardCharts
        data={data}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
      />
    </div>
  );
}
