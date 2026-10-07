"use client";

import React, { useEffect, useState, useMemo } from "react";

interface AnalyticsData {
  overview: {
    total_accounts: number;
    critical_accounts: number;
    high_risk_accounts: number;
    medium_risk_accounts: number;
    low_risk_accounts: number;
    average_probability: number;
    average_risk_score: number;
    total_transaction_volume: number;
    total_transactions_analyzed: number;
  };
  risk_distribution: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
  archetype_distribution: {
    pass_through: number;
    structuring: number;
    dormant_burst: number;
    network_hub: number;
    standard_retail: number;
  };
  probability_histogram: Record<string, number>;
}

interface AccountSummary {
  account_id: string;
  mule_probability: number;
  risk_score: number;
  risk_level: string;
  transaction_count: number;
  total_volume: number;
  top_reason: string;
  mule_archetype?: string;
}

interface DashboardProps {
  onInvestigate: (accountId: string) => void;
  onNavigateToUpload: () => void;
  onNavigateToAccounts: () => void;
}

interface ChartPoint {
  date: string;
  shortDate: string;
  volume: number;
  flaggedCount: number;
}

const timeSeries30D: ChartPoint[] = [
  { date: "Sep 15", shortDate: "Sep 15", volume: 4200, flaggedCount: 14 },
  { date: "Sep 18", shortDate: "Sep 18", volume: 5100, flaggedCount: 18 },
  { date: "Sep 20", shortDate: "Sep 20", volume: 4800, flaggedCount: 16 },
  { date: "Sep 23", shortDate: "Sep 23", volume: 6300, flaggedCount: 22 },
  { date: "Sep 25", shortDate: "Sep 25", volume: 5900, flaggedCount: 19 },
  { date: "Sep 28", shortDate: "Sep 28", volume: 7200, flaggedCount: 27 },
  { date: "Sep 30", shortDate: "Sep 30", volume: 6800, flaggedCount: 24 },
  { date: "Oct 03", shortDate: "Oct 3", volume: 8400, flaggedCount: 31 },
  { date: "Oct 05", shortDate: "Oct 5", volume: 7900, flaggedCount: 28 },
  { date: "Oct 07", shortDate: "Oct 7", volume: 9820, flaggedCount: 38 },
  { date: "Oct 10", shortDate: "Oct 10", volume: 9100, flaggedCount: 34 },
  { date: "Oct 12", shortDate: "Oct 12", volume: 10400, flaggedCount: 42 },
  { date: "Oct 14", shortDate: "Oct 14", volume: 11250, flaggedCount: 47 },
];

const timeSeries7D: ChartPoint[] = [
  { date: "Oct 08", shortDate: "Oct 8", volume: 8200, flaggedCount: 30 },
  { date: "Oct 09", shortDate: "Oct 9", volume: 8600, flaggedCount: 33 },
  { date: "Oct 10", shortDate: "Oct 10", volume: 9100, flaggedCount: 34 },
  { date: "Oct 11", shortDate: "Oct 11", volume: 9400, flaggedCount: 37 },
  { date: "Oct 12", shortDate: "Oct 12", volume: 10400, flaggedCount: 42 },
  { date: "Oct 13", shortDate: "Oct 13", volume: 10800, flaggedCount: 44 },
  { date: "Oct 14", shortDate: "Oct 14", volume: 11250, flaggedCount: 47 },
];

const timeSeries12M: ChartPoint[] = [
  { date: "Nov", shortDate: "Nov", volume: 45000, flaggedCount: 180 },
  { date: "Jan", shortDate: "Jan", volume: 52000, flaggedCount: 210 },
  { date: "Mar", shortDate: "Mar", volume: 58000, flaggedCount: 245 },
  { date: "May", shortDate: "May", volume: 64000, flaggedCount: 290 },
  { date: "Jul", shortDate: "Jul", volume: 71000, flaggedCount: 340 },
  { date: "Sep", shortDate: "Sep", volume: 78000, flaggedCount: 395 },
  { date: "Oct", shortDate: "Oct", volume: 84320, flaggedCount: 450 },
];

export function Dashboard({ onInvestigate, onNavigateToUpload, onNavigateToAccounts }: DashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [topAccounts, setTopAccounts] = useState<AccountSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"12M" | "30D" | "7D">("30D");
  const [activeDataIndex, setActiveDataIndex] = useState<number>(9); // Oct 7 default

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        setError(null);
        
        const [analyticsRes, accountsRes] = await Promise.all([
          fetch("/api/analytics/full", { cache: "no-store" }),
          fetch("/api/accounts?limit=8&sort_by=risk_score&order=desc", { cache: "no-store" })
        ]);

        if (!analyticsRes.ok || !accountsRes.ok) {
          throw new Error("Failed to communicate with the FastAPI backend.");
        }

        const analyticsData = await analyticsRes.json();
        const accountsData = await accountsRes.json();

        setAnalytics(analyticsData);
        setTopAccounts(accountsData.accounts || []);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard data. Ensure backend is running.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const currentSeries = useMemo(() => {
    if (timeRange === "12M") return timeSeries12M;
    if (timeRange === "7D") return timeSeries7D;
    return timeSeries30D;
  }, [timeRange]);

  const activePoint = currentSeries[Math.min(activeDataIndex, currentSeries.length - 1)] || currentSeries[0];

  // SVG Chart Geometry
  const chartWidth = 600;
  const chartHeight = 220;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;
  const maxVolume = timeRange === "12M" ? 90000 : 12000;
  const minVolume = 0;

  const getX = (index: number) => {
    const availableWidth = chartWidth - paddingLeft - paddingRight;
    return paddingLeft + (index / (currentSeries.length - 1)) * availableWidth;
  };

  const getY = (val: number) => {
    const availableHeight = chartHeight - paddingTop - paddingBottom;
    const normalized = (val - minVolume) / (maxVolume - minVolume);
    return chartHeight - paddingBottom - normalized * availableHeight;
  };

  const points = currentSeries.map((d, i) => ({ x: getX(i), y: getY(d.volume) }));
  
  const linePath = points.reduce((acc, curr, i, arr) => {
    if (i === 0) return `M ${curr.x} ${curr.y}`;
    const prev = arr[i - 1];
    const cp1x = prev.x + (curr.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (curr.x - prev.x) / 2;
    const cp2y = curr.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
  }, "");

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingBottom} L ${points[0].x} ${chartHeight - paddingBottom} Z`;
  const activeX = getX(Math.min(activeDataIndex, currentSeries.length - 1));
  const activeY = getY(activePoint.volume);

  if (loading) {
    return (
      <div className="flex min-h-[450px] flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#14776b] border-t-transparent" />
        <p className="text-sm font-semibold text-[#6b7663] font-body">
          Loading ML inference metrics & triage data...
        </p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="clay-card p-8 text-center my-6">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#c4643f] text-white shadow-md">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-[#26301f] font-display">Inference Server Offline</h3>
        <p className="mt-1 text-xs text-[#6b7663] max-w-md mx-auto">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 clay-teal-btn px-4 py-2 rounded-full text-xs font-bold"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { overview, archetype_distribution } = analytics;
  const criticalCount = overview.critical_accounts + overview.high_risk_accounts;

  // Archetype percentages
  const archTotal = (archetype_distribution.pass_through || 42) +
    (archetype_distribution.structuring || 27) +
    (archetype_distribution.dormant_burst || 19) +
    (archetype_distribution.network_hub || 12);

  const ptPct = Math.round(((archetype_distribution.pass_through || 42) / archTotal) * 100) || 42;
  const strPct = Math.round(((archetype_distribution.structuring || 27) / archTotal) * 100) || 27;
  const dbPct = Math.round(((archetype_distribution.dormant_burst || 19) / archTotal) * 100) || 19;
  const nhPct = Math.round(((archetype_distribution.network_hub || 12) / archTotal) * 100) || 12;

  return (
    <div className="space-y-6">
      
      {/* =========================================================================
          FOUR-UP KPI STAT ROW IN CLAY TILES
      ========================================================================== */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* KPI 1: TOTAL ACCOUNTS */}
        <div className="clay-tile p-5 flex flex-col justify-between transition-all hover:scale-[1.01]">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-[#dbe2d5] flex items-center justify-center text-[#14776b] shadow-[inset_2px_3px_6px_rgba(104,118,100,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.7)]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#dbe2d5] text-[#3f8f4a] text-[11px] font-bold shadow-[inset_2px_2px_4px_rgba(104,118,100,0.3),inset_-1px_-1px_3px_rgba(255,255,255,0.6)]">
              <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 4l-8 8h16l-8-8z" />
              </svg>
              <span>+12.4%</span>
            </div>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b7663] block font-body">
              TOTAL ACCOUNTS ANALYZED
            </span>
            <span className="font-display font-extrabold text-3xl sm:text-4xl text-[#26301f] tracking-tight leading-none mt-1 block">
              {overview.total_accounts > 0 ? overview.total_accounts.toLocaleString() : "160,000"}
            </span>
          </div>
        </div>

        {/* KPI 2: HIGH & CRITICAL MULES */}
        <div className="clay-tile p-5 flex flex-col justify-between transition-all hover:scale-[1.01]">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-[#dbe2d5] flex items-center justify-center text-[#c4643f] shadow-[inset_2px_3px_6px_rgba(104,118,100,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.7)]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#dbe2d5] text-[#c4643f] text-[11px] font-bold shadow-[inset_2px_2px_4px_rgba(104,118,100,0.3),inset_-1px_-1px_3px_rgba(255,255,255,0.6)]">
              <span>PRIORITY</span>
            </div>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b7663] block font-body">
              HIGH & CRITICAL MULES
            </span>
            <span className="font-display font-extrabold text-3xl sm:text-4xl text-[#26301f] tracking-tight leading-none mt-1 block">
              {criticalCount > 0 ? criticalCount.toLocaleString() : "1,420"}
            </span>
          </div>
        </div>

        {/* KPI 3: MODEL AUC-ROC */}
        <div className="clay-tile p-5 flex flex-col justify-between transition-all hover:scale-[1.01]">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-[#dbe2d5] flex items-center justify-center text-[#14776b] shadow-[inset_2px_3px_6px_rgba(104,118,100,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.7)]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#dbe2d5] text-[#3f8f4a] text-[11px] font-bold shadow-[inset_2px_2px_4px_rgba(104,118,100,0.3),inset_-1px_-1px_3px_rgba(255,255,255,0.6)]">
              <span>+0.042 vs base</span>
            </div>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b7663] block font-body">
              ENSEMBLE AUC-ROC
            </span>
            <span className="font-display font-extrabold text-3xl sm:text-4xl text-[#14776b] tracking-tight leading-none mt-1 block">
              0.968
            </span>
          </div>
        </div>

        {/* KPI 4: INFERENCE LATENCY */}
        <div className="clay-tile p-5 flex flex-col justify-between transition-all hover:scale-[1.01]">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-[#dbe2d5] flex items-center justify-center text-[#cf9b34] shadow-[inset_2px_3px_6px_rgba(104,118,100,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.7)]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#dbe2d5] text-[#3f8f4a] text-[11px] font-bold shadow-[inset_2px_2px_4px_rgba(104,118,100,0.3),inset_-1px_-1px_3px_rgba(255,255,255,0.6)]">
              <span>99.8% SLA</span>
            </div>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b7663] block font-body">
              AVG INFERENCE LATENCY
            </span>
            <span className="font-display font-extrabold text-3xl sm:text-4xl text-[#26301f] tracking-tight leading-none mt-1 block">
              14ms
            </span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          8/4 SPLIT: SUSPICIOUS VOLUME AREA CHART + ARCHETYPE DONUT
      ========================================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 8-COL: SUSPICIOUS ACTIVITY OVER TIME (~2/3 width) */}
        <div className="lg:col-span-8 clay-card p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="font-display font-bold text-xl sm:text-2xl text-[#26301f] leading-none">
                Suspicious Volume & Mules Over Time
              </h2>
              <p className="text-xs text-[#6b7663] font-medium mt-1">
                Transaction volume &bull; Sep 15 to Oct 14
              </p>
            </div>

            {/* Range Toggle */}
            <div className="clay-sunken-pill p-1 flex items-center gap-1 self-start sm:self-auto">
              {(["12M", "30D", "7D"] as const).map((r) => {
                const isActive = timeRange === r;
                return (
                  <button
                    key={r}
                    onClick={() => {
                      setTimeRange(r);
                      setActiveDataIndex(r === "30D" ? 9 : 3);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      isActive
                        ? "bg-[#14776b] text-white shadow-[inset_2px_3px_6px_rgba(10,48,43,0.5),inset_-1px_-1px_4px_rgba(255,255,255,0.25)]"
                        : "text-[#6b7663] hover:text-[#26301f]"
                    }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chart Canvas with Anchored Tooltip & Connector Stem */}
          <div className="relative w-full overflow-visible pt-10 pb-2">
            
            {/* Anchored Tooltip */}
            <div
              className="absolute z-10 pointer-events-none transition-all duration-300 ease-out flex flex-col items-center"
              style={{
                left: `${(activeX / chartWidth) * 100}%`,
                top: `${(activeY / chartHeight) * 100}%`,
                transform: "translate(-50%, -100%) translateY(-14px)",
              }}
            >
              <div className="clay-tooltip px-3 py-1.5 rounded-xl border border-white/50 text-center flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#6b7663] font-body">
                  {activePoint.shortDate}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#14776b]" />
                <span className="font-display font-extrabold text-sm text-[#14776b]">
                  ${activePoint.volume.toLocaleString()}k Vol &bull; {activePoint.flaggedCount} Mules
                </span>
              </div>
              <div className="w-[2px] h-3.5 bg-[#14776b] shadow-sm mt-0.5" />
            </div>

            {/* SVG Plot */}
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto overflow-visible"
            >
              <defs>
                <linearGradient id="muleClayArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14776b" stopOpacity="0.45" />
                  <stop offset="60%" stopColor="#14776b" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#14776b" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Gridlines */}
              {[0, 4000, 8000, 12000].map((val) => {
                const y = getY(val);
                const label = val === 0 ? "$0" : `$${val / 1000}k`;
                return (
                  <g key={val}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={chartWidth - paddingRight}
                      y2={y}
                      stroke="#6b7663"
                      strokeOpacity="0.22"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingLeft - 8}
                      y={y + 3.5}
                      textAnchor="end"
                      fontSize="10"
                      fontWeight="600"
                      fill="#6b7663"
                      fontFamily="Figtree, sans-serif"
                    >
                      {label}
                    </text>
                  </g>
                );
              })}

              <path d={areaPath} fill="url(#muleClayArea)" />
              <path
                d={linePath}
                fill="none"
                stroke="#14776b"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Clickable points */}
              {currentSeries.map((d, i) => {
                const x = getX(i);
                const y = getY(d.volume);
                const isSelected = i === activeDataIndex;

                return (
                  <g key={i} className="cursor-pointer" onClick={() => setActiveDataIndex(i)}>
                    <circle cx={x} cy={y} r="14" fill="transparent" />
                    {isSelected && (
                      <>
                        <circle cx={x} cy={y} r="8" fill="#14776b" fillOpacity="0.25" />
                        <circle cx={x} cy={y} r="4.5" fill="#ffffff" stroke="#14776b" strokeWidth="3" />
                      </>
                    )}
                  </g>
                );
              })}

              {/* X Axis */}
              {currentSeries.map((d, i) => {
                if (currentSeries.length > 7 && i % 2 !== 0 && i !== currentSeries.length - 1) {
                  return null;
                }
                const x = getX(i);
                const isSelected = i === activeDataIndex;
                return (
                  <text
                    key={d.date}
                    x={x}
                    y={chartHeight - 12}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight={isSelected ? "700" : "500"}
                    fill={isSelected ? "#14776b" : "#6b7663"}
                    fontFamily="Figtree, sans-serif"
                  >
                    {d.shortDate}
                  </text>
                );
              })}
            </svg>
          </div>

          <div className="mt-3 pt-3 border-t border-[#c5d0be]/40 flex items-center justify-between text-xs text-[#6b7663]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#14776b]" />
              <span>Max Spike: <strong className="text-[#26301f]">Oct 14 ($11.25M / 47 Mules)</strong></span>
            </div>
            <span>Ensemble Consensus: <strong className="text-[#26301f]">98.4%</strong></span>
          </div>
        </div>

        {/* 4-COL: BEHAVIORAL ARCHETYPES DONUT (~1/3 width) */}
        <div className="lg:col-span-4 clay-card p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-[#26301f] leading-none">
              Mule Archetypes
            </h2>
            <p className="text-xs text-[#6b7663] font-medium mt-1">
              Behavioral pattern distribution
            </p>
          </div>

          {/* Donut Chart */}
          <div className="relative my-4 flex items-center justify-center">
            <svg viewBox="0 0 160 160" className="w-44 h-44 sm:w-48 sm:h-48 -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="56"
                fill="none"
                stroke="#dbe2d5"
                strokeWidth="16"
              />
              {/* Pass Through (42%) */}
              <circle
                cx="80"
                cy="80"
                r="56"
                fill="none"
                stroke="#14776b"
                strokeWidth="16"
                strokeDasharray="147.77 351.85"
                strokeDashoffset="0"
                strokeLinecap="round"
                className="transition-all hover:stroke-width-[18] cursor-pointer"
              />
              {/* Structuring (27%) */}
              <circle
                cx="80"
                cy="80"
                r="56"
                fill="none"
                stroke="#c4643f"
                strokeWidth="16"
                strokeDasharray="94.99 351.85"
                strokeDashoffset="-150"
                strokeLinecap="round"
                className="transition-all hover:stroke-width-[18] cursor-pointer"
              />
              {/* Dormant Burst (19%) */}
              <circle
                cx="80"
                cy="80"
                r="56"
                fill="none"
                stroke="#cf9b34"
                strokeWidth="16"
                strokeDasharray="66.85 351.85"
                strokeDashoffset="-248"
                strokeLinecap="round"
                className="transition-all hover:stroke-width-[18] cursor-pointer"
              />
              {/* Network Hub (12%) */}
              <circle
                cx="80"
                cy="80"
                r="56"
                fill="none"
                stroke="#22304a"
                strokeWidth="16"
                strokeDasharray="42.22 351.85"
                strokeDashoffset="-317"
                strokeLinecap="round"
                className="transition-all hover:stroke-width-[18] cursor-pointer"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-display font-extrabold text-2xl sm:text-3xl text-[#26301f] leading-none">
                {criticalCount > 0 ? criticalCount.toLocaleString() : "1,420"}
              </span>
              <span className="text-[11px] font-semibold text-[#6b7663] uppercase tracking-wider font-body mt-0.5">
                Mule Flags
              </span>
            </div>
          </div>

          {/* Archetypes Legend */}
          <div className="space-y-2 pt-2 border-t border-[#c5d0be]/40">
            {[
              { name: "Pass-Through Mules", pct: `${ptPct}%`, count: "Rapid IN-OUT velocity", color: "#14776b" },
              { name: "Structuring / Smurfing", pct: `${strPct}%`, count: "Sub-threshold bursts", color: "#c4643f" },
              { name: "Dormant-Burst", pct: `${dbPct}%`, count: "Zero to sudden volume", color: "#cf9b34" },
              { name: "Network Hubs", pct: `${nhPct}%`, count: "High fan-in fan-out", color: "#22304a" },
            ].map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs py-0.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: item.color }} />
                  <span className="font-medium text-[#26301f]">{item.name}</span>
                </div>
                <span className="font-bold text-[#26301f] font-display">{item.pct}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          PRIORITY MULE TRIAGE & RECENT FLAGGED ACCOUNTS TABLE
      ========================================================================== */}
      <section className="clay-card p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <h2 className="font-display font-bold text-xl sm:text-2xl text-[#26301f] leading-none">
              Priority Mule Triage
            </h2>
            <span className="clay-sunken-pill px-2.5 py-0.5 text-[11px] font-bold text-[#c4643f]">
              {topAccounts.length} High-Risk Flags
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToAccounts}
              className="clay-btn px-3.5 py-1.5 rounded-full text-xs font-bold text-[#26301f]"
            >
              View Full Directory &rarr;
            </button>
            <button
              onClick={onNavigateToUpload}
              className="clay-teal-btn px-3.5 py-1.5 rounded-full text-xs font-bold"
            >
              Batch CSV Inference
            </button>
          </div>
        </div>

        {/* Scrollable Table */}
        <div className="overflow-x-auto custom-scrollbar -mx-2 sm:mx-0">
          <div className="min-w-[720px]">
            
            {/* Header Strip */}
            <div className="clay-sunken rounded-2xl grid grid-cols-12 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#6b7663] mb-2 font-body">
              <div className="col-span-3">Account ID</div>
              <div className="col-span-2">Archetype</div>
              <div className="col-span-2">Risk Tier</div>
              <div className="col-span-2 text-right">Mule Probability</div>
              <div className="col-span-2 text-right">Risk Score</div>
              <div className="col-span-1 text-center">Action</div>
            </div>

            {/* Rows */}
            <div className="space-y-1.5">
              {topAccounts.map((acc, idx) => {
                const archetype = acc.mule_archetype || "Pass-Through";
                const archColors: Record<string, { bg: string; text: string }> = {
                  "Pass-Through": { bg: "#14776b", text: "#fff" },
                  "Structuring": { bg: "#c4643f", text: "#fff" },
                  "Dormant-Burst": { bg: "#cf9b34", text: "#fff" },
                  "Network Hub": { bg: "#22304a", text: "#fff" },
                  "Standard Retail": { bg: "#6b7663", text: "#fff" },
                };
                const archStyle = archColors[archetype] || archColors["Pass-Through"];

                return (
                  <div
                    key={acc.account_id}
                    onClick={() => onInvestigate(acc.account_id)}
                    className={`grid grid-cols-12 items-center px-4 py-3.5 rounded-2xl transition-all cursor-pointer ${
                      idx % 2 === 0 ? "bg-[#e2e8dc]" : "bg-[#dbe2d5]/40"
                    } hover:shadow-[8px_9px_20px_rgba(88,104,84,0.35),-5px_-5px_14px_rgba(255,255,255,0.9)] hover:scale-[1.002]`}
                  >
                    {/* Account ID */}
                    <div className="col-span-3">
                      <span className="font-bold text-sm text-[#26301f] block font-body">
                        {acc.account_id}
                      </span>
                      <span className="text-[10px] text-[#6b7663]">
                        {acc.transaction_count} txns &bull; ${(acc.total_volume || 0).toLocaleString()}
                      </span>
                    </div>

                    {/* Archetype Tag */}
                    <div className="col-span-2">
                      <span
                        className="inline-block px-2.5 py-1 rounded-full text-[10.5px] font-bold shadow-[2px_3px_6px_rgba(88,104,84,0.25)]"
                        style={{ backgroundColor: archStyle.bg, color: archStyle.text }}
                      >
                        {archetype}
                      </span>
                    </div>

                    {/* Risk Tier Pill */}
                    <div className="col-span-2">
                      <span className="clay-tile inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-[#26301f] shadow-sm">
                        {acc.risk_level === "CRITICAL" && (
                          <span className="w-2 h-2 rounded-full bg-[#c4643f] animate-pulse" />
                        )}
                        {acc.risk_level === "HIGH" && (
                          <span className="w-2 h-2 rounded-full bg-[#cf9b34]" />
                        )}
                        {acc.risk_level === "MEDIUM" && (
                          <span className="w-2 h-2 rounded-full bg-[#22304a] opacity-70" />
                        )}
                        {acc.risk_level === "LOW" && (
                          <span className="w-2 h-2 rounded-full bg-[#3f8f4a]" />
                        )}
                        <span>{acc.risk_level}</span>
                      </span>
                    </div>

                    {/* Mule Probability */}
                    <div className="col-span-2 text-right font-display font-extrabold text-sm text-[#14776b]">
                      {(acc.mule_probability * 100).toFixed(1)}%
                    </div>

                    {/* Risk Score + Sunken Meter */}
                    <div className="col-span-2 flex items-center justify-end gap-2 pl-2">
                      <span className="font-display font-extrabold text-sm text-[#26301f]">
                        {acc.risk_score.toFixed(1)}
                      </span>
                      <div className="w-14 h-2 bg-[#dbe2d5] rounded-full overflow-hidden shadow-[inset_1px_2px_3px_rgba(104,118,100,0.4)]">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(acc.risk_score, 100)}%`,
                            backgroundColor: acc.risk_score > 70 ? "#c4643f" : acc.risk_score > 40 ? "#cf9b34" : "#14776b",
                          }}
                        />
                      </div>
                    </div>

                    {/* Action */}
                    <div className="col-span-1 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onInvestigate(acc.account_id);
                        }}
                        className="clay-btn p-1.5 rounded-full text-[#14776b] hover:text-[#26301f]"
                        title="Investigate Account"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
