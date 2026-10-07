"use client";

import React, { useState, useEffect } from "react";

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

interface AccountsListProps {
  onInvestigate: (accountId: string) => void;
}

import { fallbackAccounts } from "./fallbackData";

export function AccountsList({ onInvestigate }: AccountsListProps) {
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [riskFilter, setRiskFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("risk_score");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          sort_by: sortBy,
          order: sortOrder,
        });

        if (riskFilter) params.append("risk_level", riskFilter);
        if (search.trim()) params.append("search", search.trim());

        const res = await fetch(`/api/accounts?${params.toString()}`).catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          setAccounts(data.accounts || []);
          setTotal(data.total || 0);
        } else {
          // Client-side fallback filtering
          let filtered = [...(fallbackAccounts as AccountSummary[])];
          if (riskFilter) {
            filtered = filtered.filter((a) => a.risk_level === riskFilter);
          }
          if (search.trim()) {
            const q = search.trim().toLowerCase();
            filtered = filtered.filter((a) => a.account_id.toLowerCase().includes(q));
          }
          setAccounts(filtered);
          setTotal(filtered.length);
        }
      } catch (err) {
        let filtered = [...(fallbackAccounts as AccountSummary[])];
        if (riskFilter) {
          filtered = filtered.filter((a) => a.risk_level === riskFilter);
        }
        setAccounts(filtered);
        setTotal(filtered.length);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      fetchAccounts();
    }, 200);

    return () => clearTimeout(timer);
  }, [page, limit, riskFilter, search, sortBy, sortOrder]);

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="clay-card p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#26301f] tracking-tight">
            Monitored Accounts Directory
          </h1>
          <p className="text-xs text-[#6b7663] font-medium mt-1">
            Showing {accounts.length} of {total.toLocaleString()} evaluated accounts across all risk tiers
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {["", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((tier) => (
            <button
              key={tier}
              onClick={() => {
                setRiskFilter(tier);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                riskFilter === tier
                  ? "bg-[#14776b] text-white shadow-[inset_2px_3px_6px_rgba(10,48,43,0.5),inset_-1px_-1px_4px_rgba(255,255,255,0.25)]"
                  : "clay-btn text-[#26301f] hover:text-[#14776b]"
              }`}
            >
              {tier === "" ? "All Tiers" : tier}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Sort Controls Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search */}
        <div className="sm:col-span-6 relative">
          <input
            type="text"
            placeholder="Search by Account ID (e.g. ACCT_MULE_001)..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full clay-sunken-pill pl-10 pr-4 py-2.5 text-xs text-[#26301f] placeholder-[#6b7663] focus:outline-none"
          />
          <svg className="w-4 h-4 text-[#6b7663] absolute left-3.5 top-3 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Sort By */}
        <div className="sm:col-span-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full clay-sunken-pill px-4 py-2.5 text-xs text-[#26301f] focus:outline-none cursor-pointer"
          >
            <option value="risk_score">Sort by Risk Score</option>
            <option value="mule_probability">Sort by Probability</option>
            <option value="total_volume">Sort by Volume</option>
            <option value="transaction_count">Sort by Txn Count</option>
          </select>
        </div>

        {/* Order */}
        <div className="sm:col-span-3">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full clay-sunken-pill px-4 py-2.5 text-xs text-[#26301f] focus:outline-none cursor-pointer"
          >
            <option value="desc">Highest First &darr;</option>
            <option value="asc">Lowest First &uarr;</option>
          </select>
        </div>
      </div>

      {/* Main Directory Table */}
      <div className="clay-card p-5 sm:p-6">
        {loading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#14776b] border-t-transparent" />
            <p className="text-xs font-semibold text-[#6b7663]">Filtering accounts directory...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm font-bold text-[#26301f]">No accounts matched the query.</p>
            <p className="text-xs text-[#6b7663] mt-1">Try changing the risk tier filter or search term.</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar -mx-2 sm:mx-0">
            <div className="min-w-[760px]">
              
              {/* Header Strip */}
              <div className="clay-sunken rounded-2xl grid grid-cols-12 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#6b7663] mb-2 font-body">
                <div className="col-span-3">Account ID & Activity</div>
                <div className="col-span-2">Archetype</div>
                <div className="col-span-2">Risk Tier</div>
                <div className="col-span-2 text-right">Probability</div>
                <div className="col-span-2 text-right">Risk Score</div>
                <div className="col-span-1 text-center">Action</div>
              </div>

              {/* Rows */}
              <div className="space-y-1.5">
                {accounts.map((acc, idx) => {
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

                      {/* Archetype */}
                      <div className="col-span-2">
                        <span
                          className="inline-block px-2.5 py-1 rounded-full text-[10.5px] font-bold shadow-[2px_3px_6px_rgba(88,104,84,0.25)]"
                          style={{ backgroundColor: archStyle.bg, color: archStyle.text }}
                        >
                          {archetype}
                        </span>
                      </div>

                      {/* Risk Level */}
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

                      {/* Probability */}
                      <div className="col-span-2 text-right font-display font-extrabold text-sm text-[#14776b]">
                        {(acc.mule_probability * 100).toFixed(1)}%
                      </div>

                      {/* Risk Score */}
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
        )}

        {/* Pagination Bar */}
        <div className="mt-6 pt-4 border-t border-[#c5d0be]/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6b7663]">
          <div>
            Page <strong className="text-[#26301f]">{page}</strong> of <strong className="text-[#26301f]">{totalPages}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="clay-btn px-3 py-1.5 rounded-full font-bold text-xs disabled:opacity-40 disabled:pointer-events-none text-[#26301f]"
            >
              &larr; Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="clay-btn px-3 py-1.5 rounded-full font-bold text-xs disabled:opacity-40 disabled:pointer-events-none text-[#26301f]"
            >
              Next &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
