"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch("/health", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.status === "ok") {
            setBackendStatus("online");
            return;
          }
        }
        setBackendStatus("offline");
      } catch {
        setBackendStatus("offline");
      }
    }

    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 border border-accent/30 text-accent font-black text-xl shadow-[0_0_15px_rgba(0,212,170,0.2)]">
            M
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white sm:text-lg">
                MULE DETECT <span className="text-accent">AI</span>
              </span>
              <span className="hidden rounded-md bg-surface-raised px-2 py-0.5 text-[10px] font-semibold text-[#888] border border-border sm:inline-block">
                v8-ensemble
              </span>
            </div>
            <p className="text-[11px] text-[#777]">Financial Crime Risk Triage Platform</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-all ${
              activeTab === "dashboard"
                ? "bg-accent/15 text-accent border border-accent/40 shadow-[0_0_10px_rgba(0,212,170,0.15)]"
                : "text-[#888] hover:text-white hover:bg-surface-raised"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("accounts")}
            className={`rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-all ${
              activeTab === "accounts"
                ? "bg-accent/15 text-accent border border-accent/40 shadow-[0_0_10px_rgba(0,212,170,0.15)]"
                : "text-[#888] hover:text-white hover:bg-surface-raised"
            }`}
          >
            Accounts
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-all ${
              activeTab === "upload"
                ? "bg-accent/15 text-accent border border-accent/40 shadow-[0_0_10px_rgba(0,212,170,0.15)]"
                : "text-[#888] hover:text-white hover:bg-surface-raised"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload CSV
          </button>
          <button
            onClick={() => setActiveTab("research")}
            className={`rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-all ${
              activeTab === "research"
                ? "bg-accent/15 text-accent border border-accent/40 shadow-[0_0_10px_rgba(0,212,170,0.15)]"
                : "text-[#888] hover:text-white hover:bg-surface-raised"
            }`}
          >
            Research
          </button>
        </nav>

        {/* Live Backend Connection Indicator */}
        <div className="hidden items-center gap-2 lg:flex">
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-surface-raised px-2.5 py-1 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                backendStatus === "online"
                  ? "bg-emerald-400 animate-pulse"
                  : backendStatus === "checking"
                  ? "bg-amber-400"
                  : "bg-rose-500"
              }`}
            />
            <span className="text-[11px] font-medium text-[#999]">
              {backendStatus === "online"
                ? "FastAPI ML Backend Online"
                : backendStatus === "checking"
                ? "Connecting..."
                : "Backend Offline"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
