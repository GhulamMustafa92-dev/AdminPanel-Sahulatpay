"use client";

import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: number;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, badge, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="font-syne font-bold text-[#f0f0f0] text-xl leading-tight">{title}</h1>
          {badge != null && (
            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-dm-sans font-semibold bg-[rgba(249,115,22,0.1)] text-[#f97316] border border-[rgba(249,115,22,0.2)]">
              {badge.toLocaleString()}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-[12px] font-dm-sans text-[#888888] mt-1 leading-none">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}
