import logging
from typing import Dict
import numpy as np
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from core.database import get_db
from core.models import Account, Prediction
from schemas.analytics import (
    AnalyticsOverview, RiskDistribution, ArchetypeDistribution, AnalyticsFull
)

logger = logging.getLogger("mule_detector.api.analytics")
router = APIRouter(prefix="/analytics", tags=["Analytics & Reporting"])

@router.get("/overview", response_model=AnalyticsOverview)
def get_analytics_overview(db: Session = Depends(get_db)):
    """
    Returns aggregate summary statistics across all triaged accounts.
    """
    total_accounts = db.query(Account).count()
    
    if total_accounts == 0:
        return AnalyticsOverview(
            total_accounts=0,
            critical_accounts=0,
            high_risk_accounts=0,
            medium_risk_accounts=0,
            low_risk_accounts=0,
            average_probability=0.0,
            average_risk_score=0.0,
            total_transaction_volume=0.0,
            total_transactions_analyzed=0
        )

    # Risk counts
    critical_cnt = db.query(Prediction).filter(Prediction.risk_level == "CRITICAL").count()
    high_cnt = db.query(Prediction).filter(Prediction.risk_level == "HIGH").count()
    med_cnt = db.query(Prediction).filter(Prediction.risk_level == "MEDIUM").count()
    low_cnt = db.query(Prediction).filter(Prediction.risk_level == "LOW").count()

    # Aggregate volumes and averages
    avg_prob = db.query(func.avg(Prediction.mule_probability)).scalar() or 0.0
    avg_score = db.query(func.avg(Prediction.risk_score)).scalar() or 0.0
    tot_vol = db.query(func.sum(Account.total_volume)).scalar() or 0.0
    tot_txns = db.query(func.sum(Account.transaction_count)).scalar() or 0

    return AnalyticsOverview(
        total_accounts=total_accounts,
        critical_accounts=critical_cnt,
        high_risk_accounts=high_cnt,
        medium_risk_accounts=med_cnt,
        low_risk_accounts=low_cnt,
        average_probability=round(float(avg_prob), 4),
        average_risk_score=round(float(avg_score), 1),
        total_transaction_volume=round(float(tot_vol), 2),
        total_transactions_analyzed=int(tot_txns)
    )

@router.get("/risk-distribution", response_model=RiskDistribution)
def get_risk_distribution(db: Session = Depends(get_db)):
    """
    Returns breakdown of counts for LOW, MEDIUM, HIGH, and CRITICAL risk levels.
    """
    return RiskDistribution(
        LOW=db.query(Prediction).filter(Prediction.risk_level == "LOW").count(),
        MEDIUM=db.query(Prediction).filter(Prediction.risk_level == "MEDIUM").count(),
        HIGH=db.query(Prediction).filter(Prediction.risk_level == "HIGH").count(),
        CRITICAL=db.query(Prediction).filter(Prediction.risk_level == "CRITICAL").count()
    )

@router.get("/archetypes", response_model=ArchetypeDistribution)
def get_archetype_distribution(db: Session = Depends(get_db)):
    """
    Returns distribution count across mule behavioral archetypes.
    """
    counts = {
        "pass_through": db.query(Prediction).filter(Prediction.mule_archetype.ilike("%Pass-Through%")).count(),
        "structuring": db.query(Prediction).filter(Prediction.mule_archetype.ilike("%Structuring%")).count(),
        "dormant_burst": db.query(Prediction).filter(Prediction.mule_archetype.ilike("%Dormant-Burst%")).count(),
        "network_hub": db.query(Prediction).filter(Prediction.mule_archetype.ilike("%Network Hub%")).count(),
        "standard_retail": db.query(Prediction).filter(Prediction.mule_archetype.ilike("%Standard Retail%")).count()
    }
    return ArchetypeDistribution(**counts)

@router.get("/full", response_model=AnalyticsFull)
def get_full_analytics(db: Session = Depends(get_db)):
    """
    Composite endpoint delivering complete analytics data for dashboard charts.
    """
    overview = get_analytics_overview(db)
    risk_dist = get_risk_distribution(db)
    arch_dist = get_archetype_distribution(db)

    # Probability Histogram (10 bins)
    preds = db.query(Prediction.mule_probability).all()
    probs = [p[0] for p in preds] if preds else []
    
    hist_dict = {}
    if probs:
        bins = np.linspace(0.0, 1.0, 11)
        counts, _ = np.histogram(probs, bins=bins)
        for i in range(10):
            k = f"{int(bins[i]*100)}-{int(bins[i+1]*100)}%"
            hist_dict[k] = int(counts[i])
    else:
        hist_dict = {f"{i*10}-{(i+1)*10}%": 0 for i in range(10)}

    return AnalyticsFull(
        overview=overview,
        risk_distribution=risk_dist,
        archetype_distribution=arch_dist,
        probability_histogram=hist_dict
    )
