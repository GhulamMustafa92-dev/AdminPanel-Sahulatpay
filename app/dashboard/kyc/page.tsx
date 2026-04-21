"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, AlertTriangle, X, ScanFace } from "lucide-react";
import { getKycQueue, type KycItem } from "@/lib/api/services/kyc";
import KycQueue from "@/components/kyc/KycQueue";
import KycDocViewer from "@/components/kyc/KycDocViewer";
import { useTopNavExtras } from "@/context/TopNavExtrasContext";
import { cn } from "@/lib/utils";

// ── Toast ─────────────────────────────────────────────────────────────────────

interface ToastState {
  message: string;
  type: "success" | "error";
}

const PAGE_LIMIT = 20;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function KycPage() {
  const [selectedItem, setSelectedItem] = useState<KycItem | null>(null);
  const [statusFilter, setStatusFilter]  = useState("pending");
  const [page,          setPage]          = useState(1);
  const [toast,         setToast]         = useState<ToastState | null>(null);

  const { setExtras, clearExtras } = useTopNavExtras();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["kyc-queue", page, statusFilter],
    queryFn:  () => getKycQueue({ page, per_page: PAGE_LIMIT, status: statusFilter }),
    placeholderData: (prev) => prev,
    refetchInterval: 15_000,
  });

  const handleRefetch = useCallback(() => { refetch(); }, [refetch]);

  useEffect(() => {
    setExtras({ onRefresh: handleRefetch });
    return () => clearExtras();
  }, [handleRefetch, setExtras, clearExtras]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const showToast = useCallback((message: string, type: ToastState["type"]) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  }, []);

  const handleStatusChange = (s: string) => {
    setStatusFilter(s);
    setPage(1);
    setSelectedItem(null);
  };

  const handleActionDone = useCallback((type: "approve" | "reject") => {
    showToast(
      type === "approve"
        ? "KYC application approved — user has been verified."
        : "KYC application rejected — user has been notified.",
      type === "approve" ? "success" : "error"
    );
    setSelectedItem(null);
    refetch();
  }, [showToast, refetch]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Split panel layout (offsets parent padding) ────────────────── */}
      <div className="flex -mx-6 -my-6 h-[calc(100vh-56px)] overflow-hidden">

        {/* Left: queue list */}
        <div className="w-[380px] shrink-0 border-r border-[#252525] flex flex-col bg-[#111111]">
          <KycQueue
            data={data}
            isLoading={isLoading}
            selectedId={selectedItem?.id ?? null}
            statusFilter={statusFilter}
            page={page}
            onStatusChange={handleStatusChange}
            onPageChange={setPage}
            onSelect={setSelectedItem}
          />
        </div>

        {/* Right: document viewer */}
        <div className="flex-1 overflow-y-auto" style={{ background: "var(--bg-primary)" }}>
          {selectedItem ? (
            <KycDocViewer
              key={selectedItem.id}
              item={selectedItem}
              onActionDone={handleActionDone}
            />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>

      {/* ── Fixed toast ──────────────────────────────────────────────────── */}
      {toast && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3.5 rounded-xl border shadow-2xl",
            "font-dm-sans text-[13px] max-w-sm transition-all duration-300",
            toast.type === "success"
              ? "bg-[#0b1a0b] border-green-500/30 text-green-400"
              : "bg-[#1a0b0b] border-red-500/30 text-red-400"
          )}
        >
          {toast.type === "success"
            ? <Check className="w-4 h-4 shrink-0" />
            : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="opacity-50 hover:opacity-100 transition-opacity ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[rgba(249,115,22,0.06)] border border-[rgba(249,115,22,0.12)] flex items-center justify-center">
        <ScanFace className="w-7 h-7 text-[#2d2d2d]" />
      </div>
      <div>
        <p className="font-syne font-bold text-[#f0f0f0] text-[16px] leading-tight">
          Select an Application
        </p>
        <p className="text-[13px] font-dm-sans text-[#888888] mt-2 leading-relaxed max-w-[260px]">
          Choose a KYC application from the queue to review documents and take action.
        </p>
      </div>
    </div>
  );
}
