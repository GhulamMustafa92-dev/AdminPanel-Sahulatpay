"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  RotateCcw, CheckCircle2, XCircle, Clock, AlertTriangle, X, Check,
  ChevronLeft, ChevronRight, Loader2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { format } from "date-fns";
import { Dialog } from "radix-ui";
import { cn } from "@/lib/utils";
import {
  getReversalRequests, reviewReversalRequest,
  type ReversalRequest, type ReversalRequestsResponse,
} from "@/lib/api/services/reversal-requests";
import { useTopNavExtras } from "@/context/TopNavExtrasContext";

// ── Constants ──────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 20;

const STATUS_TABS = [
  { label: "Pending",  value: "pending"  },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

const STATUS_BADGE: Record<string, string> = {
  pending:  "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  approved: "bg-green-500/10 text-green-400 border-green-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};

const REASON_BADGE: Record<string, string> = {
  fraud_confirmed:    "bg-red-500/10 text-red-400 border-red-500/20",
  erroneous_transfer: "bg-[rgba(249,115,22,0.1)] text-[#f97316] border-[rgba(249,115,22,0.2)]",
  dispute_resolved:   "bg-green-500/10 text-green-400 border-green-500/20",
};

interface ToastState { message: string; type: "success" | "error" }

const OVERLAY_CLS =
  "fixed inset-0 z-50 bg-black/70 backdrop-blur-sm " +
  "data-[state=open]:animate-in data-[state=closed]:animate-out " +
  "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200";

const CONTENT_CLS =
  "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 " +
  "w-[520px] max-w-[calc(100vw-2rem)] bg-[#111111] border border-[#252525] " +
  "rounded-2xl shadow-2xl p-6 " +
  "data-[state=open]:animate-in data-[state=closed]:animate-out " +
  "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 " +
  "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200";

// ── Mini stat card ─────────────────────────────────────────────────────────────

function MiniStat({
  icon: Icon, label, value, iconCls, bgCls,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  iconCls: string;
  bgCls: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-[#1a1a1a] border border-[#252525]">
      <div className={cn("flex items-center justify-center w-9 h-9 rounded-lg shrink-0", bgCls)}>
        <Icon className={cn("w-4 h-4", iconCls)} />
      </div>
      <div>
        <p className="text-[10px] font-dm-sans uppercase tracking-[0.08em] text-[#4a4a4a] leading-none mb-1">
          {label}
        </p>
        <p className="font-syne font-bold text-[#f0f0f0] text-[18px] leading-none">{value}</p>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function safeDate(d?: string) {
  if (!d) return "—";
  try { return format(new Date(d), "MMM d, yyyy · h:mm a"); } catch { return "—"; }
}

function trunc(str: string, len: number) {
  if (!str) return "—";
  return str.length > len ? str.slice(0, len) + "…" : str;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReversalRequestsPage() {
  const [statusFilter, setStatusFilter] = useState("pending");
  const [page,         setPage]         = useState(1);
  const [selectedReq,  setSelectedReq]  = useState<ReversalRequest | null>(null);
  const [decision,     setDecision]     = useState<"approved" | "rejected">("approved");
  const [reviewNote,   setReviewNote]   = useState("");
  const [dialogOpen,   setDialogOpen]   = useState(false);
  const [toast,        setToast]        = useState<ToastState | null>(null);

  const { setExtras, clearExtras } = useTopNavExtras();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery<ReversalRequestsResponse>({
    queryKey: ["reversal-requests", page, statusFilter],
    queryFn: () => getReversalRequests({ page, per_page: PAGE_LIMIT, status: statusFilter }),
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

  // ── Mutation ───────────────────────────────────────────────────────────────

  const reviewMutation = useMutation({
    mutationFn: () =>
      reviewReversalRequest(selectedReq!.id, decision, reviewNote.trim() || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reversal-requests"] });
      closeDialog();
      showToast(
        decision === "approved"
          ? "Reversal request approved successfully."
          : "Reversal request rejected.",
        "success"
      );
    },
    onError: () => showToast("Failed to review reversal request.", "error"),
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  const closeDialog = () => {
    setSelectedReq(null);
    setDialogOpen(false);
    setReviewNote("");
  };

  const openDialog = (req: ReversalRequest, initialDecision: "approved" | "rejected") => {
    setSelectedReq(req);
    setDecision(initialDecision);
    setReviewNote("");
    setDialogOpen(true);
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const requests      = data?.requests ?? [];
  const pendingCount  = requests.filter(r => r.status === "pending").length;
  const approvedCount = requests.filter(r => r.status === "approved").length;
  const rejectedCount = requests.filter(r => r.status === "rejected").length;
  const hasNextPage   = requests.length >= PAGE_LIMIT;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[rgba(249,115,22,0.1)] border border-[rgba(249,115,22,0.2)]">
          <RotateCcw className="w-4 h-4 text-[#f97316]" />
        </div>
        <div>
          <h2 className="font-syne font-bold text-[#f0f0f0] text-xl leading-tight">
            Reversal Requests
          </h2>
          <p className="text-[11px] font-dm-sans text-[#888888] leading-none mt-0.5">
            Maker-Checker approval flow for transaction reversals
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat
          icon={RotateCcw}    label="Total"
          value={requests.length}
          iconCls="text-[#f97316]"  bgCls="bg-[rgba(249,115,22,0.1)]"
        />
        <MiniStat
          icon={Clock}        label="Pending"
          value={pendingCount}
          iconCls="text-yellow-400" bgCls="bg-yellow-500/10"
        />
        <MiniStat
          icon={CheckCircle2} label="Approved"
          value={approvedCount}
          iconCls="text-green-400"  bgCls="bg-green-500/10"
        />
        <MiniStat
          icon={XCircle}      label="Rejected"
          value={rejectedCount}
          iconCls="text-red-400"    bgCls="bg-red-500/10"
        />
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-[#1a1a1a] border border-[#252525] w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className={cn(
              "px-3 py-1.5 rounded-md text-[11px] font-dm-sans font-medium transition-all duration-150",
              statusFilter === tab.value
                ? "bg-[rgba(249,115,22,0.12)] text-[#f97316] border border-[rgba(249,115,22,0.2)]"
                : "text-[#888888] hover:text-[#f0f0f0] border border-transparent"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#252525] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#111111] border-b border-[#252525]">
              {["Txn ID", "Reason Code", "Requested By", "Status", "Created At", "Actions"].map(
                (col, i) => (
                  <th
                    key={col}
                    className={cn(
                      "py-2.5 text-[10px] font-dm-sans font-semibold uppercase tracking-[0.09em] text-[#4a4a4a]",
                      i === 0 ? "pl-5 pr-3 text-left" : "px-4 text-left"
                    )}
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#252525]">
            {isLoading ? (
              Array.from({ length: 5 }, (_, i) => (
                <tr key={i} className="animate-pulse bg-[#1a1a1a]">
                  {Array.from({ length: 6 }, (_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-3 rounded bg-[#252525]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center bg-[#1a1a1a]">
                  <p className="text-[12px] font-dm-sans text-[#4a4a4a]">
                    No reversal requests found for this status.
                  </p>
                </td>
              </tr>
            ) : (
              requests.map((r, idx) => (
                <tr
                  key={r.id}
                  className={cn(
                    "group hover:bg-[rgba(249,115,22,0.03)] transition-colors",
                    idx % 2 === 1 ? "bg-[rgba(255,255,255,0.012)]" : "bg-[#1a1a1a]"
                  )}
                >
                  {/* Txn ID */}
                  <td className="pl-5 pr-3 py-3">
                    <span className="font-mono text-[12px] text-[#f0f0f0]">
                      {trunc(r.txn_id, 8)}
                    </span>
                  </td>

                  {/* Reason Code */}
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex px-2 py-0.5 rounded-full text-[10px] font-dm-sans font-semibold border capitalize",
                        REASON_BADGE[r.reason_code] ?? "bg-[#252525] text-[#888888] border-[#252525]"
                      )}
                    >
                      {r.reason_code.replace(/_/g, " ")}
                    </span>
                  </td>

                  {/* Requested By */}
                  <td className="px-4 py-3">
                    <span className="font-mono text-[12px] text-[#888888]">
                      {trunc(r.requested_by, 8)}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex px-2 py-0.5 rounded-full text-[10px] font-dm-sans font-semibold border capitalize",
                        STATUS_BADGE[r.status] ?? "bg-[#252525] text-[#888888] border-[#252525]"
                      )}
                    >
                      {r.status}
                    </span>
                  </td>

                  {/* Created At */}
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-dm-sans text-[#888888]">
                      {safeDate(r.created_at)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    {r.status === "pending" ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openDialog(r, "approved")}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-dm-sans font-medium bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/15 transition-colors"
                        >
                          <Check className="w-3 h-3" /> Approve
                        </button>
                        <button
                          onClick={() => openDialog(r, "rejected")}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-dm-sans font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/15 transition-colors"
                        >
                          <X className="w-3 h-3" /> Reject
                        </button>
                      </div>
                    ) : r.review_note ? (
                      <span className="text-[11px] font-dm-sans text-[#4a4a4a] italic">
                        {trunc(r.review_note, 30)}
                      </span>
                    ) : (
                      <span className="text-[11px] font-dm-sans text-[#4a4a4a]">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {(page > 1 || hasNextPage) && (
        <div className="flex items-center justify-between px-0.5 pt-1">
          <span className="text-[12px] font-dm-sans text-[#888888]">
            Page <span className="text-[#f0f0f0]">{page}</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#252525] text-[#888888] bg-[#1a1a1a] hover:text-[#f0f0f0] hover:border-[#2d2d2d] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={!hasNextPage}
              onClick={() => setPage(p => p + 1)}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#252525] text-[#888888] bg-[#1a1a1a] hover:text-[#f0f0f0] hover:border-[#2d2d2d] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Review Dialog ─────────────────────────────────────────────────── */}
      <Dialog.Root
        open={dialogOpen && !!selectedReq}
        onOpenChange={(v) => { if (!v) closeDialog(); }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className={OVERLAY_CLS} />
          <Dialog.Content className={CONTENT_CLS} aria-describedby="reversal-review-desc">

            {/* Icon row */}
            <div className="flex items-start justify-between mb-5">
              <div
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-2xl",
                  decision === "approved"
                    ? "bg-green-500/10 border border-green-500/20"
                    : "bg-red-500/10 border border-red-500/20"
                )}
              >
                {decision === "approved"
                  ? <CheckCircle2 className="w-5 h-5 text-green-400" />
                  : <XCircle className="w-5 h-5 text-red-400" />
                }
              </div>
              <Dialog.Close
                onClick={closeDialog}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-[#4a4a4a] hover:text-[#888888] hover:bg-[#222222] transition-colors"
              >
                <X className="w-4 h-4" />
              </Dialog.Close>
            </div>

            <Dialog.Title className="font-syne font-bold text-[#f0f0f0] text-[16px] leading-tight mb-1">
              Review Reversal Request
            </Dialog.Title>
            <Dialog.Description
              id="reversal-review-desc"
              className="text-[13px] font-dm-sans text-[#888888] mb-4"
            >
              <span className="font-mono text-[12px] text-[#f0f0f0]">
                {selectedReq && trunc(selectedReq.txn_id, 12)}
              </span>
              {" · "}
              <span
                className={cn(
                  "inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-semibold border capitalize",
                  selectedReq ? (REASON_BADGE[selectedReq.reason_code] ?? "bg-[#252525] text-[#888888] border-[#252525]") : ""
                )}
              >
                {selectedReq?.reason_code.replace(/_/g, " ")}
              </span>
            </Dialog.Description>

            {/* Maker-Checker warning banner */}
            <div className="flex items-start gap-2.5 px-3.5 py-3 mb-5 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
              <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
              <p className="text-[12px] font-dm-sans text-yellow-400 leading-relaxed">
                ⚠️ Maker-Checker: You cannot approve your own reversal request.
              </p>
            </div>

            {/* Decision radio buttons */}
            <div className="mb-4">
              <label className="block text-[10px] font-dm-sans font-semibold uppercase tracking-[0.08em] text-[#4a4a4a] mb-2">
                Decision
              </label>
              <div className="flex gap-3">
                {(["approved", "rejected"] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setDecision(opt)}
                    className={cn(
                      "flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-[12px] font-dm-sans font-medium transition-all",
                      decision === opt
                        ? opt === "approved"
                          ? "bg-green-500/10 border-green-500/30 text-green-400"
                          : "bg-red-500/10 border-red-500/30 text-red-400"
                        : "bg-[#1a1a1a] border-[#252525] text-[#888888] hover:text-[#f0f0f0]"
                    )}
                  >
                    <span
                      className={cn(
                        "w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0",
                        decision === opt
                          ? opt === "approved"
                            ? "border-green-400 bg-green-400"
                            : "border-red-400 bg-red-400"
                          : "border-[#4a4a4a]"
                      )}
                    >
                      {decision === opt && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#111111]" />
                      )}
                    </span>
                    <span className="capitalize">{opt}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Review note */}
            <div className="mb-5">
              <label className="block text-[10px] font-dm-sans font-semibold uppercase tracking-[0.08em] text-[#4a4a4a] mb-2">
                Review Note{" "}
                <span className="normal-case font-normal text-[#4a4a4a]">(optional)</span>
              </label>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows={3}
                placeholder="Add a note for this decision…"
                className="w-full px-3.5 py-3 rounded-xl bg-[#1a1a1a] border border-[#252525] text-[13px] font-dm-sans text-[#f0f0f0] placeholder:text-[#4a4a4a] resize-none focus:outline-none focus:border-[rgba(249,115,22,0.4)] transition-colors duration-150 leading-relaxed"
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Dialog.Close
                onClick={closeDialog}
                className="flex-1 px-4 py-2.5 rounded-xl text-[13px] font-dm-sans font-medium text-[#888888] border border-[#252525] bg-[#1a1a1a] hover:bg-[#222222] hover:text-[#f0f0f0] transition-colors"
              >
                Cancel
              </Dialog.Close>
              <button
                onClick={() => reviewMutation.mutate()}
                disabled={reviewMutation.isPending}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl",
                  "text-[13px] font-dm-sans font-semibold border transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  decision === "approved"
                    ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/15"
                    : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/15"
                )}
              >
                {reviewMutation.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : (
                    <>
                      <Check className="w-4 h-4" />
                      Confirm {decision === "approved" ? "Approval" : "Rejection"}
                    </>
                  )
                }
              </button>
            </div>

          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Toast */}
      {toast && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3.5 rounded-xl border shadow-2xl",
            "font-dm-sans text-[13px] max-w-sm transition-all duration-300",
            toast.type === "success"
              ? "bg-[#0b1a0b] border-green-500/30 text-green-400"
              : "bg-[#1a0b0b] border-red-500/30 text-red-400"
          )}
        >
          {toast.type === "success"
            ? <Check className="w-4 h-4 shrink-0" />
            : <AlertTriangle className="w-4 h-4 shrink-0" />
          }
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="opacity-50 hover:opacity-100 transition-opacity ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );
}
