"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  ArrowLeftRight,
  PiggyBank,
  TrendingUp,
  Percent,
  SplitSquareVertical,
  ShieldAlert,
  Shield,
  Gift,
  FileText,
  Bell,
  Moon,
  ScrollText,
  Bot,
  ChevronLeft,
  ArrowRightFromLine,
  FileWarning,
  RotateCcw,
  MessageSquareWarning,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminLogout } from "@/lib/auth";

const NAV_SECTIONS = [
  {
    label: "OVERVIEW",
    items: [{ href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" }],
  },
  {
    label: "USERS",
    items: [
      { href: "/dashboard/users", icon: Users, label: "Users" },
      { href: "/dashboard/kyc", icon: CreditCard, label: "KYC Review" },
    ],
  },
  {
    label: "FINANCE",
    items: [
      {
        href: "/dashboard/transactions",
        icon: ArrowLeftRight,
        label: "Transactions",
      },
      { href: "/dashboard/savings", icon: PiggyBank, label: "Savings" },
      {
        href: "/dashboard/investments",
        icon: TrendingUp,
        label: "Investments",
      },
      {
        href: "/dashboard/high-yield",
        icon: Percent,
        label: "High-Yield Deposits",
      },
      {
        href: "/dashboard/splits",
        icon: SplitSquareVertical,
        label: "Splits Monitor",
      },
      { href: "/dashboard/finance", icon: FileText, label: "Limit Requests" },
    ],
  },
  {
    label: "RISK & SECURITY",
    items: [
      { href: "/dashboard/fraud", icon: ShieldAlert, label: "Fraud Center" },
      {
        href: "/dashboard/str-reports",
        icon: FileWarning,
        label: "STR Reports",
      },
      {
        href: "/dashboard/reversal-requests",
        icon: RotateCcw,
        label: "Reversal Requests",
      },
      {
        href: "/dashboard/disputes",
        icon: MessageSquareWarning,
        label: "Disputes",
      },
      { href: "/dashboard/login-audit", icon: Lock, label: "Login Audit" },
      { href: "/dashboard/cards", icon: CreditCard, label: "Cards" },
    ],
  },
  {
    label: "PRODUCTS",
    items: [
      { href: "/dashboard/insurance", icon: Shield, label: "Insurance" },
      { href: "/dashboard/rewards", icon: Gift, label: "Reward Offers" },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { href: "/dashboard/notifications", icon: Bell, label: "Notifications" },
      { href: "/dashboard/zakat", icon: Moon, label: "Zakat Statistics" },
      { href: "/dashboard/audit-log", icon: ScrollText, label: "Audit Log" },
      { href: "/dashboard/ai-monitor", icon: Bot, label: "AI Monitor" },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onCollapse: () => void;
}

export default function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  return (
    <aside
      className={cn(
        "flex flex-col h-full shrink-0 border-r overflow-hidden transition-all duration-300 ease-in-out",
        "border-[#252525] bg-[#111111]",
        collapsed ? "w-0 border-r-0" : "w-60",
      )}
    >
      {/* ── Logo + collapse toggle ──────────────────── */}
      <div className="flex items-center justify-between h-14 border-b border-[#252525] shrink-0 px-5">
        <div className="flex flex-col">
          <span className="font-syne font-bold text-[#f97316] text-[20px] leading-tight select-none">
            SahulatPay
          </span>
          <span className="text-[10px] text-[#4a4a4a] font-dm-sans leading-tight select-none">
            Admin Panel
          </span>
        </div>
        <button
          onClick={onCollapse}
          aria-label="Collapse sidebar"
          className="flex items-center justify-center w-7 h-7 rounded-md text-[#4a4a4a] hover:text-[#888888] hover:bg-[#222222] transition-colors duration-150"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* ── Navigation ─────────────────────────────── */}
      <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden scrollbar-hide">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-1">
            <p className="px-4 pt-3 pb-1.5 text-[9px] font-dm-sans font-semibold uppercase tracking-[0.1em] text-[#4a4a4a] select-none whitespace-nowrap">
              {section.label}
            </p>
            {section.items.map(({ href, icon: Icon, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "relative flex items-center gap-3 mx-2 px-3 py-2 rounded-md text-[13px] font-dm-sans",
                    "transition-all duration-150 whitespace-nowrap overflow-hidden",
                    active
                      ? "bg-[rgba(249,115,22,0.1)] text-[#f97316]"
                      : "text-[#888888] hover:bg-[rgba(249,115,22,0.06)] hover:text-[#f0f0f0]",
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full bg-[#f97316]" />
                  )}
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0",
                      active ? "text-[#f97316]" : "text-[#888888]",
                    )}
                  />
                  <span className="truncate">{label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Admin info + Logout ─────────────────────── */}
      <div className="border-t border-[#252525] p-3 shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-[#1a1a1a] mb-2">
          <div className="w-8 h-8 rounded-full bg-[rgba(249,115,22,0.2)] flex items-center justify-center shrink-0">
            <span className="text-[11px] font-syne font-bold text-[#f97316] select-none">
              SA
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-[#f0f0f0] truncate font-dm-sans leading-tight">
              Super Admin
            </p>
            <p className="text-[11px] text-[#888888] truncate font-dm-sans leading-none mt-0.5">
              admin@sahulatpay.com
            </p>
          </div>
        </div>
        <button
          onClick={adminLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[12px] font-dm-sans text-red-500 hover:bg-[rgba(239,68,68,0.08)] transition-colors duration-150"
        >
          <ArrowRightFromLine className="w-3.5 h-3.5 shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  );
}
