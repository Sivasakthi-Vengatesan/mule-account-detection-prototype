from typing import Dict, Any, List

def classify_mule_archetype(features: Dict[str, float]) -> str:
    """
    Transparent rule-based behavioral classification based on extracted feature signals:
      - PASS-THROUGH: High incoming volume with rapid fund depletion / near zero retained balance
      - STRUCTURING: Repeated amounts clustered under regulatory thresholds (50K / 100K)
      - DORMANT-BURST: Extended dormancy followed by sudden violent transaction spike
      - NETWORK-HUB: Disproportionately high counterparty fan-in / fan-out
      - STANDARD-RETAIL: Normal consumer/merchant activity
    """
    passthrough_ratio = features.get("passthrough_ratio", 0.0)
    net_flow = features.get("net_flow", 0.0)
    amt_cv = features.get("amt_cv", 0.0)
    near_50k = features.get("near_50000_ratio", features.get("near_50k_rate", 0.0))
    near_100k = features.get("near_100000_ratio", features.get("near_100k_rate", 0.0))
    round_ratio = features.get("round_amount_ratio", features.get("round_10k_rate", 0.0))
    burstiness = features.get("burstiness", features.get("amount_burstiness", 0.0))
    dormancy_events = features.get("dormancy_events", 0.0)
    max_gap_days = features.get("max_gap_days", 0.0)
    n_cp = features.get("n_unique_counterparties", 0.0)
    fan_in_out = features.get("fan_in_out_ratio", 1.0)
    cp_per_txn = features.get("cp_per_txn", 0.0)
    
    # 1. Structuring / Smurfing
    if near_50k > 0.15 or near_100k > 0.15 or (round_ratio > 0.35 and features.get("n_txn", 0) > 3):
        return "Structuring"
        
    # 2. Dormant-to-Burst
    if (dormancy_events > 0 or max_gap_days > 60) and (burstiness > 0.4 or features.get("txn_per_day", 0) > 5):
        return "Dormant-Burst"
        
    # 3. Pass-Through
    if passthrough_ratio > 0.65 or (features.get("n_credit", 0) > 0 and features.get("n_debit", 0) > 0 and abs(net_flow) < 10000 and features.get("sum_credit", 0) > 40000):
        return "Pass-Through"
        
    # 4. Network Hub
    if n_cp >= 6 or fan_in_out > 2.0 or cp_per_txn > 0.6:
        return "Network Hub"
        
    # 5. Default
    return "Standard Retail"

def get_suspicious_indicators(features: Dict[str, float]) -> List[str]:
    """Generates fact-based indicators from actual feature values."""
    indicators = []
    
    if features.get("mcc_6051_rate", 0) > 0.1:
        indicators.append("High volume of cryptocurrency or quasi-cash wire transactions (MCC 6051)")
    if features.get("was_frozen", 0) == 1:
        indicators.append("Prior administrative account freeze event recorded")
    if features.get("passthrough_ratio", 0) > 0.6:
        indicators.append("Rapid fund turnaround with minimal balance retention")
    if features.get("near_50000_ratio", features.get("near_50k_rate", 0)) > 0.15:
        indicators.append("Transaction structuring clustered below ₹50,000 regulatory reporting limit")
    if features.get("burstiness", 0) > 0.4 or features.get("dormancy_events", 0) > 0:
        indicators.append("Sudden burst velocity following an extended dormancy period")
    if features.get("pct_night_txn", features.get("night_rate", 0)) > 0.3:
        indicators.append("Elevated night-time activity (12:00 AM – 06:00 AM)")
    if features.get("n_unique_counterparties", 0) >= 6:
        indicators.append(f"High counterparty dispersion ({int(features.get('n_unique_counterparties', 0))} unique entities)")
    if features.get("credit_debit_ratio", 1.0) > 3.0:
        indicators.append("Asymmetrical credit aggregation funneling pattern")
        
    if not indicators:
        indicators.append("Standard banking activity pattern within typical operational parameters")
        
    return indicators
