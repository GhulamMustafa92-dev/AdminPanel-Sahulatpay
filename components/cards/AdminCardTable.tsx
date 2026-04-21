"use client";

import { ShieldOff, ShieldCheck, Truck, CreditCard, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Card, CardStatus, DeliveryStatus, CardListResponse } from "@/lib/api/services/cards";

// ── Badge configs ─────────────────────────────────────────────────────────────

const CARD_STATUS_CFG: Record<CardStatus, { cls: string; label: string }> = {
  active:           { cls: "bg-green-500/10 text-green-400 border-green-500/20",             label: "Active"           },
  blocked:          { cls: "bg-red-500/10 text-red-400 border-red-500/20",                   label: "Blocked"          },
  pending_delivery: { cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",          label: "Pending Delivery" },
  pending_approval: { cls: "bg-orange-500/10 text-orange-400 border-orange-500/20",          label: "Pending Approval" },
  frozen:           { cls: "bg-blue-500/10 text-blue-400 border-blue-500/20",                label: "Frozen"           },
  processing:       { cls: "bg-[#252525] text-[#888888] border-[#2d2d2d]",                  label: "Processing"       },
};

const DELIVERY_CFG: Record<DeliveryStatus, { cls: string; label: string }> = {
  processing:       { cls: "bg-[#252525] text-[#888888] border-[#2d2d2d]",                           label: "Processing"       },
  dispatched:       { cls: "bg-[rgba(249,115,22,0.1)] text-[#f97316] border-[rgba(249,115,22,0.2)]", label: "Dispatched"       },
  in_transit:       { cls: "bg-[rgba(249,115,22,0.1)] text-[#f97316] border-[rgba(249,115,22,0.2)]", label: "In Transit"       },
  out_for_delivery: { cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",                  label: "Out for Delivery" },
  delivered:        { cls: "bg-green-500/10 text-green-400 border-green-500/20",                     label: "Delivered"        },
};

// ── Helpers ───────────────────────────────────────────────────────────────────


function Badge({ cls, label }: { cls: string; label: string }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-dm-sans font-medium border whitespace-nowrap",
      cls
    )}>
      {label}
    </span>
  );
}

// ── Skeleton row ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-[#252525] animate-pulse">
      <td className="pl-5 pr-4 py-3.5">
        <div className="space-y-1.5">
          <div className="h-3.5 w-32 rounded bg-[#252525]" />
          <div className="h-4 w-16 rounded-full bg-[#252525]" />
        </div>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#252525] shrink-0" />
          <div className="space-y-1.5">
            <div className="h-3 w-24 rounded bg-[#252525]" />
            <div className="h-2.5 w-16 rounded bg-[#252525]" />
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5"><div className="h-8 w-40 rounded-lg bg-[#252525]" /></td>
      <td className="px-4 py-3.5"><div className="h-4 w-28 rounded-full bg-[#252525]" /></td>
      <td className="px-4 py-3.5"><div className="h-4 w-16 rounded-full bg-[#252525]" /></td>
      <td className="pr-5 py-3.5"><div className="h-7 w-24 rounded bg-[#252525] mx-auto" /></td>
    </tr>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

const COLS = ["Card", "User", "Monthly Spend", "Delivery Status", "Status", "Actions"];

interface AdminCardTableProps {
  data:             CardListResponse | undefined;
  isLoading:        boolean;
  onBlock:          (card: Card) => void;
  onUnblock:        (card: Card) => void;
  onUpdateDelivery: (card: Card) => void;
  onApprove:        (card: Card) => void;
  onReject:         (card: Card) => void;
}

export default function AdminCardTable({
  data, isLoading, onBlock, onUnblock, onUpdateDelivery, onApprove, onReject,
}: AdminCardTableProps) {
  const cards = data?.cards ?? [];

  return (
    <div className="rounded-xl border border-[#252525] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">

          {/* ── Header ─────────────────────────────────────── */}
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

          {/* ── Body ───────────────────────────────────────── */}
          <tbody className="divide-y divide-[#252525]">
            {isLoading ? (
              Array.from({ length: 8 }, (_, i) => <SkeletonRow key={i} />)
            ) : cards.length === 0 ? (
              <tr>
                <td colSpan={COLS.length} className="py-20 text-center bg-[#1a1a1a]">
                  <div className="flex flex-col items-center gap-3">
                    <CreditCard className="w-8 h-8 text-[#2d2d2d]" />
                    <p className="text-[13px] font-dm-sans text-[#888888]">No cards found</p>
                    <p className="text-[11px] font-dm-sans text-[#4a4a4a]">Try adjusting your filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              cards.map((card, idx) => (
                <tr
                  key={card.id}
                  className={cn(
                    "group transition-colors duration-100 hover:bg-[rgba(249,115,22,0.04)]",
                    idx % 2 === 1 ? "bg-[rgba(255,255,255,0.012)]" : "bg-[#1a1a1a]"
                  )}
                >
                  {/* Card number + type */}
                  <td className="pl-5 pr-4 py-3.5 border-l-2 border-l-transparent group-hover:border-l-[#f97316] transition-colors duration-100">
                    <p className="font-mono text-[13px] text-[#f0f0f0] tracking-widest leading-tight">
                      •••• {card.last_four ?? "––"}
                    </p>
                    <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[9px] font-dm-sans font-semibold uppercase tracking-[0.06em] border bg-[#252525] text-[#888888] border-[#2d2d2d]">
                      {card.card_type || "Card"}
                    </span>
                  </td>

                  {/* User */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[rgba(249,115,22,0.1)] flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-syne font-bold text-[#f97316] select-none">
                          {card.user_id.slice(0,2).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-mono text-[11px] text-[#888888] leading-tight truncate">
                          {card.user_id.slice(0,8)}…
                        </p>
                        <p className="text-[10px] font-dm-sans text-[#4a4a4a] mt-0.5 capitalize">
                          {card.network ?? card.card_type}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Created at */}
                  <td className="px-4 py-3.5">
                    <span className="text-[11px] font-dm-sans text-[#888888]">{new Date(card.created_at).toLocaleDateString()}</span>
                  </td>

                  {/* Delivery status */}
                  <td className="px-4 py-3.5">
                    {card.delivery_status
                      ? <Badge {...DELIVERY_CFG[card.delivery_status]} />
                      : <span className="text-[12px] font-dm-sans text-[#4a4a4a]">—</span>}
                  </td>

                  {/* Card status */}
                  <td className="px-4 py-3.5">
                    <Badge {...CARD_STATUS_CFG[card.status]} />
                  </td>

                  {/* Actions */}
                  <td className="pr-5 py-3.5">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Approve / Reject for pending_approval */}
                      {card.status === "pending_approval" ? (
                        <>
                          <button
                            onClick={() => onApprove(card)}
                            title="Approve card"
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-dm-sans font-medium bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/15 transition-colors duration-150"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Approve
                          </button>
                          <button
                            onClick={() => onReject(card)}
                            title="Reject card"
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-dm-sans font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/15 transition-colors duration-150"
                          >
                            <X className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </>
                      ) : card.status === "blocked" ? (
                        <button
                          onClick={() => onUnblock(card)}
                          title="Unblock card"
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-dm-sans font-medium bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/15 transition-colors duration-150"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Unblock
                        </button>
                      ) : (
                        <button
                          onClick={() => onBlock(card)}
                          title="Block card"
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-dm-sans font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/15 transition-colors duration-150"
                        >
                          <ShieldOff className="w-3.5 h-3.5" />
                          Block
                        </button>
                      )}
                      {/* Delivery update */}
                      {card.delivery_status && (
                        <button
                          onClick={() => onUpdateDelivery(card)}
                          title="Update delivery status"
                          className="flex items-center justify-center w-7 h-7 rounded-lg text-[#888888] hover:bg-[rgba(249,115,22,0.08)] hover:text-[#f97316] border border-[#252525] hover:border-[rgba(249,115,22,0.2)] transition-all duration-150"
                        >
                          <Truck className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
