"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterTab {
  label: string;
  value: string;
  count?: number;
}

export interface FilterBarProps {
  search: string;
  onSearch: (value: string) => void;
  filters?: FilterTab[];
  activeFilter?: string;
  onFilterChange?: (value: string) => void;
  searchPlaceholder?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function FilterBar({
  search, onSearch,
  filters, activeFilter, onFilterChange,
  searchPlaceholder = "Search…",
  actions, className,
}: FilterBarProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* Status tabs */}
      {filters && filters.length > 0 && (
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#1a1a1a] border border-[#252525]">
          {filters.map(tab => (
            <button
              key={tab.value}
              onClick={() => onFilterChange?.(tab.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-dm-sans font-medium transition-all duration-150 border",
                activeFilter === tab.value
                  ? "bg-[rgba(249,115,22,0.12)] text-[#f97316] border-[rgba(249,115,22,0.2)]"
                  : "text-[#888888] hover:text-[#f0f0f0] border-transparent",
              )}>
              {tab.label}
              {tab.count != null && (
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-semibold leading-none",
                  activeFilter === tab.value
                    ? "bg-[rgba(249,115,22,0.2)] text-[#f97316]"
                    : "bg-[#252525] text-[#4a4a4a]",
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative ml-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4a4a4a] pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-9 pr-3.5 py-2 rounded-xl bg-[#1a1a1a] border border-[#252525] text-[12px] font-dm-sans text-[#f0f0f0] placeholder:text-[#4a4a4a] focus:outline-none focus:border-[rgba(249,115,22,0.4)] focus:bg-[rgba(249,115,22,0.02)] transition-all duration-150 w-[210px]"
        />
      </div>

      {/* Right-side actions (e.g. ExportButton) */}
      {actions && (
        <div className="flex items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
