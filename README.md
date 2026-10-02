---
title: NFPC Mule Account Detection
emoji: 🏦
colorFrom: blue
colorTo: emerald
tags:
  - fraud-detection
  - aml
  - money-mule
  - rbih
  - lightgbm
  - xgboost
  - catboost
  - nextjs
---

# NFPC Mule Account Detection 🏦🛡️

[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.13-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-000000?logo=next.js&logoColor=white)](web/)
[![LightGBM](https://img.shields.io/badge/LightGBM-4.x-brightgreen)](https://lightgbm.readthedocs.io/)
[![XGBoost](https://img.shields.io/badge/XGBoost-3.x-orange)](https://xgboost.readthedocs.io/)
[![CatBoost](https://img.shields.io/badge/CatBoost-1.x-yellow)](https://catboost.ai/)
[![Public AUC-ROC](https://img.shields.io/badge/Public%20AUC--ROC-0.9681-blue)](results/)
[![Private AUC-ROC](https://img.shields.io/badge/Private%20AUC--ROC-0.9558-indigo)](results/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An end-to-end **Money Mule Account Detection & Risk Scoring System** developed for the **National Fraud Prevention Challenge (NFPC)** (hosted by **Reserve Bank Innovation Hub (RBIH)** in association with **IIT Delhi TRYST**).

The solution features a 3-model gradient-boosted ensemble (LightGBM + XGBoost + CatBoost) with 208 engineered features, confident learning for label noise correction, and an interactive Next.js analytics showcase.

---

## ⚡ Executive Summary & Results

In digital payment networks, illicit money is funneled through layers of mule accounts to obscure transaction trails. This repository implements an end-to-end machine learning pipeline to identify mule accounts from large-scale banking data.

### 🏆 Challenge Performance

| Phase | Evaluation Partition | Metric | Score | Key Components |
| :--- | :--- | :--- | :---: | :--- |
| **Phase 2 (Final)** | **Public Leaderboard** | **AUC-ROC** | **0.968136** | 3-Model Ensemble (LGBM + XGB + CatBoost), 208 features |
| **Phase 2 (Final)** | **Private Leaderboard** | **AUC-ROC** | **0.955815** | 3-seed × 5-fold CV, rank averaging, confident learning |
| **Phase 1** | **Out-of-Fold (OOF)** | **AUC-ROC** | **0.985100** | 125 features across 13 behavioral categories |

---

## 🏗️ End-to-End System Architecture

```mermaid
flowchart TD
    subgraph INGEST["1. Data Ingestion & Partitioning"]
        RAW_CUST["Customer Demographics<br/>(Age, Risk, Occupation, KYC)"]
        RAW_TX["Transaction Streams<br/>(Amounts, Timestamps, Types, Channels)"]
        RAW_DEV["Device & IP Logs<br/>(Fingerprints, Geolocation, Logins)"]
    end

    subgraph FEAT_ENG["2. 4-Pass Feature Engineering (208 Features)"]
        PASS1["Pass 1: Transaction Velocity & Burst Ratios"]
        PASS2["Pass 2: Flow-Through & Turnover Metrics"]
        PASS3["Pass 3: Counterparty Dispersion & Entropies"]
        PASS4["Pass 4: Temporal Night/Weekend & Rapid Pass-Through"]
    end

    subgraph NOISE["3. Label Cleaning & Robustness"]
        CONF_LEARN["Confident Learning Engine<br/>(Identifies Mislabeled Mules / False Positives)"]
        HEURISTIC["Heuristic Red-Herring Filtering"]
    end

    subgraph ENSEMBLE["4. 3-Model Ensemble Engine"]
        LGBM["LightGBM Classifier<br/>(5-Fold CV × 3 Random Seeds)"]
        XGB["XGBoost Classifier<br/>(5-Fold CV × 3 Random Seeds)"]
        CAT["CatBoost Classifier<br/>(5-Fold CV × 3 Random Seeds)"]
        RANK_AVG["Rank-Averaged Probability Aggregator"]
    end

    subgraph APPS["5. Deliverables & Web Interface"]
        CSV_OUT["Ranked Test Account Predictions<br/>(models/predictions.csv)"]
        SHOWCASE["Interactive Next.js Showcase Site<br/>(web/ & static-site/)"]
        PITCH["Competition Pitch Deck<br/>(static-site/pitch.html)"]
    end

    RAW_CUST --> PASS1
    RAW_TX --> PASS1
    RAW_DEV --> PASS1

    PASS1 --> PASS2 --> PASS3 --> PASS4
    PASS4 --> CONF_LEARN --> HEURISTIC

    HEURISTIC --> LGBM
    HEURISTIC --> XGB
    HEURISTIC --> CAT

    LGBM --> RANK_AVG
    XGB --> RANK_AVG
    CAT --> RANK_AVG

    RANK_AVG --> CSV_OUT
    RANK_AVG --> SHOWCASE
    RANK_AVG --> PITCH

    style INGEST fill:#1e293b,stroke:#3b82f6,stroke-width:2px,color:#fff
    style FEAT_ENG fill:#1e1e2e,stroke:#10b981,stroke-width:2px,color:#fff
    style NOISE fill:#1e293b,stroke:#f59e0b,stroke-width:2px,color:#fff
    style ENSEMBLE fill:#1e1e2e,stroke:#8b5cf6,stroke-width:2px,color:#fff
    style APPS fill:#0f172a,stroke:#06b6d4,stroke-width:2px,color:#fff
```

---

## 🎯 Key Behavioral Signals & Feature Taxonomy

The pipeline extracts **208 engineered features** capturing distinctive mule typologies:

```mermaid
mindmap
  root((Mule Detection Signals))
    Flow-Through Dynamics
      High credit-to-debit turnover within <24 hrs
      Zero or negligible resting balance
      Rapid drain ratios
    Transaction Velocity
      Spike in transaction counts vs historical median
      High-frequency micro-credits followed by lump-sum debit
      Off-hours / midnight burst operations
    Network & Counterparties
      High entropy of distinct senders to single beneficiary
      New unverified counterparty proliferation
      Cross-channel hops (UPI -> IMPS -> Cash ATM)
    Device & Access Profiling
      Multi-account logins from single device fingerprint
      Frequent IP subnet / VPN switching
      Short session durations during high-value transfers
```

---

## 🚀 Quick Start & Local Run

### 1. Run the Interactive Web Showcase (Local Server)

A standalone showcase site and pitch deck are pre-bundled:

```bash
# Serve the pre-built interactive dashboard
python -m http.server 8080 --directory static-site
```

Visit in your browser:
- **Main Showcase Dashboard:** [http://localhost:8080](http://localhost:8080)
- **Competition Pitch Deck:** [http://localhost:8080/pitch.html](http://localhost:8080/pitch.html)

### 2. Run the Next.js Web Application

```bash
cd web
npm install
npm run dev
```

Visit: [http://localhost:3000](http://localhost:3000)

---

## 📊 Precomputed Models & Outputs

The repository includes pre-generated evaluation outputs:

- **[`models/predictions.csv`](file:///C:/Users/sakth/.gemini/antigravity-ide/scratch/nfpc-mule-detection-main/models/predictions.csv):** 15,848 test accounts scored with probability predictions.
- **[`models/feature_importance.csv`](file:///C:/Users/sakth/.gemini/antigravity-ide/scratch/nfpc-mule-detection-main/models/feature_importance.csv):** 123 top features ranked by model gain.
- **[`reports/NFPC_Phase1_EDA_Report.md`](file:///C:/Users/sakth/.gemini/antigravity-ide/scratch/nfpc-mule-detection-main/reports/NFPC_Phase1_EDA_Report.md):** 47 statistical tables and 25 analytical plots covering transaction patterns.
- **[`round-2/report.html`](file:///C:/Users/sakth/.gemini/antigravity-ide/scratch/nfpc-mule-detection-main/round-2/report.html):** Comprehensive Phase 2 solution report.

---

## 📂 Repository Structure

```text
nfpc-mule-detection/
├── models/
│   ├── predictions.csv             # 15,848 test account predictions
│   └── feature_importance.csv      # 123 features ranked by importance
├── reports/
│   ├── NFPC_Phase1_EDA_Report.md   # Full EDA report
│   └── plots/                      # 25 analytical charts & visualizations
├── round-2/                        # Phase 2 Pipeline & Deliverables
│   ├── pipeline/
│   │   ├── config.py               # Paths, seeds, constants
│   │   ├── features.py             # 4-pass feature engineering
│   │   ├── label_cleaning.py       # Confident learning & noise removal
│   │   ├── models_v3.py            # LGBM + XGBoost + CatBoost ensemble
│   │   ├── temporal.py             # Activity window prediction
│   │   └── run_v3.py               # Orchestrator
│   ├── report.html                 # Solution report (HTML)
│   └── report.md                   # Solution report (Markdown)
├── src/                            # Phase 1 Pipeline
│   ├── full_pipeline.py            # End-to-end Phase 1 pipeline
│   ├── eda_phase1.py               # EDA script
│   └── md_to_html.py               # Report generator
├── static-site/                    # Static showcase HTML pages
│   ├── index.html                  # Main showcase dashboard
│   └── pitch.html                  # Competition pitch deck
├── web/                            # Next.js 16 web application
│   ├── app/                        # Next.js App Router pages
│   └── package.json
├── LICENSE                         # MIT License
├── requirements.txt                # Python dependencies
└── README.md                       # Project documentation
```

---

## 👥 Acknowledgements

- Built for the **National Fraud Prevention Challenge (NFPC)** hosted by **Reserve Bank Innovation Hub (RBIH)** in association with **IIT Delhi TRYST**.
- Upstream solution architecture and research foundation by Team **dmj.one**.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
