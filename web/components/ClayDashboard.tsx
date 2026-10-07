"use client";

import React, { useState, useMemo } from "react";

interface DataPoint {
  date: string;
  shortDate: string;
  revenue: number;
}

const data30D: DataPoint[] = [
  { date: "Sep 15", shortDate: "Sep 15", revenue: 4200 },
  { date: "Sep 18", shortDate: "Sep 18", revenue: 5100 },
  { date: "Sep 20", shortDate: "Sep 20", revenue: 4800 },
  { date: "Sep 23", shortDate: "Sep 23", revenue: 6300 },
  { date: "Sep 25", shortDate: "Sep 25", revenue: 5900 },
  { date: "Sep 28", shortDate: "Sep 28", revenue: 7200 },
  { date: "Sep 30", shortDate: "Sep 30", revenue: 6800 },
  { date: "Oct 03", shortDate: "Oct 3", revenue: 8400 },
  { date: "Oct 05", shortDate: "Oct 5", revenue: 7900 },
  { date: "Oct 07", shortDate: "Oct 7", revenue: 9820 },
  { date: "Oct 10", shortDate: "Oct 10", revenue: 9100 },
  { date: "Oct 12", shortDate: "Oct 12", revenue: 10400 },
  { date: "Oct 14", shortDate: "Oct 14", revenue: 11250 },
];

const data7D: DataPoint[] = [
  { date: "Oct 08", shortDate: "Oct 8", revenue: 8200 },
  { date: "Oct 09", shortDate: "Oct 9", revenue: 8600 },
  { date: "Oct 10", shortDate: "Oct 10", revenue: 9100 },
  { date: "Oct 11", shortDate: "Oct 11", revenue: 9400 },
  { date: "Oct 12", shortDate: "Oct 12", revenue: 10400 },
  { date: "Oct 13", shortDate: "Oct 13", revenue: 10800 },
  { date: "Oct 14", shortDate: "Oct 14", revenue: 11250 },
];

const data12M: DataPoint[] = [
  { date: "Nov", shortDate: "Nov", revenue: 45000 },
  { date: "Jan", shortDate: "Jan", revenue: 52000 },
  { date: "Mar", shortDate: "Mar", revenue: 58000 },
  { date: "May", shortDate: "May", revenue: 64000 },
  { date: "Jul", shortDate: "Jul", revenue: 71000 },
  { date: "Sep", shortDate: "Sep", revenue: 78000 },
  { date: "Oct", shortDate: "Oct", revenue: 84320 },
];

interface Campaign {
  id: string;
  name: string;
  channel: "Search" | "Display" | "Email" | "Social";
  status: "Active" | "Paused" | "Completed";
  spend: number;
  conversions: number;
  roas: number;
  roasProgress: number; // 0 to 100
}

const initialCampaigns: Campaign[] = [
  {
    id: "camp-1",
    name: "Q4 Holiday Push",
    channel: "Search",
    status: "Active",
    spend: 24500,
    conversions: 1420,
    roas: 4.8,
    roasProgress: 80,
  },
  {
    id: "camp-2",
    name: "Retargeting V2",
    channel: "Display",
    status: "Paused",
    spend: 12300,
    conversions: 680,
    roas: 3.2,
    roasProgress: 53,
  },
  {
    id: "camp-3",
    name: "Black Friday Email",
    channel: "Email",
    status: "Completed",
    spend: 8900,
    conversions: 950,
    roas: 5.6,
    roasProgress: 93,
  },
  {
    id: "camp-4",
    name: "IG Story Promo",
    channel: "Social",
    status: "Active",
    spend: 15200,
    conversions: 810,
    roas: 3.9,
    roasProgress: 65,
  },
];

export function ClayDashboard() {
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [timeRange, setTimeRange] = useState<"12M" | "30D" | "7D">("30D");
  const [activeDataIndex, setActiveDataIndex] = useState<number>(9); // Oct 7 by default
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationCount, setNotificationCount] = useState(3);
  const [showNotificationToast, setShowNotificationToast] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportName, setReportName] = useState("");
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active dataset
  const currentData = useMemo(() => {
    if (timeRange === "12M") return data12M;
    if (timeRange === "7D") return data7D;
    return data30D;
  }, [timeRange]);

  const activePoint = currentData[Math.min(activeDataIndex, currentData.length - 1)] || currentData[0];

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    if (!searchQuery.trim()) return initialCampaigns;
    const q = searchQuery.toLowerCase();
    return initialCampaigns.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.channel.toLowerCase().includes(q) ||
        c.status.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Handle export
  const handleExport = () => {
    setExportMessage("Exporting campaigns data as CSV...");
    setTimeout(() => {
      const csvContent =
        "data:text/csv;charset=utf-8," +
        ["Campaign,Channel,Status,Spend,Conversions,ROAS"]
          .concat(
            filteredCampaigns.map(
              (c) => `"${c.name}",${c.channel},${c.status},$${c.spend},${c.conversions},${c.roas}x`
            )
          )
          .join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `campaigns_export_${timeRange}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExportMessage("Campaigns exported successfully!");
      setTimeout(() => setExportMessage(null), 3000);
    }, 600);
  };

  // SVG Chart Geometry calculations
  const chartWidth = 600;
  const chartHeight = 220;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;

  const maxRevenue = timeRange === "12M" ? 90000 : 12000;
  const minRevenue = 0;

  const getX = (index: number) => {
    const availableWidth = chartWidth - paddingLeft - paddingRight;
    return paddingLeft + (index / (currentData.length - 1)) * availableWidth;
  };

  const getY = (val: number) => {
    const availableHeight = chartHeight - paddingTop - paddingBottom;
    const normalized = (val - minRevenue) / (maxRevenue - minRevenue);
    return chartHeight - paddingBottom - normalized * availableHeight;
  };

  // Build SVG path
  const points = currentData.map((d, i) => ({ x: getX(i), y: getY(d.revenue) }));
  
  // Smooth spline or polyline path
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

  const activeX = getX(Math.min(activeDataIndex, currentData.length - 1));
  const activeY = getY(activePoint.revenue);

  return (
    <div className="min-h-screen bg-[#c5d0be] text-[#26301f] font-sans antialiased p-3 sm:p-6 lg:p-8">
      {/* Max Width Shell Container */}
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
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div>
                <span className="font-display font-bold text-2xl tracking-tight text-[#26301f] leading-none block">
                  SageClay
                </span>
                <span className="text-[11px] font-semibold text-[#6b7663] tracking-wide uppercase">
                  Analytics OS
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

            {/* Nav Menu Content */}
            <div className={`space-y-6 ${mobileMenuOpen ? "block" : "hidden md:block"}`}>
              {/* OVERVIEW NAV GROUP */}
              <div>
                <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-[#6b7663] px-3 mb-2 font-body">
                  OVERVIEW
                </h3>
                <nav className="space-y-1.5">
                  {[
                    {
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
                      name: "Reports",
                      icon: (
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      ),
                    },
                    {
                      name: "Audience",
                      icon: (
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      ),
                    },
                    {
                      name: "Campaigns",
                      icon: (
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                        </svg>
                      ),
                    },
                    {
                      name: "Revenue",
                      icon: (
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ),
                    },
                  ].map((item) => {
                    const isActive = activeNav === item.name;
                    return (
                      <button
                        key={item.name}
                        onClick={() => setActiveNav(item.name)}
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
                      name: "Data Library",
                      icon: (
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                        </svg>
                      ),
                    },
                    {
                      name: "Integrations",
                      icon: (
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      ),
                    },
                    {
                      name: "Automations",
                      icon: (
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      ),
                    },
                    {
                      name: "Settings",
                      icon: (
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                      ),
                    },
                  ].map((item) => {
                    const isActive = activeNav === item.name;
                    return (
                      <button
                        key={item.name}
                        onClick={() => setActiveNav(item.name)}
                        className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
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

              {/* DATA CREDITS PROGRESS BLOCK */}
              <div className="pt-2">
                <div className="clay-sunken p-3.5 rounded-2xl">
                  <div className="flex items-center justify-between text-xs font-semibold mb-2">
                    <span className="text-[#26301f]">Data credits</span>
                    <span className="text-[#14776b] font-display font-bold text-sm">68%</span>
                  </div>
                  {/* Sunken meter */}
                  <div className="w-full h-2.5 bg-[#c5d0be] rounded-full overflow-hidden shadow-[inset_2px_2px_4px_rgba(104,118,100,0.45)]">
                    <div
                      className="h-full bg-[#14776b] rounded-full transition-all duration-500 shadow-[0_1px_3px_rgba(16,80,72,0.4)]"
                      style={{ width: "68%" }}
                    />
                  </div>
                  <div className="text-[10px] text-[#6b7663] mt-1.5 flex justify-between">
                    <span>13.6k used</span>
                    <span>20k cap</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ACCOUNT CHIP AT BOTTOM */}
          <div className="mt-8 pt-4 border-t border-[#c5d0be]/40">
            <div className="clay-tile p-2.5 rounded-2xl flex items-center gap-3 cursor-pointer hover:shadow-[12px_14px_28px_rgba(88,104,84,0.55),-8px_-10px_22px_rgba(255,255,255,1)] transition-all">
              <div className="w-10 h-10 rounded-full bg-[#14776b] text-white font-display font-bold text-base flex items-center justify-center shadow-[3px_4px_8px_rgba(16,80,72,0.4),-2px_-2px_5px_rgba(255,255,255,0.3)] shrink-0">
                SV
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-[#26301f] truncate font-display">
                  Sakthi V.
                </div>
                <div className="text-[10.5px] text-[#6b7663] truncate">
                  sakthi@example.com
                </div>
              </div>
              <button className="text-[#6b7663] hover:text-[#26301f] p-1 rounded-lg">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </div>
          </div>
        </aside>

        {/* =========================================================================
            MAIN COLUMN (Topbar, 4-up KPI row, 8/4 Area/Donut, Campaigns Table)
        ========================================================================== */}
        <main className="flex-1 w-full space-y-6">
          
          {/* TOPBAR */}
          <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-display font-bold text-3xl sm:text-4xl text-[#26301f] tracking-tight">
                Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-[#6b7663] font-medium mt-0.5">
                Last 30 days &bull; updated 4 min ago
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {/* Sunken Search Field */}
              <div className="relative hidden sm:block w-64 lg:w-72">
                <input
                  type="text"
                  placeholder="Search analytics, campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full clay-sunken-pill pl-9 pr-4 py-2.5 text-xs text-[#26301f] placeholder-[#6b7663] focus:outline-none focus:ring-1 focus:ring-[#14776b]/50"
                />
                <svg className="w-4 h-4 text-[#6b7663] absolute left-3 top-3 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Notification Bell with Rust Dot */}
              <button
                onClick={() => {
                  setShowNotificationToast(true);
                  setTimeout(() => setShowNotificationToast(false), 3500);
                }}
                className="w-10 h-10 rounded-full clay-btn flex items-center justify-center relative text-[#26301f] shrink-0"
                aria-label="Notifications"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notificationCount > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#c4643f] absolute top-2 right-2 border-2 border-[#e2e8dc] shadow-sm" />
                )}
              </button>

              {/* Teal Clay 'New Report' Button */}
              <button
                onClick={() => setShowReportModal(true)}
                className="clay-teal-btn px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>New report</span>
              </button>
            </div>
          </header>

          {/* Export / Alert Notification Toast */}
          {exportMessage && (
            <div className="clay-tile p-3 px-4 rounded-xl flex items-center gap-3 bg-[#e2e8dc] text-xs font-semibold text-[#14776b] animate-bounce">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>{exportMessage}</span>
            </div>
          )}

          {showNotificationToast && (
            <div className="clay-tile p-3 px-4 rounded-xl flex items-center justify-between bg-[#e2e8dc] text-xs text-[#26301f]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#c4643f]" />
                <span className="font-semibold">3 New Alerts:</span>
                <span className="text-[#6b7663]">ROAS for Q4 Holiday Push hit 4.8x milestone today.</span>
              </div>
              <button
                onClick={() => setShowNotificationToast(false)}
                className="text-[#6b7663] hover:text-[#26301f] text-xs font-bold"
              >
                &times;
              </button>
            </div>
          )}

          {/* =========================================================================
              FOUR-UP KPI STAT ROW (2-up on mobile)
          ========================================================================== */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            
            {/* KPI 1: Total Revenue */}
            <div className="clay-tile p-5 flex flex-col justify-between transition-all hover:scale-[1.01]">
              <div className="flex items-center justify-between mb-3">
                {/* Soft-tinted icon chip */}
                <div className="w-10 h-10 rounded-2xl bg-[#dbe2d5] flex items-center justify-center text-[#14776b] shadow-[inset_2px_3px_6px_rgba(104,118,100,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.7)]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                {/* Delta Pill (Green Up) */}
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#dbe2d5] text-[#3f8f4a] text-[11px] font-bold shadow-[inset_2px_2px_4px_rgba(104,118,100,0.3),inset_-1px_-1px_3px_rgba(255,255,255,0.6)]">
                  <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 4l-8 8h16l-8-8z" />
                  </svg>
                  <span>12.4%</span>
                </div>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b7663] block font-body">
                  TOTAL REVENUE
                </span>
                <span className="font-display font-extrabold text-3xl sm:text-4xl text-[#26301f] tracking-tight leading-none mt-1 block">
                  $84,320
                </span>
              </div>
            </div>

            {/* KPI 2: Active Users */}
            <div className="clay-tile p-5 flex flex-col justify-between transition-all hover:scale-[1.01]">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-[#dbe2d5] flex items-center justify-center text-[#22304a] shadow-[inset_2px_3px_6px_rgba(104,118,100,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.7)]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#dbe2d5] text-[#3f8f4a] text-[11px] font-bold shadow-[inset_2px_2px_4px_rgba(104,118,100,0.3),inset_-1px_-1px_3px_rgba(255,255,255,0.6)]">
                  <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 4l-8 8h16l-8-8z" />
                  </svg>
                  <span>8.1%</span>
                </div>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b7663] block font-body">
                  ACTIVE USERS
                </span>
                <span className="font-display font-extrabold text-3xl sm:text-4xl text-[#26301f] tracking-tight leading-none mt-1 block">
                  12,847
                </span>
              </div>
            </div>

            {/* KPI 3: Conversion Rate */}
            <div className="clay-tile p-5 flex flex-col justify-between transition-all hover:scale-[1.01]">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-[#dbe2d5] flex items-center justify-center text-[#c4643f] shadow-[inset_2px_3px_6px_rgba(104,118,100,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.7)]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                {/* Delta Pill (Rust Down) */}
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#dbe2d5] text-[#c4643f] text-[11px] font-bold shadow-[inset_2px_2px_4px_rgba(104,118,100,0.3),inset_-1px_-1px_3px_rgba(255,255,255,0.6)]">
                  <svg className="w-2.5 h-2.5 fill-current rotate-180" viewBox="0 0 24 24">
                    <path d="M12 4l-8 8h16l-8-8z" />
                  </svg>
                  <span>1.6%</span>
                </div>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b7663] block font-body">
                  CONVERSION RATE
                </span>
                <span className="font-display font-extrabold text-3xl sm:text-4xl text-[#26301f] tracking-tight leading-none mt-1 block">
                  3.92%
                </span>
              </div>
            </div>

            {/* KPI 4: Avg Session */}
            <div className="clay-tile p-5 flex flex-col justify-between transition-all hover:scale-[1.01]">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-[#dbe2d5] flex items-center justify-center text-[#cf9b34] shadow-[inset_2px_3px_6px_rgba(104,118,100,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.7)]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#dbe2d5] text-[#3f8f4a] text-[11px] font-bold shadow-[inset_2px_2px_4px_rgba(104,118,100,0.3),inset_-1px_-1px_3px_rgba(255,255,255,0.6)]">
                  <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 4l-8 8h16l-8-8z" />
                  </svg>
                  <span>5.3%</span>
                </div>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b7663] block font-body">
                  AVG. SESSION
                </span>
                <span className="font-display font-extrabold text-3xl sm:text-4xl text-[#26301f] tracking-tight leading-none mt-1 block">
                  4m 38s
                </span>
              </div>
            </div>
          </section>

          {/* =========================================================================
              8/4 SPLIT: REVENUE AREA CHART + TRAFFIC DONUT
          ========================================================================== */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* 8-COL: REVENUE OVER TIME AREA CHART (~2/3 width) */}
            <div className="lg:col-span-8 clay-card p-5 sm:p-6 flex flex-col justify-between">
              
              {/* Card Header & Segmented Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="font-display font-bold text-xl sm:text-2xl text-[#26301f] leading-none">
                    Revenue over time
                  </h2>
                  <p className="text-xs text-[#6b7663] font-medium mt-1">
                    Daily revenue &bull; Sep 15 to Oct 14
                  </p>
                </div>

                {/* Sunken Segmented Range Toggle (12M / 30D / 7D) */}
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

              {/* Chart SVG Canvas */}
              <div className="relative w-full overflow-visible pt-10 pb-2">
                
                {/* Floating Anchored Clay Tooltip with Connector Stem */}
                <div
                  className="absolute z-10 pointer-events-none transition-all duration-300 ease-out flex flex-col items-center"
                  style={{
                    left: `${(activeX / chartWidth) * 100}%`,
                    top: `${(activeY / chartHeight) * 100}%`,
                    transform: "translate(-50%, -100%) translateY(-14px)",
                  }}
                >
                  {/* Tooltip Clay Bubble */}
                  <div className="clay-tooltip px-3 py-1.5 rounded-xl border border-white/50 text-center flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[#6b7663] font-body">
                      {activePoint.shortDate}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#14776b]" />
                    <span className="font-display font-extrabold text-sm text-[#14776b]">
                      ${activePoint.revenue.toLocaleString()}
                    </span>
                  </div>

                  {/* 1px Vertical Connector Stem */}
                  <div className="w-[2px] h-3.5 bg-[#14776b] shadow-sm mt-0.5" />
                </div>

                {/* SVG Visual */}
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-auto overflow-visible"
                >
                  <defs>
                    <linearGradient id="tealClayArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#14776b" stopOpacity="0.45" />
                      <stop offset="60%" stopColor="#14776b" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#14776b" stopOpacity="0.0" />
                    </linearGradient>
                    <filter id="clayLineGlow" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#14776b" floodOpacity="0.25" />
                    </filter>
                  </defs>

                  {/* Y-Axis Horizontal Gridlines & Values */}
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

                  {/* Filled Gradient Area */}
                  <path d={areaPath} fill="url(#tealClayArea)" />

                  {/* Teal Smooth Main Line */}
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#14776b"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#clayLineGlow)"
                  />

                  {/* Clickable Hover Zones & Markers */}
                  {currentData.map((d, i) => {
                    const x = getX(i);
                    const y = getY(d.revenue);
                    const isSelected = i === activeDataIndex;

                    return (
                      <g key={i} className="cursor-pointer" onClick={() => setActiveDataIndex(i)}>
                        {/* Transparent touch/hover target */}
                        <circle cx={x} cy={y} r="14" fill="transparent" />

                        {/* Interactive Dot */}
                        {isSelected && (
                          <>
                            {/* Pulsing ring */}
                            <circle
                              cx={x}
                              cy={y}
                              r="8"
                              fill="#14776b"
                              fillOpacity="0.25"
                            />
                            {/* Center ringed marker */}
                            <circle
                              cx={x}
                              cy={y}
                              r="4.5"
                              fill="#ffffff"
                              stroke="#14776b"
                              strokeWidth="3"
                            />
                          </>
                        )}
                      </g>
                    );
                  })}

                  {/* X-Axis Date Labels */}
                  {currentData.map((d, i) => {
                    // Show select intervals to prevent clutter on small screens
                    if (currentData.length > 7 && i % 2 !== 0 && i !== currentData.length - 1) {
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

              {/* Bottom Micro Insights */}
              <div className="mt-3 pt-3 border-t border-[#c5d0be]/40 flex items-center justify-between text-xs text-[#6b7663]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#14776b]" />
                  <span>Peak day: <strong className="text-[#26301f]">Oct 14 ($11,250)</strong></span>
                </div>
                <span>Avg daily: <strong className="text-[#26301f]">$7,660</strong></span>
              </div>
            </div>

            {/* 4-COL: TRAFFIC SOURCES DONUT (~1/3 width) */}
            <div className="lg:col-span-4 clay-card p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <h2 className="font-display font-bold text-xl sm:text-2xl text-[#26301f] leading-none">
                  Traffic sources
                </h2>
                <p className="text-xs text-[#6b7663] font-medium mt-1">
                  12,847 total sessions
                </p>
              </div>

              {/* Center Donut Ring */}
              <div className="relative my-4 flex items-center justify-center">
                <svg viewBox="0 0 160 160" className="w-44 h-44 sm:w-48 sm:h-48 -rotate-90">
                  {/* Background Track */}
                  <circle
                    cx="80"
                    cy="80"
                    r="56"
                    fill="none"
                    stroke="#dbe2d5"
                    strokeWidth="16"
                    className="shadow-inner"
                  />
                  
                  {/* Donut Segments (circumference = 2 * PI * 56 = 351.85) */}
                  {/* Organic: 42% -> 147.77 */}
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
                  {/* Direct: 27% -> 94.99 */}
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
                  {/* Referral: 19% -> 66.85 */}
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
                  {/* Social: 12% -> 42.22 */}
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

                {/* Center Label in Donut Hole */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="font-display font-extrabold text-2xl sm:text-3xl text-[#26301f] leading-none">
                    12.8k
                  </span>
                  <span className="text-[11px] font-semibold text-[#6b7663] uppercase tracking-wider font-body mt-0.5">
                    sessions
                  </span>
                </div>
              </div>

              {/* Legend of 4 Rows */}
              <div className="space-y-2 pt-2 border-t border-[#c5d0be]/40">
                {[
                  { name: "Organic", pct: "42%", count: "5,396", color: "#14776b" },
                  { name: "Direct", pct: "27%", count: "3,468", color: "#c4643f" },
                  { name: "Referral", pct: "19%", count: "2,440", color: "#cf9b34" },
                  { name: "Social", pct: "12%", count: "1,543", color: "#22304a" },
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs py-0.5">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-medium text-[#26301f]">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 font-body">
                      <span className="text-[11px] text-[#6b7663]">{item.count}</span>
                      <span className="font-bold text-[#26301f] w-8 text-right font-display">{item.pct}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* =========================================================================
              CAMPAIGNS DATA TABLE (Full Width Raised Clay Card)
          ========================================================================== */}
          <section className="clay-card p-5 sm:p-6">
            
            {/* Table Header Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <h2 className="font-display font-bold text-xl sm:text-2xl text-[#26301f] leading-none">
                  Recent campaigns
                </h2>
                <span className="clay-sunken-pill px-2.5 py-0.5 text-[11px] font-bold text-[#14776b]">
                  {filteredCampaigns.length} active
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExport}
                  className="clay-btn px-3.5 py-1.5 rounded-full text-xs font-bold text-[#26301f] flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5 text-[#6b7663]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Export</span>
                </button>

                <button
                  onClick={() => alert("Showing all historical campaigns archives.")}
                  className="clay-btn px-3.5 py-1.5 rounded-full text-xs font-bold text-[#26301f]"
                >
                  View all
                </button>
              </div>
            </div>

            {/* Horizontally Scrollable Table Container */}
            <div className="overflow-x-auto custom-scrollbar -mx-2 sm:mx-0">
              <div className="min-w-[640px]">
                
                {/* Sunken Clay Header Strip */}
                <div className="clay-sunken rounded-2xl grid grid-cols-12 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#6b7663] mb-2 font-body">
                  <div className="col-span-4">Campaign</div>
                  <div className="col-span-2">Channel</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-1 text-right">Spend</div>
                  <div className="col-span-1 text-right">Conversions</div>
                  <div className="col-span-2 text-right">ROAS</div>
                </div>

                {/* Table Rows */}
                <div className="space-y-1.5">
                  {filteredCampaigns.map((camp, idx) => {
                    // Channel tag styling
                    const channelStyles = {
                      Search: { bg: "#14776b", text: "#ffffff" },
                      Display: { bg: "#22304a", text: "#ffffff" },
                      Email: { bg: "#c4643f", text: "#ffffff" },
                      Social: { bg: "#cf9b34", text: "#ffffff" },
                    }[camp.channel];

                    return (
                      <div
                        key={camp.id}
                        className={`grid grid-cols-12 items-center px-4 py-3.5 rounded-2xl transition-all ${
                          idx % 2 === 0 ? "bg-[#e2e8dc]" : "bg-[#dbe2d5]/40"
                        } hover:shadow-[8px_9px_20px_rgba(88,104,84,0.35),-5px_-5px_14px_rgba(255,255,255,0.9)] hover:scale-[1.002]`}
                      >
                        {/* Campaign Name */}
                        <div className="col-span-4 font-semibold text-sm text-[#26301f] truncate pr-2 font-body">
                          {camp.name}
                        </div>

                        {/* Channel Tinted Clay Chip */}
                        <div className="col-span-2">
                          <span
                            className="inline-block px-2.5 py-1 rounded-full text-[10.5px] font-bold shadow-[2px_3px_6px_rgba(88,104,84,0.25)]"
                            style={{ backgroundColor: channelStyles.bg, color: channelStyles.text }}
                          >
                            {camp.channel}
                          </span>
                        </div>

                        {/* Status Pill with Glyphs */}
                        <div className="col-span-2">
                          <span className="clay-tile inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-[#26301f] shadow-sm">
                            {camp.status === "Active" && (
                              <span className="w-2 h-2 rounded-full bg-[#3f8f4a]" />
                            )}
                            {camp.status === "Paused" && (
                              <span className="w-2 h-2 rounded-full bg-[#cf9b34] opacity-80" />
                            )}
                            {camp.status === "Completed" && (
                              <svg className="w-3 h-3 text-[#14776b]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            <span>{camp.status}</span>
                          </span>
                        </div>

                        {/* Spend */}
                        <div className="col-span-1 text-right font-display font-bold text-sm text-[#26301f]">
                          ${camp.spend.toLocaleString()}
                        </div>

                        {/* Conversions */}
                        <div className="col-span-1 text-right font-display font-bold text-sm text-[#26301f]">
                          {camp.conversions.toLocaleString()}
                        </div>

                        {/* ROAS + Sunken Meter */}
                        <div className="col-span-2 flex items-center justify-end gap-2.5 pl-2">
                          <span className="font-display font-extrabold text-sm text-[#14776b]">
                            {camp.roas}x
                          </span>
                          <div className="w-16 h-2 bg-[#dbe2d5] rounded-full overflow-hidden shadow-[inset_1px_2px_3px_rgba(104,118,100,0.4)]">
                            <div
                              className="h-full bg-[#14776b] rounded-full"
                              style={{ width: `${camp.roasProgress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* =========================================================================
          NEW REPORT MODAL
      ========================================================================== */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs">
          <div className="clay-card p-6 w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-2xl text-[#26301f]">
                Create New Report
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="w-8 h-8 rounded-full clay-btn flex items-center justify-center text-[#6b7663] hover:text-[#26301f]"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-[#6b7663] mb-4">
              Configure parameters for your customized dusty-sage clay analytics export.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6b7663] mb-1.5">
                  Report Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Q4 Revenue & Conversion Deep-Dive"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  className="w-full clay-sunken-pill px-4 py-2.5 text-xs text-[#26301f] placeholder-[#6b7663] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6b7663] mb-1.5">
                  Primary Metrics Included
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="clay-tile p-2 rounded-xl flex items-center gap-2 font-medium">
                    <input type="checkbox" defaultChecked className="accent-[#14776b]" /> Revenue Trends
                  </span>
                  <span className="clay-tile p-2 rounded-xl flex items-center gap-2 font-medium">
                    <input type="checkbox" defaultChecked className="accent-[#14776b]" /> Traffic Channels
                  </span>
                  <span className="clay-tile p-2 rounded-xl flex items-center gap-2 font-medium">
                    <input type="checkbox" defaultChecked className="accent-[#14776b]" /> ROAS Metrics
                  </span>
                  <span className="clay-tile p-2 rounded-xl flex items-center gap-2 font-medium">
                    <input type="checkbox" defaultChecked className="accent-[#14776b]" /> Session Times
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowReportModal(false)}
                className="clay-btn px-4 py-2 rounded-full text-xs font-bold text-[#6b7663]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setExportMessage(`Generating report "${reportName || "Custom Analytics Report"}"...`);
                  setTimeout(() => setExportMessage("Report ready for download!"), 1500);
                  setTimeout(() => setExportMessage(null), 4500);
                }}
                className="clay-teal-btn px-5 py-2 rounded-full text-xs font-bold"
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
