import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc

from core.database import get_db
from core.models import Account, Prediction, RiskFactor
from schemas.account import AccountSummary, AccountDetail, AccountListResponse
from schemas.prediction import ModelScores, RiskFactorItem
from services.archetype_service import get_suspicious_indicators

logger = logging.getLogger("mule_detector.api.accounts")
router = APIRouter(prefix="/accounts", tags=["Account Management & Investigation"])

@router.get("", response_model=AccountListResponse)
def list_accounts(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=500, description="Items per page"),
    risk_level: Optional[str] = Query(None, description="Filter by risk tier: CRITICAL, HIGH, MEDIUM, LOW"),
    search: Optional[str] = Query(None, description="Search by account ID substring"),
    sort_by: str = Query("risk_score", description="Field to sort by: risk_score, mule_probability, total_volume, transaction_count"),
    order: str = Query("desc", description="Sort order: asc or desc"),
    db: Session = Depends(get_db)
):
    """
    Retrieve ranked list of monitored accounts with filtering, search, and pagination.
    """
    # Join with latest prediction
    query = db.query(Account, Prediction).join(
        Prediction, Account.account_id == Prediction.account_id
    )

    if risk_level:
        query = query.filter(Prediction.risk_level == risk_level.upper())

    if search:
        query = query.filter(Account.account_id.ilike(f"%{search.strip()}%"))

    # Sorting
    sort_col = getattr(Prediction, sort_by, Prediction.risk_score) if hasattr(Prediction, sort_by) else getattr(Account, sort_by, Prediction.risk_score)
    if order.lower() == "asc":
        query = query.order_by(asc(sort_col))
    else:
        query = query.order_by(desc(sort_col))

    total = query.count()
    offset = (page - 1) * limit
    results = query.offset(offset).limit(limit).all()

    account_summaries = []
    for acct, pred in results:
        top_reason = "Standard behavioral pattern"
        if pred.risk_factors and len(pred.risk_factors) > 0:
            top_reason = pred.risk_factors[0].human_explanation or pred.risk_factors[0].feature_name

        account_summaries.append(AccountSummary(
            account_id=acct.account_id,
            mule_probability=pred.mule_probability,
            risk_score=pred.risk_score,
            risk_level=pred.risk_level,
            transaction_count=acct.transaction_count,
            total_volume=acct.total_volume,
            top_reason=top_reason,
            mule_archetype=pred.mule_archetype or acct.behavioral_pattern
        ))

    return AccountListResponse(
        total=total,
        page=page,
        limit=limit,
        accounts=account_summaries
    )

@router.get("/{account_id}", response_model=AccountDetail)
def get_account_detail(
    account_id: str,
    db: Session = Depends(get_db)
):
    """
    Detailed investigation view for an individual account including
    multi-model score breakdown, SHAP contributions, behavioral metrics, and timeline.
    """
    account_id = account_id.strip()
    acct = db.query(Account).filter(Account.account_id == account_id).first()
    
    if not acct:
        raise HTTPException(status_code=404, detail=f"Account '{account_id}' not found.")

    pred = db.query(Prediction).filter(Prediction.account_id == account_id).order_by(desc(Prediction.created_at)).first()

    if not pred:
        raise HTTPException(status_code=404, detail=f"No prediction record found for account '{account_id}'.")

    # Risk factors
    risk_factors = db.query(RiskFactor).filter(RiskFactor.prediction_id == pred.id).all()
    top_explanations = [
        RiskFactorItem(
            feature_name=rf.feature_name,
            feature_value=rf.feature_value,
            contribution=rf.contribution,
            human_explanation=rf.human_explanation
        )
        for rf in risk_factors
    ]

    # Model scores
    ms_raw = pred.model_scores or {}
    model_scores = ModelScores(
        lightgbm=ms_raw.get("lightgbm", pred.mule_probability),
        xgboost=ms_raw.get("xgboost", pred.mule_probability),
        catboost=ms_raw.get("catboost", pred.mule_probability),
        ensemble=ms_raw.get("ensemble", pred.mule_probability)
    )

    # Reconstruct indicators
    feat_map = {rf.feature_name: rf.feature_value for rf in risk_factors}
    indicators = get_suspicious_indicators(feat_map)

    # Timeline points for visualization
    timeline = []
    if pred.suspicious_start and pred.suspicious_end:
        timeline.append({
            "event": "Suspicious Activity Surge Detected",
            "start": pred.suspicious_start,
            "end": pred.suspicious_end,
            "severity": pred.risk_level
        })
    else:
        timeline.append({
            "event": "Account Monitored Period",
            "start": "2025-01-01",
            "end": "2025-03-31",
            "severity": pred.risk_level
        })

    return AccountDetail(
        account_id=acct.account_id,
        mule_probability=pred.mule_probability,
        risk_score=pred.risk_score,
        risk_level=pred.risk_level,
        model_scores=model_scores,
        transaction_count=acct.transaction_count,
        total_volume=acct.total_volume,
        average_amount=acct.average_amount,
        unique_counterparties=acct.unique_counterparties,
        transaction_velocity=acct.transaction_velocity,
        incoming_outgoing_ratio=acct.incoming_outgoing_ratio,
        suspicious_activity_indicators=indicators,
        mule_archetype=pred.mule_archetype or acct.behavioral_pattern,
        top_explanations=top_explanations,
        investigation_summary=pred.investigation_summary or f"Account {acct.account_id} triaged as {pred.risk_level}.",
        suspicious_start=pred.suspicious_start,
        suspicious_end=pred.suspicious_end,
        transaction_timeline=timeline
    )
