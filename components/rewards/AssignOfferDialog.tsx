"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog } from "radix-ui";
import { X, UserPlus, Search, Check, AlertTriangle, Loader2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { assignOffer, type OfferTemplate } from "@/lib/api/services/rewards";
import { getUsers, type User } from "@/lib/api/services/users";

// ── Styles ────────────────────────────────────────────────────────────────────

const OVERLAY_CLS =
  "fixed inset-0 z-50 bg-black/70 backdrop-blur-sm " +
  "data-[state=open]:animate-in data-[state=closed]:animate-out " +
  "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200";

const CONTENT_CLS =
  "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 " +
  "w-[480px] max-w-[calc(100vw-2rem)] max-h-[90vh] bg-[#111111] border border-[#252525] " +
  "rounded-2xl shadow-2xl flex flex-col " +
  "data-[state=open]:animate-in data-[state=closed]:animate-out " +
  "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 " +
  "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200";

// ── Component ─────────────────────────────────────────────────────────────────

interface AssignOfferDialogProps {
  templates:    OfferTemplate[];
  initialOffer: OfferTemplate | null;
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess:    () => void;
}

export default function AssignOfferDialog({
  templates, initialOffer, open, onOpenChange, onSuccess,
}: AssignOfferDialogProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [searchPhone,        setSearchPhone]        = useState("");
  const [selectedUsers,      setSelectedUsers]      = useState<User[]>([]);
  const [submitError,        setSubmitError]        = useState("");

  useEffect(() => {
    if (open) {
      setSelectedTemplateId(initialOffer?.id ?? "");
      setSearchPhone(""); setSelectedUsers([]); setSubmitError("");
    }
  }, [open, initialOffer]);

  const { data: searchData, isFetching } = useQuery({
    queryKey: ["user-search-assign", searchPhone],
    queryFn:  () => getUsers({ search: searchPhone, per_page: 8 }),
    enabled:  searchPhone.trim().length >= 3,
    placeholderData: (prev) => prev,
  });

  const mutation = useMutation({
    mutationFn: () => assignOffer({
      template_id: selectedTemplateId,
      user_ids:    selectedUsers.map((u) => u.id),
    }),
    onSuccess: () => { onOpenChange(false); onSuccess(); },
    onError:   () => setSubmitError("Assignment failed. Please try again."),
  });

  const toggleUser = (user: User) => {
    setSelectedUsers((prev) =>
      prev.find((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user]
    );
  };

  const canSubmit = selectedTemplateId && selectedUsers.length > 0 && !mutation.isPending;
  const results   = searchData?.users ?? [];

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!mutation.isPending) onOpenChange(v); }}>
      <Dialog.Portal>
        <Dialog.Overlay className={OVERLAY_CLS} />
        <Dialog.Content className={CONTENT_CLS} aria-describedby="assign-desc">

          {/* Header — fixed */}
          <div className="p-6 pb-4 shrink-0">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20">
                <UserPlus className="w-5 h-5 text-green-400" />
              </div>
              <Dialog.Close className="flex items-center justify-center w-8 h-8 rounded-lg text-[#4a4a4a] hover:text-[#888888] hover:bg-[#222222] transition-colors">
                <X className="w-4 h-4" />
              </Dialog.Close>
            </div>
            <Dialog.Title className="font-syne font-bold text-[#f0f0f0] text-[16px] leading-tight mb-1">
              Assign Offer
            </Dialog.Title>
            <Dialog.Description id="assign-desc" className="text-[13px] font-dm-sans text-[#888888] leading-relaxed">
              Select a template and search for users to assign the offer to.
            </Dialog.Description>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 pb-2 space-y-4 min-h-0">

            {/* Template selector */}
            <div>
              <label className="block text-[10px] font-dm-sans font-semibold uppercase tracking-[0.08em] text-[#4a4a4a] mb-1.5">
                Offer Template
              </label>
              <div className="relative">
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#252525] text-[13px] font-dm-sans text-[#f0f0f0] focus:outline-none focus:border-[rgba(249,115,22,0.4)] transition-colors cursor-pointer"
                >
                  <option value="">— Select a template —</option>
                  {templates.filter((t) => t.is_active).map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a4a4a] pointer-events-none">▾</span>
              </div>
            </div>

            {/* User search */}
            <div>
              <label className="block text-[10px] font-dm-sans font-semibold uppercase tracking-[0.08em] text-[#4a4a4a] mb-1.5">
                Search Users by Phone
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4a4a] pointer-events-none" />
                <input
                  type="text"
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  placeholder="Type at least 3 digits…"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#252525] text-[13px] font-dm-sans text-[#f0f0f0] placeholder:text-[#4a4a4a] focus:outline-none focus:border-[rgba(249,115,22,0.4)] transition-colors"
                />
                {isFetching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4a4a] animate-spin" />}
              </div>
            </div>

            {/* Search results */}
            {results.length > 0 && (
              <div className="rounded-xl border border-[#252525] overflow-hidden divide-y divide-[#252525]">
                {results.map((user) => {
                  const isSelected = !!selectedUsers.find((u) => u.id === user.id);
                  return (
                    <button
                      key={user.id}
                      onClick={() => toggleUser(user)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-100",
                        isSelected ? "bg-[rgba(249,115,22,0.06)]" : "bg-[#1a1a1a] hover:bg-[rgba(249,115,22,0.04)]"
                      )}
                    >
                      <div className={cn(
                        "flex items-center justify-center w-5 h-5 rounded border shrink-0 transition-all",
                        isSelected ? "bg-[#f97316] border-[#f97316]" : "bg-transparent border-[#252525]"
                      )}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-dm-sans font-medium text-[#f0f0f0] truncate">{user.full_name}</p>
                        <p className="text-[11px] font-dm-sans text-[#888888]">{user.phone_number}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {searchPhone.trim().length >= 3 && !isFetching && results.length === 0 && (
              <p className="text-[12px] font-dm-sans text-[#4a4a4a] text-center py-3">No users found</p>
            )}

            {/* Selected users summary */}
            {selectedUsers.length > 0 && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[rgba(249,115,22,0.06)] border border-[rgba(249,115,22,0.15)]">
                <Users className="w-4 h-4 text-[#f97316] shrink-0" />
                <span className="text-[12px] font-dm-sans text-[#f97316]">
                  <span className="font-semibold">{selectedUsers.length}</span> user{selectedUsers.length !== 1 ? "s" : ""} selected
                </span>
                <button
                  onClick={() => setSelectedUsers([])}
                  className="ml-auto text-[11px] font-dm-sans text-[#888888] hover:text-[#f0f0f0] transition-colors"
                >
                  Clear
                </button>
              </div>
            )}

          </div>

          {/* Footer — fixed */}
          <div className="p-6 pt-4 shrink-0 space-y-3">
            {submitError && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-[12px] font-dm-sans text-red-400">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {submitError}
              </div>
            )}
            <div className="flex gap-3">
              <Dialog.Close className="flex-1 px-4 py-2.5 rounded-xl text-[13px] font-dm-sans font-medium text-[#888888] border border-[#252525] bg-[#1a1a1a] hover:bg-[#222222] hover:text-[#f0f0f0] transition-colors duration-150">
                Cancel
              </Dialog.Close>
              <button
                onClick={() => mutation.mutate()}
                disabled={!canSubmit}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-dm-sans font-semibold bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/15 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {mutation.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <><UserPlus className="w-4 h-4" /> Assign to {selectedUsers.length || ""} User{selectedUsers.length !== 1 ? "s" : ""}</>}
              </button>
            </div>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
