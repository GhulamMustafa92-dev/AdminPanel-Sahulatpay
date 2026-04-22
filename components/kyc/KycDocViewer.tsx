"use client";

import { useState, useEffect, type ElementType } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlertDialog, Dialog } from "radix-ui";
import {
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  XCircle,
  Timer,
  Phone,
  User2,
  Calendar,
  CreditCard,
  MapPin,
  Users,
  AlertTriangle,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  approveKyc,
  rejectKyc,
  type KycItem,
  type KycStatus,
} from "@/lib/api/services/kyc";

// ── Helpers ───────────────────────────────────────────────────────────────────

function safeDate(d: string | undefined, fmt: string) {
  if (!d) return "—";
  try { return format(new Date(d), fmt); } catch { return "—"; }
}

function getInitials(name: string | undefined) {
  return (name || "?").split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

const STATUS_CFG: Record<KycStatus, { cls: string; label: string }> = {
  pending:  { cls: "bg-[rgba(249,115,22,0.12)] text-[#f97316] border-[rgba(249,115,22,0.25)]", label: "Pending Review" },
  approved: { cls: "bg-green-500/10 text-green-400 border-green-500/20",                        label: "Approved"       },
  rejected: { cls: "bg-red-500/10 text-red-400 border-red-500/20",                              label: "Rejected"       },
};

// ── Overlay / content animation classes (tw-animate-css) ─────────────────────

const OVERLAY_CLS =
  "fixed inset-0 z-50 bg-black/70 backdrop-blur-sm " +
  "data-[state=open]:animate-in data-[state=closed]:animate-out " +
  "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200";

const CONTENT_CLS =
  "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 " +
  "w-[440px] max-w-[calc(100vw-2rem)] bg-[#111111] border border-[#252525] " +
  "rounded-2xl shadow-2xl p-6 " +
  "data-[state=open]:animate-in data-[state=closed]:animate-out " +
  "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 " +
  "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200";

// ── RevealGuard ───────────────────────────────────────────────────────────────

interface RevealGuardProps {
  url: string | undefined;
  label: string;
  aspect?: string;
}

function RevealGuard({ url, label, aspect = "aspect-video" }: RevealGuardProps) {
  const [phase, setPhase] = useState<"hidden" | "loading" | "visible">("hidden");
  const [countdown, setCountdown] = useState(30);

  // Countdown ticker
  useEffect(() => {
    if (!url || phase !== "visible") return;
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          setPhase("hidden");
          return 30;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, url]);

  if (!url) return (
    <div className={cn("w-full rounded-xl bg-[#1a1a1a] border border-[#252525] flex items-center justify-center", aspect)}>
      <span className="text-[11px] font-dm-sans text-[#4a4a4a]">Not available</span>
    </div>
  );

  const handleReveal = () => {
    setPhase("loading");
    setCountdown(30);
  };

  const handleLoad = () => setPhase("visible");
  const handleError = () => setPhase("hidden");

  return (
    <div className={cn("relative w-full rounded-xl overflow-hidden bg-[#1a1a1a] border border-[#252525]", aspect)}>
      {/* Actual image — mounted during loading & visible */}
      {(phase === "loading" || phase === "visible") && (
        <img
          src={url}
          alt={label}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
            phase === "visible" ? "opacity-100" : "opacity-0"
          )}
        />
      )}

      {/* Hidden placeholder */}
      {phase === "hidden" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#222222] to-[#1a1a1a]">
          <EyeOff className="w-7 h-7 text-[#2d2d2d]" />
          <p className="text-[11px] font-dm-sans text-[#4a4a4a] uppercase tracking-[0.08em]">{label}</p>
          <button
            onClick={handleReveal}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-dm-sans font-medium bg-[rgba(249,115,22,0.1)] text-[#f97316] border border-[rgba(249,115,22,0.2)] hover:bg-[rgba(249,115,22,0.16)] transition-all duration-150"
          >
            <Eye className="w-3.5 h-3.5" />
            Click to Reveal
          </button>
        </div>
      )}

      {/* Loading spinner */}
      {phase === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a]">
          <Loader2 className="w-6 h-6 text-[#f97316] animate-spin" />
        </div>
      )}

      {/* Countdown badge */}
      {phase === "visible" && (
        <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-sm border border-white/10">
          <Timer className="w-3 h-3 text-[#f97316]" />
          <span className="text-[11px] font-mono text-white tabular-nums">{countdown}s</span>
        </div>
      )}

      {/* Label overlay (always) */}
      <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/60 to-transparent pointer-events-none">
        <p className="text-[10px] font-dm-sans font-semibold uppercase tracking-[0.08em] text-white/60">{label}</p>
      </div>
    </div>
  );
}

// ── Approve dialog (radix-ui AlertDialog) ─────────────────────────────────────

interface ApproveDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}

function ApproveDialog({ open, onOpenChange, onConfirm, isPending }: ApproveDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className={OVERLAY_CLS} />
        <AlertDialog.Content className={CONTENT_CLS}>
          {/* Icon */}
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
          </div>

          <AlertDialog.Title className="font-syne font-bold text-[#f0f0f0] text-[16px] leading-tight mb-2">
            Approve KYC Application?
          </AlertDialog.Title>
          <AlertDialog.Description className="text-[13px] font-dm-sans text-[#888888] leading-relaxed">
            This will verify the user&apos;s identity and grant them full platform access. This action cannot be undone.
          </AlertDialog.Description>

          <div className="flex gap-3 mt-6">
            <AlertDialog.Cancel
              className="flex-1 px-4 py-2.5 rounded-xl text-[13px] font-dm-sans font-medium text-[#888888] border border-[#252525] bg-[#1a1a1a] hover:bg-[#222222] hover:text-[#f0f0f0] transition-colors duration-150"
            >
              Cancel
            </AlertDialog.Cancel>
            <AlertDialog.Action
              onClick={(e) => { e.preventDefault(); onConfirm(); }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-dm-sans font-semibold bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/15 transition-colors duration-150 disabled:opacity-50"
              aria-disabled={isPending}
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Approve</>}
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

// ── Reject dialog (radix-ui Dialog — controlled close for validation) ─────────

interface RejectDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
  submitError: string | null;
}

function RejectDialog({ open, onOpenChange, onConfirm, isPending, submitError }: RejectDialogProps) {
  const [reason, setReason]   = useState("");
  const [fieldErr, setFieldErr] = useState("");

  // Reset on open
  useEffect(() => {
    if (open) { setReason(""); setFieldErr(""); }
  }, [open]);

  const handleConfirm = () => {
    const trimmed = reason.trim();
    if (trimmed.length < 10) {
      setFieldErr("Reason must be at least 10 characters.");
      return;
    }
    onConfirm(trimmed);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={OVERLAY_CLS} />
        <Dialog.Content className={CONTENT_CLS} aria-describedby="reject-desc">
          {/* Icon + close */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20">
              <XCircle className="w-6 h-6 text-red-400" />
            </div>
            <Dialog.Close className="flex items-center justify-center w-8 h-8 rounded-lg text-[#4a4a4a] hover:text-[#888888] hover:bg-[#222222] transition-colors">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          <Dialog.Title className="font-syne font-bold text-[#f0f0f0] text-[16px] leading-tight mb-1">
            Reject KYC Application
          </Dialog.Title>
          <Dialog.Description id="reject-desc" className="text-[13px] font-dm-sans text-[#888888] leading-relaxed mb-4">
            Provide a clear reason for rejection. The user will see this message.
          </Dialog.Description>

          {/* Textarea */}
          <div>
            <textarea
              value={reason}
              onChange={(e) => { setReason(e.target.value); setFieldErr(""); }}
              placeholder="e.g. CNIC image is blurry, please resubmit with clearer photos…"
              rows={4}
              className={cn(
                "w-full px-3.5 py-3 rounded-xl bg-[#1a1a1a] border text-[13px] font-dm-sans text-[#f0f0f0] placeholder:text-[#4a4a4a] resize-none",
                "focus:outline-none focus:border-[rgba(249,115,22,0.4)] transition-colors duration-150 leading-relaxed",
                fieldErr ? "border-red-500/50" : "border-[#252525]"
              )}
            />
            <div className="flex items-center justify-between mt-1.5 px-0.5">
              {fieldErr ? (
                <p className="text-[11px] font-dm-sans text-red-400">{fieldErr}</p>
              ) : (
                <p className="text-[11px] font-dm-sans text-[#4a4a4a]">Min. 10 characters</p>
              )}
              <p className={cn("text-[11px] font-dm-sans", reason.length < 10 ? "text-[#4a4a4a]" : "text-[#888888]")}>
                {reason.length} chars
              </p>
            </div>
          </div>

          {/* Submission error */}
          {submitError && (
            <div className="flex items-center gap-2 mt-3 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-[12px] font-dm-sans text-red-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {submitError}
            </div>
          )}

          <div className="flex gap-3 mt-5">
            <Dialog.Close className="flex-1 px-4 py-2.5 rounded-xl text-[13px] font-dm-sans font-medium text-[#888888] border border-[#252525] bg-[#1a1a1a] hover:bg-[#222222] hover:text-[#f0f0f0] transition-colors duration-150">
              Cancel
            </Dialog.Close>
            <button
              onClick={handleConfirm}
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-dm-sans font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/15 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4" /> Confirm Reject</>}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Info row ──────────────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg bg-[#1a1a1a] border border-[#252525]">
      <Icon className="w-4 h-4 text-[#4a4a4a] shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-dm-sans text-[#4a4a4a] leading-none mb-1 uppercase tracking-[0.07em]">{label}</p>
        <p className="text-[13px] font-dm-sans text-[#f0f0f0] leading-tight truncate">{value}</p>
      </div>
    </div>
  );
}

// ── Main: KycDocViewer ────────────────────────────────────────────────────────

interface KycDocViewerProps {
  item: KycItem;
  onActionDone: (type: "approve" | "reject") => void;
}

export default function KycDocViewer({ item, onActionDone }: KycDocViewerProps) {
  const [approveOpen,  setApproveOpen]  = useState(false);
  const [rejectOpen,   setRejectOpen]   = useState(false);
  const [rejectErrMsg, setRejectErrMsg] = useState<string | null>(null);

  const statusCfg = STATUS_CFG[item.status as KycStatus] ?? STATUS_CFG.pending;

  // ── Mutations ──────────────────────────────────────────────────────────────

  const approveMutation = useMutation({
    mutationFn: () => approveKyc(item.id),
    onSuccess: () => {
      setApproveOpen(false);
      onActionDone("approve");
    },
    onError: () => {
      setApproveOpen(false);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => rejectKyc(item.id, reason),
    onSuccess: () => {
      setRejectOpen(false);
      setRejectErrMsg(null);
      onActionDone("reject");
    },
    onError: () => {
      setRejectErrMsg("Failed to reject. Please try again.");
    },
  });

  const isPending = (item.status ?? "pending") === "pending";

  return (
    <div className="flex flex-col min-h-full p-6 gap-5">

      {/* ── User header ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#1a1a1a] border border-[#252525]">
        <div className="w-14 h-14 rounded-full bg-[rgba(249,115,22,0.15)] border border-[rgba(249,115,22,0.2)] flex items-center justify-center shrink-0">
          <span className="text-[20px] font-syne font-bold text-[#f97316] select-none leading-none">
            {getInitials(item.user_name ?? item.extracted_name)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-syne font-bold text-[#f0f0f0] text-[17px] leading-tight truncate mb-1.5">
            {item.user_name || item.extracted_name || "—"}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-dm-sans font-medium border", statusCfg.cls)}>
              {statusCfg.label}
            </span>
            {item.review_type && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-dm-sans font-medium border bg-[rgba(99,102,241,0.1)] text-[#818cf8] border-[rgba(99,102,241,0.25)] capitalize">
                {item.review_type}
              </span>
            )}
            {item.face_confidence != null && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-dm-sans font-medium border bg-[rgba(34,197,94,0.1)] text-green-400 border-green-500/20">
                Face match {item.face_confidence.toFixed(1)}%
              </span>
            )}
            <span className="text-[11px] font-dm-sans text-[#4a4a4a]">
              Submitted {safeDate(item.submitted_at, "MMM d, yyyy")}
            </span>
          </div>
        </div>
      </div>

      {/* ── Contact details ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        <InfoRow icon={User2}    label="Account Name"  value={item.user_name  || "—"} />
        <InfoRow icon={Phone}    label="Phone"          value={item.user_phone || "—"} />
        <InfoRow icon={CreditCard} label="CNIC (masked)" value={item.cnic_masked || item.account_cnic || "—"} />
        <InfoRow icon={Calendar} label="Submitted"      value={safeDate(item.submitted_at, "MMM d, yyyy · h:mm a")} />
      </div>

      {/* ── AI-extracted CNIC data ────────────────────────────────────────── */}
      {(item.extracted_name || item.extracted_dob || item.extracted_father || item.extracted_address) && (
        <div>
          <p className="text-[10px] font-dm-sans font-semibold uppercase tracking-[0.1em] text-[#4a4a4a] mb-3">
            AI-Extracted CNIC Data
          </p>
          <div className="grid grid-cols-2 gap-2">
            {item.extracted_name   && <InfoRow icon={User2}      label="Name on CNIC"   value={item.extracted_name} />}
            {item.extracted_dob    && <InfoRow icon={Calendar}   label="Date of Birth"  value={item.extracted_dob} />}
            {item.extracted_father && <InfoRow icon={Users}      label="Father's Name"  value={item.extracted_father} />}
            {item.extracted_address && <InfoRow icon={MapPin}    label="Address"        value={item.extracted_address} />}
          </div>
        </div>
      )}

      {/* ── Rejection reason (if rejected) ───────────────────────────────── */}
      {item.status === "rejected" && item.rejection_reason && (
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-dm-sans font-semibold uppercase tracking-[0.07em] text-red-400/70 mb-1">Rejection Reason</p>
            <p className="text-[13px] font-dm-sans text-red-300 leading-relaxed">{item.rejection_reason}</p>
          </div>
        </div>
      )}

      {/* ── Document images ──────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-dm-sans font-semibold uppercase tracking-[0.1em] text-[#4a4a4a] mb-3">
          Identity Documents
        </p>

        {/* CNIC Front + Back (2-col grid) — always shown; backend provides fallback for liveness reviews */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <RevealGuard url={item.front_image_url} label="CNIC Front" aspect="aspect-video" />
          <RevealGuard url={item.back_image_url}  label="CNIC Back"  aspect="aspect-video" />
        </div>

        {/* Selfie — only for liveness/fingerprint reviews */}
        {(item.review_type === "liveness" || item.review_type === "fingerprint" || item.selfie_url) && (
          <div className="max-w-[220px] mx-auto">
            <RevealGuard url={item.selfie_url} label="Live Selfie" aspect="aspect-[3/4]" />
          </div>
        )}
      </div>

      {/* ── Action buttons ────────────────────────────────────────────────── */}
      {isPending && (
        <div className="flex gap-3 pt-2 mt-auto">
          {/* Reject */}
          <button
            onClick={() => setRejectOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[13px] font-dm-sans font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/15 transition-all duration-150"
          >
            <XCircle className="w-4 h-4" />
            Reject
          </button>

          {/* Approve */}
          <button
            onClick={() => setApproveOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[13px] font-dm-sans font-semibold bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/15 transition-all duration-150"
          >
            <CheckCircle2 className="w-4 h-4" />
            Approve
          </button>
        </div>
      )}

      {/* ── Dialogs ────────────────────────────────────────────────────────── */}
      <ApproveDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        onConfirm={() => approveMutation.mutate()}
        isPending={approveMutation.isPending}
      />

      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onConfirm={(reason) => rejectMutation.mutate(reason)}
        isPending={rejectMutation.isPending}
        submitError={rejectErrMsg}
      />
    </div>
  );
}
