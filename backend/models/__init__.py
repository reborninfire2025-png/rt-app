from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from enum import Enum

class SubscriptionTier(str, Enum):
    FREE = "free"
    STUDENT = "student"
    PROFESSIONAL = "professional"
    INSTITUTION = "institution"

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    credential_type: Optional[str] = None  # RRT, CRT, Student, etc.

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class ABGInput(BaseModel):
    ph: float
    paco2: float
    hco3: float
    pao2: float
    fio2: Optional[float] = 0.21
    spo2: Optional[float] = None
    age: Optional[int] = None
    clinical_context: Optional[str] = None

class ABGResult(BaseModel):
    primary_disorder: str
    compensation: str
    oxygenation_status: str
    aa_gradient: Optional[float] = None
    pf_ratio: Optional[float] = None
    interpretation: str
    clinical_recommendations: List[str]
    severity: str

class VentSettings(BaseModel):
    mode: str  # AC-VC, AC-PC, SIMV, PRVC, APRV, HFOV
    rate: Optional[float] = None
    tidal_volume: Optional[float] = None
    pip: Optional[float] = None
    peep: float = 5.0
    fio2: float = 0.40
    ie_ratio: Optional[str] = None
    flow: Optional[float] = None
    weight: float = 70.0  # IBW kg
    patient_condition: Optional[str] = None

class VentSimResult(BaseModel):
    settings_analysis: str
    predicted_abg: Dict[str, float]
    compliance: float
    resistance: float
    warnings: List[str]
    recommendations: List[str]
    lung_protection_score: str

class QuestionRequest(BaseModel):
    category: str  # "nbrc_rrt", "nbrc_crt", "egan", "neonatal", "critical_care"
    difficulty: Optional[str] = "mixed"
    count: int = 10
    topics: Optional[List[str]] = None

class AIQueryRequest(BaseModel):
    question: str
    context: Optional[str] = None  # "adult", "neonatal", "pediatric"
    include_references: bool = True

class PaymentIntent(BaseModel):
    tier: SubscriptionTier
    billing_cycle: str = "monthly"  # monthly or annual

class CheckoutSession(BaseModel):
    session_url: str
    session_id: str
    amount: int
    currency: str
