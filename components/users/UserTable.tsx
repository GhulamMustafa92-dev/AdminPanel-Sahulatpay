"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Eye, ShieldOff, ShieldCheck, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  blockUser,
  unblockUser,
  type User,
} from "@/lib/api/services/users";

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
  if (amount >= 1_000_000) return `Rs. ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `Rs. ${amount.toLocaleString()}`;
  return `Rs. ${amount ?? 0}`;
}

function safeDate(dateStr: string | undefined, fmt: string): string {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), fmt);
  } catch {
    return "—";
  }
}

// ── Badges ────────────────────────────────────────────────────────────────────

function StatusBadge({ is_active, is_locked }: { is_active: boolean; is_locked: boolean }) {
  const locked = is_locked || !is_active;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-dm-sans font-medium border",
        !locked
          ? "bg-green-500/10 text-green-400 border-green-500/20"
          : "bg-red-500/10 text-red-400 border-red-500/20"
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", !locked ? "bg-green-400" : "bg-red-400")} />
      {!locked ? "Active" : is_locked ? "Locked" : "Inactive"}
    </span>
  );
}

function TierBadge({ tier }: { tier: number }) {
  const colors = ["bg-[#252525] text-[#888888] border-[#2d2d2d]", "bg-blue-500/10 text-blue-400 border-blue-500/20", "bg-purple-500/10 text-purple-400 border-purple-500/20", "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"];
  const cls = colors[tier] ?? colors[0];
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-dm-sans font-medium border", cls)}>
      Tier {tier}
    </span>
  );
}

// ── Skeleton row ──────────────────────────────────────────────────────────────

function SkeletonRow({ index }: { index: number }) {
  return (
    <tr className={cn("border-b border-[#252525]", index % 2 === 1 && "bg-[rgba(255,255,255,0.012)]")}>
      <td className="pl-5 pr-4 py-3.5">
        <div className="h-3.5 w-5 rounded bg-[#252525] animate-pulse" />
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#252525] animate-pulse shrink-0" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-28 rounded bg-[#252525] animate-pulse" />
            <div className="h-3 w-20 rounded bg-[#252525] animate-pulse" />
          </div>
        </div>
      </td>
      {[120, 80, 70, 64, 60].map((w, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className={`h-3.5 rounded bg-[#252525] animate-pulse`} style={{ width: w }} />
        </td>
      ))}
      <td className="px-5 py-3.5">
        <div className="flex items-center justify-center gap-1.5">
          <div className="w-7 h-7 rounded-md bg-[#252525] animate-pulse" />
          <div className="w-7 h-7 rounded-md bg-[#252525] animate-pulse" />
        </div>
      </td>
    </tr>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface UserTableProps {
  users: User[];
  isLoading: boolean;
  onViewUser: (user: User) => void;
  onActionDone: () => void;
}

const COLS = ["#", "User", "Account Type", "Tier", "Status", "Joined", "Actions"];

export default function UserTable({ users, isLoading, onViewUser, onActionDone }: UserTableProps) {
  const [actionId, setActionId] = useState<string | null>(null);

  const blockMutation = useMutation({
    mutationFn: (id: string) => blockUser(id),
    onSettled: () => setActionId(null),
    onSuccess: () => onActionDone(),
  });

  const unblockMutation = useMutation({
    mutationFn: (id: string) => unblockUser(id),
    onSettled: () => setActionId(null),
    onSuccess: () => onActionDone(),
  });

  const handleToggleBlock = (user: User) => {
    setActionId(user.id);
    if (user.is_active && !user.is_locked) {
      blockMutation.mutate(user.id);
    } else {
      unblockMutation.mutate(user.id);
    }
  };

  const isMutating = (id: string) =>
    actionId === id && (blockMutation.isPending || unblockMutation.isPending);

  return (
    <div className="rounded-xl border border-[#252525] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px]">
          {/* ── Header ───────────────────────────────── */}
          <thead>
            <tr className="bg-[#111111] border-b border-[#252525]">
              {COLS.map((col, i) => (
                <th
                  key={col}
                  className={cn(
                    "py-3 text-[10px] font-dm-sans font-semibold uppercase tracking-[0.09em] text-[#4a4a4a]",
                    i === 0 ? "pl-5 pr-4 text-left" : i === COLS.length - 1 ? "pr-5 text-center" : "px-4 text-left"
                  )}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          {/* ── Body ─────────────────────────────────── */}
          <tbody className="bg-[#1a1a1a] divide-y divide-[#252525]">
            {isLoading ? (
              Array.from({ length: 8 }, (_, i) => <SkeletonRow key={i} index={i} />)
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={COLS.length} className="py-20 text-center">
                  <p className="text-[13px] font-dm-sans text-[#888888]">No users found</p>
                  <p className="text-[11px] font-dm-sans text-[#4a4a4a] mt-1">Try adjusting the search or filter</p>
                </td>
              </tr>
            ) : (
              users.map((user, index) => {
                const mutating = isMutating(user.id);
                return (
                  <tr
                    key={user.id}
                    className={cn(
                      "group transition-colors duration-100",
                      "hover:bg-[rgba(249,115,22,0.04)]",
                      index % 2 === 1 && "bg-[rgba(255,255,255,0.013)]"
                    )}
                  >
                    {/* # ─ first cell carries the left-border accent */}
                    <td className="pl-5 pr-4 py-3.5 w-10 border-l-2 border-l-transparent group-hover:border-l-[#f97316] transition-colors duration-100">
                      <span className="text-[12px] font-dm-sans text-[#4a4a4a]">{index + 1}</span>
                    </td>

                    {/* User */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[rgba(249,115,22,0.15)] flex items-center justify-center shrink-0">
                          <span className="text-[11px] font-syne font-bold text-[#f97316] select-none">
                            {getInitials(user.full_name)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-dm-sans font-medium text-[#f0f0f0] leading-tight truncate max-w-[140px]">
                            {user.full_name || "—"}
                          </p>
                          <p className="text-[11px] font-dm-sans text-[#888888] leading-tight mt-0.5">
                            {user.phone_number || "—"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Account type */}
                    <td className="px-4 py-3.5 text-[12px] font-dm-sans text-[#888888] capitalize">
                      {user.account_type || "—"}
                    </td>

                    {/* Tier */}
                    <td className="px-4 py-3.5">
                      <TierBadge tier={user.verification_tier} />
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <StatusBadge is_active={user.is_active} is_locked={user.is_locked} />
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3.5 text-[12px] font-dm-sans text-[#888888] whitespace-nowrap">
                      {safeDate(user.created_at, "MMM d, yyyy")}
                    </td>

                    {/* Actions */}
                    <td className="pr-5 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        {/* View */}
                        <button
                          onClick={() => onViewUser(user)}
                          title="View details"
                          className="flex items-center justify-center w-7 h-7 rounded-md text-[#888888] hover:bg-[rgba(249,115,22,0.08)] hover:text-[#f97316] transition-colors duration-150"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Block / Unblock */}
                        <button
                          onClick={() => handleToggleBlock(user)}
                          disabled={mutating}
                          title={user.is_active && !user.is_locked ? "Block user" : "Unblock user"}
                          className={cn(
                            "flex items-center justify-center w-7 h-7 rounded-md transition-colors duration-150 disabled:opacity-40",
                            user.is_active && !user.is_locked
                              ? "text-[#888888] hover:bg-red-500/10 hover:text-red-400"
                              : "text-[#888888] hover:bg-green-500/10 hover:text-green-400"
                          )}
                        >
                          {mutating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : user.is_active && !user.is_locked ? (
                            <ShieldOff className="w-3.5 h-3.5" />
                          ) : (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
