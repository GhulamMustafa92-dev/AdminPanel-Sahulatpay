"use client";

import { useState, useEffect, type ElementType, type ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  X,
  ShieldOff,
  ShieldCheck,
  Loader2,
  Phone,
  Mail,
  Calendar,
  ChevronDown,
  Check,
  AlertTriangle,
  Star,
  Hash,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  getUserById,
  blockUser,
  unblockUser,
  overrideTier,
  type User,
  type UserDetail,
} from "@/lib/api/services/users";

// ── Constants ─────────────────────────────────────────────────────────────────

const TIER_OPTS = [0, 1, 2, 3];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return (name || "?")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function fmtRs(amount: number): string {
  if (amount >= 1_000_000) return `Rs. ${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `Rs. ${amount.toLocaleString()}`;
  return `Rs. ${amount ?? 0}`;
}

function safeDate(dateStr: string | null | undefined, fmt: string): string {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), fmt);
  } catch {
    return "—";
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ isActive, isLocked }: { isActive: boolean; isLocked: boolean }) {
  const blocked = isLocked || !isActive;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-dm-sans font-medium border",
        !blocked
          ? "bg-green-500/10 text-green-400 border-green-500/20"
          : "bg-red-500/10 text-red-400 border-red-500/20"
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full shrink-0",
          !blocked ? "bg-green-400 animate-pulse" : "bg-red-400"
        )}
      />
      {!blocked ? "Active" : isLocked ? "Locked" : "Inactive"}
    </span>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg bg-[#1a1a1a] border border-[#252525]">
      <Icon className="w-4 h-4 text-[#4a4a4a] shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-dm-sans text-[#4a4a4a] leading-none mb-1">{label}</p>
        <p className="text-[13px] font-dm-sans text-[#f0f0f0] leading-tight truncate">{value}</p>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon?: ElementType; label: string; value: ReactNode }) {
  return (
    <div className="px-3.5 py-3 rounded-lg bg-[#1a1a1a] border border-[#252525]">
      <div className="flex items-center gap-1.5 mb-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-[#888888]" />}
        <p className="text-[10px] font-dm-sans text-[#4a4a4a] uppercase tracking-[0.07em]">{label}</p>
      </div>
      <div className="text-[13px] font-dm-sans font-medium text-[#f0f0f0]">{value}</div>
    </div>
  );
}

interface ToastState {
  message: string;
  type: "success" | "error";
}

function InlineToast({ toast }: { toast: ToastState }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 px-4 py-3 rounded-lg border text-[12px] font-dm-sans",
        toast.type === "success"
          ? "bg-green-500/10 border-green-500/20 text-green-400"
          : "bg-red-500/10 border-red-500/20 text-red-400"
      )}
    >
      {toast.type === "success" ? (
        <Check className="w-4 h-4 shrink-0" />
      ) : (
        <AlertTriangle className="w-4 h-4 shrink-0" />
      )}
      {toast.message}
    </div>
  );
}

function DrawerSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center gap-4 p-4 rounded-xl bg-[#1a1a1a] border border-[#252525]">
        <div className="w-14 h-14 rounded-full bg-[#252525] shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-36 rounded-md bg-[#252525]" />
          <div className="h-4 w-48 rounded-md bg-[#252525]" />
        </div>
      </div>
      <div className="h-16 rounded-xl bg-[#252525]" />
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="h-12 rounded-lg bg-[#252525]" />
      ))}
      <div className="grid grid-cols-2 gap-2">
        <div className="h-16 rounded-lg bg-[#252525]" />
        <div className="h-16 rounded-lg bg-[#252525]" />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface UserDetailDrawerProps {
  user: User | null;
  onClose: () => void;
  onActionDone: () => void;
}

export default function UserDetailDrawer({
  user,
  onClose,
  onActionDone,
}: UserDetailDrawerProps) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [selectedTier, setSelectedTier] = useState<number>(0);
  const [localBlocked, setLocalBlocked] = useState<boolean | null>(null);

  const isOpen = !!user;

  // Fetch full user detail when drawer opens
  const {
    data: detail,
    isLoading,
    refetch: refetchDetail,
  } = useQuery({
    queryKey: ["user-detail", user?.id],
    queryFn: () => getUserById(user!.id),
    enabled: !!user?.id,
  });

  useEffect(() => {
    setLocalBlocked(null);
    setToast(null);
    if (detail?.verification_tier != null) setSelectedTier(detail.verification_tier);
  }, [user?.id, detail?.verification_tier]);

  // Escape key to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Mutations ─────────────────────────────────────────────────────────────

  const blockMutation = useMutation({
    mutationFn: () => blockUser(user!.id),
    onSuccess: () => {
      setLocalBlocked(true);
      showToast("User has been blocked successfully.", "success");
      refetchDetail(); onActionDone();
    },
    onError: () => showToast("Failed to block user. Please try again.", "error"),
  });

  const unblockMutation = useMutation({
    mutationFn: () => unblockUser(user!.id),
    onSuccess: () => {
      setLocalBlocked(false);
      showToast("User has been unblocked successfully.", "success");
      refetchDetail(); onActionDone();
    },
    onError: () => showToast("Failed to unblock user. Please try again.", "error"),
  });

  const tierMutation = useMutation({
    mutationFn: () => overrideTier(user!.id, selectedTier),
    onSuccess: () => {
      showToast(`Account tier updated to Tier ${selectedTier}.`, "success");
      refetchDetail(); onActionDone();
    },
    onError: () => showToast("Failed to update tier. Please try again.", "error"),
  });

  const isBlocked = localBlocked ?? ((detail?.is_locked || !detail?.is_active) ?? false);
  const isMutatingBlock = blockMutation.isPending || unblockMutation.isPending;

  const handleToggleBlock = () => {
    if (isBlocked) { unblockMutation.mutate(); } else { blockMutation.mutate(); }
  };

  return (
    <>
      {/* ── Backdrop ─────────────────────────────────── */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* ── Drawer panel ─────────────────────────────── */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 h-full w-[440px] flex flex-col",
          "bg-[#111111] border-l border-[#252525]",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* ── Header ──────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#252525] shrink-0 bg-[#111111]">
          <div>
            <h3 className="font-syne font-bold text-[#f0f0f0] text-[15px] leading-tight">
              User Details
            </h3>
            <p className="text-[11px] font-dm-sans text-[#888888] mt-0.5 leading-none">
              Account overview &amp; actions
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close drawer"
            className="flex items-center justify-center w-8 h-8 rounded-lg text-[#888888] hover:bg-[#222222] hover:text-[#f0f0f0] transition-colors duration-150"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Scrollable body ──────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {isLoading ? (
            <DrawerSkeleton />
          ) : !detail ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <AlertTriangle className="w-8 h-8 text-[#4a4a4a]" />
              <p className="text-[13px] font-dm-sans text-[#888888] text-center">
                Failed to load user details.
              </p>
            </div>
          ) : (
            <>
              {/* Toast notification */}
              {toast && <InlineToast toast={toast} />}

              {/* ── Avatar card ─────────────────────── */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-[#1a1a1a] border border-[#252525]">
                <div className="w-14 h-14 rounded-full bg-[rgba(249,115,22,0.15)] border border-[rgba(249,115,22,0.2)] flex items-center justify-center shrink-0">
                  <span className="text-[20px] font-syne font-bold text-[#f97316] select-none leading-none">
                    {getInitials(detail.full_name)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-syne font-bold text-[#f0f0f0] text-[16px] leading-tight truncate mb-2">
                    {detail.full_name || "—"}
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge isActive={detail.is_active} isLocked={isBlocked} />
                  </div>
                </div>
              </div>

              {/* ── Balance ──────────────────── */}
              <div className="p-4 rounded-xl bg-[rgba(249,115,22,0.06)] border border-[rgba(249,115,22,0.15)]">
                <p className="text-[10px] font-dm-sans font-semibold uppercase tracking-[0.09em] text-[#f97316]/60 mb-1.5">
                  Wallet Balance
                </p>
                <p className="font-syne font-bold text-[#f0f0f0] text-[26px] leading-none tabular-nums">
                  {fmtRs(detail.wallet_balance ?? 0)}
                </p>
                {detail.wallet_frozen && (
                  <p className="text-[11px] font-dm-sans text-red-400 mt-1">Wallet frozen</p>
                )}
              </div>

              {/* ── Contact ─────────────────────────── */}
              <div>
                <p className="text-[9px] font-dm-sans font-semibold uppercase tracking-[0.1em] text-[#4a4a4a] mb-2.5">
                  Contact
                </p>
                <div className="space-y-2">
                  <InfoRow icon={Phone}    label="Phone"   value={detail.phone_number || "—"} />
                  <InfoRow icon={Mail}     label="Email"   value={detail.email || "—"} />
                  <InfoRow icon={Calendar} label="Joined"  value={safeDate(detail.created_at, "MMMM d, yyyy")} />
                </div>
              </div>

              {/* ── Account ─────────────────────────── */}
              <div>
                <p className="text-[9px] font-dm-sans font-semibold uppercase tracking-[0.1em] text-[#4a4a4a] mb-2.5">
                  Account
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <StatCard
                    icon={Star}
                    label="Tier"
                    value={<span>Tier {detail.verification_tier}</span>}
                  />
                  <StatCard
                    icon={Hash}
                    label="User ID"
                    value={
                      <span className="text-[10px] font-mono text-[#888888] break-all">
                        {detail.id}
                      </span>
                    }
                  />
                </div>
              </div>

              {/* ── Risk / verification ────────────── */}
              <div>
                <p className="text-[9px] font-dm-sans font-semibold uppercase tracking-[0.1em] text-[#4a4a4a] mb-2.5">
                  Verification
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <StatCard label="CNIC"        value={detail.cnic_verified         ? "✓ Verified" : "– No"} />
                  <StatCard label="Biometric"   value={detail.biometric_verified     ? "✓ Verified" : "– No"} />
                  <StatCard label="NADRA"        value={detail.nadra_verified        ? "✓ Verified" : "– No"} />
                  <StatCard label="Account"      value={<span className="capitalize">{detail.account_type}</span>} />
                </div>
              </div>

              {/* ── Tier override ────────────────────── */}
              <div>
                <p className="text-[9px] font-dm-sans font-semibold uppercase tracking-[0.1em] text-[#4a4a4a] mb-2.5">
                  Override Account Tier
                </p>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <select
                      value={selectedTier}
                      onChange={(e) => setSelectedTier(Number(e.target.value))}
                      className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-lg bg-[#1a1a1a] border border-[#252525] text-[13px] font-dm-sans text-[#f0f0f0] focus:outline-none focus:border-[rgba(249,115,22,0.4)] transition-colors cursor-pointer"
                    >
                      {TIER_OPTS.map((t) => (
                        <option key={t} value={t} className="bg-[#1a1a1a]">
                          Tier {t}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#888888] pointer-events-none" />
                  </div>
                  <button
                    onClick={() => tierMutation.mutate()}
                    disabled={tierMutation.isPending || selectedTier === detail.verification_tier}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[12px] font-dm-sans font-medium bg-[rgba(249,115,22,0.1)] text-[#f97316] border border-[rgba(249,115,22,0.2)] hover:bg-[rgba(249,115,22,0.16)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 whitespace-nowrap"
                  >
                    {tierMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "Save Tier"
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Footer: Block / Unblock ───────────────── */}
        {detail && (
          <div className="px-6 py-4 border-t border-[#252525] shrink-0 bg-[#111111]">
            <button
              onClick={handleToggleBlock}
              disabled={isMutatingBlock}
              className={cn(
                "w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-[13px] font-dm-sans font-semibold border transition-all duration-150",
                !isBlocked
                  ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/15"
                  : "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/15",
                "disabled:opacity-40 disabled:cursor-not-allowed"
              )}
            >
              {isMutatingBlock ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : !isBlocked ? (
                <>
                  <ShieldOff className="w-4 h-4" />
                  Block This User
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Unblock This User
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
