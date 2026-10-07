from core.config import settings

def calculate_risk_level(mule_probability: float) -> str:
    """
    Classify mule risk probability into tiered risk categories:
      0  - 30  -> LOW
      30 - 60  -> MEDIUM
      60 - 80  -> HIGH
      80 - 100 -> CRITICAL
    """
    score = mule_probability * 100.0
    if score >= settings.RISK_THRESHOLD_HIGH:
        return "CRITICAL"
    elif score >= settings.RISK_THRESHOLD_MEDIUM:
        return "HIGH"
    elif score >= settings.RISK_THRESHOLD_LOW:
        return "MEDIUM"
    else:
        return "LOW"

def get_risk_score(mule_probability: float) -> float:
    """Calculates UI risk score from 0.0 to 100.0."""
    return round(float(mule_probability) * 100.0, 1)

def get_risk_assessment_disclaimer() -> str:
    return (
        "Mule risk scores and classifications are probabilistic risk-triage indicators "
        "designed for compliance investigation and do not constitute a definitive legal finding."
    )
