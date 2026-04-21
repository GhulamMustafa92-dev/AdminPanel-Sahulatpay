"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

export interface EmptyStateProps {
  icon?: LucideIcon | React.ReactNode;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-8 text-center", className)}>
      {Icon && (
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[rgba(249,115,22,0.07)] border border-[rgba(249,115,22,0.12)] mb-4">
          {typeof Icon === "function"
            ? <Icon className="w-6 h-6 text-[#f97316] opacity-50" />
            : Icon}
        </div>
      )}
      <p className="font-syne font-semibold text-[#888888] text-[14px] leading-tight">{title}</p>
      {description && (
        <p className="text-[12px] font-dm-sans text-[#4a4a4a] mt-2 max-w-[280px] leading-relaxed">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 rounded-xl text-[12px] font-dm-sans font-medium bg-[rgba(249,115,22,0.1)] text-[#f97316] border border-[rgba(249,115,22,0.2)] hover:bg-[rgba(249,115,22,0.15)] transition-colors duration-150">
          {action.label}
        </button>
      )}
    </div>
  );
}
