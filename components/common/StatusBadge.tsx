"use client";

import { cn } from "@/lib/utils";

type BadgeVariant = "green" | "yellow" | "orange" | "red" | "gray" | "purple" | "blue";

const VARIANT_CLS: Record<BadgeVariant, string> = {
  green:  "bg-green-500/10 text-green-400 border-green-500/20",
  yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  orange: "bg-[rgba(249,115,22,0.1)] text-[#f97316] border-[rgba(249,115,22,0.2)]",
  red:    "bg-red-500/10 text-red-400 border-red-500/20",
  gray:   "bg-[#252525] text-[#888888] border-[#2d2d2d]",
  purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  blue:   "bg-sky-500/10 text-sky-400 border-sky-500/20",
};

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  // green
  active:      "green",
  completed:   "green",
  approved:    "green",
  success:     "green",
  verified:    "green",
  matured:     "green",
  settled:     "green",
  paid:        "green",
  // yellow
  pending:     "yellow",
  processing:  "yellow",
  // orange
  partial:     "orange",
  // red
  failed:      "red",
  rejected:    "red",
  blocked:     "red",
  flagged:     "red",
  fraud:       "red",
  // gray
  cancelled:   "gray",
  inactive:    "gray",
  withdrawn:   "gray",
  expired:     "gray",
  // purple
  escalated:   "purple",
};

export interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const variant = STATUS_VARIANT[status.toLowerCase()] ?? "gray";
  const cls     = VARIANT_CLS[variant];
  const display = label
    ?? status.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-dm-sans font-semibold border whitespace-nowrap", cls, className)}>
      {display}
    </span>
  );
}
