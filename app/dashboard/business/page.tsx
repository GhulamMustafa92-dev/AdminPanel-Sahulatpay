"use client";

import { useState, useEffect, useCallback, type ElementType } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AlertDialog, Dialog } from "radix-ui";
import {
  Briefcase, Eye, EyeOff, Loader2, CheckCircle2, XCircle,
  Timer, Phone, Mail, User2, Calendar, Hash, FileText,
  AlertTriangle, X, Check, Bot, Building2,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import {
  getPendingBusinesses, approveBusiness, rejectBusiness,
  type BusinessProfile, type BusinessStatus, type BusinessListResponse,
} from "@/lib/api/services/business";
import { useTopNavExtras } from "@/context/TopNavExtrasContext";

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<BusinessStatus, { cls: string; label: string; dot: string }> = {
  pending:  { cls: "bg-[rgba(249,115,22,0.12)] text-[#f97316] border-[rgba(249,115,22,0.25)]", label: "Pending",  dot: "bg-[#f97316]" },
  approved: { cls: "bg-green-500/10 text-green-400 border-green-500/20",                        label: "Approved", dot: "bg-green-400" },
  rejected: { cls: "bg-red-500/10 text-red-400 border-red-500/20",                              label: "Rejected", dot: "bg-red-400"   },
};

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return (name || "?").split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}
function safeDate(d: string | undefined, fmt: string) {
  if (!d) return "—";
  try { return format(new Date(d), fmt); } catch { return "—"; }
}
function timeAgo(d: string) {
  try { return formatDistanceToNow(new Date(d), { addSuffix: true }); } catch { return "—"; }
}

// ── RevealGuard ───────────────────────────────────────────────────────────────

function RevealGuard({ url, label, aspect = "aspect-video" }: { url: string; label: string; aspect?: string }) {
  const [phase, setPhase] = useState<"hidden" | "loading" | "visible">("hidden");
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (phase !== "visible") return;
    const t = setInterval(() => {
      setCountdown((c) => { if (c <= 1) { setPhase("hidden"); return 30; } return c - 1; });
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  return (
    <div className={cn("relative w-full rounded-xl overflow-hidden bg-[#1a1a1a] border border-[#252525]", aspect)}>
      {(phase === "loading" || phase === "visible") && (
        <img src={url} alt={label} onLoad={() => setPhase("visible")} onError={() => setPhase("hidden")}
          className={cn("absolute inset-0 w-full h-full object-cover transition-opacity duration-500", phase === "visible" ? "opacity-100" : "opacity-0")} />
      )}
      {phase === "hidden" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#222222] to-[#1a1a1a]">
          <EyeOff className="w-7 h-7 text-[#2d2d2d]" />
          <p className="text-[11px] font-dm-sans text-[#4a4a4a] uppercase tracking-[0.08em]">{label}</p>
          <button onClick={() => setPhase("loading")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-dm-sans font-medium bg-[rgba(249,115,22,0.1)] text-[#f97316] border border-[rgba(249,115,22,0.2)] hover:bg-[rgba(249,115,22,0.16)] transition-all duration-150">
            <Eye className="w-3.5 h-3.5" /> Click to Reveal
          </button>
        </div>
      )}
      {phase === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a]">
          <Loader2 className="w-6 h-6 text-[#f97316] animate-spin" />
        </div>
      )}
      {phase === "visible" && (
        <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-sm border border-white/10">
          <Timer className="w-3 h-3 text-[#f97316]" />
          <span className="text-[11px] font-mono text-white tabular-nums">{countdown}s</span>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/60 to-transparent pointer-events-none">
        <p className="text-[10px] font-dm-sans font-semibold uppercase tracking-[0.08em] text-white/60">{label}</p>
      </div>
    </div>
  );
}

// ── InfoRow ───────────────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg bg-[#1a1a1a] border border-[#252525]">
      <Icon className="w-4 h-4 text-[#4a4a4a] shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-dm-sans text-[#4a4a4a] leading-none mb-1 uppercase tracking-[0.07em]">{label}</p>
        <p className="text-[13px] font-dm-sans text-[#f0f0f0] leading-tight truncate">{value || "—"}</p>
      </div>
    </div>
  );
}

// ── ApproveDialog ─────────────────────────────────────────────────────────────

function ApproveDialog({ open, onOpenChange, onConfirm, isPending }:
  { open: boolean; onOpenChange: (v: boolean) => void; onConfirm: () => void; isPending: boolean }) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className={OVERLAY_CLS} />
        <AlertDialog.Content className={CONTENT_CLS}>
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
          </div>
          <AlertDialog.Title className="font-syne font-bold text-[#f0f0f0] text-[16px] leading-tight mb-2">
            Approve Business Profile?
          </AlertDialog.Title>
          <AlertDialog.Description className="text-[13px] font-dm-sans text-[#888888] leading-relaxed">
            This will verify the business and grant them merchant-level access on the platform. This action cannot be undone.
          </AlertDialog.Description>
          <div className="flex gap-3 mt-6">
            <AlertDialog.Cancel className="flex-1 px-4 py-2.5 rounded-xl text-[13px] font-dm-sans font-medium text-[#888888] border border-[#252525] bg-[#1a1a1a] hover:bg-[#222222] hover:text-[#f0f0f0] transition-colors duration-150">
              Cancel
            </AlertDialog.Cancel>
            <AlertDialog.Action onClick={(e) => { e.preventDefault(); onConfirm(); }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-dm-sans font-semibold bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/15 transition-colors duration-150">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Approve</>}
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

// ── RejectDialog ──────────────────────────────────────────────────────────────

function RejectDialog({ open, onOpenChange, onConfirm, isPending, submitError }:
  { open: boolean; onOpenChange: (v: boolean) => void; onConfirm: (r: string) => void; isPending: boolean; submitError: string | null }) {
  const [reason,   setReason]   = useState("");
  const [fieldErr, setFieldErr] = useState("");

  useEffect(() => { if (open) { setReason(""); setFieldErr(""); } }, [open]);

  const handleConfirm = () => {
    const t = reason.trim();
    if (t.length < 10) { setFieldErr("Reason must be at least 10 characters."); return; }
    onConfirm(t);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={OVERLAY_CLS} />
        <Dialog.Content className={CONTENT_CLS} aria-describedby="biz-reject-desc">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20">
              <XCircle className="w-6 h-6 text-red-400" />
            </div>
            <Dialog.Close className="flex items-center justify-center w-8 h-8 rounded-lg text-[#4a4a4a] hover:text-[#888888] hover:bg-[#222222] transition-colors">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>
          <Dialog.Title className="font-syne font-bold text-[#f0f0f0] text-[16px] leading-tight mb-1">
            Reject Business Profile
          </Dialog.Title>
          <Dialog.Description id="biz-reject-desc" className="text-[13px] font-dm-sans text-[#888888] leading-relaxed mb-4">
            Provide a clear reason. The business owner will be notified.
          </Dialog.Description>
          <textarea value={reason} onChange={(e) => { setReason(e.target.value); setFieldErr(""); }}
            placeholder="e.g. Registration documents are incomplete or unverifiable…" rows={4}
            className={cn(
              "w-full px-3.5 py-3 rounded-xl bg-[#1a1a1a] border text-[13px] font-dm-sans text-[#f0f0f0] placeholder:text-[#4a4a4a] resize-none",
              "focus:outline-none focus:border-[rgba(249,115,22,0.4)] transition-colors duration-150 leading-relaxed",
              fieldErr ? "border-red-500/50" : "border-[#252525]"
            )} />
          <div className="flex items-center justify-between mt-1.5 px-0.5">
            {fieldErr
              ? <p className="text-[11px] font-dm-sans text-red-400">{fieldErr}</p>
              : <p className="text-[11px] font-dm-sans text-[#4a4a4a]">Min. 10 characters</p>}
            <p className={cn("text-[11px] font-dm-sans", reason.length < 10 ? "text-[#4a4a4a]" : "text-[#888888]")}>{reason.length} chars</p>
          </div>
          {submitError && (
            <div className="flex items-center gap-2 mt-3 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-[12px] font-dm-sans text-red-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />{submitError}
            </div>
          )}
          <div className="flex gap-3 mt-5">
            <Dialog.Close className="flex-1 px-4 py-2.5 rounded-xl text-[13px] font-dm-sans font-medium text-[#888888] border border-[#252525] bg-[#1a1a1a] hover:bg-[#222222] hover:text-[#f0f0f0] transition-colors duration-150">
              Cancel
            </Dialog.Close>
            <button onClick={handleConfirm} disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-dm-sans font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/15 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4" /> Confirm Reject</>}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── BusinessList ──────────────────────────────────────────────────────────────

function BusinessList({ data, isLoading, selectedId, onSelect }:
  { data: BusinessListResponse | undefined; isLoading: boolean; selectedId: string | null; onSelect: (p: BusinessProfile) => void }) {
  const profiles = data?.profiles ?? [];
  const total    = data?.total ?? 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-[#252525] shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[rgba(249,115,22,0.1)] border border-[rgba(249,115,22,0.2)]">
          <Briefcase className="w-4 h-4 text-[#f97316]" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-syne font-bold text-[#f0f0f0] text-[14px] leading-tight">Business Queue</h2>
          <p className="text-[10px] font-dm-sans text-[#888888] leading-none mt-0.5">
            {isLoading ? "Loading…" : `${total.toLocaleString()} pending review`}
          </p>
        </div>
        {isLoading && <Loader2 className="w-4 h-4 text-[#4a4a4a] animate-spin shrink-0" />}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3.5 border-b border-[#252525] last:border-b-0 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-[#252525] shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2 pt-0.5">
                <div className="flex justify-between gap-2">
                  <div className="h-3.5 w-32 rounded bg-[#252525]" />
                  <div className="h-4 w-14 rounded-full bg-[#252525]" />
                </div>
                <div className="h-3 w-20 rounded bg-[#252525]" />
                <div className="h-2.5 w-24 rounded bg-[#252525]" />
              </div>
            </div>
          ))
        ) : profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center py-20">
            <Briefcase className="w-8 h-8 text-[#2d2d2d]" />
            <p className="text-[12px] font-dm-sans text-[#888888]">No pending profiles</p>
            <p className="text-[11px] font-dm-sans text-[#4a4a4a]">All business applications reviewed</p>
          </div>
        ) : (
          profiles.map((p) => {
            const isSelected = selectedId === p.id;
            const cfg = STATUS_CFG[p.status] ?? STATUS_CFG.pending;
            return (
              <button key={p.id} onClick={() => onSelect(p)}
                className={cn(
                  "w-full flex items-start gap-3 px-4 py-3.5 text-left border-l-2 transition-all duration-150",
                  "border-b border-[#252525] last:border-b-0",
                  isSelected
                    ? "border-l-[#f97316] bg-[rgba(249,115,22,0.07)]"
                    : "border-l-transparent hover:bg-[rgba(249,115,22,0.03)] hover:border-l-[rgba(249,115,22,0.35)]"
                )}>
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                  isSelected ? "bg-[rgba(249,115,22,0.2)] border border-[rgba(249,115,22,0.3)]" : "bg-[#222222] border border-[#2d2d2d]"
                )}>
                  <span className={cn("text-[11px] font-syne font-bold select-none", isSelected ? "text-[#f97316]" : "text-[#888888]")}>
                    {initials(p.business_name)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <p className={cn("text-[13px] font-dm-sans font-medium leading-tight truncate", isSelected ? "text-[#f0f0f0]" : "text-[#c0c0c0]")}>
                      {p.business_name || "—"}
                    </p>
                    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-dm-sans font-medium border shrink-0", cfg.cls)}>
                      <span className={cn("w-1 h-1 rounded-full", cfg.dot)} />{cfg.label}
                    </span>
                  </div>
                  <p className="text-[11px] font-dm-sans text-[#888888] leading-none mb-1">{p.owner.name || "—"}</p>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-dm-sans font-medium bg-[#252525] text-[#888888] border border-[#2d2d2d] capitalize">
                      {p.business_type}
                    </span>
                    <span className="text-[10px] font-dm-sans text-[#4a4a4a]">{timeAgo(p.submitted_at)}</span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── BusinessDetail ────────────────────────────────────────────────────────────

function BusinessDetail({ profile, onActionDone }:
  { profile: BusinessProfile; onActionDone: (type: "approve" | "reject") => void }) {
  const [approveOpen,  setApproveOpen]  = useState(false);
  const [rejectOpen,   setRejectOpen]   = useState(false);
  const [rejectErrMsg, setRejectErrMsg] = useState<string | null>(null);

  const approveMutation = useMutation({
    mutationFn: () => approveBusiness(profile.profile_id),
    onSuccess: () => { setApproveOpen(false); onActionDone("approve"); },
    onError:   () => { setApproveOpen(false); },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => rejectBusiness(profile.profile_id, reason),
    onSuccess: () => { setRejectOpen(false); setRejectErrMsg(null); onActionDone("reject"); },
    onError:   () => setRejectErrMsg("Failed to reject. Please try again."),
  });

  const isPending = profile.status === "pending";
  const ai        = profile.ai_analysis;
  const confColor = ai ? (ai.confidence >= 80 ? "#22c55e" : ai.confidence >= 60 ? "#facc15" : "#f87171") : "#f97316";

  return (
    <div className="flex flex-col min-h-full p-6 gap-5">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#1a1a1a] border border-[#252525]">
        <div className="w-14 h-14 rounded-2xl bg-[rgba(249,115,22,0.15)] border border-[rgba(249,115,22,0.2)] flex items-center justify-center shrink-0">
          <span className="text-[18px] font-syne font-bold text-[#f97316] select-none leading-none">
            {initials(profile.business_name)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-syne font-bold text-[#f0f0f0] text-[18px] leading-tight truncate mb-1.5">
            {profile.business_name || "—"}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-dm-sans font-medium border",
              STATUS_CFG[profile.status]?.cls ?? STATUS_CFG.pending.cls)}>
              <span className={cn("w-1 h-1 rounded-full", STATUS_CFG[profile.status]?.dot ?? STATUS_CFG.pending.dot)} />
              {STATUS_CFG[profile.status]?.label ?? "Pending"}
            </span>
            <span className="text-[11px] font-dm-sans text-[#4a4a4a]">
              Submitted {safeDate(profile.submitted_at, "MMM d, yyyy")}
            </span>
          </div>
        </div>
      </div>

      {/* ── Owner info ────────────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-dm-sans font-semibold uppercase tracking-[0.1em] text-[#4a4a4a] mb-3">Owner</p>
        <div className="grid grid-cols-2 gap-2">
          <InfoRow icon={User2}    label="Full Name"  value={profile.owner.name}  />
          <InfoRow icon={Phone}    label="Phone"      value={profile.owner.phone} />
          <InfoRow icon={Mail}     label="Email"      value={profile.owner.email} />
          <InfoRow icon={Calendar} label="Submitted"  value={safeDate(profile.submitted_at, "MMM d, yyyy · h:mm a")} />
        </div>
      </div>

      {/* ── Business info ─────────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-dm-sans font-semibold uppercase tracking-[0.1em] text-[#4a4a4a] mb-3">Business Details</p>
        <div className="grid grid-cols-2 gap-2">
          <InfoRow icon={Briefcase} label="Business Type" value={profile.business_type}       />
          <InfoRow icon={Hash}      label="Reg. Number"   value={profile.registration_number} />
        </div>
        {profile.description && (
          <div className="mt-2 flex items-start gap-3 px-3.5 py-3 rounded-lg bg-[#1a1a1a] border border-[#252525]">
            <FileText className="w-4 h-4 text-[#4a4a4a] shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-dm-sans text-[#4a4a4a] leading-none mb-1.5 uppercase tracking-[0.07em]">Description</p>
              <p className="text-[13px] font-dm-sans text-[#888888] leading-relaxed">{profile.description}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Rejection reason ─────────────────────────────────────────────── */}
      {profile.status === "rejected" && profile.rejection_reason && (
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-dm-sans font-semibold uppercase tracking-[0.07em] text-red-400/70 mb-1">Rejection Reason</p>
            <p className="text-[13px] font-dm-sans text-red-300 leading-relaxed">{profile.rejection_reason}</p>
          </div>
        </div>
      )}

      {/* ── Documents ────────────────────────────────────────────────────── */}
      {profile.documents.length > 0 && (
        <div>
          <p className="text-[10px] font-dm-sans font-semibold uppercase tracking-[0.1em] text-[#4a4a4a] mb-3">Documents</p>
          <div className="grid grid-cols-2 gap-3">
            {profile.documents.map((doc, i) => (
              <RevealGuard key={i} url={doc.url} label={doc.type} aspect="aspect-[4/3]" />
            ))}
          </div>
        </div>
      )}

      {/* ── AI Analysis ──────────────────────────────────────────────────── */}
      {ai && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-dm-sans font-semibold uppercase tracking-[0.1em] text-[#4a4a4a]">AI Analysis</p>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-dm-sans font-semibold border bg-[rgba(249,115,22,0.1)] text-[#f97316] border-[rgba(249,115,22,0.2)]">
              <Bot className="w-3 h-3" /> DeepSeek
            </span>
          </div>
          <div className="p-4 rounded-xl bg-[#1a1a1a] border border-[#252525] space-y-3">
            <p className="text-[13px] font-dm-sans text-[#888888] leading-relaxed">{ai.result}</p>
            <div className="flex items-center justify-between pt-1 border-t border-[#252525]">
              <span className="text-[11px] font-dm-sans text-[#4a4a4a]">Confidence Score</span>
              <div className="flex items-center gap-2.5">
                <div className="w-28 h-1.5 rounded-full bg-[#252525] overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${ai.confidence}%`, background: confColor }} />
                </div>
                <span className="text-[12px] font-dm-sans font-semibold tabular-nums" style={{ color: confColor }}>
                  {ai.confidence}%
                </span>
              </div>
            </div>
            <p className="text-[10px] font-dm-sans text-[#4a4a4a]">
              Analyzed {safeDate(ai.analyzed_at, "MMM d, yyyy · h:mm a")}
            </p>
          </div>
        </div>
      )}

      {/* ── Action buttons ────────────────────────────────────────────────── */}
      {isPending && (
        <div className="flex gap-3 pt-2 mt-auto">
          <button onClick={() => setRejectOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[13px] font-dm-sans font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/15 transition-all duration-150">
            <XCircle className="w-4 h-4" /> Reject
          </button>
          <button onClick={() => setApproveOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[13px] font-dm-sans font-semibold bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/15 transition-all duration-150">
            <CheckCircle2 className="w-4 h-4" /> Approve
          </button>
        </div>
      )}

      <ApproveDialog open={approveOpen} onOpenChange={setApproveOpen}
        onConfirm={() => approveMutation.mutate()} isPending={approveMutation.isPending} />
      <RejectDialog  open={rejectOpen}  onOpenChange={setRejectOpen}
        onConfirm={(r) => rejectMutation.mutate(r)} isPending={rejectMutation.isPending} submitError={rejectErrMsg} />
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[rgba(249,115,22,0.06)] border border-[rgba(249,115,22,0.12)] flex items-center justify-center">
        <Building2 className="w-7 h-7 text-[#2d2d2d]" />
      </div>
      <div>
        <p className="font-syne font-bold text-[#f0f0f0] text-[16px] leading-tight">Select a Business Profile</p>
        <p className="text-[13px] font-dm-sans text-[#888888] mt-2 leading-relaxed max-w-[260px]">
          Choose a pending business profile from the queue to review documents and take action.
        </p>
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

interface ToastState { message: string; type: "success" | "error" }

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BusinessPage() {
  const [selected, setSelected] = useState<BusinessProfile | null>(null);
  const [toast,    setToast]    = useState<ToastState | null>(null);

  const { setExtras, clearExtras } = useTopNavExtras();

  const { data, isLoading, refetch } = useQuery<BusinessListResponse>({
    queryKey: ["business-pending"],
    queryFn:  getPendingBusinesses,
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

  const handleActionDone = useCallback((type: "approve" | "reject") => {
    showToast(
      type === "approve"
        ? "Business profile approved — merchant access granted."
        : "Business profile rejected — owner has been notified.",
      type === "approve" ? "success" : "error"
    );
    setSelected(null);
    refetch();
  }, [showToast, refetch]);

  return (
    <>
      <div className="flex -mx-6 -my-6 h-[calc(100vh-56px)] overflow-hidden">
        {/* Left: queue */}
        <div className="w-[380px] shrink-0 border-r border-[#252525] flex flex-col bg-[#111111]">
          <BusinessList
            data={data}
            isLoading={isLoading}
            selectedId={selected?.id ?? null}
            onSelect={setSelected}
          />
        </div>
        {/* Right: detail */}
        <div className="flex-1 overflow-y-auto" style={{ background: "var(--bg-primary)" }}>
          {selected
            ? <BusinessDetail key={selected.id} profile={selected} onActionDone={handleActionDone} />
            : <EmptyState />}
        </div>
      </div>

      {toast && (
        <div className={cn(
          "fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3.5 rounded-xl border shadow-2xl",
          "font-dm-sans text-[13px] max-w-sm transition-all duration-300",
          toast.type === "success"
            ? "bg-[#0b1a0b] border-green-500/30 text-green-400"
            : "bg-[#1a0b0b] border-red-500/30 text-red-400"
        )}>
          {toast.type === "success" ? <Check className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => setToast(null)} className="opacity-50 hover:opacity-100 transition-opacity ml-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </>
  );
}
