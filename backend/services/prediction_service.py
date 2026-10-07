import os
import json
import logging
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional
import numpy as np
import pandas as pd
from scipy.stats import rankdata
import lightgbm as lgb
import xgboost as xgb
from catboost import CatBoostClassifier
import shap

from core.config import settings
from schemas.prediction import SinglePredictionResponse, ModelScores, RiskFactorItem
from services.risk_service import calculate_risk_level, get_risk_score
from services.archetype_service import classify_mule_archetype
from services.explanation_service import generate_risk_explanations, generate_investigation_summary

logger = logging.getLogger("mule_detector.prediction_service")

class ModelManager:
    _instance = None

    def __init__(self):
        self.models_dir = settings.MODELS_DIR
        self.feature_names: List[str] = []
        self.lgb_model: Optional[lgb.Booster] = None
        self.xgb_model: Optional[xgb.Booster] = None
        self.cb_model: Optional[CatBoostClassifier] = None
        self.shap_explainer: Optional[shap.TreeExplainer] = None
        self.is_loaded = False
        self.load_models()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = ModelManager()
        return cls._instance

    def load_models(self):
        """Loads genuine native LightGBM, XGBoost, and CatBoost models."""
        try:
            # 1. Load feature names
            fn_path = self.models_dir / "feature_names.json"
            if fn_path.exists():
                with open(fn_path, "r") as f:
                    self.feature_names = json.load(f)
            else:
                logger.warning("feature_names.json not found at %s", fn_path)
                return

            # 2. Load LightGBM
            lgb_path = self.models_dir / "lightgbm_model.txt"
            if lgb_path.exists():
                self.lgb_model = lgb.Booster(model_file=str(lgb_path))
                logger.info("Loaded LightGBM model from %s", lgb_path)
            else:
                logger.warning("LightGBM model not found at %s", lgb_path)

            # 3. Load XGBoost
            xgb_path = self.models_dir / "xgboost_model.json"
            if xgb_path.exists():
                self.xgb_model = xgb.Booster()
                self.xgb_model.load_model(str(xgb_path))
                logger.info("Loaded XGBoost model from %s", xgb_path)
            else:
                logger.warning("XGBoost model not found at %s", xgb_path)

            # 4. Load CatBoost
            cb_path = self.models_dir / "catboost_model.cbm"
            if cb_path.exists():
                self.cb_model = CatBoostClassifier()
                self.cb_model.load_model(str(cb_path))
                logger.info("Loaded CatBoost model from %s", cb_path)
            else:
                logger.warning("CatBoost model not found at %s", cb_path)

            # 5. Initialize SHAP Explainer
            if self.lgb_model is not None:
                try:
                    self.shap_explainer = shap.TreeExplainer(self.lgb_model)
                    logger.info("Initialized SHAP TreeExplainer on LightGBM booster")
                except Exception as e:
                    logger.warning("Failed to initialize SHAP TreeExplainer: %s", e)

            self.is_loaded = (self.lgb_model is not None and self.xgb_model is not None and self.cb_model is not None)
            logger.info("ModelManager loaded status: %s", self.is_loaded)
        except Exception as e:
            logger.error("Error loading model artifacts: %s", e)
            self.is_loaded = False

    def predict_features(
        self,
        features_df: pd.DataFrame,
        suspicious_windows: Optional[Dict[str, Tuple[Optional[str], Optional[str]]]] = None
    ) -> List[SinglePredictionResponse]:
        """
        Runs true multi-model inference (LightGBM, XGBoost, CatBoost) + rank-weighted ensemble
        + SHAP explainability on the input feature dataframe.
        """
        if not self.is_loaded:
            self.load_models()

        if not self.is_loaded:
            raise RuntimeError("ML model artifacts are not loaded. Please ensure models are trained and present in backend/models.")

        n_samples = len(features_df)
        account_ids = list(features_df.index)

        # Align features to model feature specification
        X_aligned = pd.DataFrame(index=features_df.index)
        for col in self.feature_names:
            if col in features_df.columns:
                X_aligned[col] = pd.to_numeric(features_df[col], errors="coerce").fillna(0.0)
            else:
                X_aligned[col] = 0.0

        X_mat = X_aligned.values.astype(np.float32)

        # 1. LightGBM Inference
        p_lgb = self.lgb_model.predict(X_mat)
        if p_lgb.ndim > 1:
            p_lgb = p_lgb[:, 1] if p_lgb.shape[1] > 1 else p_lgb.ravel()

        # 2. XGBoost Inference
        dmatrix = xgb.DMatrix(X_mat, feature_names=self.feature_names)
        p_xgb = self.xgb_model.predict(dmatrix)

        # 3. CatBoost Inference
        p_cb_raw = self.cb_model.predict_proba(X_mat)
        p_cb = p_cb_raw[:, 1] if p_cb_raw.ndim > 1 else p_cb_raw

        # 4. Ensemble (Weighted Rank Averaging & Probability Blend)
        if n_samples > 1:
            r_lgb = rankdata(p_lgb) / n_samples
            r_xgb = rankdata(p_xgb) / n_samples
            r_cb = rankdata(p_cb) / n_samples
            r_avg = (r_lgb + r_xgb + r_cb) / 3.0
            # Blend calibrated probability with rank ordering
            p_ensemble = 0.5 * ((p_lgb + p_xgb + p_cb) / 3.0) + 0.5 * r_avg
        else:
            p_ensemble = (p_lgb + p_xgb + p_cb) / 3.0

        p_ensemble = np.clip(p_ensemble, 0.0001, 0.9999)

        # 5. Compute SHAP Explanations
        shap_values_matrix = None
        if self.shap_explainer is not None:
            try:
                shap_vals = self.shap_explainer.shap_values(X_aligned)
                if isinstance(shap_vals, list):
                    shap_values_matrix = shap_vals[1]
                else:
                    shap_values_matrix = shap_vals
            except Exception as e:
                logger.warning("SHAP calculation fallback: %s", e)

        results = []
        for i, account_id in enumerate(account_ids):
            mule_prob = float(p_ensemble[i])
            risk_score = get_risk_score(mule_prob)
            risk_level = calculate_risk_level(mule_prob)
            
            raw_feat_dict = features_df.loc[account_id].to_dict()
            archetype = classify_mule_archetype(raw_feat_dict)
            
            # Extract account-level SHAP map if available
            shap_dict = {}
            if shap_values_matrix is not None and i < len(shap_values_matrix):
                for j, fname in enumerate(self.feature_names):
                    shap_dict[fname] = float(shap_values_matrix[i][j])
                    
            risk_factors = generate_risk_explanations(raw_feat_dict, shap_dict, top_k=5)
            top_reasons = [rf.human_explanation for rf in risk_factors if rf.human_explanation]
            summary = generate_investigation_summary(account_id, risk_level, mule_prob, archetype, risk_factors)
            
            s_start, s_end = None, None
            if suspicious_windows and account_id in suspicious_windows:
                s_start, s_end = suspicious_windows[account_id]

            results.append(SinglePredictionResponse(
                account_id=str(account_id),
                mule_probability=round(mule_prob, 4),
                risk_score=risk_score,
                risk_level=risk_level,
                model_scores=ModelScores(
                    lightgbm=round(float(p_lgb[i]), 4),
                    xgboost=round(float(p_xgb[i]), 4),
                    catboost=round(float(p_cb[i]), 4),
                    ensemble=round(mule_prob, 4)
                ),
                top_reasons=top_reasons[:4],
                risk_factors=risk_factors,
                mule_archetype=archetype,
                investigation_summary=summary,
                suspicious_start=s_start,
                suspicious_end=s_end
            ))

        return results

prediction_manager = ModelManager.get_instance()
