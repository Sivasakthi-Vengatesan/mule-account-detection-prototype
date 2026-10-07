# Mule Account Detection Platform 🏦🛡️

[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.13-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)](backend/)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-000000?logo=next.js&logoColor=white)](web/)
[![LightGBM](https://img.shields.io/badge/LightGBM-4.x-brightgreen)](https://lightgbm.readthedocs.io/)
[![XGBoost](https://img.shields.io/badge/XGBoost-3.x-orange)](https://xgboost.readthedocs.io/)
[![CatBoost](https://img.shields.io/badge/CatBoost-1.x-yellow)](https://catboost.ai/)
[![Public AUC-ROC](https://img.shields.io/badge/Public%20AUC--ROC-0.9681-blue)](results/)
[![Private AUC-ROC](https://img.shields.io/badge/Private%20AUC--ROC-0.9558-indigo)](results/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An analyst-facing, end-to-end **Money Mule Account Detection, Risk Triage & Explainability System** developed for the **National Fraud Prevention Challenge (NFPC)** (organized by the **Reserve Bank Innovation Hub (RBIH)** and **IIT Delhi TRYST**).

The platform transforms research-grade gradient-boosted models into an interactive, investigation-ready application following the operational lifecycle:
$$\text{UPLOAD} \longrightarrow \text{DETECT} \longrightarrow \text{RANK} \longrightarrow \text{INVESTIGATE} \longrightarrow \text{EXPLAIN} \longrightarrow \text{VISUALIZE}$$

---

## 🏗️ End-to-End System Architecture

```
Raw CSV / Transactions
        ↓
Data Validation (Schema & Typings)
        ↓
Feature Engineering (Velocity, Pass-Through, Structuring, Entropies, Graph Centrality)
        ↓
┌────────────────────────────────────────────────────────┐
│  Multi-Model Ensemble Engine                           │
│  ├─ LightGBM Booster                                   │
│  ├─ XGBoost Booster                                    │
│  └─ CatBoost Classifier                                │
└────────────────────────────────────────────────────────┘
        ↓
Rank Averaging & Calibrated Probability Blending
        ↓
Mule Risk Probability (0.000 – 1.000) & Risk Score (0 – 100)
        ↓
Risk Classification Engine (LOW / MEDIUM / HIGH / CRITICAL)
        ↓
Explainability & Attribution (SHAP TreeExplainer + Natural Language Mapping)
        ↓
Behavioral Archetype Detection (Pass-Through, Structuring, Dormant-Burst, Network Hub)
        ↓
Persistent Storage (SQLite Local / PostgreSQL Production Abstracted via SQLAlchemy)
        ↓
Interactive Next.js Dashboard & Forensic Case Investigation Interface
```

---

## ⚡ Key Results & Research Metrics

| Evaluation Stage | Metric | Score | Key Components |
| :--- | :---: | :---: | :--- |
| **Phase 2 (Public Leaderboard)** | **AUC-ROC** | **0.968136** | 3-Model Ensemble (LightGBM + XGBoost + CatBoost), 208 features |
| **Phase 2 (Private Leaderboard)** | **AUC-ROC** | **0.955815** | 3-seed × 5-fold CV, rank averaging, confident learning |
| **Phase 1 (Out-of-Fold)** | **AUC-ROC** | **0.985100** | 125 features across 13 behavioral categories |

---

## 🚀 Quickstart & Development Setup

### Prerequisites
- Python 3.11, 3.12, or 3.13
- Node.js 20+ and npm / pnpm

### 1. Backend Setup (FastAPI)
```bash
cd backend
pip install -r requirements.txt

# Run test suite
pytest -v

# Start FastAPI development server
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
Backend API will be accessible at `http://127.0.0.1:8000` (Interactive Swagger Docs at `http://127.0.0.1:8000/docs`).

### 2. Frontend Setup (Next.js)
```bash
cd web
npm install # or pnpm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 📡 API Documentation & Endpoints

### 1. System Health Check
`GET /health`
```json
{
  "status": "ok",
  "service": "mule-account-detection",
  "version": "1.0.0"
}
```

### 2. Single Account Prediction & Triage
`POST /api/predict`

**Request:**
```json
{
  "account_id": "ACCT_MULE_001",
  "transactions": [
    {
      "transaction_id": "TXN_100001",
      "transaction_timestamp": "2025-03-01 02:15:20",
      "amount": 95000.0,
      "txn_type": "C",
      "channel": "UPC",
      "mcc_code": 6051,
      "counterparty_id": "CP_81920"
    },
    {
      "transaction_id": "TXN_100002",
      "transaction_timestamp": "2025-03-01 02:18:45",
      "amount": 45000.0,
      "txn_type": "D",
      "channel": "UPD",
      "mcc_code": 6051,
      "counterparty_id": "CP_10492"
    }
  ]
}
```

**Response:**
```json
{
  "account_id": "ACCT_MULE_001",
  "mule_probability": 0.8821,
  "risk_score": 88.2,
  "risk_level": "CRITICAL",
  "model_scores": {
    "lightgbm": 0.6963,
    "xgboost": 0.9716,
    "catboost": 0.7673,
    "ensemble": 0.8821
  },
  "top_reasons": [
    "Significant volume executed during anomalous overnight hours (12 AM - 6 AM)",
    "Unusually high counterparty dispersion per transaction",
    "Rapid fund depletion shortly after incoming credits (pass-through)",
    "Transactions structured just below the ₹50,000 regulatory reporting threshold"
  ],
  "mule_archetype": "Structuring",
  "investigation_summary": "Account ACCT_MULE_001 exhibits elevated mule risk (CRITICAL triage level, 88.2% probability)..."
}
```

### 3. Batch CSV Dataset Upload
`POST /api/predict/batch`
Accepts multipart form-data CSV file upload. Parses granular transactions, runs the full feature pipeline, executes offline-trained tree models, and returns ranked high-risk accounts.

### 4. Account Directory & Filtering
`GET /api/accounts?page=1&limit=25&risk_level=CRITICAL&sort_by=risk_score&order=desc`

### 5. Detailed Account Investigation
`GET /api/accounts/{account_id}`
Returns complete forensic case file: multi-model score breakdown, SHAP attribution bars, telemetry metrics (velocity, volume, in/out ratio), behavioral archetype, and suspicious activity window.

### 6. Analytics Overview & Charts
- `GET /api/analytics/overview`
- `GET /api/analytics/risk-distribution`
- `GET /api/analytics/archetypes`
- `GET /api/analytics/full`

---

## 📁 Repository Structure

```
mule-account-detection/
├── backend/
│   ├── main.py                     # FastAPI application & lifecycle bindings
│   ├── requirements.txt            # Backend dependencies
│   ├── .env.example                # Environment configuration template
│   ├── train_and_export_models.py  # Model serialization pipeline
│   ├── api/
│   │   ├── predict.py              # POST /predict and POST /predict/batch
│   │   ├── accounts.py             # GET /accounts and GET /accounts/{id}
│   │   └── analytics.py            # GET /analytics/overview, risk distribution
│   ├── core/
│   │   ├── config.py               # Pydantic Settings & thresholds
│   │   ├── database.py             # SQLAlchemy abstracted engine
│   │   └── models.py               # Database schemas (Account, Prediction, RiskFactor)
│   ├── services/
│   │   ├── feature_service.py      # Real transaction feature engineering
│   │   ├── prediction_service.py   # Multi-model inference & SHAP TreeExplainer
│   │   ├── risk_service.py         # Risk scoring (0-100) & tier classification
│   │   ├── explanation_service.py  # SHAP attribution & natural language mapping
│   │   └── archetype_service.py    # Transparent behavioral pattern detection
│   ├── schemas/                    # Pydantic request/response contracts
│   ├── models/                     # Native serialized models (.txt, .json, .cbm)
│   └── tests/                      # Automated test suite
├── web/                            # Next.js 16 + React 19 Frontend
│   ├── app/
│   │   ├── page.tsx                # Interactive multi-tab application
│   │   ├── accounts/[id]/page.tsx  # Direct URL account investigation
│   │   ├── pitch/                  # Slide deck showcase
│   │   └── lightbox.tsx            # Plot gallery viewer
│   ├── components/
│   │   ├── Navbar.tsx              # Reactive header with live status
│   │   ├── Dashboard.tsx           # KPI metrics, SVG charts, triage table
│   │   ├── AccountsList.tsx        # Searchable, filterable directory
│   │   ├── AccountInvestigation.tsx # Deep-dive case file with SHAP bars
│   │   ├── CsvUpload.tsx           # Drag-and-drop batch analyzer
│   │   └── ResearchSection.tsx     # Scientific competition findings
│   └── public/plots/               # 25 high-resolution research figures
├── sample_data/
│   ├── sample_transactions.csv     # Granular banking sample dataset
│   └── README.md                   # Schema & archetype documentation
└── round-2/                        # Competition deliverables & pipeline scripts
```

---

## ⚖️ Important Regulatory & Compliance Disclaimer

> [!IMPORTANT]
> **Triage Indicator Notice:**
> The outputs of this system (including Mule Risk Probabilities, Risk Scores, and Behavioral Archetypes) are **probabilistic risk-triage indicators** intended to assist AML compliance officers and fraud analysts in prioritizing accounts for Enhanced Due Diligence (EDD). They do not constitute a definitive legal finding of fraudulent activity or criminal culpability. Production deployment in a live banking environment requires human-in-the-loop review, audit logging, model monitoring for concept drift, and formal regulatory compliance validation.

---

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
