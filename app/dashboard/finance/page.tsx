"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  RefreshCw, CheckCircle, XCircle, FileText, Clock,
  AlertTriangle, Check, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import apiClient from "@/lib/api/client";

// ── Types ─────────────────────────────────────────────────────────────────────
interface LimitRequest {
  _id?:            string;
  id?:             string;
  userName?:       string;
  userPhone?:      string;
  userEmail?:      string;
  currentLimit?:   number;
  oldLimit?:       number;
  newLimit?:       number;
  approvedLimit?:  number;
  previousLimit?:  number;
  createdAt?:      string;
  requestedAt?:    string;
  approvedAt?:     string;
  activatedAt?:    string;
  updatedAt?:      string;
  rejectedAt?:     string;
  step1ApprovedAt?: string;
  rejectedBy?:     string;
  reviewedBy?:     string;
  cnicFrontUrl?:   string;
  cnicBackUrl?:    string;
  selfieUrl?:      string;
  user?: {
    name?:         string;
    phone?:        string;
    email?:        string;
    cnicFrontUrl?: string;
    cnicBackUrl?:  string;
    selfieUrl?:    string;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtCurrency = (n: number | undefined) =>
  new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(n ?? 0);

const fmtDatetime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString("en-PK", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function getId(r: LimitRequest) { return r._id ?? r.id ?? ""; }
function getName(r: LimitRequest) { return r.userName ?? r.user?.name ?? "—"; }
function getPhone(r: LimitRequest) { return r.userPhone ?? r.user?.phone ?? "—"; }
function getEmail(r: LimitRequest) { return r.userEmail ?? r.user?.email ?? "—"; }
function getLimit(r: LimitRequest) { return r.currentLimit ?? r.oldLimit; }

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onDone }: { msg: string; type: "success"|"error"; onDone: () => void }) {
  useEffect(() => { if (!msg) return; const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [msg, onDone]);
  if (!msg) return null;
  return (
    <div className={cn("fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3.5 rounded-xl border shadow-2xl font-dm-sans text-[13px] max-w-sm",
      type === "success" ? "bg-[#0b1a0b] border-green-500/30 text-green-400" : "bg-[#1a0b0b] border-red-500/30 text-red-400")}>
      {type === "success" ? <Check className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
      <span className="flex-1">{msg}</span>
      <button onClick={onDone} className="opacity-50 hover:opacity-100 transition-opacity ml-1"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
}

// ── Confirm ───────────────────────────────────────────────────────────────────
function ConfirmDialog({ open, title, message, confirmLabel, danger, onConfirm, onCancel, loading }: {
  open: boolean; title: string; message: string; confirmLabel: string; danger?: boolean;
  onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-[#111111] border border-[#252525] rounded-2xl shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h3 className="font-syne font-bold text-[#f0f0f0] text-[16px] text-center mb-2">{title}</h3>
        <p className="text-[13px] font-dm-sans text-[#888] text-center leading-relaxed mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onCancel} disabled={loading}
            className="px-4 py-2.5 rounded-xl text-[13px] font-dm-sans font-medium text-[#888] border border-[#252525] bg-[#1a1a1a] hover:bg-[#222] hover:text-[#f0f0f0] transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-dm-sans font-semibold transition-colors disabled:opacity-50",
              danger
                ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/15"
                : "bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/15")}>
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Image Lightbox ────────────────────────────────────────────────────────────
function ImageThumb({ url, label }: { url?: string; label: string }) {
  const [open, setOpen] = useState(false);
  if (!url) return (
    <div className="border-2 border-dashed border-[#252525] rounded-xl h-44 flex flex-col items-center justify-center gap-2 bg-[#111]">
      <span className="text-2xl">🖼️</span>
      <span className="text-[11px] font-dm-sans text-[#555]">No {label}</span>
    </div>
  );
  return (
    <>
      <div>
        <p className="text-[10px] font-dm-sans font-semibold text-[#555] uppercase tracking-[0.05em] mb-1.5">{label}</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={label} onClick={() => setOpen(true)}
          className="w-full h-44 object-cover rounded-xl border border-[#252525] cursor-zoom-in bg-[#111] block" />
      </div>
      {open && (
        <div className="fixed inset-0 bg-black/85 z-[800] flex items-center justify-center p-5" onClick={() => setOpen(false)}>
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setOpen(false)}
              className="absolute -top-10 right-0 bg-white/15 border-none text-white rounded-lg w-8 h-8 flex items-center justify-center text-[15px] cursor-pointer">
              <X className="w-4 h-4" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={label} className="max-w-full max-h-[85vh] rounded-xl block mx-auto" />
            <p className="text-center mt-3 text-white text-[13px] font-dm-sans">{label}</p>
          </div>
        </div>
      )}
    </>
  );
}

// ── Review Modal ──────────────────────────────────────────────────────────────
function ReviewModal({ request, onClose, onApprove, onReject, loading }: {
  request: LimitRequest | null; onClose: () => void;
  onApprove: () => void; onReject: () => void; loading: boolean;
}) {
  if (!request) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-[700] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-[#1a1a1a]"
          style={{ background: "linear-gradient(135deg,#f9731618 0%,#f9731608 100%)", borderColor: "#f9731625" }}>
          <div>
            <p className="text-[10px] font-dm-sans uppercase tracking-[0.08em] text-[#555] mb-1">Document Review</p>
            <h3 className="font-syne font-bold text-[#f0f0f0] text-[17px]">{getName(request)}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#252525] text-[#666] hover:text-[#f0f0f0] flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User info */}
        <div className="px-6 pt-4 flex gap-6 flex-wrap">
          {[
            ["Phone",           getPhone(request)],
            ["Email",           getEmail(request)],
            ["Step 1 Approved", fmtDatetime(request.step1ApprovedAt)],
            ["Requested On",    fmtDate(request.createdAt ?? request.requestedAt)],
          ].map(([label, val]) => val && val !== "—" ? (
            <div key={label}>
              <p className="text-[10px] font-dm-sans text-[#555] uppercase tracking-[0.05em] font-semibold">{label}</p>
              <p className="text-[13px] font-dm-sans text-[#f0f0f0] mt-0.5">{val}</p>
            </div>
          ) : null)}
        </div>

        {/* Documents */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-3 gap-3">
            <ImageThumb url={request.cnicFrontUrl ?? request.user?.cnicFrontUrl} label="CNIC Front" />
            <ImageThumb url={request.cnicBackUrl  ?? request.user?.cnicBackUrl}  label="CNIC Back" />
            <ImageThumb url={request.selfieUrl    ?? request.user?.selfieUrl}    label="Selfie" />
          </div>

          {/* Limit comparison */}
          <div className="mt-4 flex gap-8 px-5 py-4 bg-[#111] border border-[#1e1e1e] rounded-xl">
            <div>
              <p className="text-[10px] font-dm-sans text-[#555] uppercase tracking-[0.05em] font-semibold">Current Limit</p>
              <p className="text-[16px] font-syne font-bold text-[#f0f0f0] mt-0.5">{fmtCurrency(getLimit(request))}</p>
            </div>
            <div>
              <p className="text-[10px] font-dm-sans text-[#555] uppercase tracking-[0.05em] font-semibold">Requested Limit</p>
              <p className="text-[16px] font-syne font-bold text-green-400 mt-0.5">PKR 2,00,000</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-[#1a1a1a] flex gap-3 justify-end">
          <button onClick={onClose} disabled={loading}
            className="px-4 py-2.5 rounded-xl text-[13px] font-dm-sans font-medium text-[#666] border border-[#1e1e1e] bg-[#111] hover:bg-[#1a1a1a] hover:text-[#f0f0f0] transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onReject} disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-dm-sans font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/15 transition-colors disabled:opacity-50">
            <XCircle className="w-4 h-4" /> Reject
          </button>
          <button onClick={onApprove} disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-dm-sans font-semibold bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/15 transition-colors disabled:opacity-50">
            <CheckCircle className="w-4 h-4" />
            {loading ? "Processing…" : "Approve — Set PKR 2,00,000"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Table wrapper ─────────────────────────────────────────────────────────────
function TableCard({ title, onRefresh, loading, children }: {
  title: string; onRefresh: () => void; loading: boolean; children: React.ReactNode;
}) {
  return (
    <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#1a1a1a] flex items-center justify-between">
        <span className="font-syne font-bold text-[#f0f0f0] text-[14px]">{title}</span>
        <button onClick={onRefresh} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-dm-sans font-medium text-[#888] border border-[#1e1e1e] bg-[#111] hover:text-[#f0f0f0] hover:border-[#252525] transition-colors disabled:opacity-50">
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /> Refresh
        </button>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

// ── Table cell styles ─────────────────────────────────────────────────────────
const TH = "px-4 py-2.5 text-left text-[10px] font-dm-sans font-semibold uppercase tracking-[0.06em] text-[#555] whitespace-nowrap bg-[#111] border-b border-[#1a1a1a]";
const TD = "px-4 py-3 font-dm-sans text-[13px] text-[#888] align-middle border-b border-[#1a1a1a]";

// ── Skeleton ──────────────────────────────────────────────────────────────────
function TableSkeleton({ cols, rows = 5 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((__, j) => (
            <td key={j} className="px-4 py-3 border-b border-[#1a1a1a]">
              <div className="h-3 rounded-lg bg-[#1a1a1a] animate-pulse" style={{ width: `${60 + (j * 15) % 40}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <tr><td colSpan={99}>
      <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#111] border border-[#1a1a1a] flex items-center justify-center">
          <Icon className="w-6 h-6 text-[#3a3a3a]" />
        </div>
        <p className="font-syne font-bold text-[#f0f0f0] text-[14px]">{title}</p>
        <p className="text-[12px] font-dm-sans text-[#444]">{desc}</p>
      </div>
    </td></tr>
  );
}

// ── Pending Step 1 Tab ────────────────────────────────────────────────────────
function PendingStep1Tab({ onCountChange }: { onCountChange?: (n: number) => void }) {
  const [rows, setRows]         = useState<LimitRequest[]>([]);
  const [loading, setLoading]   = useState(false);
  const [confirm, setConfirm]   = useState<LimitRequest | null>(null);
  const [actLoad, setActLoad]   = useState(false);
  const [toast, setToast]       = useState({ msg: "", type: "success" as "success"|"error" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/admin/limit-requests?step=1&status=pending");
      const arr: LimitRequest[] = data?.requests ?? data?.data ?? data ?? [];
      setRows(arr);
      onCountChange?.(arr.length);
    } catch { setToast({ msg: "Failed to load Step 1 requests.", type: "error" }); }
    finally { setLoading(false); }
  }, [onCountChange]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async () => {
    if (!confirm) return;
    setActLoad(true);
    try {
      await apiClient.patch(`/admin/limit-requests/${getId(confirm)}/approve-step1`);
      setToast({ msg: `Step 1 approved for ${getName(confirm)}.`, type: "success" });
      setConfirm(null);
      await load();
    } catch { setToast({ msg: "Approval failed. Please try again.", type: "error" }); }
    finally { setActLoad(false); }
  };

  return (
    <>
      <TableCard title="Pending Step 1" onRefresh={load} loading={loading}>
        <table className="w-full border-collapse text-[13px]">
          <thead><tr>
            {["User", "Phone", "Email", "Requested Date", "Current Limit", "Action"].map(h =>
              <th key={h} className={TH}>{h}</th>)}
          </tr></thead>
          <tbody>
            {loading ? <TableSkeleton cols={6} /> :
             rows.length === 0 ? <EmptyState icon={Clock} title="No pending Step 1 requests" desc="All Step 1 requests have been processed." /> :
             rows.map((r, i) => (
              <tr key={getId(r) || i} className="hover:bg-[#111] transition-colors">
                <td className={TD}>
                  <p className="font-semibold text-[#f0f0f0]">{getName(r)}</p>
                  <p className="text-[11px] text-[#555] mt-0.5">ID: {getId(r).slice(-8)}</p>
                </td>
                <td className={TD}>{getPhone(r)}</td>
                <td className={TD}>{getEmail(r)}</td>
                <td className={cn(TD, "whitespace-nowrap text-[12px]")}>{fmtDatetime(r.createdAt ?? r.requestedAt)}</td>
                <td className={cn(TD, "font-semibold text-[#f97316]")}>{fmtCurrency(getLimit(r))}</td>
                <td className={TD}>
                  <button onClick={() => setConfirm(r)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-dm-sans font-semibold bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/15 transition-colors">
                    <CheckCircle className="w-3.5 h-3.5" /> Approve Step 1
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      <ConfirmDialog open={!!confirm} title="Approve Step 1"
        message={`Approve Step 1 for ${confirm ? getName(confirm) : "this user"}? They will move to the Step 2 Document Review queue.`}
        confirmLabel="Yes, Approve Step 1"
        onConfirm={handleApprove} onCancel={() => setConfirm(null)} loading={actLoad} />
      <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(t => ({ ...t, msg: "" }))} />
    </>
  );
}

// ── Step 2 Review Tab ─────────────────────────────────────────────────────────
function Step2ReviewTab({ onCountChange }: { onCountChange?: (n: number) => void }) {
  const [rows, setRows]               = useState<LimitRequest[]>([]);
  const [loading, setLoading]         = useState(false);
  const [selected, setSelected]       = useState<LimitRequest | null>(null);
  const [actLoad, setActLoad]         = useState(false);
  const [toast, setToast]             = useState({ msg: "", type: "success" as "success"|"error" });
  const [rejectTarget, setRejectTarget] = useState<LimitRequest | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/admin/limit-requests?status=pending");
      const arr: LimitRequest[] = data?.requests ?? data?.data ?? data ?? [];
      setRows(arr);
      onCountChange?.(arr.length);
    } catch { setToast({ msg: "Failed to load pending requests.", type: "error" }); }
    finally { setLoading(false); }
  }, [onCountChange]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async () => {
    if (!selected) return;
    setActLoad(true);
    try {
      await apiClient.patch(`/admin/limit-requests/${getId(selected)}/approve`);
      setToast({ msg: `Rs. 200,000 limit approved for ${getName(selected)}.`, type: "success" });
      setSelected(null);
      await load();
    } catch { setToast({ msg: "Final approval failed. Please try again.", type: "error" }); }
    finally { setActLoad(false); }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setActLoad(true);
    try {
      await apiClient.patch(`/admin/limit-requests/${getId(rejectTarget)}/reject`);
      setToast({ msg: `Request rejected for ${getName(rejectTarget)}.`, type: "success" });
      setRejectTarget(null);
      await load();
    } catch { setToast({ msg: "Rejection failed. Please try again.", type: "error" }); }
    finally { setActLoad(false); }
  };

  return (
    <>
      <TableCard title="Pending Requests" onRefresh={load} loading={loading}>
        <table className="w-full border-collapse text-[13px]">
          <thead><tr>
            {["User", "Phone", "Email", "Requested At", "Current Limit", "Action"].map(h =>
              <th key={h} className={TH}>{h}</th>)}
          </tr></thead>
          <tbody>
            {loading ? <TableSkeleton cols={6} /> :
             rows.length === 0 ? <EmptyState icon={FileText} title="No pending limit requests" desc="New limit requests will appear here." /> :
             rows.map((r, i) => (
              <tr key={getId(r) || i} className="hover:bg-[#111] transition-colors">
                <td className={TD}>
                  <p className="font-semibold text-[#f0f0f0]">{getName(r)}</p>
                  <p className="text-[11px] text-[#555] mt-0.5">ID: {getId(r).slice(-8)}</p>
                </td>
                <td className={TD}>{getPhone(r)}</td>
                <td className={TD}>{getEmail(r)}</td>
                <td className={cn(TD, "whitespace-nowrap text-[12px]")}>{fmtDatetime(r.createdAt ?? r.requestedAt)}</td>
                <td className={cn(TD, "font-semibold text-[#f97316]")}>{fmtCurrency(getLimit(r))}</td>
                <td className={TD}>
                  <button onClick={() => { setSelected(r); setActLoad(false); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-dm-sans font-semibold bg-[rgba(249,115,22,0.08)] text-[#f97316] border border-[rgba(249,115,22,0.2)] hover:bg-[rgba(249,115,22,0.14)] transition-colors">
                    <FileText className="w-3.5 h-3.5" /> Review Docs
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      <ReviewModal request={selected} onClose={() => setSelected(null)}
        onApprove={handleApprove}
        onReject={() => { setRejectTarget(selected); setSelected(null); }}
        loading={actLoad} />

      <ConfirmDialog open={!!rejectTarget} title="Reject Limit Request" danger
        message={`Are you sure you want to REJECT the limit request for ${rejectTarget ? getName(rejectTarget) : "this user"}? The user will be notified.`}
        confirmLabel="Yes, Reject"
        onConfirm={handleReject} onCancel={() => setRejectTarget(null)} loading={actLoad} />

      <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(t => ({ ...t, msg: "" }))} />
    </>
  );
}

// ── Completed Tab ─────────────────────────────────────────────────────────────
function CompletedTab() {
  const [rows, setRows]       = useState<LimitRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast]     = useState({ msg: "", type: "success" as "success"|"error" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/admin/limit-requests?status=activated");
      setRows(data?.requests ?? data?.data ?? data ?? []);
    } catch { setToast({ msg: "Failed to load completed requests.", type: "error" }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <TableCard title="Completed Activations" onRefresh={load} loading={loading}>
        <table className="w-full border-collapse text-[13px]">
          <thead><tr>
            {["User", "Phone", "Email", "Old Limit", "New Limit", "Activated Date"].map(h =>
              <th key={h} className={TH}>{h}</th>)}
          </tr></thead>
          <tbody>
            {loading ? <TableSkeleton cols={6} /> :
             rows.length === 0 ? <EmptyState icon={CheckCircle} title="No completed activations yet" desc="Approved limit increases will appear here." /> :
             rows.map((r, i) => (
              <tr key={getId(r) || i} className="hover:bg-[#111] transition-colors">
                <td className={TD}><p className="font-semibold text-[#f0f0f0]">{getName(r)}</p></td>
                <td className={TD}>{getPhone(r)}</td>
                <td className={TD}>{getEmail(r)}</td>
                <td className={cn(TD, "text-[#555]")}>{fmtCurrency(r.oldLimit ?? r.previousLimit)}</td>
                <td className={cn(TD, "font-bold text-green-400")}>
                  {(r.newLimit ?? r.approvedLimit) === -1 ? "Unlimited" : fmtCurrency(r.newLimit ?? r.approvedLimit)}
                </td>
                <td className={cn(TD, "whitespace-nowrap text-[12px]")}>{fmtDatetime(r.approvedAt ?? r.activatedAt ?? r.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
      <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(t => ({ ...t, msg: "" }))} />
    </>
  );
}

// ── Rejected Tab ──────────────────────────────────────────────────────────────
function RejectedTab() {
  const [rows, setRows]       = useState<LimitRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast]     = useState({ msg: "", type: "success" as "success"|"error" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/admin/limit-requests?status=rejected");
      setRows(data?.requests ?? data?.data ?? data ?? []);
    } catch { setToast({ msg: "Failed to load rejected requests.", type: "error" }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <TableCard title="Rejected Requests" onRefresh={load} loading={loading}>
        <table className="w-full border-collapse text-[13px]">
          <thead><tr>
            {["User", "Phone", "Email", "Old Limit", "Rejected At", "Rejected By"].map(h =>
              <th key={h} className={TH}>{h}</th>)}
          </tr></thead>
          <tbody>
            {loading ? <TableSkeleton cols={6} /> :
             rows.length === 0 ? <EmptyState icon={XCircle} title="No rejected requests" desc="Rejected limit requests will appear here." /> :
             rows.map((r, i) => (
              <tr key={getId(r) || i} className="hover:bg-[#111] transition-colors">
                <td className={TD}><p className="font-semibold text-[#f0f0f0]">{getName(r)}</p></td>
                <td className={TD}>{getPhone(r)}</td>
                <td className={TD}>{getEmail(r)}</td>
                <td className={cn(TD, "text-[#555]")}>{fmtCurrency(r.oldLimit ?? r.currentLimit)}</td>
                <td className={cn(TD, "whitespace-nowrap text-[12px] text-red-400")}>{fmtDatetime(r.rejectedAt ?? r.updatedAt)}</td>
                <td className={TD}>{r.rejectedBy ?? r.reviewedBy ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
      <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(t => ({ ...t, msg: "" }))} />
    </>
  );
}

// ── Tab Bar ───────────────────────────────────────────────────────────────────
type TabKey = "pending" | "completed" | "rejected";

interface TabDef { key: TabKey; label: string; count?: number | null; }

function TabBar({ tabs, active, onChange }: { tabs: TabDef[]; active: TabKey; onChange: (k: TabKey) => void }) {
  return (
    <div className="flex gap-0 border-b border-[#1a1a1a] overflow-x-auto">
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)}
          className={cn("flex items-center gap-2 px-5 py-3.5 text-[13px] font-dm-sans font-semibold whitespace-nowrap transition-all duration-150 border-b-2 -mb-px",
            active === t.key
              ? "border-[#f97316] text-[#f97316]"
              : "border-transparent text-[#666] hover:text-[#f0f0f0]")}>
          {t.label}
          {t.count != null && (
            <span className={cn("rounded-full text-[11px] font-bold px-2 py-0.5",
              active === t.key ? "bg-[#f97316] text-white" : "bg-[#1a1a1a] text-[#888]")}>
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function FinancePage() {
  const [activeTab,    setActiveTab]    = useState<TabKey>("pending");
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  const tabs: TabDef[] = [
    { key: "pending",   label: "Pending Requests", count: pendingCount },
    { key: "completed", label: "Completed" },
    { key: "rejected",  label: "Rejected"  },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[rgba(249,115,22,0.08)] border border-[rgba(249,115,22,0.18)]">
          <FileText className="w-4 h-4 text-[#f97316]" />
        </div>
        <div>
          <h2 className="font-syne font-bold text-[#f0f0f0] text-xl leading-tight">Limit Requests</h2>
          <p className="text-[11px] font-dm-sans text-[#555] leading-none mt-0.5">Review and manage user credit limit increase requests</p>
        </div>
      </div>

      {/* Tabs + content */}
      <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl overflow-hidden">
        <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />
        <div className="p-0">
          {activeTab === "pending"   && <Step2ReviewTab  onCountChange={setPendingCount} />}
          {activeTab === "completed" && <CompletedTab />}
          {activeTab === "rejected"  && <RejectedTab />}
        </div>
      </div>
    </div>
  );
}
