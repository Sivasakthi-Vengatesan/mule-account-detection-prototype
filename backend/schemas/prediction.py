from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class SinglePredictionRequest(BaseModel):
    account_id: str = Field(..., description="Unique Account ID", json_schema_extra={"example": "ACCT_001"})
    transactions: Optional[List[Dict[str, Any]]] = Field(default=None, description="Optional raw transactions for the account")
    features: Optional[Dict[str, float]] = Field(default=None, description="Optional precomputed feature vector")

class RiskFactorItem(BaseModel):
    feature_name: str
    feature_value: float
    contribution: float
    human_explanation: Optional[str] = None

class ModelScores(BaseModel):
    lightgbm: float
    xgboost: float
    catboost: float
    ensemble: Optional[float] = None

class SinglePredictionResponse(BaseModel):
    account_id: str
    mule_probability: float
    risk_score: float
    risk_level: str
    model_scores: ModelScores
    top_reasons: List[str]
    risk_factors: Optional[List[RiskFactorItem]] = None
    mule_archetype: Optional[str] = None
    investigation_summary: Optional[str] = None
    suspicious_start: Optional[str] = None
    suspicious_end: Optional[str] = None

class BatchPredictionResponse(BaseModel):
    filename: str
    total_accounts: int
    total_transactions: int
    critical_accounts: int
    high_risk_accounts: int
    medium_risk_accounts: int
    low_risk_accounts: int
    average_risk: float
    ranked_predictions: List[SinglePredictionResponse]
