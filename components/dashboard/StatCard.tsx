"use client";

import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";

const DEFAULT_SPARK = [42, 68, 45, 82, 56, 91, 74];

interface StatCardProps {
  icon: LucideIcon;
  value: string;
  label: string;
  sublabel?: string;
  trend?: { pct: number };
  sparkline?: number[];
  loading?: boolean;
  delay?: number;
}

export default function StatCard({
  icon: Icon,
  value,
  label,
  sublabel,
  trend,
  sparkline = DEFAULT_SPARK,
  loading = false,
  delay = 0,
}: StatCardProps) {
  const [animated, setAnimated] = useState(false);
  const [hovered, setHovered] = useState(false);
  const max = Math.max(...sparkline);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 80 + delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className="relative rounded-xl overflow-hidden cursor-default"
      style={{
        background: "var(--bg-card)",
        border: `1px solid ${hovered ? "rgba(249,115,22,0.4)" : "var(--border-color)"}`,
        transform: hovered ? "scale(1.01)" : "scale(1)",
        transition: "border-color 0.2s, transform 0.2s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Top orange accent line ─────────────────── */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: "linear-gradient(90deg, #f97316 0%, #ea580c 60%, transparent 100%)",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.2s",
        }}
      />

      <div className="p-5">
        {/* ── Icon + trend ──────────────────────────── */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-[10px]"
            style={{
              background: "rgba(249,115,22,0.1)",
              border: "1px solid rgba(249,115,22,0.2)",
            }}
          >
            <Icon className="w-[18px] h-[18px]" style={{ color: "#f97316" }} />
          </div>

          {trend && (
            <span
              className="text-[11px] font-dm-sans font-medium px-2 py-[3px] rounded-full"
              style={{
                color: trend.pct >= 0 ? "#22c55e" : "#f87171",
                background:
                  trend.pct >= 0
                    ? "rgba(34,197,94,0.1)"
                    : "rgba(248,113,113,0.1)",
                border: `1px solid ${trend.pct >= 0 ? "rgba(34,197,94,0.2)" : "rgba(248,113,113,0.2)"}`,
              }}
            >
              {trend.pct >= 0 ? "+" : ""}
              {trend.pct}%
            </span>
          )}
        </div>

        {/* ── Value ─────────────────────────────────── */}
        {loading ? (
          <div
            className="h-8 w-28 rounded-lg animate-pulse mb-2"
            style={{ background: "var(--bg-card2)" }}
          />
        ) : (
          <p
            className="font-syne font-bold leading-none mb-1.5"
            style={{ fontSize: "26px", color: "var(--text-primary)" }}
          >
            {value}
          </p>
        )}

        {/* ── Label ─────────────────────────────────── */}
        <p
          className="font-dm-sans"
          style={{
            fontSize: "10px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--text-secondary)",
          }}
        >
          {label}
        </p>
        {sublabel && (
          <p className="font-dm-sans text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
            {sublabel}
          </p>
        )}

        {/* ── Sparkline ─────────────────────────────── */}
        <div
          className="flex items-end gap-[3px] mt-4"
          style={{ height: "32px" }}
        >
          {sparkline.map((v, i) => {
            const pct = (v / max) * 100;
            const isLast = i === sparkline.length - 1;
            return (
              <div
                key={i}
                className="flex-1 rounded-t-sm"
                style={{
                  height: animated ? `${pct}%` : "4px",
                  background: isLast ? "#f97316" : "rgba(249,115,22,0.3)",
                  transition: `height 0.55s cubic-bezier(0.34,1.56,0.64,1) ${i * 55}ms`,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
