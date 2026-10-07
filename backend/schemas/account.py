from typing import List, Dict, Optional, Any
from pydantic import BaseModel
from schemas.prediction import ModelScores, RiskFactorItem

class AccountSummary(BaseModel):
    account_id: str
    mule_probability: float
    risk_score: float
    risk_level: str
    transaction_count: int
    total_volume: float
    top_reason: str
    mule_archetype: Optional[str] = None

class AccountDetail(BaseModel):
    account_id: str
    mule_probability: float
    risk_score: float
    risk_level: str
    model_scores: ModelScores
    
    # Behavioral metrics
    transaction_count: int
    total_volume: float
    average_amount: float
    unique_counterparties: int
    transaction_velocity: float
    incoming_outgoing_ratio: float
    
    # Indicators & Archetype
    suspicious_activity_indicators: List[str]
    mule_archetype: str
    top_explanations: List[RiskFactorItem]
    investigation_summary: str
    
    # Timeline
    suspicious_start: Optional[str] = None
    suspicious_end: Optional[str] = None
    transaction_timeline: Optional[List[Dict[str, Any]]] = None

class AccountListResponse(BaseModel):
    total: int
    page: int
    limit: int
    accounts: List[AccountSummary]
