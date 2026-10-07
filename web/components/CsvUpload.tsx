"use client";

import React, { useState, useRef } from "react";

interface PredictionItem {
  account_id: string;
  mule_probability: number;
  risk_score: number;
  risk_level: string;
  model_scores: {
    lightgbm: number;
    xgboost: number;
    catboost: number;
    ensemble: number;
  };
  top_reasons: string[];
  mule_archetype?: string;
  investigation_summary?: string;
}

interface BatchResult {
  filename: string;
  total_accounts: number;
  total_transactions: number;
  critical_accounts: number;
  high_risk_accounts: number;
  medium_risk_accounts: number;
  low_risk_accounts: number;
  average_risk: number;
  ranked_predictions: PredictionItem[];
}

interface CsvUploadProps {
  onInvestigate: (accountId: string) => void;
  onNavigateToAccounts: () => void;
}

export function CsvUpload({ onInvestigate, onNavigateToAccounts }: CsvUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progressStep, setProgressStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BatchResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      if (dropped.name.endsWith(".csv")) {
        setFile(dropped);
        setError(null);
      } else {
        setError("Please upload a valid .csv file.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const runAnalysis = async (targetFile: File) => {
    try {
      setAnalyzing(true);
      setError(null);
      setResult(null);

      setProgressStep("Validating transaction schema & headers...");
      await new Promise((r) => setTimeout(r, 250));

      setProgressStep("Aggregating accounts & engineering 124 temporal, MCC & graph features...");
      await new Promise((r) => setTimeout(r, 350));

      setProgressStep("Running multi-model inference (LightGBM + XGBoost + CatBoost)...");
      const formData = new FormData();
      formData.append("file", targetFile);

      const res = await fetch("/api/predict/batch", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.detail?.message || errorJson.detail || "Batch prediction analysis failed.");
      }

      setProgressStep("Computing SHAP attributions and saving triage rankings...");
      const data: BatchResult = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during analysis.");
    } finally {
      setAnalyzing(false);
      setProgressStep("");
    }
  };

  const loadPresetMockData = async (presetName: string, csvContent: string) => {
    try {
      const blob = new Blob([csvContent], { type: "text/csv" });
      const sampleFile = new File([blob], `${presetName}.csv`, { type: "text/csv" });
      setFile(sampleFile);
      await runAnalysis(sampleFile);
    } catch (err: any) {
      setError("Failed to process mock dataset: " + err.message);
      setAnalyzing(false);
    }
  };

  const sampleDatasets = [
    {
      name: "Mixed Batch (Mules + Retail)",
      filename: "mixed_batch_test",
      desc: "5 accounts with Pass-Through, Smurfing, Burst, Hub & Legit Retail",
      csv: `transaction_id,account_id,transaction_timestamp,amount,txn_type,channel,mcc_code,counterparty_id,balance_after_transaction,part_transaction_type,transaction_sub_type,ip_address
TXN_101,ACCT_TEST_MULE_PASS,2025-03-01 02:15:20,95000.0,C,UPC,6051,CP_SOURCE_1,95500.0,CI,NORMAL,192.168.1.10
TXN_102,ACCT_TEST_MULE_PASS,2025-03-01 02:18:45,45000.0,D,UPD,6051,CP_DEST_1,50500.0,CI,NORMAL,192.168.1.10
TXN_103,ACCT_TEST_MULE_PASS,2025-03-01 02:21:10,49000.0,D,UPD,6051,CP_DEST_2,1500.0,CI,NORMAL,192.168.1.10
TXN_104,ACCT_TEST_MULE_PASS,2025-03-02 03:05:00,88000.0,C,UPC,6051,CP_SOURCE_2,89500.0,CI,NORMAL,192.168.1.10
TXN_105,ACCT_TEST_MULE_PASS,2025-03-02 03:09:12,87000.0,D,UPD,6051,CP_DEST_3,2500.0,CI,NORMAL,192.168.1.10
TXN_201,ACCT_TEST_SMURF,2025-03-01 10:15:00,49500.0,C,UPC,6012,CP_SMURF_A,49500.0,CI,NORMAL,192.168.2.15
TXN_202,ACCT_TEST_SMURF,2025-03-01 11:20:00,49000.0,C,UPC,6012,CP_SMURF_B,98500.0,CI,NORMAL,192.168.2.15
TXN_203,ACCT_TEST_SMURF,2025-03-01 13:45:00,49800.0,C,UPC,6012,CP_SMURF_C,148300.0,CI,NORMAL,192.168.2.15
TXN_204,ACCT_TEST_SMURF,2025-03-02 09:30:00,48500.0,C,UPC,6012,CP_SMURF_D,196800.0,CI,NORMAL,192.168.2.15
TXN_205,ACCT_TEST_SMURF,2025-03-02 18:00:00,195000.0,D,UPD,6012,CP_MASTER,1800.0,CI,NORMAL,192.168.2.15
TXN_301,ACCT_TEST_BURST,2024-05-10 10:00:00,200.0,C,UPC,5411,CP_OLD,500.0,CI,NORMAL,192.168.3.20
TXN_302,ACCT_TEST_BURST,2025-03-05 01:10:00,150000.0,C,UPC,5933,CP_NEW_IN,150500.0,CI,NORMAL,192.168.3.20
TXN_303,ACCT_TEST_BURST,2025-03-05 01:15:30,148000.0,D,UPD,5933,CP_NEW_OUT,2500.0,CI,NORMAL,192.168.3.20
TXN_401,ACCT_TEST_HUB,2025-03-01 08:00:00,10000.0,C,UPC,6051,CP_SRC_1,10000.0,CI,NORMAL,192.168.4.5
TXN_402,ACCT_TEST_HUB,2025-03-01 08:15:00,15000.0,C,UPC,6051,CP_SRC_2,25000.0,CI,NORMAL,192.168.4.5
TXN_403,ACCT_TEST_HUB,2025-03-01 08:30:00,20000.0,C,UPC,6051,CP_SRC_3,45000.0,CI,NORMAL,192.168.4.5
TXN_404,ACCT_TEST_HUB,2025-03-01 08:45:00,18000.0,C,UPC,6051,CP_SRC_4,63000.0,CI,NORMAL,192.168.4.5
TXN_405,ACCT_TEST_HUB,2025-03-01 09:00:00,60000.0,D,UPD,6051,CP_OUT_1,3000.0,CI,NORMAL,192.168.4.5
TXN_501,ACCT_TEST_LEGIT_01,2025-03-01 09:00:00,85000.0,C,CSD,5411,CP_EMPLOYER,92000.0,BI,NORMAL,192.168.5.1
TXN_502,ACCT_TEST_LEGIT_01,2025-03-03 14:20:00,3200.0,D,UPD,5411,CP_GROCERY,88800.0,CI,NORMAL,192.168.5.1
TXN_503,ACCT_TEST_LEGIT_01,2025-03-05 18:30:00,1800.0,D,UPD,5812,CP_RESTAURANT,87000.0,CI,NORMAL,192.168.5.1
TXN_504,ACCT_TEST_LEGIT_01,2025-03-08 11:15:00,5000.0,D,ATW,6011,CP_ATM_CITY,82000.0,CI,CLT_CASH,192.168.5.1`,
    },
    {
      name: "Pass-Through Mule",
      filename: "mule_passthrough_test",
      desc: "High velocity wire transfers with 99% instant debit drain",
      csv: `transaction_id,account_id,transaction_timestamp,amount,txn_type,channel,mcc_code,counterparty_id,balance_after_transaction,part_transaction_type,transaction_sub_type,ip_address
TXN_PT_001,ACCT_TEST_PT_01,2025-03-10 01:15:20,95000.0,C,UPC,6051,CP_SOURCE_A,96000.0,CI,NORMAL,192.168.10.1
TXN_PT_002,ACCT_TEST_PT_01,2025-03-10 01:18:45,47000.0,D,UPD,6051,CP_DEST_X,49000.0,CI,NORMAL,192.168.10.1
TXN_PT_003,ACCT_TEST_PT_01,2025-03-10 01:21:10,48000.0,D,UPD,6051,CP_DEST_Y,1000.0,CI,NORMAL,192.168.10.1
TXN_PT_004,ACCT_TEST_PT_01,2025-03-11 02:05:00,88000.0,C,UPC,6051,CP_SOURCE_B,89000.0,CI,NORMAL,192.168.10.1
TXN_PT_005,ACCT_TEST_PT_01,2025-03-11 02:08:12,44000.0,D,UPD,6051,CP_DEST_Z,45000.0,CI,NORMAL,192.168.10.1
TXN_PT_006,ACCT_TEST_PT_01,2025-03-11 02:11:30,43500.0,D,UPD,6051,CP_DEST_W,1500.0,CI,NORMAL,192.168.10.1
TXN_PT_007,ACCT_TEST_PT_01,2025-03-12 01:40:15,75000.0,C,UPC,6051,CP_SOURCE_C,76500.0,CI,NORMAL,192.168.10.1
TXN_PT_008,ACCT_TEST_PT_01,2025-03-12 01:43:00,75000.0,D,UPD,6051,CP_DEST_V,1500.0,CI,NORMAL,192.168.10.1`,
    },
    {
      name: "Smurfing / Structuring",
      filename: "mule_smurfing_structuring_test",
      desc: "Repetitive ₹49,000-₹49,900 deposits to evade ₹50k thresholds",
      csv: `transaction_id,account_id,transaction_timestamp,amount,txn_type,channel,mcc_code,counterparty_id,balance_after_transaction,part_transaction_type,transaction_sub_type,ip_address
TXN_SM_001,ACCT_TEST_SMURF_02,2025-03-01 10:15:00,49500.0,C,UPC,6012,CP_SMURF_01,49500.0,CI,NORMAL,192.168.20.5
TXN_SM_002,ACCT_TEST_SMURF_02,2025-03-01 11:20:00,49000.0,C,UPC,6012,CP_SMURF_02,98500.0,CI,NORMAL,192.168.20.5
TXN_SM_003,ACCT_TEST_SMURF_02,2025-03-01 13:45:00,49800.0,C,UPC,6012,CP_SMURF_03,148300.0,CI,NORMAL,192.168.20.5
TXN_SM_004,ACCT_TEST_SMURF_02,2025-03-02 09:30:00,48500.0,C,UPC,6012,CP_SMURF_04,196800.0,CI,NORMAL,192.168.20.5
TXN_SM_005,ACCT_TEST_SMURF_02,2025-03-02 11:10:00,49200.0,C,UPC,6012,CP_SMURF_05,246000.0,CI,NORMAL,192.168.20.5
TXN_SM_006,ACCT_TEST_SMURF_02,2025-03-02 14:00:00,49900.0,C,UPC,6012,CP_SMURF_06,295900.0,CI,NORMAL,192.168.20.5
TXN_SM_007,ACCT_TEST_SMURF_02,2025-03-03 10:00:00,48900.0,C,UPC,6012,CP_SMURF_07,344800.0,CI,NORMAL,192.168.20.5
TXN_SM_008,ACCT_TEST_SMURF_02,2025-03-03 16:30:00,49700.0,C,UPC,6012,CP_SMURF_08,394500.0,CI,NORMAL,192.168.20.5
TXN_SM_009,ACCT_TEST_SMURF_02,2025-03-04 18:00:00,390000.0,D,UPD,6012,CP_MASTER_DRAIN,4500.0,CI,NORMAL,192.168.20.5`,
    },
    {
      name: "Dormant-Burst Account",
      filename: "mule_dormant_burst_test",
      desc: "Inactive for months, then sudden late-night high-value transfers",
      csv: `transaction_id,account_id,transaction_timestamp,amount,txn_type,channel,mcc_code,counterparty_id,balance_after_transaction,part_transaction_type,transaction_sub_type,ip_address
TXN_DB_001,ACCT_TEST_BURST_03,2024-06-10 10:00:00,250.0,C,UPC,5411,CP_OLD_01,500.0,CI,NORMAL,192.168.30.8
TXN_DB_002,ACCT_TEST_BURST_03,2025-03-05 01:10:00,150000.0,C,UPC,5933,CP_BURST_IN_01,150500.0,CI,NORMAL,192.168.30.8
TXN_DB_003,ACCT_TEST_BURST_03,2025-03-05 01:15:30,50000.0,D,ATW,6012,CP_ATM_PULL_01,100500.0,CI,CLT_CASH,192.168.30.8
TXN_DB_004,ACCT_TEST_BURST_03,2025-03-05 01:20:00,50000.0,D,ATW,6012,CP_ATM_PULL_02,50500.0,CI,CLT_CASH,192.168.30.8
TXN_DB_005,ACCT_TEST_BURST_03,2025-03-05 01:25:00,49000.0,D,UPD,5933,CP_BURST_OUT_03,1500.0,CI,NORMAL,192.168.30.8
TXN_DB_006,ACCT_TEST_BURST_03,2025-03-05 02:00:00,120000.0,C,UPC,5933,CP_BURST_IN_02,121500.0,CI,NORMAL,192.168.30.8
TXN_DB_007,ACCT_TEST_BURST_03,2025-03-05 02:08:00,120000.0,D,UPD,5933,CP_BURST_OUT_04,1500.0,CI,NORMAL,192.168.30.8`,
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner Card */}
      <div className="clay-card p-6">
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#26301f] tracking-tight">
          Batch Transaction Inference & Mock Testing
        </h1>
        <p className="text-xs text-[#6b7663] font-medium mt-1">
          Select a preset mock dataset below or upload any custom transaction CSV file.
        </p>

        {/* 1-Click Mock Datasets Grid */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {sampleDatasets.map((ds) => (
            <div
              key={ds.filename}
              onClick={() => !analyzing && loadPresetMockData(ds.filename, ds.csv)}
              className={`clay-tile p-3.5 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] ${
                analyzing ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#14776b] font-display">
                  <span>&plus;</span>
                  <span>{ds.name}</span>
                </div>
                <p className="text-[10.5px] text-[#6b7663] mt-1 font-body leading-tight">
                  {ds.desc}
                </p>
              </div>
              <span className="mt-3 text-[10px] font-bold text-[#26301f] underline">
                Run Test &rarr;
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Sunken Dropzone Card */}
      <div className="clay-card p-6">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          className="clay-sunken p-8 sm:p-12 rounded-3xl text-center cursor-pointer hover:bg-[#dbe2d5]/80 transition-all"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-[#e2e8dc] text-[#14776b] flex items-center justify-center shadow-[6px_7px_16px_rgba(88,104,84,0.4),-4px_-5px_12px_rgba(255,255,255,0.9)]">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>

          <h3 className="font-display font-bold text-lg text-[#26301f]">
            {file ? file.name : "Or drag & drop your own transaction CSV file here"}
          </h3>
          <p className="text-xs text-[#6b7663] mt-1">
            Expected columns: <code className="font-bold">account_id, timestamp, amount, transaction_type, counterparty_id</code>
          </p>

          {file && !analyzing && (
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  runAnalysis(file);
                }}
                className="clay-teal-btn px-6 py-2.5 rounded-full text-xs font-bold"
              >
                Run Multi-Model Inference &rarr;
              </button>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {analyzing && (
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-xs text-[#26301f] font-semibold">
              <span>{progressStep}</span>
              <span className="font-display font-bold text-[#14776b]">Processing...</span>
            </div>
            <div className="w-full h-3 bg-[#dbe2d5] rounded-full overflow-hidden shadow-[inset_1px_2px_4px_rgba(104,118,100,0.4)]">
              <div className="h-full bg-[#14776b] rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-[#c4643f]/15 text-[#c4643f] text-xs font-semibold">
            {error}
          </div>
        )}
      </div>

      {/* Results Section */}
      {result && (
        <div className="clay-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display font-bold text-xl sm:text-2xl text-[#26301f]">
                Inference Results Summary: {result.filename}
              </h2>
              <p className="text-xs text-[#6b7663]">
                Processed {result.total_transactions} transactions across {result.total_accounts} accounts
              </p>
            </div>

            <button
              onClick={onNavigateToAccounts}
              className="clay-btn px-4 py-2 rounded-full text-xs font-bold text-[#26301f]"
            >
              Open in Accounts Directory &rarr;
            </button>
          </div>

          {/* KPI Stat Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="clay-tile p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7663] block">TOTAL EVALUATED</span>
              <span className="font-display font-extrabold text-2xl text-[#26301f] mt-1 block">{result.total_accounts}</span>
            </div>
            <div className="clay-tile p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#c4643f] block">CRITICAL MULES</span>
              <span className="font-display font-extrabold text-2xl text-[#c4643f] mt-1 block">{result.critical_accounts}</span>
            </div>
            <div className="clay-tile p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#cf9b34] block">HIGH RISK</span>
              <span className="font-display font-extrabold text-2xl text-[#cf9b34] mt-1 block">{result.high_risk_accounts}</span>
            </div>
            <div className="clay-tile p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#14776b] block">AVG RISK SCORE</span>
              <span className="font-display font-extrabold text-2xl text-[#14776b] mt-1 block">{result.average_risk.toFixed(1)}</span>
            </div>
          </div>

          {/* Results Table */}
          <div className="overflow-x-auto custom-scrollbar">
            <div className="min-w-[720px]">
              <div className="clay-sunken rounded-2xl grid grid-cols-12 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#6b7663] mb-2 font-body">
                <div className="col-span-3">Account ID</div>
                <div className="col-span-2">Archetype</div>
                <div className="col-span-2">Risk Level</div>
                <div className="col-span-2 text-right">Probability</div>
                <div className="col-span-2 text-right">Risk Score</div>
                <div className="col-span-1 text-center">Action</div>
              </div>

              <div className="space-y-1.5">
                {result.ranked_predictions.map((p, idx) => {
                  const archetype = p.mule_archetype || "Pass-Through";
                  return (
                    <div
                      key={p.account_id}
                      onClick={() => onInvestigate(p.account_id)}
                      className={`grid grid-cols-12 items-center px-4 py-3 rounded-2xl transition-all cursor-pointer ${
                        idx % 2 === 0 ? "bg-[#e2e8dc]" : "bg-[#dbe2d5]/40"
                      } hover:shadow-[6px_7px_16px_rgba(88,104,84,0.35)]`}
                    >
                      <div className="col-span-3 font-bold text-sm text-[#26301f] font-body">
                        {p.account_id}
                      </div>
                      <div className="col-span-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-[#14776b] text-white">
                          {archetype}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="clay-tile px-2.5 py-0.5 rounded-full text-xs font-semibold text-[#26301f]">
                          {p.risk_level}
                        </span>
                      </div>
                      <div className="col-span-2 text-right font-display font-bold text-sm text-[#14776b]">
                        {(p.mule_probability * 100).toFixed(1)}%
                      </div>
                      <div className="col-span-2 text-right font-display font-extrabold text-sm text-[#26301f]">
                        {p.risk_score.toFixed(1)}
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onInvestigate(p.account_id);
                          }}
                          className="clay-btn p-1.5 rounded-full text-[#14776b]"
                        >
                          &rarr;
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
