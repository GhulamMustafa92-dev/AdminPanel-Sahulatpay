"use client";

import { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, Loader2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import apiClient from "@/lib/api/client";

type RevealState = "hidden" | "revealing" | "revealed";

export interface RevealGuardProps {
  children: React.ReactNode;
  label?: string;
  onReveal?: () => void;
  countdownSeconds?: number;
  targetId?: string;
  className?: string;
}

export function RevealGuard({
  children, label, onReveal,
  countdownSeconds = 30,
  targetId, className,
}: RevealGuardProps) {
  const [state,     setState]     = useState<RevealState>("hidden");
  const [countdown, setCountdown] = useState(countdownSeconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const startCountdown = () => {
    clearTimer();
    setCountdown(countdownSeconds);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearTimer();
          setState("hidden");
          return countdownSeconds;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearTimer(), []);

  const handleReveal = async () => {
    setState("revealing");
    // Log to audit trail — fire-and-forget, non-blocking
    apiClient.post("/admin/audit-log", {
      action_type: "data_reveal",
      target_id:   targetId ?? label ?? "unknown",
    }).catch(() => undefined);
    // Brief spinner for UX feedback
    await new Promise(r => setTimeout(r, 600));
    setState("revealed");
    startCountdown();
    onReveal?.();
  };

  return (
    <div className={cn("relative overflow-hidden rounded-xl", className)}>
      {/* Content — blurred while not revealed */}
      <div className={cn("transition-all duration-300", state !== "revealed" && "blur-md select-none pointer-events-none")}>
        {children}
      </div>

      {/* ── HIDDEN: blur overlay + reveal button ─────────────────────────────── */}
      {state === "hidden" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0d0d0d]/70 backdrop-blur-[2px] rounded-xl">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[rgba(249,115,22,0.1)] border border-[rgba(249,115,22,0.2)]">
            <EyeOff className="w-5 h-5 text-[#f97316]" />
          </div>
          {label && (
            <p className="text-[11px] font-dm-sans font-medium text-[#888888]">{label}</p>
          )}
          <button
            onClick={handleReveal}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12px] font-dm-sans font-semibold bg-[rgba(249,115,22,0.12)] text-[#f97316] border border-[rgba(249,115,22,0.25)] hover:bg-[rgba(249,115,22,0.18)] transition-colors duration-150">
            <Eye className="w-3.5 h-3.5" /> Click to Reveal
          </button>
          <p className="text-[10px] font-dm-sans text-[#4a4a4a]">Reveal is logged for compliance</p>
        </div>
      )}

      {/* ── REVEALING: loading spinner ───────────────────────────────────────── */}
      {state === "revealing" && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d0d]/70 backdrop-blur-[2px] rounded-xl">
          <Loader2 className="w-7 h-7 text-[#f97316] animate-spin" />
        </div>
      )}

      {/* ── REVEALED: countdown badge ────────────────────────────────────────── */}
      {state === "revealed" && (
        <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[rgba(249,115,22,0.1)] border border-[rgba(249,115,22,0.2)] pointer-events-none">
          <Clock className="w-3 h-3 text-[#f97316] shrink-0" />
          <span className="font-mono text-[11px] font-semibold text-[#f97316]">
            Hiding in {countdown}s
          </span>
        </div>
      )}
    </div>
  );
}
