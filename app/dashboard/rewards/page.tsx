"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Gift, Plus, Edit2, Trash2, Check, AlertTriangle, X,
  ShoppingBag, Receipt, UtensilsCrossed, Zap, CreditCard, Tag, Star,
  ShieldOff, TrendingUp, PackageCheck, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getOfferTemplates, createOfferTemplate, updateOfferTemplate, deleteOfferTemplate,
  type OfferTemplate, type OfferListResponse, type CreateOfferPayload,
} from "@/lib/api/services/rewards";
import { useTopNavExtras } from "@/context/TopNavExtrasContext";

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = ["shopping", "food"] as const;
const CAT_COLORS: Record<string, string> = { shopping: "#f97316", food: "#22c55e" };
const ICON_OPTIONS = [
  { id: "cart",    label: "Cart",    El: ShoppingBag },
  { id: "receipt", label: "Receipt", El: Receipt },
  { id: "food",    label: "Food",    El: UtensilsCrossed },
  { id: "flash",   label: "Flash",   El: Zap },
  { id: "card",    label: "Card",    El: CreditCard },
  { id: "gift",    label: "Gift",    El: Gift },
  { id: "tag",     label: "Tag",     El: Tag },
  { id: "star",    label: "Star",    El: Star },
];
const COLOR_OPTIONS = ["#f97316","#3b82f6","#22c55e","#e53e3e","#a855f7","#eab308","#ec4899","#06b6d4"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function encodeMeta(icon: string, color: string, desc: string) {
  return JSON.stringify({ _i: icon, _c: color, _d: desc.trim() });
}
function decodeMeta(raw?: string) {
  try {
    const p = JSON.parse(raw ?? "");
    if (p._i && p._c) return { icon: p._i as string, color: p._c as string, desc: (p._d ?? "") as string };
  } catch { /* plain text */ }
  return { icon: "gift", color: "#f97316", desc: raw ?? "" };
}
function daysLeft(expiry: string) { return Math.ceil((new Date(expiry).getTime() - Date.now()) / 86_400_000); }
function expiryFromDays(n: number) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
const fmtPKR = (n: number) => `PKR ${(n ?? 0).toLocaleString()}`;

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

// ── Confirm Dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({ open, title, message, onConfirm, onCancel, loading }: {
  open: boolean; title: string; message: string;
  onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-[#111111] border border-[#252525] rounded-2xl shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 mb-4 mx-auto">
          <ShieldOff className="w-5 h-5 text-red-400" />
        </div>
        <h3 className="font-syne font-bold text-[#f0f0f0] text-[16px] text-center mb-2">{title}</h3>
        <p className="text-[13px] font-dm-sans text-[#888] text-center leading-relaxed mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-[13px] font-dm-sans font-medium text-[#888] border border-[#252525] bg-[#1a1a1a] hover:bg-[#222] hover:text-[#f0f0f0] transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-dm-sans font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/15 transition-colors disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={cn("relative w-11 h-6 rounded-full cursor-pointer transition-colors duration-200 shrink-0 border-none",
        checked ? "bg-green-500" : "bg-[#333]")}>
      <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200",
        checked ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}

// ── Offer Modal ───────────────────────────────────────────────────────────────
const EMPTY_FORM = { title: "", category: "shopping", description: "", targetAmount: "", rewardAmount: "", daysValid: "7", icon: "gift", color: "#f97316", isActive: true };

function OfferModal({ mode, offer, onClose, onSaved }: {
  mode: "add"|"edit"; offer?: OfferTemplate | null;
  onClose: () => void; onSaved: (msg: string) => void;
}) {
  const [form, setForm] = useState(() => {
    if (mode === "edit" && offer) {
      const m = decodeMeta(offer.description);
      return {
        title: offer.name, category: offer.type, description: m.desc,
        targetAmount: String(offer.min_spend), rewardAmount: String(offer.value),
        daysValid: String(Math.max(1, daysLeft(offer.expiry_date))),
        icon: m.icon, color: m.color, isActive: offer.is_active,
      };
    }
    return { ...EMPTY_FORM };
  });
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [saving, setSaving]   = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim())                                     e.title        = "Title is required.";
    if (!form.description.trim())                               e.description  = "Description is required.";
    if (!form.targetAmount || Number(form.targetAmount) <= 0)   e.targetAmount = "Valid target amount required.";
    if (!form.rewardAmount || Number(form.rewardAmount) <= 0)   e.rewardAmount = "Valid reward amount required.";
    if (!form.daysValid    || Number(form.daysValid)    <= 0)   e.daysValid    = "Valid days required.";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true); setSaveErr("");
    try {
      const payload: CreateOfferPayload = {
        name:          form.title.trim(),
        type:          form.category,
        discount_type: "flat",
        value:         Number(form.rewardAmount),
        min_spend:     Number(form.targetAmount),
        expiry_date:   expiryFromDays(Number(form.daysValid)),
        description:   encodeMeta(form.icon, form.color, form.description),
      };
      if (mode === "add") await createOfferTemplate(payload);
      else                await updateOfferTemplate(offer!.id, { ...payload, is_active: form.isActive });
      onSaved(mode === "add" ? "Offer created successfully." : "Offer updated successfully.");
      onClose();
    } catch { setSaveErr("Save failed. Please try again."); }
    finally  { setSaving(false); }
  };

  const inp = (field: string) => cn(
    "bg-[#0d0d0d] border rounded-xl px-3 py-2.5 text-[13px] font-dm-sans text-[#f0f0f0] placeholder-[#3a3a3a] outline-none focus:border-[#f97316] transition-colors w-full",
    errors[field] ? "border-red-500/50" : "border-[#1e1e1e]"
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-[540px] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between border-b"
          style={{ background: `linear-gradient(135deg,${form.color}18 0%,${form.color}08 100%)`, borderColor: `${form.color}25` }}>
          <div>
            <p className="text-[10px] font-dm-sans uppercase tracking-[0.08em] text-[#555] mb-1">
              {mode === "add" ? "New Offer" : "Edit Offer"}
            </p>
            <h3 className="font-syne font-bold text-[#f0f0f0] text-[17px]">
              {mode === "add" ? "Create Reward Offer" : (offer?.name ?? "Edit Offer")}
            </h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#252525] text-[#666] hover:text-[#f0f0f0] flex items-center justify-center transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto max-h-[65vh]">

            {/* Title + Category */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-dm-sans font-semibold text-[#555] uppercase tracking-[0.06em]">Title <span className="text-red-400">*</span></label>
                <input className={inp("title")} value={form.title} placeholder="e.g. Shopping Spree"
                  onChange={e => { set("title", e.target.value); setErrors(v => ({ ...v, title: "" })); }} />
                {errors.title && <span className="text-[11px] text-red-400">{errors.title}</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-dm-sans font-semibold text-[#555] uppercase tracking-[0.06em]">Category</label>
                <select className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl px-3 py-2.5 text-[13px] font-dm-sans text-[#f0f0f0] outline-none focus:border-[#f97316] transition-colors"
                  value={form.category}
                  onChange={e => { set("category", e.target.value); set("color", CAT_COLORS[e.target.value] ?? "#f97316"); }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-dm-sans font-semibold text-[#555] uppercase tracking-[0.06em]">Description <span className="text-red-400">*</span></label>
              <textarea className={cn("resize-none", inp("description"))} rows={2} value={form.description}
                placeholder="e.g. Spend Rs.5,000 on shopping this week and earn Rs.500 cashback!"
                onChange={e => { set("description", e.target.value); setErrors(v => ({ ...v, description: "" })); }} />
              {errors.description && <span className="text-[11px] text-red-400">{errors.description}</span>}
            </div>

            {/* Target + Reward */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-dm-sans font-semibold text-[#555] uppercase tracking-[0.06em]">Target Amount (PKR) <span className="text-red-400">*</span></label>
                <input type="number" min="1" className={inp("targetAmount")} value={form.targetAmount} placeholder="e.g. 5000"
                  onChange={e => { set("targetAmount", e.target.value); setErrors(v => ({ ...v, targetAmount: "" })); }} />
                {errors.targetAmount && <span className="text-[11px] text-red-400">{errors.targetAmount}</span>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-dm-sans font-semibold text-[#555] uppercase tracking-[0.06em]">Reward Amount (PKR) <span className="text-red-400">*</span></label>
                <input type="number" min="1" className={inp("rewardAmount")} value={form.rewardAmount} placeholder="e.g. 500"
                  onChange={e => { set("rewardAmount", e.target.value); setErrors(v => ({ ...v, rewardAmount: "" })); }} />
                {errors.rewardAmount && <span className="text-[11px] text-red-400">{errors.rewardAmount}</span>}
              </div>
            </div>

            {/* Valid Days */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-dm-sans font-semibold text-[#555] uppercase tracking-[0.06em]">Valid Days <span className="text-red-400">*</span></label>
              <input type="number" min="1" className={inp("daysValid")} value={form.daysValid} placeholder="e.g. 7"
                onChange={e => { set("daysValid", e.target.value); setErrors(v => ({ ...v, daysValid: "" })); }} />
              {errors.daysValid && <span className="text-[11px] text-red-400">{errors.daysValid}</span>}
            </div>

            {/* Icon picker */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-dm-sans font-semibold text-[#555] uppercase tracking-[0.06em]">Icon</label>
              <div className="flex gap-2 flex-wrap">
                {ICON_OPTIONS.map(({ id, label, El }) => (
                  <button key={id} type="button" onClick={() => set("icon", id)}
                    className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-dm-sans font-semibold cursor-pointer transition-all",
                      form.icon === id ? "border-2 bg-[#1a1a1a]" : "border border-[#1e1e1e] bg-[#111] text-[#555] hover:text-[#888]")}
                    style={form.icon === id ? { borderColor: form.color, color: form.color } : {}}>
                    <El className="w-3.5 h-3.5" />{label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color picker */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-dm-sans font-semibold text-[#555] uppercase tracking-[0.06em]">Color</label>
              <div className="flex gap-2 flex-wrap">
                {COLOR_OPTIONS.map(c => (
                  <button key={c} type="button" onClick={() => set("color", c)}
                    className="w-8 h-8 rounded-full cursor-pointer transition-all duration-150"
                    style={{ background: c, border: form.color === c ? "3px solid #f0f0f0" : "2px solid #1e1e1e" }} />
                ))}
              </div>
            </div>

            {/* Status — edit only */}
            {mode === "edit" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-dm-sans font-semibold text-[#555] uppercase tracking-[0.06em]">Status</label>
                <div className="flex items-center gap-3">
                  <Toggle checked={form.isActive} onChange={v => set("isActive", v)} />
                  <span className={cn("text-[13px] font-dm-sans font-semibold", form.isActive ? "text-green-400" : "text-[#555]")}>
                    {form.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            )}

            {saveErr && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[13px] font-dm-sans text-red-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />{saveErr}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#1a1a1a] flex gap-3 justify-end">
            <button type="button" onClick={onClose} disabled={saving}
              className="px-4 py-2.5 rounded-xl text-[13px] font-dm-sans font-medium text-[#666] border border-[#1e1e1e] bg-[#111] hover:bg-[#1a1a1a] hover:text-[#f0f0f0] transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-dm-sans font-semibold bg-[rgba(249,115,22,0.1)] text-[#f97316] border border-[rgba(249,115,22,0.25)] hover:bg-[rgba(249,115,22,0.16)] transition-colors disabled:opacity-60">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Saving…" : mode === "add" ? "Create Offer" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Card Skeleton ─────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl overflow-hidden">
      <div className="h-1.5 bg-[#1a1a1a] animate-pulse" />
      <div className="p-5 flex flex-col gap-3">
        <div className="flex justify-between">
          <div className="h-5 w-20 bg-[#1a1a1a] rounded-lg animate-pulse" />
          <div className="h-5 w-16 bg-[#1a1a1a] rounded-lg animate-pulse" />
        </div>
        <div className="h-4 w-4/5 bg-[#1a1a1a] rounded-lg animate-pulse" />
        <div className="h-3 w-full bg-[#1a1a1a] rounded-lg animate-pulse" />
        <div className="h-3 w-3/4 bg-[#1a1a1a] rounded-lg animate-pulse" />
        <div className="flex gap-4 mt-1">
          <div className="h-10 w-20 bg-[#1a1a1a] rounded-lg animate-pulse" />
          <div className="h-10 w-20 bg-[#1a1a1a] rounded-lg animate-pulse" />
          <div className="h-10 w-20 bg-[#1a1a1a] rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// ── Offer Card ────────────────────────────────────────────────────────────────
function OfferCard({ offer, onEdit, onDelete }: { offer: OfferTemplate; onEdit: () => void; onDelete: () => void }) {
  const meta   = decodeMeta(offer.description);
  const IconEl = ICON_OPTIONS.find(i => i.id === meta.icon)?.El ?? Gift;
  const days   = daysLeft(offer.expiry_date);

  return (
    <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:border-[#252525] hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:-translate-y-0.5">
      <div className="h-1.5 shrink-0" style={{ background: meta.color }} />

      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Badges */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-dm-sans font-semibold px-2.5 py-1 rounded-lg capitalize flex items-center gap-1.5"
            style={{ background: `${meta.color}18`, color: meta.color }}>
            <IconEl className="w-3 h-3" />{offer.type}
          </span>
          <span className={cn("text-[11px] font-dm-sans font-semibold px-2.5 py-1 rounded-lg",
            offer.is_active ? "bg-green-500/10 text-green-400" : "bg-[#1a1a1a] text-[#444]")}>
            {offer.is_active ? "● Active" : "○ Inactive"}
          </span>
        </div>

        {/* Title + desc */}
        <div>
          <h3 className="font-syne font-bold text-[#f0f0f0] text-[15px] leading-snug">{offer.name}</h3>
          {meta.desc && <p className="text-[12px] font-dm-sans text-[#555] mt-1 leading-relaxed line-clamp-2">{meta.desc}</p>}
        </div>

        {/* Stats */}
        <div className="flex items-start gap-5 pt-1">
          <div>
            <p className="text-[10px] font-dm-sans text-[#444] uppercase tracking-[0.06em]">Target</p>
            <p className="text-[14px] font-syne font-bold text-[#f0f0f0]">{fmtPKR(offer.min_spend)}</p>
          </div>
          <div>
            <p className="text-[10px] font-dm-sans text-[#444] uppercase tracking-[0.06em]">Reward</p>
            <p className="text-[14px] font-syne font-bold" style={{ color: meta.color }}>{fmtPKR(offer.value)}</p>
          </div>
          <div>
            <p className="text-[10px] font-dm-sans text-[#444] uppercase tracking-[0.06em]">Duration</p>
            <p className={cn("text-[14px] font-syne font-bold", days < 4 ? "text-red-400" : "text-[#f0f0f0]")}>
              {days >= 0 ? `${days} days` : "Expired"}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-5 pb-4 pt-2 border-t border-[#1a1a1a]">
        <button onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-dm-sans font-medium text-[#666] border border-[#1a1a1a] hover:border-[#252525] hover:text-[#f0f0f0] bg-[#111] transition-colors">
          <Edit2 className="w-3.5 h-3.5" /> Edit
        </button>
        <button onClick={onDelete}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-dm-sans font-medium text-red-400/50 border border-red-500/10 hover:border-red-500/20 hover:text-red-400 bg-[#111] transition-colors">
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>
    </div>
  );
}

// ── Mini Stat ─────────────────────────────────────────────────────────────────
function MiniStat({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string|number; color: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-[#0d0d0d] border border-[#1a1a1a]">
      <div className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0" style={{ background: `${color}18` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <p className="text-[10px] font-dm-sans uppercase tracking-[0.08em] text-[#3a3a3a] leading-none mb-1">{label}</p>
        <p className="font-syne font-bold text-[#f0f0f0] text-[18px] leading-none">{value}</p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function RewardsPage() {
  const [createOpen,   setCreateOpen]   = useState(false);
  const [editTarget,   setEditTarget]   = useState<OfferTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OfferTemplate | null>(null);
  const [toast,        setToast]        = useState({ msg: "", type: "success" as "success"|"error" });

  const queryClient = useQueryClient();
  const { setExtras, clearExtras } = useTopNavExtras();
  const queryKey = ["offer-templates"];

  const { data, isLoading, isError, refetch } = useQuery<OfferListResponse>({
    queryKey, queryFn: getOfferTemplates, retry: 1,
    refetchInterval: 15_000,
  });

  const handleRefetch = useCallback(() => { refetch(); }, [refetch]);
  useEffect(() => {
    setExtras({ onRefresh: handleRefetch });
    return () => clearExtras();
  }, [handleRefetch, setExtras, clearExtras]);

  const showToast = useCallback((msg: string, type: "success"|"error") => setToast({ msg, type }), []);

  const deleteMutation = useMutation({
    mutationFn: () => deleteOfferTemplate(deleteTarget!.id),
    onSuccess: () => {
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey });
      showToast("Offer deleted.", "success");
    },
    onError: () => showToast("Failed to delete offer.", "error"),
  });

  const templates = data?.templates ?? [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[rgba(249,115,22,0.08)] border border-[rgba(249,115,22,0.18)]">
            <Gift className="w-4 h-4 text-[#f97316]" />
          </div>
          <div>
            <h2 className="font-syne font-bold text-[#f0f0f0] text-xl leading-tight">Reward Offers</h2>
            <p className="text-[11px] font-dm-sans text-[#555] leading-none mt-0.5">
              {isLoading ? "Loading…" : `${data?.total ?? 0} offer${(data?.total ?? 0) !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <button onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-dm-sans font-semibold bg-[rgba(249,115,22,0.08)] text-[#f97316] border border-[rgba(249,115,22,0.2)] hover:bg-[rgba(249,115,22,0.14)] transition-colors">
          <Plus className="w-4 h-4" /> Add Offer
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat icon={Gift}        label="Total"         value={data?.total                  ?? "—"} color="#f97316" />
        <MiniStat icon={PackageCheck} label="Active"       value={data?.active_count           ?? "—"} color="#22c55e" />
        <MiniStat icon={ShieldOff}   label="Inactive"      value={data?.inactive_count         ?? "—"} color="#6b7280" />
        <MiniStat icon={TrendingUp}  label="Assigned / Mo" value={data?.assignments_this_month ?? "—"} color="#eab308" />
      </div>

      {/* Error */}
      {isError && (
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-[13px] font-dm-sans text-red-400 flex-1">Failed to load offers.</p>
          <button onClick={() => refetch()} className="text-[11px] font-dm-sans text-red-400 border border-red-500/30 px-2.5 py-1 rounded-lg hover:bg-red-500/10 transition-colors">Retry</button>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
          : templates.length === 0 && !isError
          ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[rgba(249,115,22,0.06)] border border-[rgba(249,115,22,0.12)] flex items-center justify-center">
                <Gift className="w-6 h-6 text-[#f97316]/40" />
              </div>
              <p className="font-syne font-bold text-[#f0f0f0] text-[15px]">No offers yet</p>
              <p className="text-[12px] font-dm-sans text-[#444]">Click "Add Offer" to create your first cashback offer.</p>
            </div>
          )
          : templates.map(o => (
            <OfferCard key={o.id} offer={o} onEdit={() => setEditTarget(o)} onDelete={() => setDeleteTarget(o)} />
          ))
        }
      </div>

      {createOpen && (
        <OfferModal mode="add" onClose={() => setCreateOpen(false)}
          onSaved={msg => { showToast(msg, "success"); queryClient.invalidateQueries({ queryKey }); }} />
      )}
      {editTarget && (
        <OfferModal mode="edit" offer={editTarget} onClose={() => setEditTarget(null)}
          onSaved={msg => { showToast(msg, "success"); queryClient.invalidateQueries({ queryKey }); }} />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Offer"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => { if (!deleteMutation.isPending) setDeleteTarget(null); }}
        loading={deleteMutation.isPending}
      />

      <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(t => ({ ...t, msg: "" }))} />
    </div>
  );
}
