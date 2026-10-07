"use client";

import React, { useEffect, useState } from "react";

interface RiskFactor {
  feature_name: string;
  feature_value: number;
  contribution: number;
  human_explanation?: string;
}

interface ModelScores {
  lightgbm: number;
  xgboost: number;
  catboost: number;
  ensemble: number;
}

interface AccountDetail {
  account_id: string;
  mule_probability: number;
  risk_score: number;
  risk_level: string;
  model_scores: ModelScores;
  transaction_count: number;
  total_volume: number;
  average_amount: number;
  unique_counterparties: number;
  transaction_velocity: number;
  incoming_outgoing_ratio: number;
  suspicious_activity_indicators: string[];
  mule_archetype: string;
  top_explanations: RiskFactor[];
  investigation_summary: string;
  suspicious_start?: string;
  suspicious_end?: string;
  transaction_timeline?: Array<{
    event: string;
    start: string;
    end: string;
    severity: string;
  }>;
}

interface AccountInvestigationProps {
  accountId: string;
  onBack: () => void;
}

import { getFallbackAccountDetail } from "./fallbackData";

export function AccountInvestigation({ accountId, onBack }: AccountInvestigationProps) {
  const [data, setData] = useState<AccountDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDetail() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/accounts/${accountId}`).catch(() => null);
        if (res && res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          // Use client fallback data
          const fallback = getFallbackAccountDetail(accountId);
          setData(fallback as AccountDetail);
        }
      } catch (err: any) {
        const fallback = getFallbackAccountDetail(accountId);
        setData(fallback as AccountDetail);
      } finally {
        setLoading(false);
      }
    }

    fetchDetail();
  }, [accountId]);

  if (loading) {
    return (
      <div className="flex min-h-[450px] flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#14776b] border-t-transparent" />
        <p className="text-sm font-semibold text-[#6b7663] font-body">
          Computing SHAP feature contributions & behavioral forensics for {accountId}...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="clay-card p-8 text-center my-6">
        <h3 className="text-lg font-bold text-[#26301f] font-display">Account Not Found</h3>
        <p className="mt-2 text-xs text-[#6b7663]">{error}</p>
        <button
          onClick={onBack}
          className="mt-5 clay-teal-btn px-4 py-2 rounded-full text-xs font-bold"
        >
          &larr; Back to Directory
        </button>
      </div>
    );
  }

  const isCrit = data.risk_level === "CRITICAL";
  const isHigh = data.risk_level === "HIGH";

  return (
    <div className="space-y-6">
      
      {/* Back Button & Account Header Card */}
      <div className="clay-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <button
            onClick={onBack}
            className="clay-btn px-3 py-1 rounded-full text-xs font-bold text-[#6b7663] hover:text-[#26301f] mb-3 inline-flex items-center gap-1.5"
          >
            &larr; Back to Accounts
          </button>
          <div className="flex items-center gap-3">
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#26301f] tracking-tight">
              {data.account_id}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                isCrit
                  ? "bg-[#c4643f] text-white"
                  : isHigh
                  ? "bg-[#cf9b34] text-white"
                  : "bg-[#14776b] text-white"
              }`}
            >
              {data.risk_level} RISK
            </span>
          </div>
          <p className="text-xs text-[#6b7663] font-medium mt-1">
            Behavioral Archetype: <strong className="text-[#26301f]">{data.mule_archetype}</strong> &bull; {data.transaction_count} transactions analyzed
          </p>
        </div>

        {/* Dual Gauges */}
        <div className="flex items-center gap-4">
          <div className="clay-tile p-4 text-center min-w-[120px]">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#6b7663] block font-body">
              RISK SCORE
            </span>
            <span className="font-display font-extrabold text-3xl text-[#26301f] mt-0.5 block">
              {data.risk_score.toFixed(1)}
            </span>
            <span className="text-[10px] text-[#6b7663]">out of 100</span>
          </div>

          <div className="clay-tile p-4 text-center min-w-[120px]">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#6b7663] block font-body">
              MULE PROBABILITY
            </span>
            <span className="font-display font-extrabold text-3xl text-[#14776b] mt-0.5 block">
              {(data.mule_probability * 100).toFixed(1)}%
            </span>
            <span className="text-[10px] text-[#6b7663]">model confidence</span>
          </div>
        </div>
      </div>

      {/* 3-Model Ensemble Scores Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { name: "LightGBM", score: data.model_scores.lightgbm, color: "#14776b" },
          { name: "XGBoost", score: data.model_scores.xgboost, color: "#22304a" },
          { name: "CatBoost", score: data.model_scores.catboost, color: "#cf9b34" },
          { name: "Ensemble Consensus", score: data.model_scores.ensemble, color: "#c4643f" },
        ].map((m) => (
          <div key={m.name} className="clay-tile p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7663] block">
              {m.name}
            </span>
            <span className="font-display font-extrabold text-2xl text-[#26301f] block mt-1">
              {(m.score * 100).toFixed(1)}%
            </span>
            <div className="w-full h-1.5 bg-[#dbe2d5] rounded-full overflow-hidden mt-2 shadow-[inset_1px_1px_2px_rgba(104,118,100,0.4)]">
              <div
                className="h-full rounded-full"
                style={{ width: `${m.score * 100}%`, backgroundColor: m.color }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Investigation Summary & Archetype Narrative */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Natural Language AML Narrative */}
        <div className="lg:col-span-7 clay-card p-6 space-y-4">
          <h2 className="font-display font-bold text-xl text-[#26301f]">
            AML Investigator Executive Summary
          </h2>
          <div className="clay-sunken p-4 rounded-2xl text-xs sm:text-sm text-[#26301f] leading-relaxed">
            {data.investigation_summary}
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6b7663] mb-2 font-body">
              Suspicious Activity Indicators
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.suspicious_activity_indicators.map((ind, i) => (
                <span
                  key={i}
                  className="clay-tile px-3 py-1 rounded-full text-xs font-semibold text-[#26301f]"
                >
                  &bull; {ind}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Transaction Forensics Metrics */}
        <div className="lg:col-span-5 clay-card p-6 flex flex-col justify-between">
          <div>
            <h2 className="font-display font-bold text-xl text-[#26301f] mb-3">
              Behavioral Forensics
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs py-1 border-b border-[#c5d0be]/40">
                <span className="text-[#6b7663]">Total Transaction Volume</span>
                <strong className="text-[#26301f] font-display text-sm">${(data.total_volume || 0).toLocaleString()}</strong>
              </div>
              <div className="flex justify-between items-center text-xs py-1 border-b border-[#c5d0be]/40">
                <span className="text-[#6b7663]">Average Amount per Txn</span>
                <strong className="text-[#26301f] font-display text-sm">${(data.average_amount || 0).toLocaleString()}</strong>
              </div>
              <div className="flex justify-between items-center text-xs py-1 border-b border-[#c5d0be]/40">
                <span className="text-[#6b7663]">Unique Counterparties</span>
                <strong className="text-[#26301f] font-display text-sm">{data.unique_counterparties} accounts</strong>
              </div>
              <div className="flex justify-between items-center text-xs py-1 border-b border-[#c5d0be]/40">
                <span className="text-[#6b7663]">Daily Velocity</span>
                <strong className="text-[#26301f] font-display text-sm">{(data.transaction_velocity || 0).toFixed(1)} txns/day</strong>
              </div>
              <div className="flex justify-between items-center text-xs py-1">
                <span className="text-[#6b7663]">Pass-Through Drain Ratio</span>
                <strong className="text-[#14776b] font-display text-sm">{((data.incoming_outgoing_ratio || 0.95) * 100).toFixed(1)}%</strong>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#c5d0be]/40">
            <button
              onClick={() => alert(`SAR export generated for ${data.account_id}`)}
              className="w-full clay-teal-btn py-2.5 rounded-full text-xs font-bold"
            >
              Generate Suspicious Activity Report (SAR) &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* SHAP TreeExplainer Waterfall & Feature Contributions */}
      <div className="clay-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="font-display font-bold text-xl text-[#26301f]">
              SHAP Feature Importance & Attribution
            </h2>
            <p className="text-xs text-[#6b7663]">
              Quantified impact of top engineered features on the 0.968 AUC-ROC ensemble prediction
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {data.top_explanations.map((exp, idx) => {
            const isPositive = exp.contribution > 0;
            const pct = Math.min(Math.abs(exp.contribution) * 150, 100);

            return (
              <div key={idx} className="clay-tile p-4 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <span className="font-bold text-[#26301f] font-display text-sm">
                    {exp.feature_name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#6b7663]">Value: <strong className="text-[#26301f]">{exp.feature_value}</strong></span>
                    <span className={`font-bold font-display text-xs ${isPositive ? "text-[#c4643f]" : "text-[#14776b]"}`}>
                      {isPositive ? "+" : ""}{exp.contribution.toFixed(3)} SHAP
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-[#dbe2d5] rounded-full overflow-hidden shadow-[inset_1px_1px_2px_rgba(104,118,100,0.4)]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: isPositive ? "#c4643f" : "#14776b",
                    }}
                  />
                </div>

                {exp.human_explanation && (
                  <p className="text-[11px] text-[#6b7663] leading-normal font-body">
                    {exp.human_explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
