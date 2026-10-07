from typing import Dict, List, Any, Optional
from schemas.prediction import RiskFactorItem

FEATURE_EXPLANATIONS = {
    "mcc_6051_rate": "Disproportionate frequency of high-risk crypto/wire transfer operations",
    "was_frozen": "Historical regulatory freeze or suspicious activity lock on the account",
    "ch_UPD_rate": "High concentration of immediate UPI debit outflows",
    "cp_per_txn": "Unusually high counterparty dispersion per transaction",
    "days_since_kyc": "Extended elapsed time since last KYC verification update",
    "mcc_5933_rate": "Elevated transactions involving pawn shops or high-risk second-hand merchants",
    "p25_amount": "Abnormally high baseline floor for minimum transaction amounts",
    "ch_CHQ_rate": "Elevated clearing activity via cheque transactions",
    "rel_years": "Short account tenure / recently established banking relationship",
    "ch_ATW_rate": "Rapid cash liquidation through ATM cash withdrawals",
    "weekend_rate": "Unusual concentration of transaction volume during weekend non-business hours",
    "pct_weekend_txn": "Unusual concentration of transaction volume during weekend non-business hours",
    "age": "High risk demographic / young account holder profile vulnerable to mule recruitment",
    "age_years": "High risk demographic / young account holder profile vulnerable to mule recruitment",
    "n_unique_counterparties": "Extensive counterparty network with high node connectivity",
    "night_rate": "Significant volume executed during anomalous overnight hours (12 AM - 6 AM)",
    "pct_night_txn": "Significant volume executed during anomalous overnight hours (12 AM - 6 AM)",
    "balance_std": "Extreme balance swings with high volatility",
    "daily_avg_balance": "Low maintained average daily balance relative to transaction velocity",
    "round_5k_rate": "Repeated round-denomination transactions (multiples of ₹5,000)",
    "round_10k_rate": "Repeated round-denomination transactions (multiples of ₹10,000)",
    "round_amount_ratio": "High proportion of round-denomination transaction values",
    "cv_amount": "High variance in transaction sizes indicating erratic throughput",
    "amt_cv": "High coefficient of variation in transaction amounts",
    "mcc_6012_rate": "Elevated transactions involving financial institutions / securities",
    "salary_window_rate": "Activity deviating from standard salaried payroll cycles",
    "txn_per_day": "High transaction throughput velocity per active day",
    "cc_sum": "Lack of diversified credit products indicating secondary utility account",
    "min_gap_hrs": "Minimal time gap between consecutive inbound and outbound transfers",
    "inter_txn_min_sec": "Immediate fund movement occurring within seconds of credit receipt",
    "credit_debit_ratio": "Asymmetrical credit-to-debit ratio indicating funneling behavior",
    "amount_burstiness": "Irregular transaction bursts following long periods of dormancy",
    "burstiness": "Extreme burstiness in inter-transaction arrival times",
    "near_50k_rate": "Transactions structured just below the ₹50,000 regulatory reporting threshold",
    "near_50000_ratio": "Transactions structured just below the ₹50,000 regulatory reporting threshold",
    "near_100000_ratio": "Transactions structured just below the ₹100,000 AML reporting threshold",
    "loan_sum": "Absence of formal lending footprint",
    "net_flow": "Nearly zero net flow despite substantial gross turnover",
    "passthrough_ratio": "Rapid fund depletion shortly after incoming credits (pass-through)",
    "max_txn_to_balance": "Individual transaction amount dramatically exceeds typical ledger balance",
    "fan_in_out_ratio": "High ratio of inbound counterparties to outbound beneficiaries",
}

def generate_risk_explanations(
    feature_dict: Dict[str, float],
    shap_contributions: Optional[Dict[str, float]] = None,
    top_k: int = 5
) -> List[RiskFactorItem]:
    """
    Produce domain-specific risk factor explanations for an account based on
    either real SHAP feature contributions or ranked feature importances.
    """
    items = []
    
    if shap_contributions:
        sorted_feats = sorted(shap_contributions.items(), key=lambda x: abs(x[1]), reverse=True)
        for fname, contrib in sorted_feats[:top_k]:
            val = feature_dict.get(fname, 0.0)
            explanation = FEATURE_EXPLANATIONS.get(
                fname,
                f"Feature '{fname.replace('_', ' ').title()}' contributes significantly ({val:.2f}) to the risk score"
            )
            items.append(RiskFactorItem(
                feature_name=fname,
                feature_value=round(val, 4),
                contribution=round(contrib, 4),
                human_explanation=explanation
            ))
    else:
        # Fallback using known important features and deviations
        candidate_feats = [
            "mcc_6051_rate", "was_frozen", "passthrough_ratio", "cp_per_txn",
            "near_50000_ratio", "burstiness", "inter_txn_min_sec", "pct_night_txn",
            "n_unique_counterparties", "credit_debit_ratio", "round_amount_ratio", "txn_per_day"
        ]
        
        scored = []
        for f in candidate_feats:
            if f in feature_dict and feature_dict[f] > 0:
                weight = 0.15 if f in ["mcc_6051_rate", "was_frozen", "passthrough_ratio"] else 0.08
                contrib = feature_dict[f] * weight
                scored.append((f, feature_dict[f], contrib))
                
        scored.sort(key=lambda x: abs(x[2]), reverse=True)
        for fname, val, contrib in scored[:top_k]:
            explanation = FEATURE_EXPLANATIONS.get(
                fname,
                f"Elevated activity in {fname.replace('_', ' ')}"
            )
            items.append(RiskFactorItem(
                feature_name=fname,
                feature_value=round(val, 4),
                contribution=round(contrib, 4),
                human_explanation=explanation
            ))
            
    if not items:
        items.append(RiskFactorItem(
            feature_name="baseline_behavior",
            feature_value=1.0,
            contribution=0.01,
            human_explanation="Normal operational baseline with standard transaction frequencies"
        ))
        
    return items

def generate_investigation_summary(
    account_id: str,
    risk_level: str,
    mule_probability: float,
    archetype: str,
    top_factors: List[RiskFactorItem]
) -> str:
    """Creates a concise, professional, evidence-based investigation summary."""
    prob_pct = f"{mule_probability * 100:.1f}%"
    
    if risk_level in ["CRITICAL", "HIGH"]:
        reasons_text = ", ".join([f.human_explanation.lower() for f in top_factors[:3]])
        return (
            f"Account {account_id} exhibits elevated mule risk ({risk_level} triage level, {prob_pct} probability) "
            f"characterized by a '{archetype}' behavioral pattern. Primary risk drivers include {reasons_text}. "
            f"Further enhanced due diligence (EDD) and AML transaction review are recommended."
        )
    elif risk_level == "MEDIUM":
        return (
            f"Account {account_id} displays moderate anomaly markers ({prob_pct} probability) with "
            f"'{archetype}' characteristics. Activity warrants standard periodic monitoring."
        )
    else:
        return (
            f"Account {account_id} demonstrates normal consumer banking operations ({prob_pct} probability) "
            f"with balanced inbound and outbound flows and consistent counterparty relationships."
        )
