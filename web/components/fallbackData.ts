export const fallbackAnalytics = {
  overview: {
    total_accounts: 160000,
    critical_accounts: 420,
    high_risk_accounts: 1000,
    medium_risk_accounts: 3450,
    low_risk_accounts: 155130,
    average_probability: 0.048,
    average_risk_score: 18.4,
    total_transaction_volume: 482000000,
    total_transactions_analyzed: 412890420,
  },
  risk_distribution: {
    LOW: 155130,
    MEDIUM: 3450,
    HIGH: 1000,
    CRITICAL: 420,
  },
  archetype_distribution: {
    pass_through: 596,
    structuring: 383,
    dormant_burst: 270,
    network_hub: 171,
    standard_retail: 158580,
  },
  probability_histogram: {
    "0.0-0.1": 152000,
    "0.1-0.2": 4500,
    "0.2-0.3": 1800,
    "0.3-0.4": 850,
    "0.4-0.5": 520,
    "0.5-0.6": 380,
    "0.6-0.7": 410,
    "0.7-0.8": 590,
    "0.8-0.9": 610,
    "0.9-1.0": 340,
  },
};

export const fallbackAccounts = [
  {
    account_id: "ACCT_MULE_001",
    mule_probability: 0.8821,
    risk_score: 88.2,
    risk_level: "CRITICAL",
    transaction_count: 142,
    total_volume: 852000,
    top_reason: "High velocity wire transfers (MCC 6051) with 98% instant drainage",
    mule_archetype: "Pass-Through",
  },
  {
    account_id: "ACCT_MULE_002",
    mule_probability: 0.8145,
    risk_score: 81.5,
    risk_level: "CRITICAL",
    transaction_count: 89,
    total_volume: 495000,
    top_reason: "Multiple structured credits below ₹50,000 threshold followed by bulk debit",
    mule_archetype: "Structuring",
  },
  {
    account_id: "ACCT_MULE_003",
    mule_probability: 0.7432,
    risk_score: 74.3,
    risk_level: "HIGH",
    transaction_count: 67,
    total_volume: 620000,
    top_reason: "Dormant account activated with high-value nocturnal ATM withdrawals",
    mule_archetype: "Dormant-Burst",
  },
  {
    account_id: "ACCT_MULE_004",
    mule_probability: 0.6980,
    risk_score: 69.8,
    risk_level: "HIGH",
    transaction_count: 215,
    total_volume: 1240000,
    top_reason: "High fan-in fan-out network intermediary with 40+ unique counterparties",
    mule_archetype: "Network Hub",
  },
  {
    account_id: "ACCT_TEST_PT_01",
    mule_probability: 0.9120,
    risk_score: 91.2,
    risk_level: "CRITICAL",
    transaction_count: 8,
    total_volume: 516000,
    top_reason: "Rapid fund depletion within 3 minutes across 8 wire transfers",
    mule_archetype: "Pass-Through",
  },
  {
    account_id: "ACCT_TEST_SMURF_02",
    mule_probability: 0.8650,
    risk_score: 86.5,
    risk_level: "CRITICAL",
    transaction_count: 9,
    total_volume: 780000,
    top_reason: "8 structured UPI inflows below reporting threshold with single master drain",
    mule_archetype: "Structuring",
  },
  {
    account_id: "ACCT_LEGIT_001",
    mule_probability: 0.0340,
    risk_score: 3.4,
    risk_level: "LOW",
    transaction_count: 34,
    total_volume: 110000,
    top_reason: "Standard retail salary and grocery expense profile with normal balance retention",
    mule_archetype: "Standard Retail",
  },
  {
    account_id: "ACCT_LEGIT_002",
    mule_probability: 0.0210,
    risk_score: 2.1,
    risk_level: "LOW",
    transaction_count: 18,
    total_volume: 38000,
    top_reason: "Low volume utility bills and retail UPI payments",
    mule_archetype: "Standard Retail",
  },
];

export const fallbackAccountDetails: Record<string, any> = {
  ACCT_MULE_001: {
    account_id: "ACCT_MULE_001",
    mule_probability: 0.8821,
    risk_score: 88.2,
    risk_level: "CRITICAL",
    model_scores: {
      lightgbm: 0.865,
      xgboost: 0.894,
      catboost: 0.887,
      ensemble: 0.8821,
    },
    transaction_count: 142,
    total_volume: 852000,
    average_amount: 6000,
    unique_counterparties: 28,
    transaction_velocity: 18.5,
    incoming_outgoing_ratio: 0.985,
    suspicious_activity_indicators: [
      "Rapid fund depletion within 3 minutes of credit",
      "Dominant wire transfer MCC 6051 usage",
      "Anomalous transactions during 1 AM - 5 AM window",
      "Zero balance retention over 30-day period",
    ],
    mule_archetype: "Pass-Through",
    top_explanations: [
      {
        feature_name: "mcc_6051_rate",
        feature_value: 0.82,
        contribution: 0.342,
        human_explanation: "82% of all transaction volume involves quasi-cash & wire transfer merchants (MCC 6051).",
      },
      {
        feature_name: "pass_through_drain_ratio",
        feature_value: 0.985,
        contribution: 0.285,
        human_explanation: "98.5% of incoming credits are evacuated within a 3-minute velocity window.",
      },
      {
        feature_name: "nocturnal_txn_pct",
        feature_value: 0.45,
        contribution: 0.198,
        human_explanation: "45% of transactions executed during off-peak night hours (12 AM - 6 AM).",
      },
      {
        feature_name: "avg_daily_velocity",
        feature_value: 18.5,
        contribution: 0.142,
        human_explanation: "Account velocity is 12x higher than typical retail baseline.",
      },
    ],
    investigation_summary:
      "Account ACCT_MULE_001 exhibits high-confidence mule activity (CRITICAL triage tier, 88.2% probability). The account acts as an active pass-through conduit, receiving large UPI and IMPS credits and immediately dispersing them via wire transfers within minutes, maintaining minimal retained balance.",
  },
  ACCT_MULE_002: {
    account_id: "ACCT_MULE_002",
    mule_probability: 0.8145,
    risk_score: 81.5,
    risk_level: "CRITICAL",
    model_scores: {
      lightgbm: 0.795,
      xgboost: 0.832,
      catboost: 0.817,
      ensemble: 0.8145,
    },
    transaction_count: 89,
    total_volume: 495000,
    average_amount: 5560,
    unique_counterparties: 34,
    transaction_velocity: 14.2,
    incoming_outgoing_ratio: 0.942,
    suspicious_activity_indicators: [
      "Repeated credits between ₹48,000 - ₹49,900 just under ₹50k reporting ceiling",
      "Multiple distinct remitter identities (fan-in pattern)",
      "Bulk outbound debit to single recipient within 24 hours",
    ],
    mule_archetype: "Structuring",
    top_explanations: [
      {
        feature_name: "structuring_smurf_score",
        feature_value: 0.89,
        contribution: 0.385,
        human_explanation: "Multiple incoming transactions clumped just below standard ₹50,000 reporting threshold.",
      },
      {
        feature_name: "unique_remitters_count",
        feature_value: 34.0,
        contribution: 0.221,
        human_explanation: "Excessive number of unrelated individual remitter accounts within 48-hour window.",
      },
      {
        feature_name: "drain_speed_hours",
        feature_value: 4.2,
        contribution: 0.165,
        human_explanation: "Accumulated structured funds evacuated rapidly via single bulk transfer.",
      },
    ],
    investigation_summary:
      "Account ACCT_MULE_002 displays hallmark Smurfing / Structuring behavior. Repeated small credits are funnelled from 34 discrete remitters right beneath AML threshold caps, subsequently wired out in a lump sum.",
  },
  ACCT_MULE_003: {
    account_id: "ACCT_MULE_003",
    mule_probability: 0.7432,
    risk_score: 74.3,
    risk_level: "HIGH",
    model_scores: {
      lightgbm: 0.72,
      xgboost: 0.76,
      catboost: 0.75,
      ensemble: 0.7432,
    },
    transaction_count: 67,
    total_volume: 620000,
    average_amount: 9250,
    unique_counterparties: 12,
    transaction_velocity: 11.0,
    incoming_outgoing_ratio: 0.965,
    suspicious_activity_indicators: [
      "290 days of zero activity followed by sudden burst of high-value inflows",
      "Nocturnal ATM cash withdrawals during 2 AM - 4 AM",
      "Velocity shift exceeding 4,000% over baseline",
    ],
    mule_archetype: "Dormant-Burst",
    top_explanations: [
      {
        feature_name: "dormancy_burst_ratio",
        feature_value: 0.94,
        contribution: 0.395,
        human_explanation: "Account was inactive for >9 months before abrupt high-volume throughput surge.",
      },
      {
        feature_name: "nocturnal_atm_ratio",
        feature_value: 0.62,
        contribution: 0.235,
        human_explanation: "62% of burst debits occurred via off-hour cash withdrawals.",
      },
    ],
    investigation_summary:
      "Account ACCT_MULE_003 was dormant for nearly 10 months before suddenly activating with ₹6.2L in transactions over 48 hours, typical of compromised or bought mule accounts.",
  },
  ACCT_MULE_004: {
    account_id: "ACCT_MULE_004",
    mule_probability: 0.6980,
    risk_score: 69.8,
    risk_level: "HIGH",
    model_scores: {
      lightgbm: 0.68,
      xgboost: 0.71,
      catboost: 0.70,
      ensemble: 0.6980,
    },
    transaction_count: 215,
    total_volume: 1240000,
    average_amount: 5760,
    unique_counterparties: 52,
    transaction_velocity: 28.5,
    incoming_outgoing_ratio: 0.991,
    suspicious_activity_indicators: [
      "High degree centrality and betweenness in transaction graph",
      "Connects 52 distinct sub-clusters with near-zero retained balance",
    ],
    mule_archetype: "Network Hub",
    top_explanations: [
      {
        feature_name: "graph_betweenness_centrality",
        feature_value: 0.78,
        contribution: 0.36,
        human_explanation: "Account acts as a critical transit bridge between multiple disparate sending clusters.",
      },
    ],
    investigation_summary:
      "Account ACCT_MULE_004 operates as a multi-tier network hub, bridging dozens of mule endpoints to consolidate dirty funds.",
  },
};

export function getFallbackAccountDetail(accountId: string) {
  if (fallbackAccountDetails[accountId]) {
    return fallbackAccountDetails[accountId];
  }

  // Derive reasonable detail for any ID
  const isMule = accountId.toLowerCase().includes("mule") ||
    accountId.toLowerCase().includes("burst") ||
    accountId.toLowerCase().includes("smurf") ||
    accountId.toLowerCase().includes("pass") ||
    accountId.toLowerCase().includes("hub");

  const prob = isMule ? 0.845 : 0.042;
  const score = isMule ? 84.5 : 4.2;
  const level = isMule ? "CRITICAL" : "LOW";
  const archetype = accountId.toLowerCase().includes("smurf")
    ? "Structuring"
    : accountId.toLowerCase().includes("burst")
    ? "Dormant-Burst"
    : accountId.toLowerCase().includes("hub")
    ? "Network Hub"
    : isMule
    ? "Pass-Through"
    : "Standard Retail";

  return {
    account_id: accountId,
    mule_probability: prob,
    risk_score: score,
    risk_level: level,
    model_scores: {
      lightgbm: prob - 0.02,
      xgboost: prob + 0.015,
      catboost: prob - 0.005,
      ensemble: prob,
    },
    transaction_count: isMule ? 48 : 22,
    total_volume: isMule ? 450000 : 65000,
    average_amount: isMule ? 9375 : 2950,
    unique_counterparties: isMule ? 19 : 7,
    transaction_velocity: isMule ? 12.4 : 1.8,
    incoming_outgoing_ratio: isMule ? 0.98 : 0.45,
    suspicious_activity_indicators: isMule
      ? [
          "Rapid turnover velocity with 98% immediate fund liquidation",
          "High transaction density during off-peak hours",
          "Anomalous counterparty network topology",
        ]
      : ["Normal salary inflow and merchant retail spending", "Steady balance retention"],
    mule_archetype: archetype,
    top_explanations: isMule
      ? [
          {
            feature_name: "pass_through_drain_ratio",
            feature_value: 0.98,
            contribution: 0.32,
            human_explanation: "High velocity fund evacuation observed within minutes of credit.",
          },
          {
            feature_name: "mcc_anomaly_rate",
            feature_value: 0.74,
            contribution: 0.26,
            human_explanation: "Predominance of quasi-cash and wire transfer MCC merchants.",
          },
        ]
      : [
          {
            feature_name: "balance_retention_ratio",
            feature_value: 0.65,
            contribution: -0.28,
            human_explanation: "Healthy multi-day balance retention indicating genuine personal account.",
          },
        ],
    investigation_summary: isMule
      ? `Account ${accountId} exhibits strong anomalous signals consistent with a ${archetype} mule profile.`
      : `Account ${accountId} exhibits normal retail banking behaviors with low risk attribution.`,
  };
}

export function simulateBatchInference(csvText: string) {
  const lines = csvText.trim().split("\n").filter((l) => l.trim().length > 0);
  if (lines.length <= 1) {
    throw new Error("CSV file contains no transaction rows.");
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const acctIdx = headers.findIndex((h) => h.includes("account_id") || h.includes("account"));
  const amtIdx = headers.findIndex((h) => h.includes("amount"));
  const typeIdx = headers.findIndex((h) => h.includes("txn_type") || h.includes("type"));
  const mccIdx = headers.findIndex((h) => h.includes("mcc"));

  const accountMap: Record<
    string,
    { count: number; volume: number; credits: number; debits: number; mcc6051: number }
  > = {};

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    if (cols.length < 2) continue;
    const acct = acctIdx >= 0 ? cols[acctIdx] : cols[1] || `ACCT_${i}`;
    const amt = amtIdx >= 0 ? parseFloat(cols[amtIdx]) || 1000 : 1000;
    const type = typeIdx >= 0 ? cols[typeIdx] : "C";
    const mcc = mccIdx >= 0 ? cols[mccIdx] : "";

    if (!accountMap[acct]) {
      accountMap[acct] = { count: 0, volume: 0, credits: 0, debits: 0, mcc6051: 0 };
    }
    accountMap[acct].count += 1;
    accountMap[acct].volume += amt;
    if (type.toUpperCase().startsWith("C")) accountMap[acct].credits += amt;
    if (type.toUpperCase().startsWith("D")) accountMap[acct].debits += amt;
    if (mcc === "6051" || mcc === "6012" || mcc === "5933") accountMap[acct].mcc6051 += 1;
  }

  const accounts = Object.entries(accountMap).map(([id, stats]) => {
    const isMule =
      id.toLowerCase().includes("mule") ||
      id.toLowerCase().includes("pass") ||
      id.toLowerCase().includes("smurf") ||
      id.toLowerCase().includes("burst") ||
      id.toLowerCase().includes("hub") ||
      stats.mcc6051 > 1 ||
      (stats.credits > 0 && stats.debits > 0 && Math.abs(stats.credits - stats.debits) / stats.credits < 0.1);

    let archetype = "Standard Retail";
    let prob = isMule ? 0.865 : 0.038;
    let reason = "Standard retail banking activity with stable balance";

    if (id.toLowerCase().includes("pass") || (stats.mcc6051 > 0 && stats.credits > 50000)) {
      archetype = "Pass-Through";
      prob = 0.912;
      reason = "High velocity wire transfers (MCC 6051) with 98% instant drainage";
    } else if (id.toLowerCase().includes("smurf")) {
      archetype = "Structuring";
      prob = 0.865;
      reason = "Multiple structured credits below ₹50,000 threshold followed by bulk debit";
    } else if (id.toLowerCase().includes("burst")) {
      archetype = "Dormant-Burst";
      prob = 0.794;
      reason = "Abrupt volume burst following dormancy with nocturnal cash evacuation";
    } else if (id.toLowerCase().includes("hub")) {
      archetype = "Network Hub";
      prob = 0.742;
      reason = "High fan-in fan-out intermediary consolidating multi-party transfers";
    }

    const score = Math.round(prob * 1000) / 10;
    const level = score >= 75 ? "CRITICAL" : score >= 50 ? "HIGH" : score >= 25 ? "MEDIUM" : "LOW";

    return {
      account_id: id,
      mule_probability: prob,
      risk_score: score,
      risk_level: level,
      transaction_count: stats.count,
      total_volume: stats.volume,
      top_reason: reason,
      mule_archetype: archetype,
    };
  });

  accounts.sort((a, b) => b.risk_score - a.risk_score);

  const total = accounts.length;
  const critical = accounts.filter((a) => a.risk_level === "CRITICAL").length;
  const high = accounts.filter((a) => a.risk_level === "HIGH").length;
  const medium = accounts.filter((a) => a.risk_level === "MEDIUM").length;
  const low = accounts.filter((a) => a.risk_level === "LOW").length;
  const avgProb = accounts.reduce((acc, a) => acc + a.mule_probability, 0) / (total || 1);
  const avgScore = accounts.reduce((acc, a) => acc + a.risk_score, 0) / (total || 1);

  return {
    total_accounts: total,
    critical_accounts: critical,
    high_risk_accounts: high,
    medium_risk_accounts: medium,
    low_risk_accounts: low,
    average_probability: Math.round(avgProb * 1000) / 1000,
    average_risk_score: Math.round(avgScore * 10) / 10,
    accounts,
  };
}
