"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog } from "radix-ui";
import { X, Gift, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createOfferTemplate, updateOfferTemplate,
  type OfferTemplate, type CreateOfferPayload, type DiscountType,
} from "@/lib/api/services/rewards";

// ── Styles ────────────────────────────────────────────────────────────────────

const OVERLAY_CLS =
  "fixed inset-0 z-50 bg-black/70 backdrop-blur-sm " +
  "data-[state=open]:animate-in data-[state=closed]:animate-out " +
  "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200";

const CONTENT_CLS =
  "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 " +
  "w-[520px] max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto bg-[#111111] border border-[#252525] " +
  "rounded-2xl shadow-2xl p-6 " +
  "data-[state=open]:animate-in data-[state=closed]:animate-out " +
  "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 " +
  "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200";

const INPUT_CLS =
  "w-full px-3.5 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#252525] text-[13px] font-dm-sans " +
  "text-[#f0f0f0] placeholder:text-[#4a4a4a] focus:outline-none focus:border-[rgba(249,115,22,0.4)] " +
  "transition-colors duration-150";

const LABEL_CLS = "block text-[10px] font-dm-sans font-semibold uppercase tracking-[0.08em] text-[#4a4a4a] mb-1.5";

// ── Helpers ───────────────────────────────────────────────────────────────────

const OFFER_TYPES = ["cashback", "discount", "voucher", "referral"];

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

interface FormState {
  name: string; type: string; discount_type: DiscountType;
  value: string; min_spend: string; expiry_date: string; description: string;
}

const EMPTY_FORM: FormState = {
  name: "", type: "", discount_type: "percent",
  value: "", min_spend: "0", expiry_date: "", description: "",
};

function validate(f: FormState): Partial<Record<keyof FormState, string>> {
  const e: Partial<Record<keyof FormState, string>> = {};
  if (!f.name.trim() || f.name.trim().length < 3) e.name = "Min 3 characters.";
  if (!f.type) e.type = "Select a type.";
  const val = Number(f.value);
  if (!f.value || isNaN(val) || val <= 0) e.value = "Must be > 0.";
  if (f.discount_type === "percent" && val > 100) e.value = "Max 100%.";
  if (Number(f.min_spend) < 0) e.min_spend = "Cannot be negative.";
  if (!f.expiry_date) e.expiry_date = "Required.";
  else if (f.expiry_date <= todayStr()) e.expiry_date = "Must be a future date.";
  return e;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface CreateOfferDialogProps {
  mode:         "create" | "edit";
  initialData?: OfferTemplate;
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess:    () => void;
}

export default function CreateOfferDialog({
  mode, initialData, open, onOpenChange, onSuccess,
}: CreateOfferDialogProps) {
  const [form,        setForm]        = useState<FormState>(EMPTY_FORM);
  const [errors,      setErrors]      = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (open && mode === "edit" && initialData) {
      setForm({
        name:          initialData.name,
        type:          initialData.type,
        discount_type: initialData.discount_type,
        value:         String(initialData.value),
        min_spend:     String(initialData.min_spend),
        expiry_date:   initialData.expiry_date.split("T")[0],
        description:   initialData.description ?? "",
      });
    } else if (open && mode === "create") {
      setForm(EMPTY_FORM);
    }
    setErrors({}); setSubmitError("");
  }, [open, mode, initialData]);

  const set = (k: keyof FormState, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => { const n = { ...e }; delete n[k]; return n; });
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: CreateOfferPayload = {
        name: form.name.trim(), type: form.type,
        discount_type: form.discount_type,
        value: Number(form.value), min_spend: Number(form.min_spend),
        expiry_date: form.expiry_date,
        description: form.description.trim() || undefined,
      };
      await (mode === "edit"
        ? updateOfferTemplate(initialData!.id, payload)
        : createOfferTemplate(payload));
    },
    onSuccess: () => { onOpenChange(false); onSuccess(); },
    onError:   () => setSubmitError("Request failed. Please try again."),
  });

  const handleSubmit = () => {
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    mutation.mutate();
  };

  const Field = ({ id, label, err, children }: { id: string; label: string; err?: string; children: React.ReactNode }) => (
    <div>
      <label htmlFor={id} className={LABEL_CLS}>{label}</label>
      {children}
      {err && <p className="text-[11px] text-red-400 mt-1 px-0.5">{err}</p>}
    </div>
  );

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!mutation.isPending) onOpenChange(v); }}>
      <Dialog.Portal>
        <Dialog.Overlay className={OVERLAY_CLS} />
        <Dialog.Content className={CONTENT_CLS} aria-describedby="offer-form-desc">

          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[rgba(249,115,22,0.1)] border border-[rgba(249,115,22,0.2)]">
              <Gift className="w-5 h-5 text-[#f97316]" />
            </div>
            <Dialog.Close className="flex items-center justify-center w-8 h-8 rounded-lg text-[#4a4a4a] hover:text-[#888888] hover:bg-[#222222] transition-colors">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>
          <Dialog.Title className="font-syne font-bold text-[#f0f0f0] text-[16px] leading-tight mb-1">
            {mode === "edit" ? "Edit Offer Template" : "Create Offer Template"}
          </Dialog.Title>
          <Dialog.Description id="offer-form-desc" className="text-[13px] font-dm-sans text-[#888888] leading-relaxed mb-5">
            {mode === "edit" ? "Update the template details below." : "Define the offer parameters for this template."}
          </Dialog.Description>

          {/* Form */}
          <div className="space-y-4">
            <Field id="name" label="Offer Name" err={errors.name}>
              <input id="name" type="text" value={form.name} onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Summer Cashback 10%" className={cn(INPUT_CLS, errors.name && "border-red-500/50")} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field id="type" label="Type" err={errors.type}>
                <div className="relative">
                  <select id="type" value={form.type} onChange={(e) => set("type", e.target.value)}
                    className={cn(INPUT_CLS, "appearance-none pr-8 cursor-pointer", errors.type && "border-red-500/50")}>
                    <option value="">Select type</option>
                    {OFFER_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a4a4a] pointer-events-none">▾</span>
                </div>
              </Field>
              <Field id="expiry_date" label="Expiry Date" err={errors.expiry_date}>
                <input id="expiry_date" type="date" value={form.expiry_date} onChange={(e) => set("expiry_date", e.target.value)}
                  className={cn(INPUT_CLS, "[color-scheme:dark]", errors.expiry_date && "border-red-500/50")} />
              </Field>
            </div>

            {/* Discount type radio */}
            <Field id="discount_type" label="Discount Type">
              <div className="flex gap-2">
                {(["percent", "flat"] as DiscountType[]).map((dt) => (
                  <button key={dt} onClick={() => set("discount_type", dt)}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-[12px] font-dm-sans font-medium border transition-all duration-150",
                      form.discount_type === dt
                        ? "bg-[rgba(249,115,22,0.1)] text-[#f97316] border-[rgba(249,115,22,0.3)]"
                        : "bg-[#1a1a1a] text-[#888888] border-[#252525] hover:border-[#2d2d2d] hover:text-[#f0f0f0]"
                    )}>
                    {dt === "percent" ? "Percentage (%)" : "Flat Amount (Rs.)"}
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field id="value" label={form.discount_type === "percent" ? "Discount %" : "Discount Rs."} err={errors.value}>
                <input id="value" type="number" min="0" value={form.value} onChange={(e) => set("value", e.target.value)}
                  placeholder={form.discount_type === "percent" ? "e.g. 10" : "e.g. 500"}
                  className={cn(INPUT_CLS, "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none", errors.value && "border-red-500/50")} />
              </Field>
              <Field id="min_spend" label="Min Spend (Rs.)" err={errors.min_spend}>
                <input id="min_spend" type="number" min="0" value={form.min_spend} onChange={(e) => set("min_spend", e.target.value)}
                  placeholder="e.g. 1000"
                  className={cn(INPUT_CLS, "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none", errors.min_spend && "border-red-500/50")} />
              </Field>
            </div>

            <Field id="description" label="Description (optional)">
              <textarea id="description" value={form.description} onChange={(e) => set("description", e.target.value)}
                placeholder="Short description visible to users…" rows={2}
                className={cn(INPUT_CLS, "resize-none leading-relaxed")} />
            </Field>
          </div>

          {submitError && (
            <div className="flex items-center gap-2 mt-4 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-[12px] font-dm-sans text-red-400">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {submitError}
            </div>
          )}

          <div className="flex gap-3 mt-5">
            <Dialog.Close className="flex-1 px-4 py-2.5 rounded-xl text-[13px] font-dm-sans font-medium text-[#888888] border border-[#252525] bg-[#1a1a1a] hover:bg-[#222222] hover:text-[#f0f0f0] transition-colors duration-150">
              Cancel
            </Dialog.Close>
            <button onClick={handleSubmit} disabled={mutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-dm-sans font-semibold bg-[rgba(249,115,22,0.1)] text-[#f97316] border border-[rgba(249,115,22,0.25)] hover:bg-[rgba(249,115,22,0.16)] transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed">
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === "edit" ? "Save Changes" : "Create Template"}
            </button>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
