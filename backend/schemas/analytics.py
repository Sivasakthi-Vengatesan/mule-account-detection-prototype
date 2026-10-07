from typing import Dict, List, Optional
from pydantic import BaseModel

class AnalyticsOverview(BaseModel):
    total_accounts: int
    critical_accounts: int
    high_risk_accounts: int
    medium_risk_accounts: int
    low_risk_accounts: int
    average_probability: float
    average_risk_score: float
    total_transaction_volume: float
    total_transactions_analyzed: int

class RiskDistribution(BaseModel):
    LOW: int
    MEDIUM: int
    HIGH: int
    CRITICAL: int

class ArchetypeDistribution(BaseModel):
    pass_through: int
    structuring: int
    dormant_burst: int
    network_hub: int
    standard_retail: int

class AnalyticsFull(BaseModel):
    overview: AnalyticsOverview
    risk_distribution: RiskDistribution
    archetype_distribution: ArchetypeDistribution
    probability_histogram: Dict[str, int]
