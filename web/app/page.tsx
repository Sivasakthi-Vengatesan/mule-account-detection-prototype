"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Dashboard } from "@/components/Dashboard";
import { AccountsList } from "@/components/AccountsList";
import { AccountInvestigation } from "@/components/AccountInvestigation";
import { CsvUpload } from "@/components/CsvUpload";
import { ResearchSection } from "@/components/ResearchSection";

function AppContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "dashboard";
  const initialAccount = searchParams.get("account") || null;

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [investigatingAccountId, setInvestigatingAccountId] = useState<string | null>(initialAccount);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationCount, setNotificationCount] = useState(3);
  const [showNotificationToast, setShowNotificationToast] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    const accountParam = searchParams.get("account");

    if (accountParam) {
      setInvestigatingAccountId(accountParam);
      setActiveTab("investigate");
    } else if (tabParam) {
      setActiveTab(tabParam);
      setInvestigatingAccountId(null);
    }
  }, [searchParams]);

  const handleInvestigate = (accountId: string) => {
    setInvestigatingAccountId(accountId);
    setActiveTab("investigate");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToDirectory = () => {
    setInvestigatingAccountId(null);
    setActiveTab("accounts");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      handleInvestigate(searchQuery.trim());
      setSearchQuery("");
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case "accounts":
        return { title: "Accounts Directory", subtitle: "160,000 evaluated banking accounts" };
      case "investigate":
        return { title: `Investigation: ${investigatingAccountId || "Account"}`, subtitle: "Deep-dive SHAP attribution & behavioral forensics" };
      case "upload":
        return { title: "Batch Inference", subtitle: "Upload CSV transactions for real-time model scoring" };
      case "research":
        return { title: "Research & Benchmarks", subtitle: "RBIH x IIT Delhi competition models & AUC-ROC metrics" };
      default:
        return { title: "Dashboard", subtitle: "Last 30 days &bull; updated 4 min ago" };
    }
  };

  const pageInfo = getPageTitle();

  return (
    <div className="min-h-screen bg-[#c5d0be] text-[#26301f] font-sans antialiased p-3 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1440px] flex flex-col md:flex-row gap-6 items-start">
        
        {/* =========================================================================
            LEFT SIDEBAR (~260px, rounded 28px, raised clay surface #e2e8dc)
        ========================================================================== */}
        <aside className="w-full md:w-[260px] shrink-0 clay-card p-5 flex flex-col justify-between self-stretch">
          <div>
            {/* Logo Tile + Wordmark */}
            <div className="flex items-center gap-3.5 mb-8">
              <div className="w-11 h-11 rounded-2xl bg-[#14776b] flex items-center justify-center shadow-[4px_5px_12px_rgba(16,80,72,0.4),-3px_-3px_8px_rgba(255,255,255,0.35)] shrink-0">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div>
                <span className="font-display font-bold text-2xl tracking-tight text-[#26301f] leading-none block">
                  MuleGuard
                </span>
                <span className="text-[11px] font-semibold text-[#6b7663] tracking-wide uppercase font-body">
                  NFPC &bull; AML OS
                </span>
              </div>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden ml-auto p-2 rounded-xl clay-btn text-[#26301f]"
                aria-label="Toggle navigation"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </button>
            </div>

            {/* Nav Menu Items */}
            <div className={`space-y-6 ${mobileMenuOpen ? "block" : "hidden md:block"}`}>
              {/* OVERVIEW NAV GROUP */}
              <div>
                <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-[#6b7663] px-3 mb-2 font-body">
                  OVERVIEW
                </h3>
                <nav className="space-y-1.5">
                  {[
                    {
                      id: "dashboard",
                      name: "Dashboard",
                      icon: (
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                          <rect x="3" y="3" width="7" height="7" rx="2" />
                          <rect x="14" y="3" width="7" height="7" rx="2" />
                          <rect x="14" y="14" width="7" height="7" rx="2" />
                          <rect x="3" y="14" width="7" height="7" rx="2" />
                        </svg>
                      ),
                    },
                    {
                      id: "accounts",
                      name: "Accounts",
                      icon: (
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      ),
                    },
                    {
                      id: "upload",
                      name: "Batch Upload",
                      icon: (
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      ),
                    },
                    {
                      id: "research",
                      name: "Research",
                      icon: (
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      ),
                    },
                  ].map((item) => {
                    const isActive = activeTab === item.id || (item.id === "accounts" && activeTab === "investigate");
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setInvestigatingAccountId(null);
                        }}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-medium transition-all ${
                          isActive
                            ? "bg-[#14776b] text-white shadow-[inset_3px_4px_8px_rgba(10,48,43,0.55),inset_-2px_-2px_6px_rgba(255,255,255,0.25)] font-semibold"
                            : "text-[#26301f] hover:text-[#14776b] hover:bg-[#dbe2d5]/60 active:scale-[0.98]"
                        }`}
                      >
                        <span className={isActive ? "text-white" : "text-[#6b7663]"}>
                          {item.icon}
                        </span>
                        <span>{item.name}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* WORKSPACE NAV GROUP */}
              <div>
                <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-[#6b7663] px-3 mb-2 font-body">
                  WORKSPACE
                </h3>
                <nav className="space-y-1.5">
                  {[
                    {
                      name: "SHAP Explainer",
                      icon: (
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      ),
                      action: () => handleInvestigate("ACCT_MULE_001"),
                    },
                    {
                      name: "AML Rule Engine",
                      icon: (
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      ),
                      action: () => setActiveTab("research"),
                    },
                    {
                      name: "Triage Queue",
                      icon: (
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      ),
                      action: () => setActiveTab("accounts"),
                    },
                  ].map((item) => (
                    <button
                      key={item.name}
                      onClick={item.action}
                      className="w-full flex items-center gap-3 px-3.5 py-2 rounded-full text-sm font-medium text-[#26301f] hover:text-[#14776b] hover:bg-[#dbe2d5]/60 transition-all"
                    >
                      <span className="text-[#6b7663]">{item.icon}</span>
                      <span>{item.name}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* MODEL CONFIDENCE SUNKEN METER */}
              <div className="pt-2">
                <div className="clay-sunken p-3.5 rounded-2xl">
                  <div className="flex items-center justify-between text-xs font-semibold mb-2">
                    <span className="text-[#26301f]">Ensemble AUC</span>
                    <span className="text-[#14776b] font-display font-bold text-sm">0.968</span>
                  </div>
                  <div className="w-full h-2.5 bg-[#c5d0be] rounded-full overflow-hidden shadow-[inset_2px_2px_4px_rgba(104,118,100,0.45)]">
                    <div
                      className="h-full bg-[#14776b] rounded-full transition-all duration-500 shadow-[0_1px_3px_rgba(16,80,72,0.4)]"
                      style={{ width: "96.8%" }}
                    />
                  </div>
                  <div className="text-[10px] text-[#6b7663] mt-1.5 flex justify-between">
                    <span>Rank Avg V3</span>
                    <span className="text-emerald-700 font-bold">Optimal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* INVESTIGATOR PROFILE CHIP */}
          <div className="mt-8 pt-4 border-t border-[#c5d0be]/40">
            <div className="clay-tile p-2.5 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#14776b] text-white font-display font-bold text-base flex items-center justify-center shadow-[3px_4px_8px_rgba(16,80,72,0.4),-2px_-2px_5px_rgba(255,255,255,0.3)] shrink-0">
                SV
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-[#26301f] truncate font-display">
                  Sakthi V.
                </div>
                <div className="text-[10.5px] text-[#6b7663] truncate">
                  Lead AML Analyst
                </div>
              </div>
              <div
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  backendStatus === "online" ? "bg-emerald-600" : "bg-rose-500"
                }`}
                title={backendStatus === "online" ? "ML Backend Connected" : "Backend Offline"}
              />
            </div>
          </div>
        </aside>

        {/* =========================================================================
            MAIN COLUMN (Topbar, Dynamic Content)
        ========================================================================== */}
        <main className="flex-1 w-full space-y-6">
          
          {/* TOPBAR */}
          <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-display font-bold text-3xl sm:text-4xl text-[#26301f] tracking-tight">
                {pageInfo.title}
              </h1>
              <p
                className="text-xs sm:text-sm text-[#6b7663] font-medium mt-0.5"
                dangerouslySetInnerHTML={{ __html: pageInfo.subtitle }}
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {/* Sunken Search Field */}
              <form onSubmit={handleSearchSubmit} className="relative hidden sm:block w-64 lg:w-72">
                <input
                  type="text"
                  placeholder="Search Account ID (e.g. ACCT_MULE_001)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full clay-sunken-pill pl-9 pr-4 py-2.5 text-xs text-[#26301f] placeholder-[#6b7663] focus:outline-none focus:ring-1 focus:ring-[#14776b]/50"
                />
                <button type="submit" className="absolute left-3 top-3 text-[#6b7663]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>

              {/* Notification Bell */}
              <button
                onClick={() => {
                  setShowNotificationToast(true);
                  setTimeout(() => setShowNotificationToast(false), 4000);
                }}
                className="w-10 h-10 rounded-full clay-btn flex items-center justify-center relative text-[#26301f] shrink-0"
                aria-label="Alerts"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notificationCount > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#c4643f] absolute top-2 right-2 border-2 border-[#e2e8dc] shadow-sm" />
                )}
              </button>

              {/* Batch Upload / Action Button */}
              <button
                onClick={() => {
                  setActiveTab("upload");
                  setInvestigatingAccountId(null);
                }}
                className="clay-teal-btn px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Batch CSV Upload</span>
              </button>
            </div>
          </header>

          {/* Toast */}
          {showNotificationToast && (
            <div className="clay-tile p-3 px-4 rounded-xl flex items-center justify-between bg-[#e2e8dc] text-xs text-[#26301f]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#c4643f]" />
                <span className="font-semibold">Live Alert:</span>
                <span className="text-[#6b7663]">Account ACCT_MULE_001 triggered Structuring + High Velocity rules.</span>
              </div>
              <button
                onClick={() => setShowNotificationToast(false)}
                className="text-[#6b7663] hover:text-[#26301f] text-xs font-bold"
              >
                &times;
              </button>
            </div>
          )}

          {/* DYNAMIC VIEW ROUTING */}
          {activeTab === "investigate" && investigatingAccountId ? (
            <AccountInvestigation
              accountId={investigatingAccountId}
              onBack={handleBackToDirectory}
            />
          ) : activeTab === "accounts" ? (
            <AccountsList onInvestigate={handleInvestigate} />
          ) : activeTab === "upload" ? (
            <CsvUpload
              onInvestigate={handleInvestigate}
              onNavigateToAccounts={() => {
                setActiveTab("accounts");
                setInvestigatingAccountId(null);
              }}
            />
          ) : activeTab === "research" ? (
            <ResearchSection />
          ) : (
            <Dashboard
              onInvestigate={handleInvestigate}
              onNavigateToUpload={() => {
                setActiveTab("upload");
                setInvestigatingAccountId(null);
              }}
              onNavigateToAccounts={() => {
                setActiveTab("accounts");
                setInvestigatingAccountId(null);
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#c5d0be]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#14776b] border-t-transparent" />
      </div>
    }>
      <AppContent />
    </Suspense>
  );
}
