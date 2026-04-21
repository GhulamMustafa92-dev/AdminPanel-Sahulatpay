"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog } from "radix-ui";
import { X, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveAlert, type FraudAlert } from "@/lib/api/services/fraud";

// ── Animation classes ─────────────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────────────

interface ResolveDialogProps {
  alert:         FraudAlert | null;
  open:          boolean;
  onOpenChange:  (open: boolean) => void;
  onSuccess:     () => void;
}

export default function ResolveDialog({
  alert, open, onOpenChange, onSuccess,
}: ResolveDialogProps) {
  const [note,        setNote]        = useState("");
  const [fieldErr,    setFieldErr]    = useState("");
  const [submitError, setSubmitError] = useState("");

  const mutation = useMutation({
    mutationFn: () => resolveAlert(alert!.id, note),
    onSuccess:  () => { onOpenChange(false); onSuccess(); },
    onError:    () => setSubmitError("Request failed. Please try again."),
  });

  const handleConfirm = () => {
    if (note.trim().length < 5) { setFieldErr("Please provide at least 5 characters."); return; }
    setSubmitError("");
    mutation.mutate();
  };

  const handleClose = (v: boolean) => {
    if (!v) { setNote(""); setFieldErr(""); setSubmitError(""); }
    onOpenChange(v);
  };

  if (!alert) return null;

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className={OVERLAY_CLS} />
        <Dialog.Content className={CONTENT_CLS} aria-describedby="resolve-desc">

          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <Dialog.Close className="flex items-center justify-center w-8 h-8 rounded-lg text-[#4a4a4a] hover:text-[#888888] hover:bg-[#222222] transition-colors">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          <Dialog.Title className="font-syne font-bold text-[#f0f0f0] text-[16px] leading-tight mb-1">
            Resolve Alert
          </Dialog.Title>
          <Dialog.Description id="resolve-desc" className="text-[13px] font-dm-sans text-[#888888] leading-relaxed mb-5">
            <span className="font-mono text-[12px]">{alert.id}</span>
            {" — "}
            <span className="capitalize text-[#f0f0f0] font-medium">{alert.severity} severity</span>
          </Dialog.Description>

          {/* Note textarea */}
          <div className="mb-5">
            <label className="block text-[10px] font-dm-sans font-semibold uppercase tracking-[0.08em] text-[#4a4a4a] mb-2">
              Note / Reason
            </label>
            <textarea
              value={note}
              onChange={(e) => { setNote(e.target.value); setFieldErr(""); }}
              placeholder="Describe how this alert was resolved…"
              rows={3}
              className={cn(
                "w-full px-3.5 py-3 rounded-xl bg-[#1a1a1a] border text-[13px] font-dm-sans text-[#f0f0f0] placeholder:text-[#4a4a4a] resize-none focus:outline-none focus:border-[rgba(249,115,22,0.4)] transition-colors duration-150 leading-relaxed",
                fieldErr ? "border-red-500/50" : "border-[#252525]"
              )}
            />
            {fieldErr && <p className="text-[11px] font-dm-sans text-red-400 mt-1 px-0.5">{fieldErr}</p>}
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
              onClick={handleConfirm}
              disabled={mutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-dm-sans font-semibold border transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/15"
            >
              {mutation.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><CheckCircle2 className="w-4 h-4" /> Confirm Resolved</>}
            </button>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
