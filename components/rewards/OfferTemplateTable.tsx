"use client";

import { Pencil, UserPlus, Trash2, Gift } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { OfferTemplate, OfferListResponse } from "@/lib/api/services/rewards";

// ── Custom Switch ─────────────────────────────────────────────────────────────

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 cursor-pointer rounded-full border-2 border-transparent",
        "transition-colors duration-200 focus:outline-none shrink-0",
        checked ? "bg-[#f97316]" : "bg-[#2d2d2d]"
      )}
    >
      <span className={cn(
        "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm",
        "transition-transform duration-200",
        checked ? "translate-x-4" : "translate-x-0"
      )} />
    </button>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function safeDate(d: string) {
  try { return format(new Date(d), "MMM d, yyyy"); } catch { return "—"; }
}

function isExpired(d: string) {
  try { return new Date(d) < new Date(); } catch { return false; }
}

// ── Skeleton row ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-[#252525] animate-pulse">
      <td className="pl-5 pr-4 py-3.5"><div className="h-3.5 w-36 rounded bg-[#252525]" /></td>
      <td className="px-4 py-3.5"><div className="h-4 w-20 rounded-full bg-[#252525]" /></td>
      <td className="px-4 py-3.5"><div className="h-3.5 w-16 rounded bg-[#252525]" /></td>
      <td className="px-4 py-3.5"><div className="h-3.5 w-20 rounded bg-[#252525]" /></td>
      <td className="px-4 py-3.5"><div className="h-3.5 w-24 rounded bg-[#252525]" /></td>
      <td className="px-4 py-3.5"><div className="h-5 w-9 rounded-full bg-[#252525]" /></td>
      <td className="px-4 py-3.5"><div className="h-6 w-28 rounded bg-[#252525]" /></td>
      <td className="pr-5 py-3.5"><div className="h-7 w-20 rounded bg-[#252525] mx-auto" /></td>
    </tr>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

const COLS = ["Name", "Type", "Discount", "Min Spend", "Expiry", "Status", "Completion", "Actions"];

const TYPE_COLORS: Record<string, string> = {
  cashback: "bg-green-500/10 text-green-400 border-green-500/20",
  discount: "bg-[rgba(249,115,22,0.1)] text-[#f97316] border-[rgba(249,115,22,0.2)]",
  voucher:  "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  referral: "bg-[#252525] text-[#888888] border-[#2d2d2d]",
};

interface OfferTemplateTableProps {
  data:      OfferListResponse | undefined;
  isLoading: boolean;
  onToggle:  (id: string, is_active: boolean) => void;
  onEdit:    (template: OfferTemplate) => void;
  onAssign:  (template: OfferTemplate) => void;
  onDelete:  (template: OfferTemplate) => void;
}

export default function OfferTemplateTable({
  data, isLoading, onToggle, onEdit, onAssign, onDelete,
}: OfferTemplateTableProps) {
  const templates = data?.templates ?? [];

  return (
    <div className="rounded-xl border border-[#252525] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px]">

          {/* ── Header ─────────────────────────────────── */}
          <thead>
            <tr className="bg-[#111111] border-b border-[#252525]">
              {COLS.map((col, i) => (
                <th
                  key={col}
                  className={cn(
                    "py-3 text-[10px] font-dm-sans font-semibold uppercase tracking-[0.09em] text-[#4a4a4a]",
                    i === 0               ? "pl-5 pr-4 text-left"  :
                    i === COLS.length - 1 ? "pr-5 text-center"     : "px-4 text-left"
                  )}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          {/* ── Body ───────────────────────────────────── */}
          <tbody className="divide-y divide-[#252525]">
            {isLoading ? (
              Array.from({ length: 6 }, (_, i) => <SkeletonRow key={i} />)
            ) : templates.length === 0 ? (
              <tr>
                <td colSpan={COLS.length} className="py-20 text-center bg-[#1a1a1a]">
                  <div className="flex flex-col items-center gap-3">
                    <Gift className="w-8 h-8 text-[#2d2d2d]" />
                    <p className="text-[13px] font-dm-sans text-[#888888]">No offer templates yet</p>
                    <p className="text-[11px] font-dm-sans text-[#4a4a4a]">Click "Create Template" to add one</p>
                  </div>
                </td>
              </tr>
            ) : (
              templates.map((t, idx) => {
                const expired = isExpired(t.expiry_date);
                const pct     = Math.min(t.completion_rate, 100);
                return (
                  <tr
                    key={t.id}
                    className={cn(
                      "group transition-colors duration-100 hover:bg-[rgba(249,115,22,0.04)]",
                      idx % 2 === 1 ? "bg-[rgba(255,255,255,0.012)]" : "bg-[#1a1a1a]"
                    )}
                  >
                    {/* Name */}
                    <td className="pl-5 pr-4 py-3.5 border-l-2 border-l-transparent group-hover:border-l-[#f97316] transition-colors duration-100">
                      <p className="text-[13px] font-dm-sans font-medium text-[#f0f0f0] leading-tight truncate max-w-[160px]">
                        {t.name}
                      </p>
                      {t.description && (
                        <p className="text-[11px] font-dm-sans text-[#4a4a4a] mt-0.5 truncate max-w-[160px]">
                          {t.description}
                        </p>
                      )}
                    </td>

                    {/* Type badge */}
                    <td className="px-4 py-3.5">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-dm-sans font-semibold border capitalize",
                        TYPE_COLORS[t.type] ?? TYPE_COLORS.referral
                      )}>
                        {t.type}
                      </span>
                    </td>

                    {/* Discount */}
                    <td className="px-4 py-3.5">
                      <span className="text-[13px] font-syne font-bold text-[#f97316] tabular-nums">
                        {t.discount_type === "percent" ? `${t.value}%` : `Rs. ${t.value.toLocaleString()}`}
                      </span>
                    </td>

                    {/* Min spend */}
                    <td className="px-4 py-3.5">
                      <span className="text-[12px] font-dm-sans text-[#888888] tabular-nums">
                        Rs. {t.min_spend.toLocaleString()}
                      </span>
                    </td>

                    {/* Expiry */}
                    <td className="px-4 py-3.5">
                      <span className={cn(
                        "text-[12px] font-dm-sans tabular-nums",
                        expired ? "text-red-400" : "text-[#888888]"
                      )}>
                        {safeDate(t.expiry_date)}
                        {expired && <span className="ml-1 text-[10px] text-red-400/70">expired</span>}
                      </span>
                    </td>

                    {/* Status toggle */}
                    <td className="px-4 py-3.5">
                      <Switch
                        checked={t.is_active}
                        onChange={(v) => onToggle(t.id, v)}
                      />
                    </td>

                    {/* Completion rate */}
                    <td className="px-4 py-3.5">
                      <div className="min-w-[110px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-[#252525] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#f97316] transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-dm-sans text-[#888888] tabular-nums shrink-0 w-[34px] text-right">
                            {pct}%
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="pr-5 py-3.5">
                      <div className="flex items-center justify-center gap-0.5">
                        <button
                          onClick={() => onEdit(t)}
                          title="Edit template"
                          className="flex items-center justify-center w-7 h-7 rounded-md text-[#888888] hover:bg-[rgba(249,115,22,0.08)] hover:text-[#f97316] transition-colors duration-150"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onAssign(t)}
                          title="Assign to users"
                          className="flex items-center justify-center w-7 h-7 rounded-md text-[#888888] hover:bg-green-500/10 hover:text-green-400 transition-colors duration-150"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(t)}
                          title="Delete template"
                          className="flex items-center justify-center w-7 h-7 rounded-md text-[#888888] hover:bg-red-500/10 hover:text-red-400 transition-colors duration-150"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
