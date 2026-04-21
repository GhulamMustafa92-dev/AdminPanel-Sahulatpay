"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, RefreshCw, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useTopNavExtras } from "@/context/TopNavExtrasContext";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":              "Dashboard",
  "/dashboard/users":        "Users",
  "/dashboard/kyc":          "KYC Review",
  "/dashboard/transactions": "Transactions",
  "/dashboard/savings":      "Savings",
  "/dashboard/investments":  "Investments",
  "/dashboard/high-yield":   "High-Yield Deposits",
  "/dashboard/splits":       "Splits Monitor",
  "/dashboard/fraud":        "Fraud Center",
  "/dashboard/cards":        "Cards",
  "/dashboard/insurance":    "Insurance",
  "/dashboard/rewards":      "Reward Offers",
  "/dashboard/finance":      "Limit Requests",
  "/dashboard/notifications":"Notifications",
  "/dashboard/zakat":        "Zakat Statistics",
  "/dashboard/audit-log":    "Audit Log",
  "/dashboard/ai-monitor":   "AI Monitor",
};

function getFormattedDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getFormattedTime() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

interface TopNavProps {
  onToggleSidebar: () => void;
}

export default function TopNav({ onToggleSidebar }: TopNavProps) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "Dashboard";
  const { extras } = useTopNavExtras();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const lastUpdated = extras.lastUpdated ?? getFormattedTime();

  return (
    <header className="h-14 flex items-center justify-between px-4 shrink-0 border-b border-[#252525] bg-[#111111]">
      {/* ── Left: hamburger + page title + date ────── */}
      <div className="flex items-center gap-3">
        {/* Hamburger */}
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#252525] text-[#888888] hover:text-[#f0f0f0] hover:border-[#333333] transition-colors duration-150"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Title + date */}
        <div className="flex flex-col justify-center">
          <h1 className="font-syne font-bold text-[#f0f0f0] text-[15px] leading-tight">
            {title}
          </h1>
          <p className="text-[11px] text-[#888888] font-dm-sans leading-tight mt-0.5">
            {getFormattedDate()}
          </p>
        </div>
      </div>

      {/* ── Right: badges + refresh + avatar ──────── */}
      <div className="flex items-center gap-2">
        {/* Last updated badge */}
        <div className="hidden md:flex items-center px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#252525]">
          <span className="text-[11px] font-dm-sans text-[#888888]">
            Last updated:{" "}
            <span className="text-[#f0f0f0]">{lastUpdated}</span>
          </span>
        </div>

        {/* Live badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#252525]">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse block" />
          <span className="text-[11px] font-dm-sans font-medium text-green-400">Live</span>
        </div>

        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#252525] text-[#888888] hover:text-[#f97316] hover:border-[rgba(249,115,22,0.25)] transition-colors duration-150"
          >
            {resolvedTheme === "dark"
              ? <Sun  className="w-4 h-4" />
              : <Moon className="w-4 h-4" />}
          </button>
        )}

        {/* Refresh */}
        <button
          onClick={extras.onRefresh}
          aria-label="Refresh data"
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#252525] text-[#888888] hover:text-[#f97316] hover:border-[rgba(249,115,22,0.25)] transition-colors duration-150"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Admin avatar */}
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[rgba(249,115,22,0.2)] border border-[rgba(249,115,22,0.15)] cursor-default shrink-0">
          <span className="text-[11px] font-syne font-bold text-[#f97316] select-none">SA</span>
        </div>
      </div>
    </header>
  );
}
