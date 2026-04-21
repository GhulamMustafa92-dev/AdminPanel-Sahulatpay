"use client";

interface CardProgressBarProps {
  spent: number;
  limit: number;
}

export default function CardProgressBar({ spent, limit }: CardProgressBarProps) {
  const pct   = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const color = pct > 85 ? "#f87171" : pct > 60 ? "#facc15" : "#22c55e";

  return (
    <div className="min-w-[148px] max-w-[180px]">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-dm-sans text-[#888888] tabular-nums leading-none">
          Rs.&nbsp;{spent.toLocaleString()}
          <span className="text-[#4a4a4a]"> / {limit.toLocaleString()}</span>
        </span>
        <span
          className="text-[11px] font-dm-sans font-semibold tabular-nums leading-none ml-2"
          style={{ color }}
        >
          {pct.toFixed(0)}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-[#252525] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
