"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertDialog } from "radix-ui";
import {
  Bell, Megaphone, ArrowLeftRight, AlertTriangle, Settings,
  Search, X, Loader2, Send, Users, User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { broadcastNotification, type NotificationType } from "@/lib/api/services/notifications";
import { getUsers, type User as UserType } from "@/lib/api/services/users";

// ── Config ────────────────────────────────────────────────────────────────────

const MAX_BODY = 200;

interface TypeMeta { icon: React.ElementType; label: string; iconCls: string; activeCls: string }

const TYPE_CFG: Record<NotificationType, TypeMeta> = {
  promotional:   { icon: Megaphone,       label: "Promotional",   iconCls: "text-[#f97316]", activeCls: "bg-[rgba(249,115,22,0.1)] border-[rgba(249,115,22,0.3)] text-[#f97316]" },
  transactional: { icon: ArrowLeftRight,  label: "Transactional", iconCls: "text-green-400", activeCls: "bg-green-500/10 border-green-500/25 text-green-400" },
  alert:         { icon: AlertTriangle,   label: "Alert",         iconCls: "text-red-400",   activeCls: "bg-red-500/10 border-red-500/25 text-red-400" },
  system:        { icon: Settings,        label: "System",        iconCls: "text-[#888888]", activeCls: "bg-[#252525] border-[#2d2d2d] text-[#888888]" },
};

// ── Alert dialog styles ───────────────────────────────────────────────────────

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

const INPUT_CLS =
  "w-full px-3.5 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#252525] text-[13px] font-dm-sans " +
  "text-[#f0f0f0] placeholder:text-[#4a4a4a] focus:outline-none focus:border-[rgba(249,115,22,0.4)] " +
  "transition-colors duration-150";

const LABEL_CLS = "block text-[10px] font-dm-sans font-semibold uppercase tracking-[0.08em] text-[#4a4a4a] mb-1.5";

// ── Component ─────────────────────────────────────────────────────────────────

interface BroadcastFormProps { onSuccess: () => void }

export default function BroadcastForm({ onSuccess }: BroadcastFormProps) {
  const [title,         setTitle]         = useState("");
  const [body,          setBody]          = useState("");
  const [type,          setType]          = useState<NotificationType>("promotional");
  const [targetAll,     setTargetAll]     = useState(true);
  const [searchPhone,   setSearchPhone]   = useState("");
  const [selectedUsers, setSelectedUsers] = useState<UserType[]>([]);
  const [confirmOpen,   setConfirmOpen]   = useState(false);
  const [errors,        setErrors]        = useState<Record<string, string>>({});

  const { data: searchData, isFetching } = useQuery({
    queryKey: ["users-notify-search", searchPhone],
    queryFn:  () => getUsers({ search: searchPhone, per_page: 5 }),
    enabled:  searchPhone.trim().length >= 3,
  });

  const mutation = useMutation({
    mutationFn: () => broadcastNotification({
      title, body, notification_type: type,
      target_all: targetAll,
      user_ids: targetAll ? [] : selectedUsers.map((u) => u.id),
    }),
    onSuccess: () => {
      setConfirmOpen(false);
      setTitle(""); setBody(""); setType("promotional");
      setTargetAll(true); setSelectedUsers([]);
      onSuccess();
    },
  });

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!title.trim() || title.trim().length < 3) e.title = "Min 3 characters.";
    if (!body.trim() || body.trim().length < 5)   e.body  = "Min 5 characters.";
    if (!targetAll && selectedUsers.length === 0)  e.target = "Select at least one user.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const addUser = (user: UserType) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers((p) => [...p, user]);
      setErrors((e) => { const n = { ...e }; delete n.target; return n; });
    }
    setSearchPhone("");
  };

  const removeUser = (id: string) => setSelectedUsers((p) => p.filter((u) => u.id !== id));

  const handleSend = () => { if (validate()) setConfirmOpen(true); };

  const TypeIcon = TYPE_CFG[type].icon;
  const results  = (searchData?.users ?? []).filter((u) => !selectedUsers.find((s) => s.id === u.id));

  return (
    <div className="space-y-4">

      {/* Title */}
      <div>
        <label className={LABEL_CLS}>Notification Title</label>
        <input
          type="text" value={title} onChange={(e) => { setTitle(e.target.value); setErrors((r) => ({ ...r, title: "" })); }}
          placeholder="e.g. Eid Mubarak! 20% cashback awaits"
          className={cn(INPUT_CLS, errors.title && "border-red-500/50")}
        />
        {errors.title && <p className="text-[11px] text-red-400 mt-1 px-0.5">{errors.title}</p>}
      </div>

      {/* Body + counter */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={cn(LABEL_CLS, "mb-0")}>Message Body</label>
          <span className={cn(
            "text-[10px] font-dm-sans tabular-nums",
            body.length > MAX_BODY * 0.9 ? "text-[#f97316]" : "text-[#4a4a4a]"
          )}>
            {body.length}/{MAX_BODY}
          </span>
        </div>
        <textarea
          value={body} maxLength={MAX_BODY} rows={3}
          onChange={(e) => { setBody(e.target.value); setErrors((r) => ({ ...r, body: "" })); }}
          placeholder="Write your notification message…"
          className={cn(INPUT_CLS, "resize-none leading-relaxed", errors.body && "border-red-500/50")}
        />
        {errors.body && <p className="text-[11px] text-red-400 mt-1 px-0.5">{errors.body}</p>}
      </div>

      {/* Type selector */}
      <div>
        <label className={LABEL_CLS}>Notification Type</label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(TYPE_CFG) as [NotificationType, TypeMeta][]).map(([key, cfg]) => (
            <button key={key} onClick={() => setType(key)}
              className={cn(
                "flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-left transition-all duration-150",
                type === key ? cfg.activeCls : "bg-[#1a1a1a] border-[#252525] text-[#888888] hover:border-[#2d2d2d] hover:text-[#f0f0f0]"
              )}>
              <cfg.icon className={cn("w-4 h-4 shrink-0", type === key ? "" : cfg.iconCls)} />
              <span className="text-[12px] font-dm-sans font-medium">{cfg.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Target */}
      <div>
        <label className={LABEL_CLS}>Audience</label>
        <div className="space-y-2">
          {[true, false].map((all) => (
            <button key={String(all)} onClick={() => { setTargetAll(all); setErrors((e) => ({ ...e, target: "" })); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-150",
                targetAll === all
                  ? "bg-[rgba(249,115,22,0.08)] border-[rgba(249,115,22,0.3)]"
                  : "bg-[#1a1a1a] border-[#252525] hover:border-[#2d2d2d]"
              )}>
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg shrink-0",
                targetAll === all ? "bg-[rgba(249,115,22,0.12)]" : "bg-[#252525]"
              )}>
                {all ? <Users className={cn("w-4 h-4", targetAll === all ? "text-[#f97316]" : "text-[#888888]")} />
                     : <User  className={cn("w-4 h-4", targetAll === all ? "text-[#f97316]" : "text-[#888888]")} />}
              </div>
              <div>
                <p className={cn("text-[13px] font-dm-sans font-medium", targetAll === all ? "text-[#f97316]" : "text-[#888888]")}>
                  {all ? "All Active Users" : "Specific Users"}
                </p>
                <p className="text-[11px] font-dm-sans text-[#4a4a4a]">
                  {all ? "Broadcast to your entire user base" : "Search and select individual users"}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* User search */}
        {!targetAll && (
          <div className="mt-3 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4a4a] pointer-events-none" />
              <input
                type="text" value={searchPhone} onChange={(e) => setSearchPhone(e.target.value)}
                placeholder="Search by phone (min 3 chars)…"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#252525] text-[13px] font-dm-sans text-[#f0f0f0] placeholder:text-[#4a4a4a] focus:outline-none focus:border-[rgba(249,115,22,0.4)] transition-colors"
              />
              {isFetching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4a4a] animate-spin" />}
            </div>

            {results.length > 0 && (
              <div className="rounded-xl border border-[#252525] divide-y divide-[#252525] overflow-hidden">
                {results.map((u) => (
                  <button key={u.id} onClick={() => addUser(u)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 bg-[#1a1a1a] hover:bg-[rgba(249,115,22,0.04)] text-left transition-colors">
                    <div className="w-6 h-6 rounded-full bg-[rgba(249,115,22,0.1)] flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-syne font-bold text-[#f97316]">
                        {u.full_name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                      </span>
                    </div>
                    <span className="text-[12px] font-dm-sans text-[#f0f0f0] flex-1 truncate">{u.full_name}</span>
                    <span className="text-[11px] font-dm-sans text-[#888888]">{u.phone_number}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Chips */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedUsers.map((u) => (
                  <span key={u.id}
                    className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-[rgba(249,115,22,0.1)] border border-[rgba(249,115,22,0.2)] text-[11px] font-dm-sans text-[#f97316]">
                    {u.full_name}
                    <button onClick={() => removeUser(u.id)} className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-[rgba(249,115,22,0.2)] transition-colors">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {errors.target && <p className="text-[11px] text-red-400 px-0.5">{errors.target}</p>}
          </div>
        )}
      </div>

      {/* Mobile preview */}
      <div className="rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1a1a1a]">
          <span className="text-[10px] font-dm-sans font-semibold uppercase tracking-[0.07em] text-[#4a4a4a]">
            Live Preview
          </span>
          <div className="flex items-center gap-2.5">
            <div className="flex gap-1">{[1,2,3].map((i) => <div key={i} className="w-1 h-1 rounded-full bg-[#2d2d2d]" />)}</div>
            <span className="text-[10px] font-mono text-[#4a4a4a]">9:41</span>
          </div>
        </div>
        <div className="p-4">
          <div className="bg-[#1a1a1a] rounded-xl p-3.5 border border-[#252525]">
            <div className="flex items-start gap-2.5">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                type === "transactional" ? "bg-green-500/10" : type === "alert" ? "bg-red-500/10" : "bg-[rgba(249,115,22,0.1)]"
              )}>
                <TypeIcon className={cn("w-4 h-4", TYPE_CFG[type].iconCls)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-dm-sans text-[#4a4a4a]">SahulatPay</span>
                  <span className="text-[10px] font-dm-sans text-[#4a4a4a]">now</span>
                </div>
                <p className="text-[13px] font-syne font-bold text-[#f0f0f0] leading-tight truncate">
                  {title || "Notification title…"}
                </p>
                <p className="text-[11px] font-dm-sans text-[#888888] leading-relaxed mt-0.5 line-clamp-2">
                  {body || "Your message body will appear here."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Send button */}
      <button
        onClick={handleSend}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[14px] font-syne font-bold bg-[rgba(249,115,22,0.12)] text-[#f97316] border border-[rgba(249,115,22,0.25)] hover:bg-[rgba(249,115,22,0.18)] transition-colors duration-150"
      >
        <Send className="w-4 h-4" />
        Send Notification
      </button>

      {/* Confirmation dialog */}
      <AlertDialog.Root open={confirmOpen} onOpenChange={(v) => { if (!mutation.isPending) setConfirmOpen(v); }}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className={OVERLAY_CLS} />
          <AlertDialog.Content className={CONTENT_CLS}>
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[rgba(249,115,22,0.1)] border border-[rgba(249,115,22,0.2)] mb-5">
              <Bell className="w-5 h-5 text-[#f97316]" />
            </div>
            <AlertDialog.Title className="font-syne font-bold text-[#f0f0f0] text-[16px] leading-tight mb-1">
              Confirm Broadcast
            </AlertDialog.Title>
            <AlertDialog.Description className="text-[13px] font-dm-sans text-[#888888] leading-relaxed mb-4">
              This notification will be sent immediately and cannot be recalled.
            </AlertDialog.Description>

            <div className="space-y-2 mb-5">
              <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#252525]">
                <span className="text-[11px] font-dm-sans text-[#4a4a4a] uppercase tracking-[0.06em]">Sending to</span>
                <span className="text-[12px] font-dm-sans font-medium text-[#f0f0f0]">
                  {targetAll ? "All Active Users" : `${selectedUsers.length} user${selectedUsers.length !== 1 ? "s" : ""}`}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#252525]">
                <span className="text-[11px] font-dm-sans text-[#4a4a4a] uppercase tracking-[0.06em] shrink-0">Title</span>
                <span className="text-[12px] font-dm-sans font-medium text-[#f0f0f0] text-right line-clamp-2">{title}</span>
              </div>
              <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#252525]">
                <span className="text-[11px] font-dm-sans text-[#4a4a4a] uppercase tracking-[0.06em]">Type</span>
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-dm-sans font-semibold border capitalize",
                  TYPE_CFG[type].activeCls
                )}>
                  <TypeIcon className="w-3 h-3" /> {TYPE_CFG[type].label}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <AlertDialog.Cancel className="flex-1 px-4 py-2.5 rounded-xl text-[13px] font-dm-sans font-medium text-[#888888] border border-[#252525] bg-[#1a1a1a] hover:bg-[#222222] hover:text-[#f0f0f0] transition-colors duration-150">
                Cancel
              </AlertDialog.Cancel>
              <AlertDialog.Action
                onClick={(e) => { e.preventDefault(); mutation.mutate(); }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-dm-sans font-semibold bg-[rgba(249,115,22,0.1)] text-[#f97316] border border-[rgba(249,115,22,0.25)] hover:bg-[rgba(249,115,22,0.16)] transition-colors duration-150"
              >
                {mutation.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <><Send className="w-4 h-4" /> Send Now</>}
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
