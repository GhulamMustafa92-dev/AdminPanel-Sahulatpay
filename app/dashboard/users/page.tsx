"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Users } from "lucide-react";
import { getUsers, type User } from "@/lib/api/services/users";
import UserTable from "@/components/users/UserTable";
import UserDetailDrawer from "@/components/users/UserDetailDrawer";
import { useTopNavExtras } from "@/context/TopNavExtrasContext";

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { label: "All",     value: ""        },
  { label: "Active",  value: "active"  },
  { label: "Blocked", value: "blocked" },
];

const PAGE_LIMIT = 20;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [search,       setSearch]       = useState("");
  const [status,       setStatus]       = useState("");
  const [page,         setPage]         = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { setExtras, clearExtras } = useTopNavExtras();

  const isActiveFilter =
    status === "active" ? true : status === "blocked" ? false : undefined;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["users", page, search, status],
    queryFn: () =>
      getUsers({
        page,
        per_page:  PAGE_LIMIT,
        search:    search || undefined,
        is_active: isActiveFilter,
      }),
    placeholderData: (prev) => prev,
    refetchInterval: 15_000,
    retry: 1,
  });

  const handleRefetch = useCallback(() => { refetch(); }, [refetch]);

  useEffect(() => {
    setExtras({ onRefresh: handleRefetch });
    return () => clearExtras();
  }, [handleRefetch, setExtras, clearExtras]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleStatusChange = (val: string) => {
    setStatus(val);
    setPage(1);
  };

  const total      = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));
  const rangeStart = (page - 1) * PAGE_LIMIT + 1;
  const rangeEnd   = Math.min(page * PAGE_LIMIT, total);

  return (
    <div className="space-y-5">
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[rgba(249,115,22,0.1)] border border-[rgba(249,115,22,0.2)]">
          <Users className="w-4 h-4 text-[#f97316]" />
        </div>
        <div>
          <h2 className="font-syne font-bold text-[#f0f0f0] text-xl leading-tight">Users</h2>
          <p className="text-[11px] font-dm-sans text-[#888888] leading-none mt-0.5">
            Manage registered accounts
          </p>
        </div>
        {data && (
          <span className="ml-1 px-2.5 py-0.5 rounded-full text-[11px] font-dm-sans font-semibold bg-[rgba(249,115,22,0.1)] text-[#f97316] border border-[rgba(249,115,22,0.2)]">
            {total.toLocaleString()} total
          </span>
        )}
      </div>

      {/* ── Error banner ──────────────────────────────────────────────────── */}
      {isError && (
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-red-500/10 border border-red-500/20">
          <span className="text-red-400 text-lg leading-none shrink-0 mt-0.5">⚠</span>
          <div>
            <p className="text-[13px] font-dm-sans font-semibold text-red-400">Failed to load users</p>
            <p className="text-[11px] font-dm-sans text-red-400/70 mt-0.5">
              {(error as { response?: { data?: { message?: string }; status?: number } })?.response?.data?.message
                ?? (error as Error)?.message
                ?? "Unknown error — check the console for details"}
            </p>
          </div>
          <button onClick={() => refetch()} className="ml-auto text-[11px] font-dm-sans text-red-400 border border-red-500/30 px-2.5 py-1 rounded-lg hover:bg-red-500/10 transition-colors shrink-0">
            Retry
          </button>
        </div>
      )}

      {/* ── Filter bar ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4a4a] pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, phone or email…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 rounded-lg bg-[#1a1a1a] border border-[#252525] text-[13px] font-dm-sans text-[#f0f0f0] placeholder:text-[#4a4a4a] focus:outline-none focus:border-[rgba(249,115,22,0.4)] transition-colors duration-150"
          />
          {search && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#4a4a4a] hover:text-[#888888] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status tab pills */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#1a1a1a] border border-[#252525]">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleStatusChange(tab.value)}
              className={`px-3.5 py-1.5 rounded-md text-[12px] font-dm-sans font-medium transition-all duration-150 ${
                status === tab.value
                  ? "bg-[rgba(249,115,22,0.12)] text-[#f97316] border border-[rgba(249,115,22,0.2)]"
                  : "text-[#888888] hover:text-[#f0f0f0] border border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <UserTable
        users={data?.users ?? []}
        isLoading={isLoading}
        onViewUser={(user) => setSelectedUser(user)}
        onActionDone={handleRefetch}
      />

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      {total > PAGE_LIMIT && (
        <div className="flex items-center justify-between pt-1 px-0.5">
          <span className="text-[12px] font-dm-sans text-[#888888]">
            Showing{" "}
            <span className="text-[#f0f0f0]">
              {rangeStart}–{rangeEnd}
            </span>{" "}
            of{" "}
            <span className="text-[#f0f0f0]">{total.toLocaleString()}</span> users
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3.5 py-1.5 rounded-lg text-[12px] font-dm-sans font-medium border border-[#252525] text-[#888888] bg-[#1a1a1a] hover:text-[#f0f0f0] hover:border-[#2d2d2d] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
            >
              ← Previous
            </button>

            <span className="px-3 py-1.5 rounded-lg text-[12px] font-dm-sans text-[#f0f0f0] bg-[rgba(249,115,22,0.08)] border border-[rgba(249,115,22,0.15)]">
              {page} / {totalPages}
            </span>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3.5 py-1.5 rounded-lg text-[12px] font-dm-sans font-medium border border-[#252525] text-[#888888] bg-[#1a1a1a] hover:text-[#f0f0f0] hover:border-[#2d2d2d] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ── Detail drawer ─────────────────────────────────────────────────── */}
      <UserDetailDrawer
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onActionDone={handleRefetch}
      />
    </div>
  );
}
