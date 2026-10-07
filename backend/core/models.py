from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, JSON, Text
)
from sqlalchemy.orm import relationship
from core.database import Base

class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    account_id = Column(String(64), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Metadata / Aggregations
    transaction_count = Column(Integer, default=0)
    total_volume = Column(Float, default=0.0)
    average_amount = Column(Float, default=0.0)
    unique_counterparties = Column(Integer, default=0)
    transaction_velocity = Column(Float, default=0.0)
    incoming_outgoing_ratio = Column(Float, default=1.0)
    behavioral_pattern = Column(String(64), default="STANDARD_RETAIL")
    
    # Relationships
    predictions = relationship("Prediction", back_populates="account", cascade="all, delete-orphan")

class PredictionRun(Base):
    __tablename__ = "prediction_runs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    filename = Column(String(255), nullable=False)
    accounts_processed = Column(Integer, default=0)
    critical_count = Column(Integer, default=0)
    high_count = Column(Integer, default=0)
    medium_count = Column(Integer, default=0)
    low_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    account_id = Column(String(64), ForeignKey("accounts.account_id"), index=True, nullable=False)
    prediction_run_id = Column(Integer, ForeignKey("prediction_runs.id"), nullable=True)
    
    mule_probability = Column(Float, nullable=False)
    risk_score = Column(Float, nullable=False)  # 0 to 100
    risk_level = Column(String(16), nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    
    # Model scores breakdown
    model_scores = Column(JSON, nullable=True)  # {"lightgbm": float, "xgboost": float, "catboost": float, "ensemble": float}
    
    # Suspicious temporal window & archetypes
    suspicious_start = Column(String(64), nullable=True)
    suspicious_end = Column(String(64), nullable=True)
    mule_archetype = Column(String(64), nullable=True)
    investigation_summary = Column(Text, nullable=True)
    
    model_version = Column(String(32), default="v8-ensemble")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    account = relationship("Account", back_populates="predictions")
    risk_factors = relationship("RiskFactor", back_populates="prediction", cascade="all, delete-orphan")

class RiskFactor(Base):
    __tablename__ = "risk_factors"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    prediction_id = Column(Integer, ForeignKey("predictions.id"), index=True, nullable=False)
    
    feature_name = Column(String(128), nullable=False)
    feature_value = Column(Float, nullable=False)
    contribution = Column(Float, nullable=False)  # SHAP value / contribution weight
    human_explanation = Column(Text, nullable=True)
    
    prediction = relationship("Prediction", back_populates="risk_factors")
