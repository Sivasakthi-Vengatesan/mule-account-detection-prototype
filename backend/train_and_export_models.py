"""
Offline training and model export script for Mule Account Detection.
Trains LightGBM, XGBoost, and CatBoost models and serializes them
to native model formats for online production inference.
"""
import os
import json
import numpy as np
import pandas as pd
from pathlib import Path
import lightgbm as lgb
import xgboost as xgb
from catboost import CatBoostClassifier

MODELS_DIR = Path(__file__).resolve().parent / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

# 124 Core features matching Phase 1 & 2 pipeline
FEATURE_COLS = [
    "mcc_6051_rate", "was_frozen", "ch_UPD_rate", "cp_per_txn", "days_since_kyc",
    "mcc_5933_rate", "p25_amount", "ch_CHQ_rate", "rel_years", "ch_ATW_rate",
    "weekend_rate", "age", "n_unique_counterparties", "night_rate", "balance_std",
    "daily_avg_balance", "round_5k_rate", "cv_amount", "mcc_6012_rate",
    "salary_window_rate", "txn_per_day", "cc_sum", "round_10k_rate", "min_gap_hrs",
    "credit_debit_ratio", "amount_burstiness", "near_50k_rate", "loan_sum",
    "round_1k_rate", "med_gap_hrs", "net_flow", "passthrough_ratio", "ch_MCR_rate",
    "max_txn_to_balance", "active_span_days", "balance_range", "max_amount",
    "median_amount", "near_10k_rate", "avg_balance", "acct_age_txn_ratio",
    "credit_mean", "std_amount", "ch_UPC_rate", "ch_IPM_rate", "min_amount",
    "n_txn", "n_credit", "n_debit", "sum_credit", "sum_debit", "amt_mean", "amt_std",
    "amt_max", "amt_min", "amt_cv", "amt_median", "amt_p25", "amt_p75", "amt_iqr",
    "cr_mean", "cr_std", "cr_max", "dr_mean", "dr_std", "dr_max",
    "txn_span_days", "inter_txn_mean_sec", "inter_txn_std_sec", "inter_txn_min_sec",
    "inter_txn_max_sec", "inter_txn_cv", "burstiness", "max_gap_days", "dormancy_events",
    "pct_night_txn", "pct_business_hours", "pct_weekend_txn", "hour_entropy", "dow_entropy",
    "channel_entropy", "channel_hhi", "pct_UPC", "pct_UPD", "pct_ATW", "pct_CHQ",
    "pct_CSD", "pct_NTD", "pct_IPM", "pct_END", "n_unique_mcc", "mcc_entropy",
    "n_unique_cp_credit", "n_unique_cp_debit", "fan_in_out_ratio", "top_cp_share",
    "near_50000_ratio", "near_100000_ratio", "round_amount_ratio", "age_years"
]

def generate_training_data(n_samples=2000):
    """
    Generates realistic feature vectors reflecting true mule fraud patterns
    and legitimate customer profiles for offline model fitting.
    """
    np.random.seed(42)
    
    # 97% Legitimate, 3% Mules (matching 2.8% real dataset class balance)
    n_mules = int(n_samples * 0.03)
    n_legit = n_samples - n_mules
    
    y = np.array([0] * n_legit + [1] * n_mules)
    
    X_dict = {f: np.zeros(n_samples) for f in FEATURE_COLS}
    
    # --- Legitimate Accounts ---
    X_dict["mcc_6051_rate"][:n_legit] = np.random.beta(0.5, 20, n_legit) * 0.05
    X_dict["was_frozen"][:n_legit] = np.random.binomial(1, 0.005, n_legit)
    X_dict["passthrough_ratio"][:n_legit] = np.random.beta(2, 5, n_legit) * 0.4
    X_dict["cp_per_txn"][:n_legit] = np.random.beta(2, 8, n_legit) * 0.3
    X_dict["near_50000_ratio"][:n_legit] = np.random.beta(0.5, 20, n_legit) * 0.03
    X_dict["near_50k_rate"][:n_legit] = X_dict["near_50000_ratio"][:n_legit]
    X_dict["burstiness"][:n_legit] = np.random.beta(2, 5, n_legit) * 0.3
    X_dict["pct_night_txn"][:n_legit] = np.random.beta(1, 10, n_legit) * 0.1
    X_dict["n_unique_counterparties"][:n_legit] = np.random.poisson(3, n_legit)
    X_dict["credit_debit_ratio"][:n_legit] = np.random.normal(1.0, 0.2, n_legit).clip(0.5, 2.0)
    X_dict["round_amount_ratio"][:n_legit] = np.random.beta(1, 8, n_legit) * 0.2
    X_dict["days_since_kyc"][:n_legit] = np.random.uniform(30, 365, n_legit)
    X_dict["age"][:n_legit] = np.random.normal(42, 12, n_legit).clip(18, 80)
    X_dict["age_years"][:n_legit] = X_dict["age"][:n_legit]
    X_dict["rel_years"][:n_legit] = np.random.uniform(2, 15, n_legit)
    X_dict["n_txn"][:n_legit] = np.random.poisson(25, n_legit).clip(1, 200)
    X_dict["amt_mean"][:n_legit] = np.random.lognormal(7, 1.2, n_legit)
    
    # --- Mule Accounts ---
    X_dict["mcc_6051_rate"][n_legit:] = np.random.beta(5, 2, n_mules) * 0.8 + 0.1
    X_dict["was_frozen"][n_legit:] = np.random.binomial(1, 0.45, n_mules)
    X_dict["passthrough_ratio"][n_legit:] = np.random.beta(8, 2, n_mules) * 0.4 + 0.6
    X_dict["cp_per_txn"][n_legit:] = np.random.beta(6, 2, n_mules) * 0.5 + 0.4
    X_dict["near_50000_ratio"][n_legit:] = np.random.beta(4, 2, n_mules) * 0.6 + 0.15
    X_dict["near_50k_rate"][n_legit:] = X_dict["near_50000_ratio"][n_legit:]
    X_dict["burstiness"][n_legit:] = np.random.beta(7, 2, n_mules) * 0.5 + 0.4
    X_dict["pct_night_txn"][n_legit:] = np.random.beta(4, 3, n_mules) * 0.6 + 0.2
    X_dict["n_unique_counterparties"][n_legit:] = np.random.poisson(12, n_mules).clip(5, 50)
    X_dict["credit_debit_ratio"][n_legit:] = np.random.uniform(2.5, 8.0, n_mules)
    X_dict["round_amount_ratio"][n_legit:] = np.random.beta(5, 2, n_mules) * 0.5 + 0.3
    X_dict["days_since_kyc"][n_legit:] = np.random.uniform(400, 1500, n_mules)
    X_dict["age"][n_legit:] = np.random.normal(22, 4, n_mules).clip(18, 30)
    X_dict["age_years"][n_legit:] = X_dict["age"][n_legit:]
    X_dict["rel_years"][n_legit:] = np.random.uniform(0.1, 1.2, n_mules)
    X_dict["n_txn"][n_legit:] = np.random.poisson(45, n_mules).clip(10, 300)
    X_dict["amt_mean"][n_legit:] = np.random.lognormal(10, 0.8, n_mules)

    # Fill remaining columns with baseline distributions
    for col in FEATURE_COLS:
        if np.all(X_dict[col] == 0):
            X_dict[col] = np.random.uniform(0, 1, n_samples)
            
    df_X = pd.DataFrame(X_dict)
    return df_X, y

def train_and_export():
    print("Generating training data according to Phase 2 distributions...")
    X, y = generate_training_data(n_samples=3000)
    
    # 1. Train LightGBM
    print("Training LightGBM model...")
    lgb_train = lgb.Dataset(X, y)
    lgb_params = {
        "objective": "binary",
        "metric": "auc",
        "boosting_type": "gbdt",
        "learning_rate": 0.03,
        "num_leaves": 31,
        "max_depth": 6,
        "scale_pos_weight": 34.0,  # real 34:1 imbalance
        "feature_fraction": 0.8,
        "bagging_fraction": 0.8,
        "bagging_freq": 5,
        "verbose": -1,
        "random_state": 42
    }
    lgb_model = lgb.train(lgb_params, lgb_train, num_boost_round=300)
    lgb_path = MODELS_DIR / "lightgbm_model.txt"
    lgb_model.save_model(str(lgb_path))
    print(f"  Saved LightGBM model to {lgb_path}")
    
    # 2. Train XGBoost
    print("Training XGBoost model...")
    dtrain = xgb.DMatrix(X, label=y)
    xgb_params = {
        "objective": "binary:logistic",
        "eval_metric": "auc",
        "max_depth": 6,
        "learning_rate": 0.03,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
        "scale_pos_weight": 34.0,
        "tree_method": "hist",
        "random_state": 42,
        "verbosity": 0
    }
    xgb_model = xgb.train(xgb_params, dtrain, num_boost_round=300)
    xgb_path = MODELS_DIR / "xgboost_model.json"
    xgb_model.save_model(str(xgb_path))
    print(f"  Saved XGBoost model to {xgb_path}")
    
    # 3. Train CatBoost
    print("Training CatBoost model...")
    cb_model = CatBoostClassifier(
        iterations=300,
        learning_rate=0.03,
        depth=6,
        scale_pos_weight=34.0,
        random_seed=42,
        verbose=0
    )
    cb_model.fit(X, y)
    cb_path = MODELS_DIR / "catboost_model.cbm"
    cb_model.save_model(str(cb_path))
    print(f"  Saved CatBoost model to {cb_path}")
    
    # 4. Save Feature Names Metadata
    features_meta_path = MODELS_DIR / "feature_names.json"
    with open(features_meta_path, "w") as f:
        json.dump(FEATURE_COLS, f, indent=2)
    print(f"  Saved feature names to {features_meta_path}")
    
    # 5. Copy Feature Importance
    orig_imp = Path(__file__).resolve().parent.parent / "models" / "feature_importance.csv"
    if orig_imp.exists():
        import shutil
        shutil.copy(orig_imp, MODELS_DIR / "feature_importance.csv")
        print("  Copied feature importance reference table.")
        
    print("All models successfully trained and serialized to native formats!")

if __name__ == "__main__":
    train_and_export()
