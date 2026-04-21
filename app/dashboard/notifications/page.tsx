"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog } from "radix-ui";
import { Bell, X, Check, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  getBroadcastHistory,
  type BroadcastHistoryItem,
  type BroadcastStatus,
  type NotificationType,
} from "@/lib/api/services/notifications";
import BroadcastForm from "@/components/notifications/BroadcastForm";
import { useTopNavExtras } from "@/context/TopNavExtrasContext";

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<BroadcastStatus, { cls: string; label: string }> = {
  sent:    { cls: "bg-green-500/10 text-green-400 border-green-500/20",             label: "Sent"    },
  failed:  { cls: "bg-red-500/10 text-red-400 border-red-500/20",                   label: "Failed"  },
  pending: { cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",          label: "Pending" },
};

const TYPE_CLS: Record<NotificationType, string> = {
  promotional:   "bg-[rgba(249,115,22,0.1)] text-[#f97316] border-[rgba(249,115,22,0.2)]",
  transactional: "bg-green-500/10 text-green-400 border-green-500/20",
  alert:         "bg-red-500/10 text-red-400 border-red-500/20",
  system:        "bg-[#252525] text-[#888888] border-[#2d2d2d]",
};

// ── Dialog styles ─────────────────────────────────────────────────────────────

const OVERLAY_CLS =
  "fixed inset-0 z-50 bg-black/70 backdrop-blur-sm " +
  "data-[state=open]:animate-in data-[state=closed]:animate-out " +
  "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200";

const CONTENT_CLS =
  "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 " +
  "w-[460px] max-w-[calc(100vw-2rem)] bg-[#111111] border border-[#252525] " +
  "rounded-2xl shadow-2xl p-6 " +
  "data-[state=open]:animate-in data-[state=closed]:animate-out " +
  "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 " +
  "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200";

// ── Toast ─────────────────────────────────────────────────────────────────────

interface ToastState { message: string; type: "success" | "error" }

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [detail, setDetail] = useState<BroadcastHistoryItem | null>(null);
  const [toast,  setToast]  = useState<ToastState | null>(null);

  const { setExtras, clearExtras } = useTopNavExtras();
  const queryKey = ["broadcast-history"];

  const { data, isLoading, refetch } = useQuery({
    queryKey,
    queryFn:  getBroadcastHistory,
  });

  const handleRefetch = useCallback(() => { refetch(); }, [refetch]);
  useEffect(() => {
    setExtras({ onRefresh: handleRefetch });
    return () => clearExtras();
  }, [handleRefetch, setExtras, clearExtras]);

  const showToast = (message: string, type: ToastState["type"]) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const items = data?.items ?? [];

  return (
    <div className="space-y-5">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[rgba(249,115,22,0.1)] border border-[rgba(249,115,22,0.2)]">
          <Bell className="w-4 h-4 text-[#f97316]" />
        </div>
        <div>
          <h2 className="font-syne font-bold text-[#f0f0f0] text-xl leading-tight">Broadcast Notifications</h2>
          <p className="text-[11px] font-dm-sans text-[#888888] leading-none mt-0.5">
            Send push notifications to users
          </p>
        </div>
      </div>

      {/* ── Two-column layout ────────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row gap-5 items-start">

        {/* ── LEFT: Form card ───────────────────────────────────────── */}
        <div className="w-full xl:w-[55%] shrink-0 rounded-2xl bg-[#111111] border border-[#252525] p-5">
          <h3 className="font-syne font-bold text-[#f0f0f0] text-[14px] leading-tight mb-4">
            Compose Broadcast
          </h3>
          <BroadcastForm
            onSuccess={() => {
              refetch();
              showToast("Notification broadcast sent successfully.", "success");
            }}
          />
        </div>

        {/* ── RIGHT: History ────────────────────────────────────────── */}
        <div className="w-full xl:flex-1 min-w-0 rounded-2xl border border-[#252525] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 bg-[#111111] border-b border-[#252525]">
            <h3 className="font-syne font-bold text-[#f0f0f0] text-[14px] leading-tight">Send History</h3>
            <span className="text-[11px] font-dm-sans text-[#4a4a4a]">
              {isLoading ? "…" : `${data?.total ?? 0} broadcast${(data?.total ?? 0) !== 1 ? "s" : ""}`}
            </span>
          </div>

          {isLoading ? (
            <div className="divide-y divide-[#252525]">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5 bg-[#1a1a1a] animate-pulse">
                  <div className="h-3.5 w-40 rounded bg-[#252525] flex-1" />
                  <div className="h-4 w-20 rounded-full bg-[#252525]" />
                  <div className="h-3.5 w-16 rounded bg-[#252525]" />
                  <div className="h-4 w-14 rounded-full bg-[#252525]" />
                  <div className="h-3 w-20 rounded bg-[#252525]" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-[#1a1a1a] gap-3">
              <Bell className="w-8 h-8 text-[#2d2d2d]" />
              <p className="text-[13px] font-dm-sans text-[#888888]">No broadcasts sent yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px]">
                <thead>
                  <tr className="bg-[#111111] border-b border-[#252525]">
                    {["Title", "Type", "Sent To", "Status", "Date"].map((col, i) => (
                      <th key={col} className={cn(
                        "py-2.5 text-[10px] font-dm-sans font-semibold uppercase tracking-[0.09em] text-[#4a4a4a]",
                        i === 0 ? "pl-5 pr-4 text-left" : "px-3 text-left"
                      )}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#252525]">
                  {items.map((item, idx) => (
                    <tr
                      key={item.id}
                      onClick={() => setDetail(item)}
                      className={cn(
                        "cursor-pointer transition-colors duration-100 hover:bg-[rgba(249,115,22,0.04)]",
                        idx % 2 === 1 ? "bg-[rgba(255,255,255,0.012)]" : "bg-[#1a1a1a]"
                      )}
                    >
                      <td className="pl-5 pr-4 py-3 border-l-2 border-l-transparent hover:border-l-[#f97316] transition-colors">
                        <p className="text-[12px] font-dm-sans font-medium text-[#f0f0f0] truncate max-w-[160px]">{item.title}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-dm-sans font-medium border capitalize",
                          TYPE_CLS[item.notification_type]
                        )}>
                          {item.notification_type}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-[12px] font-dm-sans text-[#888888] tabular-nums">
                          {item.target_all ? "All users" : `${item.recipient_count.toLocaleString()}`}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-dm-sans font-medium border",
                          STATUS_CFG[item.status].cls
                        )}>
                          {STATUS_CFG[item.status].label}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-[11px] font-dm-sans text-[#4a4a4a] tabular-nums whitespace-nowrap">
                          {(() => { try { return format(new Date(item.sent_at), "MMM d, h:mm a"); } catch { return "—"; } })()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Detail modal ─────────────────────────────────────────────── */}
      <Dialog.Root open={!!detail} onOpenChange={(v) => { if (!v) setDetail(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className={OVERLAY_CLS} />
          <Dialog.Content className={CONTENT_CLS} aria-describedby="notif-detail-desc">
            <div className="flex items-start justify-between mb-5">
              <span className={cn(
                "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-dm-sans font-semibold border capitalize",
                detail ? TYPE_CLS[detail.notification_type] : ""
              )}>
                {detail?.notification_type}
              </span>
              <Dialog.Close className="flex items-center justify-center w-8 h-8 rounded-lg text-[#4a4a4a] hover:text-[#888888] hover:bg-[#222222] transition-colors">
                <X className="w-4 h-4" />
              </Dialog.Close>
            </div>

            <Dialog.Title className="font-syne font-bold text-[#f0f0f0] text-[16px] leading-snug mb-2">
              {detail?.title}
            </Dialog.Title>
            <Dialog.Description id="notif-detail-desc" className="text-[13px] font-dm-sans text-[#888888] leading-relaxed mb-5">
              {detail?.body}
            </Dialog.Description>

            <div className="space-y-2 p-4 rounded-xl bg-[#1a1a1a] border border-[#252525]">
              {[
                { label: "Status",    value: detail ? STATUS_CFG[detail.status].label : "—" },
                { label: "Sent To",   value: detail ? (detail.target_all ? "All Active Users" : `${detail.recipient_count.toLocaleString()} users`) : "—" },
                { label: "Sent At",   value: detail?.sent_at ? (() => { try { return format(new Date(detail.sent_at), "MMM d, yyyy · h:mm a"); } catch { return "—"; } })() : "—" },
                { label: "Sent By",   value: detail?.created_by ?? "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-dm-sans text-[#4a4a4a] uppercase tracking-[0.06em]">{label}</span>
                  <span className="text-[12px] font-dm-sans font-medium text-[#f0f0f0] text-right">{value}</span>
                </div>
              ))}
            </div>

            <Dialog.Close className="mt-4 w-full px-4 py-2.5 rounded-xl text-[13px] font-dm-sans font-medium text-[#888888] border border-[#252525] bg-[#1a1a1a] hover:bg-[#222222] hover:text-[#f0f0f0] transition-colors duration-150">
              Close
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

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
            ? <Check className="w-4 h-4 shrink-0" />
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
