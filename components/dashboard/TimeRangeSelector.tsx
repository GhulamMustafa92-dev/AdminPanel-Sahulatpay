"use client";

export const TIME_RANGES = ["7D", "30D", "90D"] as const;
export type TimeRange = (typeof TIME_RANGES)[number];

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

export default function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div
      className="flex items-center gap-1 p-1 rounded-lg"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}
    >
      {TIME_RANGES.map((r) => {
        const active = value === r;
        return (
          <button
            key={r}
            onClick={() => onChange(r)}
            className="px-3 py-1 rounded-md text-xs font-dm-sans font-medium transition-all duration-150"
            style={
              active
                ? { background: "#f97316", color: "#fff" }
                : { color: "var(--text-secondary)" }
            }
            onMouseEnter={(e) => {
              if (!active) e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              if (!active) e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            {r}
          </button>
        );
      })}
    </div>
  );
}
