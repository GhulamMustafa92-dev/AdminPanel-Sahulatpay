"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog } from "radix-ui";
import {
  X, Package, PackageCheck, Truck, MapPin, CheckCircle2,
  Check, Loader2, AlertTriangle, Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  updateDeliveryStatus,
  type Card,
  type DeliveryStatus,
} from "@/lib/api/services/cards";

// ── Config ────────────────────────────────────────────────────────────────────

const DELIVERY_STEPS: {
  value: DeliveryStatus;
  label: string;
  icon:  React.ElementType;
  cls:   string;
}[] = [
  { value: "processing",       label: "Processing",       icon: Package,      cls: "text-[#888888]"  },
  { value: "dispatched",       label: "Dispatched",       icon: PackageCheck, cls: "text-[#f97316]"  },
  { value: "in_transit",       label: "In Transit",       icon: Truck,        cls: "text-[#f97316]"  },
  { value: "out_for_delivery", label: "Out for Delivery", icon: MapPin,       cls: "text-yellow-400" },
  { value: "delivered",        label: "Delivered",        icon: CheckCircle2, cls: "text-green-400"  },
];

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

interface CardDeliveryDialogProps {
  card:          Card | null;
  open:          boolean;
  onOpenChange:  (open: boolean) => void;
  onSuccess:     () => void;
}

export default function CardDeliveryDialog({
  card, open, onOpenChange, onSuccess,
}: CardDeliveryDialogProps) {
  const [selected,    setSelected]    = useState<DeliveryStatus | null>(null);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (card?.delivery_status) setSelected(card.delivery_status);
  }, [card]);

  const mutation = useMutation({
    mutationFn: () => updateDeliveryStatus(card!.id, selected!),
    onSuccess:  () => { onOpenChange(false); onSuccess(); },
    onError:    () => setSubmitError("Failed to update delivery status. Please try again."),
  });

  const handleClose = (v: boolean) => {
    if (!v) { setSubmitError(""); }
    onOpenChange(v);
  };

  const canSubmit = selected !== null && selected !== card?.delivery_status && !mutation.isPending;

  if (!card) return null;

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className={OVERLAY_CLS} />
        <Dialog.Content className={CONTENT_CLS} aria-describedby="delivery-desc">

          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[rgba(249,115,22,0.1)] border border-[rgba(249,115,22,0.2)]">
              <Truck className="w-5 h-5 text-[#f97316]" />
            </div>
            <Dialog.Close className="flex items-center justify-center w-8 h-8 rounded-lg text-[#4a4a4a] hover:text-[#888888] hover:bg-[#222222] transition-colors">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          <Dialog.Title className="font-syne font-bold text-[#f0f0f0] text-[16px] leading-tight mb-1">
            Update Delivery Status
          </Dialog.Title>
          <Dialog.Description id="delivery-desc" className="text-[13px] font-dm-sans text-[#888888] leading-relaxed mb-5">
            Card ending in{" "}
            <span className="font-mono text-[#f0f0f0]">•••• {card.last_four ?? "–"}</span>
            {" — "}
            <span className="font-mono text-[11px] text-[#f0f0f0]">{card.user_id.slice(0,8)}…</span>
          </Dialog.Description>

          {/* Status selector */}
          <div className="space-y-2 mb-5">
            {DELIVERY_STEPS.map(({ value, label, icon: Icon, cls }) => {
              const isCurrent  = card.delivery_status === value;
              const isSelected = selected === value;
              return (
                <button
                  key={value}
                  onClick={() => setSelected(value)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-150",
                    isSelected
                      ? "bg-[rgba(249,115,22,0.08)] border-[rgba(249,115,22,0.3)]"
                      : "bg-[#1a1a1a] border-[#252525] hover:border-[#2d2d2d]"
                  )}
                >
                  <Icon className={cn("w-4 h-4 shrink-0", isSelected ? "text-[#f97316]" : cls)} />
                  <span className={cn(
                    "flex-1 text-[13px] font-dm-sans font-medium",
                    isSelected ? "text-[#f97316]" : "text-[#888888]"
                  )}>
                    {label}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-dm-sans text-[#4a4a4a] uppercase tracking-[0.06em]">
                      current
                    </span>
                  )}
                  {isSelected && !isCurrent && (
                    <Check className="w-4 h-4 text-[#f97316] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* FCM note */}
          <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-[#1a1a1a] border border-[#252525] mb-5">
            <Bell className="w-4 h-4 text-[#4a4a4a] shrink-0 mt-0.5" />
            <p className="text-[12px] font-dm-sans text-[#4a4a4a] leading-relaxed">
              FCM push notification will be auto-sent to the cardholder upon confirmation.
            </p>
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
                : <><Truck className="w-4 h-4" /> Update Status</>}
            </button>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
