import io
import logging
from typing import Optional
import numpy as np
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session

from core.database import get_db
from core.models import Account, Prediction, RiskFactor, PredictionRun
from schemas.prediction import (
    SinglePredictionRequest, SinglePredictionResponse, BatchPredictionResponse
)
from services.feature_service import (
    validate_transaction_dataframe, extract_features_from_transactions
)
from services.prediction_service import prediction_manager

logger = logging.getLogger("mule_detector.api.predict")
router = APIRouter(tags=["Prediction & Triage"])

@router.post("/predict", response_model=SinglePredictionResponse)
def predict_single(
    request: SinglePredictionRequest,
    db: Session = Depends(get_db)
):
    """
    Generate mule risk probability, model breakdown, and SHAP explainability
    for a single account.
    """
    account_id = request.account_id.strip()

    if request.transactions and len(request.transactions) > 0:
        df = pd.DataFrame(request.transactions)
        if "account_id" not in df.columns:
            df["account_id"] = account_id
            
        is_valid, msg, _ = validate_transaction_dataframe(df)
        if not is_valid:
            raise HTTPException(status_code=400, detail=msg)
            
        features_df, susp_windows, meta_dict = extract_features_from_transactions(df)
        preds = prediction_manager.predict_features(features_df, susp_windows)
        if not preds:
            raise HTTPException(status_code=500, detail="Prediction pipeline returned empty output")
        return preds[0]

    elif request.features and len(request.features) > 0:
        features_df = pd.DataFrame([request.features], index=[account_id])
        preds = prediction_manager.predict_features(features_df)
        if not preds:
            raise HTTPException(status_code=500, detail="Prediction pipeline returned empty output")
        return preds[0]

    else:
        # Check if account already exists in database
        db_acct = db.query(Account).filter(Account.account_id == account_id).first()
        if db_acct and db_acct.predictions:
            latest_pred = db_acct.predictions[-1]
            rf_items = [
                {
                    "feature_name": rf.feature_name,
                    "feature_value": rf.feature_value,
                    "contribution": rf.contribution,
                    "human_explanation": rf.human_explanation
                }
                for rf in latest_pred.risk_factors
            ]
            top_reasons = [rf["human_explanation"] for rf in rf_items if rf.get("human_explanation")]
            return SinglePredictionResponse(
                account_id=db_acct.account_id,
                mule_probability=latest_pred.mule_probability,
                risk_score=latest_pred.risk_score,
                risk_level=latest_pred.risk_level,
                model_scores=latest_pred.model_scores,
                top_reasons=top_reasons[:4],
                risk_factors=rf_items,
                mule_archetype=latest_pred.mule_archetype,
                investigation_summary=latest_pred.investigation_summary,
                suspicious_start=latest_pred.suspicious_start,
                suspicious_end=latest_pred.suspicious_end
            )

        raise HTTPException(
            status_code=400,
            detail="Must provide either 'transactions' list, 'features' dictionary, or existing account ID."
        )

@router.post("/predict/batch", response_model=BatchPredictionResponse)
async def predict_batch(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Accept CSV transaction upload -> Validate schema -> Feature Engineering ->
    Multi-model inference (LightGBM, XGBoost, CatBoost) -> Rank Ensemble ->
    Save to Database -> Return ranked high-risk accounts.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are supported.")

    try:
        content = await file.read()
        df_raw = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {str(e)}")

    is_valid, msg, missing = validate_transaction_dataframe(df_raw)
    if not is_valid:
        raise HTTPException(
            status_code=422,
            detail={"message": msg, "missing_columns": missing}
        )

    # 1. Feature Engineering
    features_df, susp_windows, meta_dict = extract_features_from_transactions(df_raw)
    
    # 2. Model Inference & SHAP Explainability
    predictions = prediction_manager.predict_features(features_df, susp_windows)

    # Sort predictions by risk score descending
    predictions.sort(key=lambda p: p.risk_score, reverse=True)

    # 3. Store results in Database
    critical_cnt = sum(1 for p in predictions if p.risk_level == "CRITICAL")
    high_cnt = sum(1 for p in predictions if p.risk_level == "HIGH")
    med_cnt = sum(1 for p in predictions if p.risk_level == "MEDIUM")
    low_cnt = sum(1 for p in predictions if p.risk_level == "LOW")
    avg_risk = round(float(np.mean([p.risk_score for p in predictions])), 2) if predictions else 0.0

    run = PredictionRun(
        filename=file.filename,
        accounts_processed=len(predictions),
        critical_count=critical_cnt,
        high_count=high_cnt,
        medium_count=med_cnt,
        low_count=low_cnt
    )
    db.add(run)
    db.flush()

    for pred in predictions:
        meta = meta_dict.get(pred.account_id, {})
        
        # Check if account exists
        existing_acct = db.query(Account).filter(Account.account_id == pred.account_id).first()
        if existing_acct:
            existing_acct.transaction_count = meta.get("transaction_count", existing_acct.transaction_count)
            existing_acct.total_volume = meta.get("total_volume", existing_acct.total_volume)
            existing_acct.average_amount = meta.get("average_amount", existing_acct.average_amount)
            existing_acct.unique_counterparties = meta.get("unique_counterparties", existing_acct.unique_counterparties)
            existing_acct.transaction_velocity = meta.get("transaction_velocity", existing_acct.transaction_velocity)
            existing_acct.incoming_outgoing_ratio = meta.get("incoming_outgoing_ratio", existing_acct.incoming_outgoing_ratio)
            existing_acct.behavioral_pattern = pred.mule_archetype or existing_acct.behavioral_pattern
        else:
            new_acct = Account(
                account_id=pred.account_id,
                transaction_count=meta.get("transaction_count", 0),
                total_volume=meta.get("total_volume", 0.0),
                average_amount=meta.get("average_amount", 0.0),
                unique_counterparties=meta.get("unique_counterparties", 0),
                transaction_velocity=meta.get("transaction_velocity", 0.0),
                incoming_outgoing_ratio=meta.get("incoming_outgoing_ratio", 1.0),
                behavioral_pattern=pred.mule_archetype or "Standard Retail"
            )
            db.add(new_acct)

        p_record = Prediction(
            account_id=pred.account_id,
            prediction_run_id=run.id,
            mule_probability=pred.mule_probability,
            risk_score=pred.risk_score,
            risk_level=pred.risk_level,
            model_scores={
                "lightgbm": pred.model_scores.lightgbm,
                "xgboost": pred.model_scores.xgboost,
                "catboost": pred.model_scores.catboost,
                "ensemble": pred.model_scores.ensemble
            },
            suspicious_start=pred.suspicious_start,
            suspicious_end=pred.suspicious_end,
            mule_archetype=pred.mule_archetype,
            investigation_summary=pred.investigation_summary,
            model_version="v8-ensemble"
        )
        db.add(p_record)
        db.flush()

        if pred.risk_factors:
            for rf in pred.risk_factors:
                rf_rec = RiskFactor(
                    prediction_id=p_record.id,
                    feature_name=rf.feature_name,
                    feature_value=rf.feature_value,
                    contribution=rf.contribution,
                    human_explanation=rf.human_explanation
                )
                db.add(rf_rec)

    db.commit()

    return BatchPredictionResponse(
        filename=file.filename,
        total_accounts=len(predictions),
        total_transactions=len(df_raw),
        critical_accounts=critical_cnt,
        high_risk_accounts=high_cnt,
        medium_risk_accounts=med_cnt,
        low_risk_accounts=low_cnt,
        average_risk=avg_risk,
        ranked_predictions=predictions
    )
