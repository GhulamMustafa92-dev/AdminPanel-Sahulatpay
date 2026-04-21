"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatTrend {
  value: number;
  label?: string;
}

export interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: StatTrend;
  iconColor?: string;
  iconBg?: string;
  valueColor?: string;
  className?: string;
}

export function StatCard({
  icon: Icon, label, value, trend,
  iconColor, iconBg, valueColor, className,
}: StatCardProps) {
  return (
    <div className={cn("flex items-center gap-3 px-4 py-3.5 rounded-xl bg-[#1a1a1a] border border-[#252525]", className)}>
      <div className={cn("flex items-center justify-center w-10 h-10 rounded-xl shrink-0", iconBg ?? "bg-[rgba(249,115,22,0.1)]")}>
        <Icon className={cn("w-5 h-5", iconColor ?? "text-[#f97316]")} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-dm-sans uppercase tracking-[0.08em] text-[#4a4a4a] leading-none mb-1.5 truncate">
          {label}
        </p>
        <p className={cn("font-syne font-bold text-[20px] leading-none", valueColor ?? "text-[#f0f0f0]")}>
          {value}
        </p>
        {trend && (
          <div className={cn("flex items-center gap-1 mt-1.5 text-[11px] font-dm-sans font-medium",
            trend.value >= 0 ? "text-green-400" : "text-red-400")}>
            {trend.value >= 0
              ? <TrendingUp  className="w-3 h-3 shrink-0" />
              : <TrendingDown className="w-3 h-3 shrink-0" />}
            <span>{trend.value >= 0 ? "+" : ""}{trend.value}%{trend.label ? ` ${trend.label}` : ""}</span>
          </div>
        )}
      </div>
    </div>
  );
}
