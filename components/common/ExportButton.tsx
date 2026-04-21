"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExportColumn {
  key: string;
  label: string;
}

export interface ExportButtonProps {
  data: Record<string, unknown>[];
  filename: string;
  columns: ExportColumn[];
  disabled?: boolean;
  className?: string;
}

export function ExportButton({ data, filename, columns, disabled, className }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!data.length) return;
    setExporting(true);
    try {
      const esc  = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const head = columns.map(c => esc(c.label)).join(",");
      const rows = data.map(row => columns.map(c => esc(row[c.key])).join(","));
      const csv  = [head, ...rows].join("\n");
      const href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      const a    = Object.assign(document.createElement("a"), {
        href,
        download: `${filename}_${Date.now()}.csv`,
      });
      a.click();
      URL.revokeObjectURL(href);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={disabled || exporting || !data.length}
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-dm-sans font-medium",
        "border border-[#252525] bg-[#1a1a1a] text-[#888888]",
        "hover:text-[#f0f0f0] hover:border-[rgba(249,115,22,0.3)] hover:bg-[rgba(249,115,22,0.04)]",
        "transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed",
        className,
      )}>
      {exporting
        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
        : <Download className="w-3.5 h-3.5" />}
      {exporting ? "Exporting…" : "Export CSV"}
    </button>
  );
}
