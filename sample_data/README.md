# Mule Account Detection — Local Mock Datasets for Testing

All test files are saved locally in this directory:
`C:\Users\sakth\.gemini\antigravity-ide\scratch\mule-account-detection\sample_data\`

---

## 📁 Available Local Test Files

| File Name | Size | Target Archetype / Scenario | Description |
| :--- | :--- | :--- | :--- |
| [`mixed_batch_test.csv`](file:///C:/Users/sakth/.gemini/antigravity-ide/scratch/mule-account-detection/sample_data/mixed_batch_test.csv) | 2.8 KB | **Multi-Account Mixed Batch** | 5 distinct accounts containing Pass-Through, Smurfing, Burst, Hub, and Legitimate Retail transactions. |
| [`mule_passthrough_test.csv`](file:///C:/Users/sakth/.gemini/antigravity-ide/scratch/mule-account-detection/sample_data/mule_passthrough_test.csv) | 1.0 KB | **Pass-Through Mule** | High velocity wire transfers (MCC 6051) where incoming funds are drained within 3 minutes. |
| [`mule_smurfing_structuring_test.csv`](file:///C:/Users/sakth/.gemini/antigravity-ide/scratch/mule-account-detection/sample_data/mule_smurfing_structuring_test.csv) | 1.2 KB | **Structuring / Smurfing** | Rapid repetitive credits of ₹48,500–₹49,900 evading ₹50,000 threshold followed by a ₹390k debit. |
| [`mule_dormant_burst_test.csv`](file:///C:/Users/sakth/.gemini/antigravity-ide/scratch/mule-account-detection/sample_data/mule_dormant_burst_test.csv) | 1.0 KB | **Dormant-Burst Account** | Long period of total inactivity followed by sudden high-value night transfers and ATM pulls. |
| [`sample_transactions.csv`](file:///C:/Users/sakth/.gemini/antigravity-ide/scratch/mule-account-detection/sample_data/sample_transactions.csv) | 6.1 KB | **Full Benchmark Dataset** | 59 transactions across 6 accounts used for baseline seeding and model validation. |

---

## 🚀 How to Test Locally

### 1. In the Web UI:
1. Open **[http://localhost:3005/?tab=upload](http://localhost:3005/?tab=upload)** in your browser.
2. Click any of the **1-Click Preset Cards** (e.g. *Mixed Batch*, *Pass-Through*, *Smurfing*, *Dormant-Burst*).
3. Or drag and drop any `.csv` from this directory into the sunken upload zone.

### 2. Via Terminal / PowerShell:
```powershell
# Test batch inference against FastAPI backend
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/predict/batch" `
  -Method Post `
  -InFile "C:\Users\sakth\.gemini\antigravity-ide\scratch\mule-account-detection\sample_data\mixed_batch_test.csv" `
  -ContentType "text/csv"
```
