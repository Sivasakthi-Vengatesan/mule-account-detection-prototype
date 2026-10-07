import pytest
from fastapi.testclient import TestClient
from main import app
from core.database import init_db
from utils.data_loader import seed_database_if_empty

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    init_db()
    seed_database_if_empty()

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "mule-account-detection"

def test_analytics_overview(client):
    response = client.get("/api/analytics/overview")
    assert response.status_code == 200
    data = response.json()
    assert "total_accounts" in data
    assert "critical_accounts" in data
    assert "high_risk_accounts" in data
    assert "average_probability" in data

def test_analytics_risk_distribution(client):
    response = client.get("/api/analytics/risk-distribution")
    assert response.status_code == 200
    data = response.json()
    assert "LOW" in data
    assert "MEDIUM" in data
    assert "HIGH" in data
    assert "CRITICAL" in data

def test_list_accounts(client):
    response = client.get("/api/accounts?page=1&limit=10")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "accounts" in data
    assert len(data["accounts"]) > 0
    first_acct = data["accounts"][0]
    assert "account_id" in first_acct
    assert "risk_score" in first_acct
    assert "mule_probability" in first_acct

def test_account_detail(client):
    list_res = client.get("/api/accounts?limit=1")
    assert list_res.status_code == 200
    accounts = list_res.json()["accounts"]
    if accounts:
        target_id = accounts[0]["account_id"]
        res = client.get(f"/api/accounts/{target_id}")
        assert res.status_code == 200
        detail = res.json()
        assert detail["account_id"] == target_id
        assert "model_scores" in detail
        assert "lightgbm" in detail["model_scores"]
        assert "xgboost" in detail["model_scores"]
        assert "catboost" in detail["model_scores"]
        assert "top_explanations" in detail
        assert "investigation_summary" in detail

def test_single_prediction_with_transactions(client):
    payload = {
        "account_id": "TEST_ACCT_999",
        "transactions": [
            {
                "transaction_id": "TXN_TEST_1",
                "transaction_timestamp": "2025-03-01 02:00:00",
                "amount": 95000.0,
                "txn_type": "C",
                "channel": "UPC",
                "mcc_code": 6051,
                "counterparty_id": "CP_999_A"
            },
            {
                "transaction_id": "TXN_TEST_2",
                "transaction_timestamp": "2025-03-01 02:05:00",
                "amount": 94000.0,
                "txn_type": "D",
                "channel": "UPD",
                "mcc_code": 6051,
                "counterparty_id": "CP_999_B"
            }
        ]
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["account_id"] == "TEST_ACCT_999"
    assert "mule_probability" in data
    assert "risk_score" in data
    assert "model_scores" in data
    assert len(data["top_reasons"]) > 0
