"use client";

import { cn } from "@/lib/utils";

export interface LoadingStateProps {
  rows?: number;
  columns?: number;
  className?: string;
}

const WIDTHS = [80, 100, 70, 110, 60, 90];

export function LoadingState({ rows = 8, columns = 5, className }: LoadingStateProps) {
  return (
    <div className={cn("rounded-xl border border-[#252525] overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <tbody className="divide-y divide-[#252525]">
            {Array.from({ length: rows }, (_, i) => (
              <tr key={i} className={i % 2 === 1 ? "bg-[rgba(255,255,255,0.012)]" : "bg-[#1a1a1a]"}>
                {Array.from({ length: columns }, (_, j) => (
                  <td key={j} className={cn("py-3.5", j === 0 ? "pl-5 pr-4" : "px-4")}>
                    {j === 0 ? (
                      <div className="flex items-center gap-2.5 animate-pulse">
                        <div className="w-7 h-7 rounded-full bg-[#252525] shrink-0" />
                        <div className="space-y-1.5">
                          <div className="h-3 w-24 rounded bg-[#252525]" />
                          <div className="h-2.5 w-16 rounded bg-[#252525]" />
                        </div>
                      </div>
                    ) : (
                      <div
                        className="h-3 rounded animate-pulse"
                        style={{
                          width: `${WIDTHS[(i + j * 3) % WIDTHS.length]}px`,
                          backgroundColor: "rgba(249,115,22,0.07)",
                        }}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
