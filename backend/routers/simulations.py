from fastapi import APIRouter, HTTPException, Depends
from models import VentSettings, VentSimResult
from routers.auth import get_current_user
from anthropic import Anthropic
import os
import math

router = APIRouter()
client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

VENT_SYSTEM = """You are an expert respiratory therapist and mechanical ventilation specialist with deep knowledge of:
- All ventilator modes: AC-VC, AC-PC, SIMV, PRVC, PSV, CPAP, APRV, HFOV, HFT, NAVA, PAV+
- Lung mechanics: compliance, resistance, time constants, auto-PEEP
- ARDSNet protocol and lung-protective ventilation
- Neonatal ventilation strategies
- Weaning protocols and spontaneous breathing trials
- Hemodynamic effects of mechanical ventilation

Provide expert analysis of ventilator settings."""

def calculate_vent_mechanics(settings: VentSettings):
    """Calculate ventilator mechanics and predicted gas exchange"""
    weight = settings.weight
    
    # Ideal body weight based tidal volume
    ibw = weight
    tv_per_kg = (settings.tidal_volume / ibw) if settings.tidal_volume else 6
    
    # Minute ventilation
    rate = settings.rate or 14
    mv = (settings.tidal_volume or ibw * 6) * rate / 1000  # L/min
    
    # Estimated PaCO2 (simplified Bohr equation)
    vd_vt = 0.33  # assumed dead space ratio
    alveolar_mv = mv * (1 - vd_vt)
    predicted_paco2 = 40 * (4.0 / alveolar_mv) if alveolar_mv > 0 else 40
    
    # Compliance estimation
    compliance = 50 if tv_per_kg <= 6 else 35  # mL/cmH2O
    
    # Oxygenation estimate
    fio2 = settings.fio2
    peep = settings.peep
    mean_airway_pressure = peep + (30 - peep) * 0.3  # approximation
    predicted_pao2 = min(500 * fio2 + peep * 3, 600)
    
    # Resistance
    resistance = 5  # cmH2O/L/s normal
    
    # Auto-PEEP risk
    inspiratory_time = 60 / rate * (1 / (1 + 2))  # assume 1:2 I:E
    time_constant = compliance * resistance / 1000
    exp_complete = inspiratory_time / time_constant
    
    warnings = []
    if tv_per_kg > 8:
        warnings.append(f"⚠️ HIGH TIDAL VOLUME: {tv_per_kg:.1f} mL/kg IBW - Risk of VILI. Target ≤ 6 mL/kg")
    if fio2 > 0.60 and peep < 8:
        warnings.append("⚠️ HIGH FiO2 with LOW PEEP - Consider optimizing PEEP before increasing FiO2")
    if predicted_paco2 < 35:
        warnings.append(f"⚠️ PREDICTED HYPERVENTILATION: PaCO2 ~ {predicted_paco2:.0f} mmHg")
    if predicted_paco2 > 55:
        warnings.append(f"⚠️ PREDICTED HYPOVENTILATION: PaCO2 ~ {predicted_paco2:.0f} mmHg")
    if settings.peep < 5 and settings.fio2 > 0.40:
        warnings.append("⚠️ SUBTHERAPEUTIC PEEP for FiO2 requirement - Consider PEEP/FiO2 ARDSNet table")
    if rate > 30:
        warnings.append("⚠️ HIGH RESPIRATORY RATE - Increased risk of auto-PEEP and air trapping")
    
    # Lung protection score
    if tv_per_kg <= 6 and peep >= 5 and fio2 <= 0.60:
        lung_protection = "✅ LUNG PROTECTIVE - Following ARDSNet principles"
    elif tv_per_kg <= 8:
        lung_protection = "⚠️ PARTIALLY PROTECTIVE - Consider reducing TV to 6 mL/kg IBW"
    else:
        lung_protection = "🚨 NOT LUNG PROTECTIVE - High VILI risk"
    
    return {
        "predicted_abg": {
            "ph": round(7.40 if 35 <= predicted_paco2 <= 45 else (7.30 if predicted_paco2 > 45 else 7.50), 2),
            "paco2": round(predicted_paco2, 1),
            "hco3": 24.0,
            "pao2": round(predicted_pao2, 0),
            "spo2": min(99, round(0.94 + (predicted_pao2 - 60) * 0.001, 2) * 100)
        },
        "compliance": compliance,
        "resistance": resistance,
        "minute_ventilation": round(mv, 2),
        "tv_per_kg": round(tv_per_kg, 1),
        "warnings": warnings,
        "lung_protection_score": lung_protection,
    }

@router.post("/analyze")
async def analyze_vent_settings(settings: VentSettings, current_user: dict = Depends(get_current_user)):
    """Analyze ventilator settings and provide recommendations"""
    
    mechanics = calculate_vent_mechanics(settings)
    
    # Get AI analysis
    settings_str = f"""
Mode: {settings.mode}
Rate: {settings.rate} breaths/min
Tidal Volume: {settings.tidal_volume} mL
PEEP: {settings.peep} cmH2O
FiO2: {settings.fio2 * 100:.0f}%
I:E Ratio: {settings.ie_ratio or '1:2'}
Patient IBW: {settings.weight} kg
Condition: {settings.patient_condition or 'Not specified'}
Calculated TV/kg IBW: {mechanics['tv_per_kg']} mL/kg
Predicted Minute Ventilation: {mechanics['minute_ventilation']} L/min"""
    
    response = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=1000,
        system=VENT_SYSTEM,
        messages=[{
            "role": "user",
            "content": f"""Analyze these ventilator settings and provide clinical recommendations:

{settings_str}

Predicted ABG: {mechanics['predicted_abg']}

Please provide:
1. Overall assessment of these settings
2. Specific concerns (if any)
3. Recommended adjustments with rationale
4. Target goals for this patient
5. Monitoring parameters"""
        }]
    )
    
    return {
        "mode": settings.mode,
        "settings_analysis": response.content[0].text,
        "predicted_abg": mechanics["predicted_abg"],
        "compliance": mechanics["compliance"],
        "resistance": mechanics["resistance"],
        "minute_ventilation": mechanics["minute_ventilation"],
        "tv_per_kg": mechanics["tv_per_kg"],
        "warnings": mechanics["warnings"],
        "lung_protection_score": mechanics["lung_protection_score"],
        "recommendations": []
    }

@router.get("/modes")
async def get_vent_modes():
    return {
        "modes": [
            {"id": "AC-VC", "name": "Assist Control - Volume Control", "description": "Guarantees tidal volume, variable pressure", "use_case": "Most common initial mode, ARDS, respiratory failure"},
            {"id": "AC-PC", "name": "Assist Control - Pressure Control", "description": "Set inspiratory pressure, variable volume", "use_case": "Lung-protective strategies, air leak syndromes"},
            {"id": "SIMV", "name": "Synchronized IMV", "description": "Combination of mandatory and spontaneous breaths", "use_case": "Weaning (controversial), some pediatric applications"},
            {"id": "PRVC", "name": "Pressure-Regulated Volume Control", "description": "Dual control - guarantees volume with lowest pressure", "use_case": "ARDS, when lung compliance changes frequently"},
            {"id": "PSV", "name": "Pressure Support Ventilation", "description": "Augments patient's spontaneous effort", "use_case": "Weaning, spontaneous breathing trials"},
            {"id": "CPAP", "name": "Continuous Positive Airway Pressure", "description": "No ventilator breaths, maintains airway pressure", "use_case": "Weaning, OSA, mild hypoxemia"},
            {"id": "APRV", "name": "Airway Pressure Release Ventilation", "description": "Time-cycled, pressure-limited inverse ratio mode", "use_case": "Severe ARDS, refractory hypoxemia"},
            {"id": "HFOV", "name": "High Frequency Oscillatory Ventilation", "description": "Very small tidal volumes at high frequency", "use_case": "Severe ARDS (adults), neonatal RDS"},
            {"id": "HFJV", "name": "High Frequency Jet Ventilation", "description": "High velocity gas pulses", "use_case": "Air leak syndromes, neonatal, procedures"},
            {"id": "nHFOV", "name": "Noninvasive HFOV", "description": "HFOV via mask/nasal interface", "use_case": "Neonatal apnea, post-extubation support"},
        ]
    }

@router.post("/weaning-assessment")
async def weaning_assessment(data: dict, current_user: dict = Depends(get_current_user)):
    """SBT and weaning readiness assessment"""
    
    clinical_data = data.get("clinical_data", {})
    
    response = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=800,
        system=VENT_SYSTEM,
        messages=[{
            "role": "user",
            "content": f"""Perform a weaning readiness assessment based on this clinical data:
{clinical_data}

Assess:
1. RSBI (if RR and TV provided)
2. Standard SBT criteria (ABCDEF bundle)
3. Extubation readiness
4. Recommended SBT approach (T-piece vs PSV 5/5)
5. Post-extubation support needs"""
        }]
    )
    
    return {"assessment": response.content[0].text}
