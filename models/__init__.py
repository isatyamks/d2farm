"""
D2Farm ML Models Package
========================
Production-grade machine learning models for India's demand-driven
agricultural exchange platform.

Modules:
    - price_prediction    : AGMARKNET-calibrated crop price forecasting
    - crop_quality        : Multi-factor crop quality grading (A/B/C/Rejected)
    - demand_forecasting  : Buyer demand prediction from POS + seasonal signals
    - supply_confidence   : Farmer reliability & yield estimation scoring
    - spoilage_risk       : Perishability-aware transit spoilage predictor
    - route_optimizer     : Multi-stop transport route cost optimizer
    - matching_engine     : Demand ↔ Supply matching with risk-aware allocation

Data Sources:
    AGMARKNET (agmarknet.gov.in), eNAM, APMC Bulletins,
    IMD Weather, ICAR Crop Guides, Nafed/NCCF Reports
"""

__version__ = "0.3.0"
__author__ = "D2Farm ML Team"

from .price_prediction import PricePredictionModel
from .crop_quality import CropQualityClassifier
from .demand_forecasting import DemandForecaster
from .supply_confidence import SupplyConfidenceScorer
from .spoilage_risk import SpoilageRiskPredictor
from .route_optimizer import RouteOptimizer
from .matching_engine import MatchingEngine
