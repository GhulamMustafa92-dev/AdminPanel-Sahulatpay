"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  const handleToggle = () => setCollapsed((prev) => !prev);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      {/* ── Sidebar ───────────────────────────────── */}
      <Sidebar
        collapsed={collapsed}
        onCollapse={handleToggle}
      />

      {/* ── Main area ─────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNav onToggleSidebar={handleToggle} />

        {/* ── Page content ─────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-6" style={{ background: "var(--bg-primary)" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
