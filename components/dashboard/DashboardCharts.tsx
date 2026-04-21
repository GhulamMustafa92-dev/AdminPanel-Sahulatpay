"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import type { DashboardStats } from "@/lib/api/services/dashboard";
import TimeRangeSelector, { type TimeRange } from "./TimeRangeSelector";

// ── Helpers ─────────────────────────────────────────────────────────────────
function fmtK(v: number) {
  if (v >= 1_000_000) return `Rs.${(v / 1_000_000).toFixed(1)}M`;
  return `Rs.${(v / 1_000).toFixed(0)}K`;
}
function fmtCount(v: number) {
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return `${v}`;
}
function calcTrend(series: { value: number }[]) {
  if (series.length < 2) return 0;
  const mid = Math.floor(series.length / 2);
  const a = series.slice(0, mid).reduce((s, x) => s + x.value, 0) / mid;
  const b = series.slice(mid).reduce((s, x) => s + x.value, 0) / (series.length - mid);
  return Math.round(((b - a) / a) * 100);
}

// ── Mock data ────────────────────────────────────────────────────────────────
const BASE = [145, 189, 123, 267, 198, 87, 312, 156, 201, 178, 234, 145, 289,
              167, 212, 198, 156, 267, 189, 234, 178, 145, 189, 267, 234, 198, 156, 289, 212, 178];

const MOCK_7D  = BASE.slice(0, 7).map((v, i) => ({ date: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i], value: v * 1000 }));
const MOCK_30D = BASE.map((v, i) => ({ date: `D${i + 1}`, value: v * 1000 }));
const MOCK_90D = BASE.slice(0, 13).map((v, i) => ({ date: `W${i + 1}`, value: v * 6500 }));

const REV_7D = [89, 124, 97, 168, 142, 56, 203].map((v, i) => ({
  date: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i], value: v * 1000,
}));

const CATEGORY_DATA = [
  { name: "Food & Dining", value: 3240 },
  { name: "Shopping",      value: 2180 },
  { name: "Transport",     value: 1560 },
  { name: "Bill Payment",  value: 980  },
  { name: "Other",         value: 640  },
];

const PURPOSE_DATA = [
  { name: "Other",        count: 3240 },
  { name: "Shopping",     count: 2180 },
  { name: "Food",         count: 1890 },
  { name: "Medical",      count: 1240 },
  { name: "Bill Payment", count: 980  },
  { name: "Transport",    count: 720  },
];

const HEALTH_DATA = [
  { name: "Success", value: 8420, color: "#22c55e" },
  { name: "Failed",  value: 340,  color: "#f87171" },
  { name: "Pending", value: 180,  color: "#facc15" },
];

const ORANGE_RAMP = ["#f97316", "#fb923c", "#fdba74", "#fed7aa", "#fde8d0"];

// ── Sub-components ───────────────────────────────────────────────────────────
function ChartCard({ title, topRight, children, minH = 240 }: {
  title: string;
  topRight?: React.ReactNode;
  children: React.ReactNode;
  minH?: number;
}) {
  return (
    <div
      className="rounded-xl border flex flex-col"
      style={{ background: "var(--bg-card)", borderColor: "var(--border-color)", minHeight: minH }}
    >
      <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
        <p className="font-syne font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
          {title}
        </p>
        {topRight}
      </div>
      <div className="flex-1 px-2 pb-4">{children}</div>
    </div>
  );
}

function TrendBadge({ pct }: { pct: number }) {
  const pos = pct >= 0;
  return (
    <span
      className="text-[11px] font-dm-sans font-medium px-2 py-[3px] rounded-full"
      style={{
        color: pos ? "#22c55e" : "#f87171",
        background: pos ? "rgba(34,197,94,0.1)" : "rgba(248,113,113,0.1)",
        border: `1px solid ${pos ? "rgba(34,197,94,0.2)" : "rgba(248,113,113,0.2)"}`,
      }}
    >
      {pos ? "+" : ""}{pct}%
    </span>
  );
}

function VolTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg-card2)", border: "1px solid var(--border-active)", borderRadius: "8px", padding: "8px 12px" }}>
      <p style={{ color: "var(--text-secondary)", fontSize: "11px", marginBottom: "3px", fontFamily: "var(--font-dm-sans)" }}>{label}</p>
      <p style={{ color: "var(--text-primary)", fontSize: "14px", fontFamily: "var(--font-syne)", fontWeight: 700 }}>
        {fmtK(payload[0].value)}
      </p>
    </div>
  );
}

// ── Chart: Transaction Volume ────────────────────────────────────────────────
function VolumeChart({ data, timeRange, onTimeRangeChange }: {
  data?: DashboardStats;
  timeRange: TimeRange;
  onTimeRangeChange: (r: TimeRange) => void;
}) {
  const series = data?.time_series ?? (timeRange === "7D" ? MOCK_7D : timeRange === "30D" ? MOCK_30D : MOCK_90D);
  const trend = calcTrend(series);

  return (
    <ChartCard
      title="Transaction Volume"
      topRight={
        <div className="flex items-center gap-2">
          <TrendBadge pct={trend} />
          <TimeRangeSelector value={timeRange} onChange={onTimeRangeChange} />
        </div>
      }
    >
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={series} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#f97316" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#f97316" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: "var(--text-secondary)", fontSize: 11, fontFamily: "var(--font-dm-sans)" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11, fontFamily: "var(--font-dm-sans)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={38} />
          <Tooltip content={<VolTooltip />} cursor={{ stroke: "rgba(249,115,22,0.2)", strokeWidth: 1 }} />
          <Area type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} fill="url(#volGrad)" dot={false} activeDot={{ r: 4, fill: "#f97316", strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── Chart: By Category (Donut) ───────────────────────────────────────────────
function CategoryDonut() {
  const total = CATEGORY_DATA.reduce((s, x) => s + x.value, 0);
  return (
    <ChartCard title="By Category">
      <div className="relative">
        <ResponsiveContainer width="100%" height={170}>
          <PieChart>
            <Pie data={CATEGORY_DATA} innerRadius={52} outerRadius={78} dataKey="value" paddingAngle={3} startAngle={90} endAngle={-270}>
              {CATEGORY_DATA.map((_, i) => <Cell key={i} fill={ORANGE_RAMP[i]} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="font-syne font-bold text-[17px] leading-none" style={{ color: "var(--text-primary)" }}>
              {fmtCount(total)}
            </p>
            <p style={{ fontSize: "10px", color: "var(--text-secondary)", fontFamily: "var(--font-dm-sans)", letterSpacing: "0.06em" }}>TOTAL</p>
          </div>
        </div>
      </div>
      <div className="px-3 space-y-2 mt-1">
        {CATEGORY_DATA.map((item, i) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: ORANGE_RAMP[i] }} />
              <span className="text-[12px] font-dm-sans" style={{ color: "var(--text-secondary)" }}>{item.name}</span>
            </div>
            <span className="text-[12px] font-syne font-semibold" style={{ color: "var(--text-primary)" }}>
              {item.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

// ── Chart: Weekly Revenue ────────────────────────────────────────────────────
function RevenueChart() {
  const trend = calcTrend(REV_7D);
  return (
    <ChartCard
      title="Weekly Revenue"
      topRight={<TrendBadge pct={trend} />}
      minH={220}
    >
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={REV_7D} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#f97316" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#f97316" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: "var(--text-secondary)", fontSize: 10, fontFamily: "var(--font-dm-sans)" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 10, fontFamily: "var(--font-dm-sans)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={34} />
          <Tooltip content={<VolTooltip />} cursor={{ stroke: "rgba(249,115,22,0.2)", strokeWidth: 1 }} />
          <Area type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} fill="url(#revGrad)" dot={false} activeDot={{ r: 4, fill: "#f97316", strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── Chart: Purpose Breakdown ─────────────────────────────────────────────────
function PurposeBreakdown() {
  const max = Math.max(...PURPOSE_DATA.map((x) => x.count));
  return (
    <ChartCard title="Purpose Breakdown" minH={220}>
      <div className="px-3 space-y-3 pt-1">
        {PURPOSE_DATA.map((item) => (
          <div key={item.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px] font-dm-sans" style={{ color: "var(--text-secondary)" }}>{item.name}</span>
              <span className="text-[12px] font-syne font-semibold" style={{ color: "var(--text-primary)" }}>
                {item.count.toLocaleString()}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-card2)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(item.count / max) * 100}%`,
                  background: "linear-gradient(90deg, #f97316, #ea580c)",
                  transition: "width 0.8s cubic-bezier(0.34,1.56,0.64,1)",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

// ── Chart: Transaction Health ────────────────────────────────────────────────
function HealthDonut() {
  const total = HEALTH_DATA.reduce((s, x) => s + x.value, 0);
  return (
    <ChartCard title="Transaction Health" minH={220}>
      <div className="relative">
        <ResponsiveContainer width="100%" height={150}>
          <PieChart>
            <Pie data={HEALTH_DATA} innerRadius={48} outerRadius={70} dataKey="value" paddingAngle={3} startAngle={90} endAngle={-270}>
              {HEALTH_DATA.map((item) => <Cell key={item.name} fill={item.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="font-syne font-bold text-base leading-none" style={{ color: "var(--text-primary)" }}>
              {fmtCount(total)}
            </p>
            <p style={{ fontSize: "10px", color: "var(--text-secondary)", fontFamily: "var(--font-dm-sans)", letterSpacing: "0.06em" }}>TOTAL</p>
          </div>
        </div>
      </div>
      <div className="px-3 space-y-2">
        {HEALTH_DATA.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
              <span className="text-[12px] font-dm-sans" style={{ color: "var(--text-secondary)" }}>{item.name}</span>
            </div>
            <span className="text-[12px] font-syne font-semibold" style={{ color: "var(--text-primary)" }}>
              {item.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
interface DashboardChartsProps {
  data?: DashboardStats;
  timeRange: TimeRange;
  onTimeRangeChange: (r: TimeRange) => void;
}

export default function DashboardCharts({ data, timeRange, onTimeRangeChange }: DashboardChartsProps) {
  return (
    <div className="space-y-4">
      {/* Row 1: Volume (65%) + Category donut (35%) */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "65fr 35fr" }}>
        <VolumeChart data={data} timeRange={timeRange} onTimeRangeChange={onTimeRangeChange} />
        <CategoryDonut />
      </div>

      {/* Row 2: Revenue + Purpose + Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RevenueChart />
        <PurposeBreakdown />
        <HealthDonut />
      </div>
    </div>
  );
}
