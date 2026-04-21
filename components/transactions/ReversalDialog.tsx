"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog } from "radix-ui";
import { X, AlertTriangle, RotateCcw, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { requestReversal, type Transaction } from "@/lib/api/services/transactions";

// ── Animation classes (reused from KYC pattern) ───────────────────────────────

const OVERLAY_CLS =
  "fixed inset-0 z-50 bg-black/70 backdrop-blur-sm " +
  "data-[state=open]:animate-in data-[state=closed]:animate-out " +
  "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200";

const CONTENT_CLS =
  "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 " +
  "w-[480px] max-w-[calc(100vw-2rem)] bg-[#111111] border border-[#252525] " +
  "rounded-2xl shadow-2xl p-6 " +
  "data-[state=open]:animate-in data-[state=closed]:animate-out " +
  "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 " +
  "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtRs(n: number) {
  return `Rs. ${n.toLocaleString()}`;
}

function safeDate(d: string) {
  try { return format(new Date(d), "MMM d, yyyy · h:mm a"); } catch { return "—"; }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface ReversalDialogProps {
  txn:           Transaction | null;
  open:          boolean;
  onOpenChange:  (open: boolean) => void;
  onSuccess:     () => void;
}

type ReasonCode = "fraud_confirmed" | "erroneous_transfer" | "dispute_resolved";

const REASON_OPTIONS: { value: ReasonCode; label: string }[] = [
  { value: "fraud_confirmed",    label: "Fraud Confirmed"     },
  { value: "erroneous_transfer", label: "Erroneous Transfer"  },
  { value: "dispute_resolved",   label: "Dispute Resolved"   },
];

export default function ReversalDialog({ txn, open, onOpenChange, onSuccess }: ReversalDialogProps) {
  const [reasonCode,  setReasonCode]  = useState<ReasonCode>("erroneous_transfer");
  const [detail,      setDetail]      = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [submitError, setSubmitError] = useState("");

  const mutation = useMutation({
    mutationFn: () => requestReversal(txn!.id, reasonCode, detail || undefined),
    onSuccess: () => { onOpenChange(false); onSuccess(); },
    onError:   () => setSubmitError("Reversal request failed. Please try again."),
  });

  const canSubmit = confirm === "REVERSE" && !mutation.isPending;

  const handleClose = (v: boolean) => {
    if (!v) { setDetail(""); setConfirm(""); setSubmitError(""); }
    onOpenChange(v);
  };

  if (!txn) return null;

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className={OVERLAY_CLS} />
        <Dialog.Content className={CONTENT_CLS} aria-describedby="reversal-desc">

          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[rgba(249,115,22,0.1)] border border-[rgba(249,115,22,0.2)]">
              <RotateCcw className="w-5 h-5 text-[#f97316]" />
            </div>
            <Dialog.Close className="flex items-center justify-center w-8 h-8 rounded-lg text-[#4a4a4a] hover:text-[#888888] hover:bg-[#222222] transition-colors">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          <Dialog.Title className="font-syne font-bold text-[#f0f0f0] text-[16px] leading-tight mb-1">
            Reverse Transaction
          </Dialog.Title>
          <Dialog.Description id="reversal-desc" className="text-[13px] font-dm-sans text-[#888888] leading-relaxed mb-5">
            Review the details carefully before proceeding.
          </Dialog.Description>

          {/* TX details card */}
          <div className="p-4 rounded-xl bg-[#1a1a1a] border border-[#252525] mb-4 space-y-2.5">
            {([
              ["TX ID",   <span key="id" className="text-[12px] font-mono text-[#888888]">{txn.reference_number || txn.id}</span>],
              ["Amount",  <span key="amt" className="text-[13px] font-syne font-bold text-[#f97316]">{fmtRs(txn.amount)}</span>],
              ["Status",  <span key="st" className="text-[12px] font-dm-sans text-[#f0f0f0] capitalize">{txn.status}</span>],
              ["Date",    <span key="dt" className="text-[12px] font-dm-sans text-[#888888]">{safeDate(txn.created_at)}</span>],
            ] as [string, React.ReactNode][]).map(([lbl, val]) => (
              <div key={lbl} className="flex items-center justify-between">
                <span className="text-[11px] font-dm-sans text-[#4a4a4a] uppercase tracking-[0.07em]">{lbl}</span>
                {val}
              </div>
            ))}
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-[rgba(249,115,22,0.06)] border border-[rgba(249,115,22,0.2)] mb-5">
            <AlertTriangle className="w-4 h-4 text-[#f97316] shrink-0 mt-0.5" />
            <p className="text-[12px] font-dm-sans text-[#f97316]/80 leading-relaxed">
              This action cannot be undone. The full amount will be credited back to the user&apos;s wallet.
            </p>
          </div>

          {/* Reason Code */}
          <div className="mb-3">
            <label className="block text-[10px] font-dm-sans font-semibold uppercase tracking-[0.08em] text-[#4a4a4a] mb-2">
              Reason Code
            </label>
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value as ReasonCode)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#252525] text-[13px] font-dm-sans text-[#f0f0f0] focus:outline-none focus:border-[rgba(249,115,22,0.4)] transition-colors duration-150"
            >
              {REASON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-[10px] font-dm-sans font-semibold uppercase tracking-[0.08em] text-[#4a4a4a] mb-2">
              Additional Detail (optional)
            </label>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Optional extra context…"
              rows={2}
              className="w-full px-3.5 py-3 rounded-xl bg-[#1a1a1a] border border-[#252525] text-[13px] font-dm-sans text-[#f0f0f0] placeholder:text-[#4a4a4a] resize-none focus:outline-none focus:border-[rgba(249,115,22,0.4)] transition-colors duration-150 leading-relaxed"
            />
          </div>

          {/* Double-confirm */}
          <div className="mb-5">
            <label className="block text-[10px] font-dm-sans font-semibold uppercase tracking-[0.08em] text-[#4a4a4a] mb-2">
              Type <span className="text-[#f97316] font-mono">REVERSE</span> to confirm
            </label>
            <input
              type="text"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="REVERSE"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#252525] text-[13px] font-mono text-[#f0f0f0] placeholder:text-[#4a4a4a] focus:outline-none focus:border-[rgba(249,115,22,0.4)] transition-colors duration-150"
            />
          </div>

          {/* Submit error */}
          {submitError && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-[12px] font-dm-sans text-red-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {submitError}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Dialog.Close className="flex-1 px-4 py-2.5 rounded-xl text-[13px] font-dm-sans font-medium text-[#888888] border border-[#252525] bg-[#1a1a1a] hover:bg-[#222222] hover:text-[#f0f0f0] transition-colors duration-150">
              Cancel
            </Dialog.Close>
            <button
              onClick={() => mutation.mutate()}
              disabled={!canSubmit}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-dm-sans font-semibold bg-[rgba(249,115,22,0.1)] text-[#f97316] border border-[rgba(249,115,22,0.25)] hover:bg-[rgba(249,115,22,0.16)] transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {mutation.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><RotateCcw className="w-4 h-4" /> Reverse Transaction</>}
            </button>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
