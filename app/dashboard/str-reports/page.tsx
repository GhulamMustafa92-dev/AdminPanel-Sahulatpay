"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileWarning, CheckCircle2, Send, Clock, AlertTriangle, X, Check,
  ChevronLeft, ChevronRight, Loader2, FileText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { format } from "date-fns";
import { Dialog } from "radix-ui";
import { cn } from "@/lib/utils";
import {
  getStrReports, reviewStrReport, submitStrReport,
  type StrReport, type StrReportsResponse,
} from "@/lib/api/services/str-reports";
import { useTopNavExtras } from "@/context/TopNavExtrasContext";

const PAGE_LIMIT = 20;

const STATUS_TABS = [
  { label: "Draft",     value: "draft"     },
  { label: "Reviewed",  value: "reviewed"  },
  { label: "Submitted", value: "submitted" },
];

const STATUS_BADGE: Record<string, string> = {
  draft:     "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  reviewed:  "bg-[rgba(249,115,22,0.1)] text-[#f97316] border-[rgba(249,115,22,0.2)]",
  submitted: "bg-green-500/10 text-green-400 border-green-500/20",
};

const TYPE_BADGE: Record<string, string> = {
  STR: "bg-red-500/10 text-red-400 border-red-500/20",
  CTR: "bg-[rgba(249,115,22,0.1)] text-[#f97316] border-[rgba(249,115,22,0.2)]",
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StrReportsPage() {
  const [statusFilter,   setStatusFilter]   = useState("draft");
  const [page,           setPage]           = useState(1);
  const [selectedReport, setSelectedReport] = useState<StrReport | null>(null);
  const [dialogMode,     setDialogMode]     = useState<"review" | "submit" | null>(null);
  const [narrative,      setNarrative]      = useState("");
  const [submissionRef,  setSubmissionRef]  = useState("");
  const [fieldErr,       setFieldErr]       = useState("");
  const [toast,          setToast]          = useState<ToastState | null>(null);

  const { setExtras, clearExtras } = useTopNavExtras();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery<StrReportsResponse>({
    queryKey: ["str-reports", page, statusFilter],
    queryFn: () => getStrReports({ page, per_page: PAGE_LIMIT, status: statusFilter }),
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

  const reviewMutation = useMutation({
    mutationFn: () => reviewStrReport(selectedReport!.id, narrative),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["str-reports"] });
      closeDialog();
      showToast("STR report marked as reviewed.", "success");
    },
    onError: () => showToast("Failed to update report.", "error"),
  });

  const submitMutation = useMutation({
    mutationFn: () => submitStrReport(selectedReport!.id, submissionRef),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["str-reports"] });
      closeDialog();
      showToast("STR report submitted to FIU.", "success");
    },
    onError: () => showToast("Failed to submit report.", "error"),
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  const closeDialog = () => {
    setSelectedReport(null);
    setDialogMode(null);
    setNarrative("");
    setSubmissionRef("");
    setFieldErr("");
  };

  const handleReview = (r: StrReport) => {
    setSelectedReport(r);
    setNarrative(r.ai_narrative ?? "");
    setDialogMode("review");
  };

  const handleSubmit = (r: StrReport) => {
    setSelectedReport(r);
    setDialogMode("submit");
  };

  const confirmReview = () => {
    if (narrative.trim().length < 20) {
      setFieldErr("Narrative must be at least 20 characters.");
      return;
    }
    setFieldErr("");
    reviewMutation.mutate();
  };

  const confirmSubmit = () => {
    if (submissionRef.trim().length < 3) {
      setFieldErr("Submission reference is required.");
      return;
    }
    setFieldErr("");
    submitMutation.mutate();
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const reports       = data?.reports ?? [];
  const total         = data?.total ?? 0;
  const totalPages    = Math.max(1, Math.ceil(total / PAGE_LIMIT));
  const draftCount    = reports.filter(r => r.status === "draft").length;
  const reviewedCount = reports.filter(r => r.status === "reviewed").length;
  const submittedCount = reports.filter(r => r.status === "submitted").length;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20">
          <FileWarning className="w-4 h-4 text-red-400" />
        </div>
        <div>
          <h2 className="font-syne font-bold text-[#f0f0f0] text-xl leading-tight">STR Reports</h2>
          <p className="text-[11px] font-dm-sans text-[#888888] leading-none mt-0.5">
            Suspicious Transaction Reports for SBP / FIU submission
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat
          icon={FileWarning}  label="Total"
          value={total}
          iconCls="text-red-400"    bgCls="bg-red-500/10"
        />
        <MiniStat
          icon={Clock}        label="Draft"
          value={draftCount}
          iconCls="text-yellow-400" bgCls="bg-yellow-500/10"
        />
        <MiniStat
          icon={FileText}     label="Reviewed"
          value={reviewedCount}
          iconCls="text-[#f97316]"  bgCls="bg-[rgba(249,115,22,0.1)]"
        />
        <MiniStat
          icon={CheckCircle2} label="Submitted"
          value={submittedCount}
          iconCls="text-green-400"  bgCls="bg-green-500/10"
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
              {["Type", "Amount (PKR)", "Status", "AI Narrative", "Generated", "Actions"].map((col, i) => (
                <th
                  key={col}
                  className={cn(
                    "py-2.5 text-[10px] font-dm-sans font-semibold uppercase tracking-[0.09em] text-[#4a4a4a]",
                    i === 0 ? "pl-5 pr-3 text-left" : "px-4 text-left"
                  )}
                >
                  {col}
                </th>
              ))}
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
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center bg-[#1a1a1a]">
                  <p className="text-[12px] font-dm-sans text-[#4a4a4a]">
                    No STR reports found for this status.
                  </p>
                </td>
              </tr>
            ) : (
              reports.map((r, idx) => (
                <tr
                  key={r.id}
                  className={cn(
                    "group hover:bg-[rgba(249,115,22,0.03)] transition-colors",
                    idx % 2 === 1 ? "bg-[rgba(255,255,255,0.012)]" : "bg-[#1a1a1a]"
                  )}
                >
                  {/* Type */}
                  <td className="pl-5 pr-3 py-3">
                    <span className={cn(
                      "inline-flex px-2 py-0.5 rounded-full text-[10px] font-dm-sans font-semibold border uppercase",
                      TYPE_BADGE[r.report_type] ?? "bg-[#252525] text-[#888888] border-[#252525]"
                    )}>
                      {r.report_type}
                    </span>
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-3">
                    <span className="font-syne font-bold text-[13px] text-[#f0f0f0]">
                      Rs. {r.amount_pkr.toLocaleString()}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex px-2 py-0.5 rounded-full text-[10px] font-dm-sans font-semibold border capitalize",
                      STATUS_BADGE[r.status] ?? "bg-[#252525] text-[#888888] border-[#252525]"
                    )}>
                      {r.status}
                    </span>
                  </td>

                  {/* AI Narrative preview */}
                  <td className="px-4 py-3 max-w-[200px]">
                    <p className="text-[11px] font-dm-sans text-[#888888] truncate">
                      {r.ai_narrative
                        ? r.ai_narrative.slice(0, 60) + (r.ai_narrative.length > 60 ? "…" : "")
                        : <span className="text-[#4a4a4a] italic">No narrative yet</span>
                      }
                    </p>
                  </td>

                  {/* Generated at */}
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-dm-sans text-[#888888]">
                      {safeDate(r.generated_at)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {r.status !== "submitted" && (
                        <button
                          onClick={() => handleReview(r)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-dm-sans font-medium bg-[rgba(249,115,22,0.1)] text-[#f97316] border border-[rgba(249,115,22,0.2)] hover:bg-[rgba(249,115,22,0.15)] transition-colors"
                        >
                          <FileText className="w-3 h-3" /> Review
                        </button>
                      )}
                      {r.status === "reviewed" && (
                        <button
                          onClick={() => handleSubmit(r)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-dm-sans font-medium bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/15 transition-colors"
                        >
                          <Send className="w-3 h-3" /> Submit to FIU
                        </button>
                      )}
                      {r.status === "submitted" && r.submission_ref && (
                        <span className="text-[11px] font-mono text-[#4a4a4a]">
                          Ref: {r.submission_ref}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > PAGE_LIMIT && (
        <div className="flex items-center justify-between px-0.5 pt-1">
          <span className="text-[12px] font-dm-sans text-[#888888]">
            Page{" "}
            <span className="text-[#f0f0f0]">{page}</span>
            {" "}of{" "}
            <span className="text-[#f0f0f0]">{totalPages}</span>
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
              disabled={page >= totalPages}
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
        open={dialogMode === "review" && !!selectedReport}
        onOpenChange={(v) => { if (!v) closeDialog(); }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className={OVERLAY_CLS} />
          <Dialog.Content className={CONTENT_CLS} aria-describedby="str-review-desc">

            {/* Icon row */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[rgba(249,115,22,0.1)] border border-[rgba(249,115,22,0.2)]">
                <FileText className="w-5 h-5 text-[#f97316]" />
              </div>
              <Dialog.Close
                onClick={closeDialog}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-[#4a4a4a] hover:text-[#888888] hover:bg-[#222222] transition-colors"
              >
                <X className="w-4 h-4" />
              </Dialog.Close>
            </div>

            <Dialog.Title className="font-syne font-bold text-[#f0f0f0] text-[16px] leading-tight mb-1">
              Review STR Report
            </Dialog.Title>
            <Dialog.Description
              id="str-review-desc"
              className="text-[13px] font-dm-sans text-[#888888] mb-5"
            >
              Edit or confirm the AI-generated narrative before submitting to FIU.
            </Dialog.Description>

            {/* Narrative textarea */}
            <div className="mb-5">
              <label className="block text-[10px] font-dm-sans font-semibold uppercase tracking-[0.08em] text-[#4a4a4a] mb-2">
                AI Narrative (editable)
              </label>
              <textarea
                value={narrative}
                onChange={(e) => { setNarrative(e.target.value); setFieldErr(""); }}
                rows={6}
                placeholder="Enter or edit the STR narrative for SBP submission…"
                className={cn(
                  "w-full px-3.5 py-3 rounded-xl bg-[#1a1a1a] border text-[13px] font-dm-sans text-[#f0f0f0]",
                  "placeholder:text-[#4a4a4a] resize-none focus:outline-none transition-colors duration-150 leading-relaxed",
                  fieldErr ? "border-red-500/50" : "border-[#252525] focus:border-[rgba(249,115,22,0.4)]"
                )}
              />
              {fieldErr && (
                <p className="text-[11px] font-dm-sans text-red-400 mt-1">{fieldErr}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Dialog.Close
                onClick={closeDialog}
                className="flex-1 px-4 py-2.5 rounded-xl text-[13px] font-dm-sans font-medium text-[#888888] border border-[#252525] bg-[#1a1a1a] hover:bg-[#222222] hover:text-[#f0f0f0] transition-colors"
              >
                Cancel
              </Dialog.Close>
              <button
                onClick={confirmReview}
                disabled={reviewMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-dm-sans font-semibold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-[rgba(249,115,22,0.1)] text-[#f97316] border-[rgba(249,115,22,0.2)] hover:bg-[rgba(249,115,22,0.15)]"
              >
                {reviewMutation.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <><Check className="w-4 h-4" /> Mark Reviewed</>
                }
              </button>
            </div>

          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ── Submit to FIU Dialog ──────────────────────────────────────────── */}
      <Dialog.Root
        open={dialogMode === "submit" && !!selectedReport}
        onOpenChange={(v) => { if (!v) closeDialog(); }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className={OVERLAY_CLS} />
          <Dialog.Content className={CONTENT_CLS} aria-describedby="str-submit-desc">

            {/* Icon row */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20">
                <Send className="w-5 h-5 text-green-400" />
              </div>
              <Dialog.Close
                onClick={closeDialog}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-[#4a4a4a] hover:text-[#888888] hover:bg-[#222222] transition-colors"
              >
                <X className="w-4 h-4" />
              </Dialog.Close>
            </div>

            <Dialog.Title className="font-syne font-bold text-[#f0f0f0] text-[16px] leading-tight mb-1">
              Submit to FIU
            </Dialog.Title>
            <Dialog.Description
              id="str-submit-desc"
              className="text-[13px] font-dm-sans text-[#888888] mb-5"
            >
              Enter the FIU / SBP submission reference number. This action cannot be undone.
            </Dialog.Description>

            {/* Submission reference input */}
            <div className="mb-5">
              <label className="block text-[10px] font-dm-sans font-semibold uppercase tracking-[0.08em] text-[#4a4a4a] mb-2">
                Submission Reference
              </label>
              <input
                value={submissionRef}
                onChange={(e) => { setSubmissionRef(e.target.value); setFieldErr(""); }}
                placeholder="e.g. FIU-2024-001234"
                className={cn(
                  "w-full px-3.5 py-3 rounded-xl bg-[#1a1a1a] border text-[13px] font-dm-sans text-[#f0f0f0]",
                  "placeholder:text-[#4a4a4a] focus:outline-none transition-colors",
                  fieldErr ? "border-red-500/50" : "border-[#252525] focus:border-[rgba(249,115,22,0.4)]"
                )}
              />
              {fieldErr && (
                <p className="text-[11px] font-dm-sans text-red-400 mt-1">{fieldErr}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Dialog.Close
                onClick={closeDialog}
                className="flex-1 px-4 py-2.5 rounded-xl text-[13px] font-dm-sans font-medium text-[#888888] border border-[#252525] bg-[#1a1a1a] hover:bg-[#222222] hover:text-[#f0f0f0] transition-colors"
              >
                Cancel
              </Dialog.Close>
              <button
                onClick={confirmSubmit}
                disabled={submitMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-dm-sans font-semibold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/15"
              >
                {submitMutation.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <><Send className="w-4 h-4" /> Submit to FIU</>
                }
              </button>
            </div>

          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3.5 rounded-xl border shadow-2xl",
          "font-dm-sans text-[13px] max-w-sm transition-all duration-300",
          toast.type === "success"
            ? "bg-[#0b1a0b] border-green-500/30 text-green-400"
            : "bg-[#1a0b0b] border-red-500/30 text-red-400"
        )}>
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
