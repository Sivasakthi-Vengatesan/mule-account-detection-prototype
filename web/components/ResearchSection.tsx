"use client";

import React from "react";
import { LightboxGallery } from "../app/lightbox";

const PLOT_FILES = [
  "01_class_distribution.png", "02_alert_reasons.png", "03_account_status_freeze.png",
  "04_balance_boxplots.png", "05_account_opening.png", "06_customer_demographics.png",
  "07_flags_heatmap.png", "08_channel_analysis.png", "09_temporal_patterns.png",
  "10_amount_distribution.png", "11_structuring.png", "12_counterparty.png",
  "13_mcc_analysis.png", "14_branch_analysis.png", "15_velocity.png",
  "16_correlations.png", "17_feature_importance.png", "18_model_evaluation.png",
  "19_shap_summary.png", "20_geographic_analysis.png", "21_unsupervised_features.png",
  "22_focused_heatmap.png", "23_network_topology.png", "24_false_positive_analysis.png",
  "25_cost_sensitive_matrix.png"
];

const LIGHTBOX_IMAGES = PLOT_FILES.map((f) => ({
  src: `/plots/${f}`,
  alt: f.replace(/^\d+_/, "").replace(".png", "").replace(/_/g, " ").toUpperCase(),
}));

const PHASE2_EXPERIMENTS = [
  { version: "V1: Baseline (LGB+XGB+CB)", auc: "0.956", outcome: "Solid starting point with target encoding" },
  { version: "V2: Optuna HPO (100 trials/model)", auc: "0.956", outcome: "Found optimal near-zero regularization" },
  { version: "V3: Freq encoding + rank avg + multi-seed", auc: "0.968", outcome: "Best. Eliminated leakage, improved stability", best: true },
  { version: "V5: Feature interactions (26 derived)", auc: "0.963", outcome: "Hurt. Trees discover interactions internally" },
  { version: "V6: Pseudo-labeling (2-stage)", auc: "0.787", outcome: "Catastrophic. Diluted mule signal from 2.8% to 1.8%" },
  { version: "V7: Drop all branch features", auc: "0.959", outcome: "Fixed RH7 but destroyed overall AUC" },
  { version: "V8: Surgical branch_code drop", auc: "0.958", outcome: "Precise RH7 fix, still too much AUC loss" },
];

const FEATURE_CATEGORIES_P2 = [
  { cat: "Transaction Core", n: "~100", pass: 1, desc: "Velocity, timing, amount moments, Benford divergence" },
  { cat: "Transaction Extended", n: "~40", pass: 2, desc: "Geo spread, IP diversity, drawdown, balance volatility" },
  { cat: "Static Account", n: "~35", pass: 3, desc: "Demographics, KYC status, account age, product holdings" },
  { cat: "Graph / Network", n: "~33", pass: 4, desc: "PageRank, HITS, Louvain communities, betweenness centrality" },
];

export function ResearchSection() {
  return (
    <div className="space-y-6">
      
      {/* Top Card */}
      <div className="clay-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#26301f] tracking-tight">
            Research & Model Validation
          </h1>
          <p className="text-xs text-[#6b7663] font-medium mt-1">
            RBIH x IIT Delhi Mule Account Detection &bull; 208 engineered features &bull; 0.968 AUC-ROC
          </p>
        </div>
      </div>

      {/* Model Evolution & AUC-ROC Benchmark Grid */}
      <div className="clay-card p-6 space-y-4">
        <h2 className="font-display font-bold text-xl text-[#26301f]">
          Model Evolution & Ablation Benchmark
        </h2>

        <div className="space-y-2">
          {PHASE2_EXPERIMENTS.map((exp) => (
            <div
              key={exp.version}
              className={`p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${
                exp.best
                  ? "clay-tile border-2 border-[#14776b]/60 bg-[#e2e8dc]"
                  : "bg-[#dbe2d5]/50"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#26301f] font-body">
                    {exp.version}
                  </span>
                  {exp.best && (
                    <span className="clay-sunken-pill px-2 py-0.5 text-[10.5px] font-bold text-[#14776b]">
                      PRODUCTION ENSEMBLE
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#6b7663] mt-0.5">{exp.outcome}</p>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <span className="text-xs text-[#6b7663]">AUC-ROC:</span>
                <span className={`font-display font-extrabold text-lg ${exp.best ? "text-[#14776b]" : "text-[#26301f]"}`}>
                  {exp.auc}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Engineering Architecture */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FEATURE_CATEGORIES_P2.map((cat) => (
          <div key={cat.cat} className="clay-tile p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7663]">
                  PASS {cat.pass}
                </span>
                <span className="clay-sunken-pill px-2 py-0.5 text-[11px] font-bold text-[#14776b]">
                  {cat.n} features
                </span>
              </div>
              <h3 className="font-display font-bold text-base text-[#26301f]">
                {cat.cat}
              </h3>
              <p className="text-xs text-[#6b7663] mt-1 leading-normal font-body">
                {cat.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Research EDA & SHAP Plots Gallery */}
      <div className="clay-card p-6">
        <h2 className="font-display font-bold text-xl text-[#26301f] mb-1">
          Exploratory Data Analysis & Diagnostic Plots
        </h2>
        <p className="text-xs text-[#6b7663] mb-4">
          Click any diagnostic plot below to view high-resolution analysis.
        </p>

        <LightboxGallery images={LIGHTBOX_IMAGES} />
      </div>
    </div>
  );
}
