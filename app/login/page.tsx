"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Zap } from "lucide-react";
import { adminLogin } from "@/lib/auth";

type Particle = {
  top: string;
  left?: string;
  right?: string;
  size: number;
  duration: string;
  delay: string;
  anim: "sp-float" | "sp-float2" | "sp-float3";
};

const PARTICLES: Particle[] = [
  { top: "12%",  left:  "9%",  size: 3, duration: "6s",   delay: "0s",    anim: "sp-float"  },
  { top: "22%",  right: "11%", size: 2, duration: "8s",   delay: "1.2s",  anim: "sp-float2" },
  { top: "68%",  left:  "7%",  size: 4, duration: "7s",   delay: "2.1s",  anim: "sp-float3" },
  { top: "58%",  right: "9%",  size: 2, duration: "9s",   delay: "0.7s",  anim: "sp-float"  },
  { top: "83%",  left:  "22%", size: 3, duration: "6.5s", delay: "3.3s",  anim: "sp-float2" },
  { top: "8%",   right: "26%", size: 2, duration: "7.5s", delay: "1.8s",  anim: "sp-float3" },
  { top: "38%",  left:  "4%",  size: 2, duration: "8.5s", delay: "4s",    anim: "sp-float"  },
  { top: "48%",  right: "5%",  size: 3, duration: "6.2s", delay: "2.6s",  anim: "sp-float2" },
  { top: "75%",  right: "20%", size: 2, duration: "7.8s", delay: "0.4s",  anim: "sp-float3" },
  { top: "30%",  left:  "18%", size: 2, duration: "9.2s", delay: "5s",    anim: "sp-float"  },
];

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await adminLogin(phone, password);
      router.replace("/dashboard");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Login failed. Please check your credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* ── Keyframe animations + scoped utilities ── */}
      <style>{`
        @keyframes sp-float {
          0%, 100% { transform: translateY(0)   scale(1);   opacity: 0.35; }
          50%       { transform: translateY(-22px) scale(1.15); opacity: 0.75; }
        }
        @keyframes sp-float2 {
          0%, 100% { transform: translateY(0)   scale(1);   opacity: 0.25; }
          50%       { transform: translateY(-30px) scale(0.9);  opacity: 0.6;  }
        }
        @keyframes sp-float3 {
          0%, 100% { transform: translateY(0);              opacity: 0.2;  }
          50%       { transform: translateY(-16px);          opacity: 0.5;  }
        }
        .sp-input {
          background: #111111;
          border: 1px solid #252525;
          color: #f0f0f0;
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        .sp-input:focus {
          outline: none;
          border-color: rgba(249,115,22,0.55);
          box-shadow: 0 0 0 3px rgba(249,115,22,0.08);
        }
        .sp-btn {
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          transition: filter 0.18s ease, transform 0.18s ease;
        }
        .sp-btn:hover:not(:disabled) {
          filter: brightness(1.12);
          transform: scale(1.01);
        }
        .sp-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <div
        className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10"
        style={{ background: "#0a0a0a" }}
      >
        {/* ── CSS grid lines ─────────────────────────── */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(249,115,22,0.045) 1px, transparent 1px),
              linear-gradient(90deg, rgba(249,115,22,0.045) 1px, transparent 1px)
            `,
            backgroundSize: "44px 44px",
          }}
        />

        {/* ── Orange radial glow ─────────────────────── */}
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "760px",
            height: "520px",
            background:
              "radial-gradient(ellipse at center, rgba(249,115,22,0.13) 0%, rgba(249,115,22,0.05) 38%, transparent 68%)",
            borderRadius: "50%",
          }}
        />

        {/* ── Floating particles ─────────────────────── */}
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            aria-hidden
            className="pointer-events-none absolute rounded-full"
            style={{
              top: p.top,
              left: p.left,
              right: p.right,
              width:  p.size,
              height: p.size,
              background: "rgba(249,115,22,0.65)",
              boxShadow: "0 0 7px rgba(249,115,22,0.45)",
              animation: `${p.anim} ${p.duration} ease-in-out infinite ${p.delay}`,
            }}
          />
        ))}

        {/* ── Card ──────────────────────────────────── */}
        <div
          className="relative z-10 w-full"
          style={{
            maxWidth: "400px",
            background: "#1a1a1a",
            border: "1px solid #2d2d2d",
            borderRadius: "16px",
            padding: "40px 36px 36px",
            boxShadow: "0 32px 80px rgba(0,0,0,0.55), 0 0 0 0.5px rgba(249,115,22,0.06) inset",
          }}
        >
          {/* Logo row */}
          <div className="flex items-center gap-3 mb-1">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
              style={{
                background: "rgba(249,115,22,0.12)",
                border: "1px solid rgba(249,115,22,0.28)",
              }}
            >
              <Zap className="w-[18px] h-[18px]" style={{ color: "#f97316" }} />
            </div>
            <span
              className="font-syne font-bold text-[22px] tracking-tight leading-none"
              style={{ color: "#f97316" }}
            >
              SahulatPay
            </span>
          </div>

          {/* Subtitle */}
          <p
            className="font-dm-sans mb-9 pl-[3px]"
            style={{
              fontSize: "10px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#888888",
            }}
          >
            Admin Control Panel
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ── Phone ─────────────────────────────── */}
            <div className="space-y-2">
              <label
                className="block font-dm-sans"
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#888888",
                }}
              >
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 0000000"
                required
                autoComplete="tel"
                className="sp-input w-full rounded-xl px-4 py-[11px] text-sm font-dm-sans"
              />
            </div>

            {/* ── Password ──────────────────────────── */}
            <div className="space-y-2">
              <label
                className="block font-dm-sans"
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#888888",
                }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="sp-input w-full rounded-xl px-4 py-[11px] pr-11 text-sm font-dm-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "#4a4a4a" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#888888")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#4a4a4a")}
                  tabIndex={-1}
                >
                  {showPw
                    ? <EyeOff className="w-[15px] h-[15px]" />
                    : <Eye    className="w-[15px] h-[15px]" />}
                </button>
              </div>
            </div>

            {/* ── Error box ─────────────────────────── */}
            {error && (
              <div
                className="rounded-xl px-4 py-3"
                style={{
                  background: "rgba(239,68,68,0.07)",
                  border: "1px solid rgba(239,68,68,0.22)",
                }}
              >
                <p className="font-dm-sans text-[12px] leading-relaxed" style={{ color: "#f87171" }}>
                  {error}
                </p>
              </div>
            )}

            {/* ── Submit ────────────────────────────── */}
            <button
              type="submit"
              disabled={loading}
              className="sp-btn w-full rounded-xl py-[13px] font-syne font-bold text-sm text-white flex items-center justify-center gap-2.5 mt-1"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4 shrink-0"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12" cy="12" r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* ── Bottom version tag ────────────────── */}
          <p
            className="text-center font-dm-sans mt-9"
            style={{ fontSize: "11px", color: "#4a4a4a", letterSpacing: "0.04em" }}
          >
            v1.0 · Secure Admin Access
          </p>
        </div>
      </div>
    </>
  );
}
