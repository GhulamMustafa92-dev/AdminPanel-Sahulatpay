"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertDialog } from "radix-ui";
import {
  CreditCard, ShieldCheck, ShieldOff, Clock,
  Check, AlertTriangle, X, ChevronLeft, ChevronRight, Loader2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getCards, blockCard, unblockCard,
  type Card, type CardListResponse,
} from "@/lib/api/services/cards";
import AdminCardTable    from "@/components/cards/AdminCardTable";
import CardDeliveryDialog from "@/components/cards/CardDeliveryDialog";
import { useTopNavExtras } from "@/context/TopNavExtrasContext";

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 25;

const STATUS_TABS = [
  { label: "All",              value: ""                 },
  { label: "Active",           value: "active"           },
  { label: "Blocked",          value: "blocked"          },
  { label: "Pending Delivery", value: "pending_delivery" },
];

// ── Toast ─────────────────────────────────────────────────────────────────────

interface ToastState { message: string; type: "success" | "error" }

// ── Mini stat ─────────────────────────────────────────────────────────────────

function MiniStat({
  icon: Icon, label, value, iconCls, bgCls,
}: { icon: LucideIcon; label: string; value: string | number; iconCls: string; bgCls: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-[#1a1a1a] border border-[#252525]">
      <div className={cn("flex items-center justify-center w-9 h-9 rounded-lg shrink-0", bgCls)}>
        <Icon className={cn("w-4 h-4", iconCls)} />
      </div>
      <div>
        <p className="text-[10px] font-dm-sans uppercase tracking-[0.08em] text-[#4a4a4a] leading-none mb-1">{label}</p>
        <p className="font-syne font-bold text-[#f0f0f0] text-[18px] leading-none">{value}</p>
      </div>
    </div>
  );
}

// ── Alert dialog styles ───────────────────────────────────────────────────────

const OVERLAY_CLS =
  "fixed inset-0 z-50 bg-black/70 backdrop-blur-sm " +
  "data-[state=open]:animate-in data-[state=closed]:animate-out " +
  "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200";

const CONTENT_CLS =
  "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 " +
  "w-[420px] max-w-[calc(100vw-2rem)] bg-[#111111] border border-[#252525] " +
  "rounded-2xl shadow-2xl p-6 " +
  "data-[state=open]:animate-in data-[state=closed]:animate-out " +
  "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 " +
  "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CardsPage() {
  const [statusFilter,    setStatusFilter]    = useState("");
  const [page,            setPage]            = useState(1);
  const [blockTarget,     setBlockTarget]     = useState<{ card: Card; action: "block" | "unblock" } | null>(null);
  const [deliveryTarget,  setDeliveryTarget]  = useState<Card | null>(null);
  const [toast,           setToast]           = useState<ToastState | null>(null);

  const queryClient = useQueryClient();
  const { setExtras, clearExtras } = useTopNavExtras();

  const queryKey = ["cards", page, statusFilter];

  const { data, isLoading, refetch } = useQuery<CardListResponse>({
    queryKey,
    queryFn: () => getCards({
      page, per_page: PAGE_LIMIT,
      status: statusFilter || undefined,
    }),
    placeholderData: (prev) => prev,
    refetchInterval: 15_000,
  });

  const handleRefetch = useCallback(() => { refetch(); }, [refetch]);
  useEffect(() => {
    setExtras({ onRefresh: handleRefetch });
    return () => clearExtras();
  }, [handleRefetch, setExtras, clearExtras]);

  const showToast = useCallback((message: string, type: ToastState["type"]) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  }, []);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const blockMutation = useMutation({
    mutationFn: () =>
      blockTarget!.action === "block"
        ? blockCard(blockTarget!.card.id)
        : unblockCard(blockTarget!.card.id),
    onSuccess: () => {
      setBlockTarget(null);
      queryClient.invalidateQueries({ queryKey });
      showToast(
        blockTarget?.action === "block"
          ? "Card has been blocked successfully."
          : "Card has been unblocked successfully.",
        "success"
      );
    },
    onError: () => showToast("Action failed. Please try again.", "error"),
  });

  const total      = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));
  const rangeStart = (page - 1) * PAGE_LIMIT + 1;
  const rangeEnd   = Math.min(page * PAGE_LIMIT, total);

  const resetPage = () => setPage(1);

  return (
    <div className="space-y-5">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[rgba(249,115,22,0.1)] border border-[rgba(249,115,22,0.2)]">
          <CreditCard className="w-4 h-4 text-[#f97316]" />
        </div>
        <div>
          <h2 className="font-syne font-bold text-[#f0f0f0] text-xl leading-tight">Cards</h2>
          <p className="text-[11px] font-dm-sans text-[#888888] leading-none mt-0.5">
            {isLoading ? "Loading…" : `${total.toLocaleString()} card${total !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat icon={CreditCard}   label="Total Cards"     value={data?.total                  ?? "—"} iconCls="text-[#f97316]"  bgCls="bg-[rgba(249,115,22,0.1)]" />
        <MiniStat icon={ShieldCheck}  label="Active"          value={(data?.cards ?? []).filter(c => c.status === "active").length}           iconCls="text-green-400"  bgCls="bg-green-500/10"  />
        <MiniStat icon={ShieldOff}    label="Blocked"         value={(data?.cards ?? []).filter(c => c.status === "blocked").length}          iconCls="text-red-400"    bgCls="bg-red-500/10"    />
        <MiniStat icon={Clock}        label="Pending Delivery" value={(data?.cards ?? []).filter(c => c.status === "pending_delivery").length} iconCls="text-yellow-400" bgCls="bg-yellow-500/10" />
      </div>

      {/* ── Filter tabs ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-[#1a1a1a] border border-[#252525] w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); resetPage(); }}
            className={cn(
              "px-3.5 py-1.5 rounded-md text-[11px] font-dm-sans font-medium transition-all duration-150",
              statusFilter === tab.value
                ? "bg-[rgba(249,115,22,0.12)] text-[#f97316] border border-[rgba(249,115,22,0.2)]"
                : "text-[#888888] hover:text-[#f0f0f0] border border-transparent"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Table ───────────────────────────────────────────────────── */}
      <AdminCardTable
        data={data}
        isLoading={isLoading}
        onBlock={(card)   => setBlockTarget({ card, action: "block"   })}
        onUnblock={(card) => setBlockTarget({ card, action: "unblock" })}
        onUpdateDelivery={(card) => setDeliveryTarget(card)}
      />

      {/* ── Pagination ──────────────────────────────────────────────── */}
      {total > PAGE_LIMIT && (
        <div className="flex items-center justify-between pt-1 px-0.5">
          <span className="text-[12px] font-dm-sans text-[#888888]">
            Showing <span className="text-[#f0f0f0]">{rangeStart}–{rangeEnd}</span> of{" "}
            <span className="text-[#f0f0f0]">{total.toLocaleString()}</span> cards
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#252525] text-[#888888] bg-[#1a1a1a] hover:text-[#f0f0f0] hover:border-[#2d2d2d] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1.5 rounded-lg text-[12px] font-dm-sans text-[#f0f0f0] bg-[rgba(249,115,22,0.08)] border border-[rgba(249,115,22,0.15)]">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#252525] text-[#888888] bg-[#1a1a1a] hover:text-[#f0f0f0] hover:border-[#2d2d2d] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Block / Unblock AlertDialog ──────────────────────────────── */}
      <AlertDialog.Root
        open={!!blockTarget}
        onOpenChange={(v) => { if (!v && !blockMutation.isPending) setBlockTarget(null); }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className={OVERLAY_CLS} />
          <AlertDialog.Content className={CONTENT_CLS}>

            {/* Icon */}
            <div className={cn(
              "flex items-center justify-center w-12 h-12 rounded-2xl mb-5",
              blockTarget?.action === "block"
                ? "bg-red-500/10 border border-red-500/20"
                : "bg-green-500/10 border border-green-500/20"
            )}>
              {blockTarget?.action === "block"
                ? <ShieldOff   className="w-5 h-5 text-red-400"   />
                : <ShieldCheck className="w-5 h-5 text-green-400" />}
            </div>

            <AlertDialog.Title className="font-syne font-bold text-[#f0f0f0] text-[16px] leading-tight mb-1">
              {blockTarget?.action === "block" ? "Block Card" : "Unblock Card"}
            </AlertDialog.Title>
            <AlertDialog.Description className="text-[13px] font-dm-sans text-[#888888] leading-relaxed mb-4">
              {blockTarget?.action === "block"
                ? "Blocking this card will immediately prevent all transactions. The cardholder will be unable to make payments until unblocked."
                : "Unblocking this card will restore full transaction capabilities for the cardholder."}
            </AlertDialog.Description>

            {/* Card detail */}
            {blockTarget && (
              <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#252525] mb-5">
                <span className="font-mono text-[13px] text-[#f0f0f0] tracking-widest">•••• {blockTarget.card.last_four ?? "–"}</span>
                <span className="text-[12px] font-dm-sans text-[#888888] font-mono text-[11px]">{blockTarget.card.user_id.slice(0,8)}…</span>
              </div>
            )}

            <div className="flex gap-3">
              <AlertDialog.Cancel className="flex-1 px-4 py-2.5 rounded-xl text-[13px] font-dm-sans font-medium text-[#888888] border border-[#252525] bg-[#1a1a1a] hover:bg-[#222222] hover:text-[#f0f0f0] transition-colors duration-150">
                Cancel
              </AlertDialog.Cancel>
              <AlertDialog.Action
                onClick={(e) => { e.preventDefault(); blockMutation.mutate(); }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-dm-sans font-semibold border transition-colors duration-150 disabled:opacity-50",
                  blockTarget?.action === "block"
                    ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/15"
                    : "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/15"
                )}
              >
                {blockMutation.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : blockTarget?.action === "block"
                    ? <><ShieldOff   className="w-4 h-4" /> Block Card</>
                    : <><ShieldCheck className="w-4 h-4" /> Unblock Card</>}
              </AlertDialog.Action>
            </div>

          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>

      {/* ── Delivery dialog ──────────────────────────────────────────── */}
      <CardDeliveryDialog
        card={deliveryTarget}
        open={!!deliveryTarget}
        onOpenChange={(v) => { if (!v) setDeliveryTarget(null); }}
        onSuccess={() => {
          showToast("Delivery status updated. Notification sent to cardholder.", "success");
          queryClient.invalidateQueries({ queryKey });
        }}
      />

      {/* ── Toast ───────────────────────────────────────────────────── */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3.5 rounded-xl border shadow-2xl",
          "font-dm-sans text-[13px] max-w-sm",
          toast.type === "success"
            ? "bg-[#0b1a0b] border-green-500/30 text-green-400"
            : "bg-[#1a0b0b] border-red-500/30 text-red-400"
        )}>
          {toast.type === "success"
            ? <Check         className="w-4 h-4 shrink-0" />
            : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => setToast(null)} className="opacity-50 hover:opacity-100 transition-opacity ml-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );
}
