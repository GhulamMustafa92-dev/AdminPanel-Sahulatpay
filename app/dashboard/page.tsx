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

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("7D");
  const { setExtras, clearExtras } = useTopNavExtras();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn:  getDashboardStats,
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

  // ── Stat card definitions ────────────────────────────────────────────────
  const CARDS = [
    {
      icon: Users,          value: fmtCount(data?.total_users),
      label: "Total Users",          sublabel: "Registered accounts",
      spark: SPARKS.users,  trend: { pct: 12 }, delay: 0,
    },
    {
      icon: ArrowLeftRight, value: fmtCount(data?.total_transactions),
      label: "Total Transactions",   sublabel: "All time",
      spark: SPARKS.tx,     trend: { pct: 8  }, delay: 60,
    },
    {
      icon: DollarSign,     value: fmtRs(data?.total_volume_pkr),
      label: "Total Volume",         sublabel: "Completed transactions",
      spark: SPARKS.vol,    trend: { pct: 15 }, delay: 120,
    },
    {
      icon: Zap,            value: fmtCount(data?.open_fraud_alerts),
      label: "Open Fraud Alerts",    sublabel: "Unresolved flags",
      spark: SPARKS.today,  trend: { pct: -3 }, delay: 180,
    },
    {
      icon: Activity,       value: fmtCount(data?.active_users),
      label: "Active Users",         sublabel: "Active accounts",
      spark: SPARKS.active, trend: { pct: 5  }, delay: 240,
    },
    {
      icon: Clock,          value: fmtCount(data?.kyc_queue),
      label: "KYC Queue",            sublabel: "Pending verification",
      spark: SPARKS.pending,trend: { pct: -1 }, delay: 300,
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
