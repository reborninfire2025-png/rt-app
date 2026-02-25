from fastapi import APIRouter, HTTPException, Depends
from models import ABGInput, ABGResult, AIQueryRequest
from routers.auth import get_current_user
from anthropic import Anthropic
import os

router = APIRouter()
client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

RT_SYSTEM_PROMPT = """You are RT Enigma AI, an expert respiratory therapist and clinical educator with comprehensive knowledge of:

CLINICAL REFERENCES:
- Egan's Fundamentals of Respiratory Care (all editions)
- Kettering National Seminars review materials  
- Lindsay Jones NBRC prep content
- AARC Clinical Practice Guidelines
- NBRC CRT and RRT exam content specifications
- Neonatal/Pediatric Respiratory Care (Walsh)
- Critical Care Medicine protocols

EXPERTISE AREAS:
- Arterial Blood Gas interpretation (full acid-base analysis)
- Mechanical ventilation (all modes: AC-VC, AC-PC, SIMV, PRVC, APRV, HFOV, HFT, NAVA)
- Neonatal respiratory care (RDS, BPD, PPHN, CDH, meconium aspiration)
- Adult critical care (ARDS, COPD, asthma, pneumonia, PE, heart failure)
- Pediatric respiratory emergencies
- Pulmonary function testing interpretation
- Hemodynamic monitoring
- Airway management
- Weaning protocols (SBT, RSS, ABCDEF bundle)
- Oxygen therapy and delivery devices
- Aerosol and humidity therapy
- Disease pathophysiology

Provide evidence-based, clinically accurate responses. Reference specific guidelines and textbooks when appropriate. For exam prep, indicate the likely NBRC cognitive level (recall, application, analysis). Always prioritize patient safety."""

@router.post("/query")
async def ai_query(request: AIQueryRequest, current_user: dict = Depends(get_current_user)):
    """General AI Q&A drawing on full RT knowledge base"""
    
    context_prefix = ""
    if request.context:
        context_prefix = f"[Context: {request.context.upper()} patient population] "
    
    ref_instruction = "\n\nPlease include relevant textbook references (Egan's chapter, AARC guidelines, etc.) if applicable." if request.include_references else ""
    
    response = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=1500,
        system=RT_SYSTEM_PROMPT,
        messages=[{
            "role": "user",
            "content": f"{context_prefix}{request.question}{ref_instruction}"
        }]
    )
    
    return {
        "answer": response.content[0].text,
        "tokens_used": response.usage.input_tokens + response.usage.output_tokens
    }

@router.post("/abg-interpret", response_model=ABGResult)
async def interpret_abg(abg: ABGInput, current_user: dict = Depends(get_current_user)):
    """Full ABG interpretation with AI clinical context"""
    
    # Algorithmic interpretation first
    ph = abg.ph
    paco2 = abg.paco2
    hco3 = abg.hco3
    pao2 = abg.pao2
    fio2 = abg.fio2 or 0.21
    
    # Primary disorder
    primary = ""
    if 7.35 <= ph <= 7.45:
        if paco2 < 35 and hco3 < 22:
            primary = "Compensated Respiratory Alkalosis OR Mixed Respiratory Alkalosis/Metabolic Acidosis"
        elif paco2 > 45 and hco3 > 26:
            primary = "Compensated Respiratory Acidosis OR Mixed Respiratory Acidosis/Metabolic Alkalosis"
        else:
            primary = "Normal pH - No primary disorder OR fully compensated"
    elif ph < 7.35:
        if paco2 > 45:
            primary = "Respiratory Acidosis"
        elif hco3 < 22:
            primary = "Metabolic Acidosis"
        else:
            primary = "Mixed Acidosis"
    elif ph > 7.45:
        if paco2 < 35:
            primary = "Respiratory Alkalosis"
        elif hco3 > 26:
            primary = "Metabolic Alkalosis"
        else:
            primary = "Mixed Alkalosis"
    
    # Compensation check
    compensation = ""
    if "Respiratory Acidosis" in primary:
        expected_hco3_acute = 24 + (paco2 - 40) * 0.1
        expected_hco3_chronic = 24 + (paco2 - 40) * 0.35
        if abs(hco3 - expected_hco3_chronic) < 2:
            compensation = "Fully compensated (chronic - metabolic compensation present)"
        elif abs(hco3 - expected_hco3_acute) < 2:
            compensation = "Partially compensated (acute - early metabolic compensation)"
        else:
            compensation = "Uncompensated"
    elif "Metabolic Acidosis" in primary:
        expected_paco2 = 1.5 * hco3 + 8  # Winter's formula
        if abs(paco2 - expected_paco2) < 2:
            compensation = "Appropriate respiratory compensation (Winter's formula)"
        elif paco2 < expected_paco2:
            compensation = "Over-compensated respiratory response (concurrent resp alkalosis)"
        else:
            compensation = "Inadequate respiratory compensation (additional resp acidosis or respiratory failure)"
    elif "Respiratory Alkalosis" in primary:
        expected_hco3_acute = 24 - (40 - paco2) * 0.2
        expected_hco3_chronic = 24 - (40 - paco2) * 0.5
        if abs(hco3 - expected_hco3_chronic) < 2:
            compensation = "Fully compensated (chronic)"
        elif abs(hco3 - expected_hco3_acute) < 2:
            compensation = "Partially compensated (acute)"
        else:
            compensation = "Uncompensated"
    elif "Metabolic Alkalosis" in primary:
        expected_paco2 = 40 + (hco3 - 24) * 0.7
        if abs(paco2 - expected_paco2) < 2:
            compensation = "Appropriate respiratory compensation"
        else:
            compensation = "Inadequate compensation"
    else:
        compensation = "Normal/Compensated"
    
    # Oxygenation
    pf_ratio = pao2 / fio2
    aa_gradient = None
    if abg.age:
        expected_pao2 = 713 * fio2 - paco2 / 0.8
        aa_gradient = expected_pao2 - pao2
        age_normal = 2.5 + 0.21 * abg.age
    
    if pao2 >= 80:
        oxy_status = "Normal oxygenation"
    elif pao2 >= 60:
        oxy_status = "Mild hypoxemia"
    elif pao2 >= 40:
        oxy_status = "Moderate hypoxemia"
    else:
        oxy_status = "Severe hypoxemia - CRITICAL"
    
    if pf_ratio < 100:
        oxy_status += " | Severe ARDS (P/F < 100)"
    elif pf_ratio < 200:
        oxy_status += " | Moderate ARDS (P/F 100-200)"
    elif pf_ratio < 300:
        oxy_status += f" | Mild ARDS/ALI (P/F 200-300)"
    
    # Severity
    if ph < 7.20 or ph > 7.60 or pao2 < 40:
        severity = "CRITICAL - Immediate intervention required"
    elif ph < 7.30 or ph > 7.55 or pao2 < 55:
        severity = "SEVERE - Urgent management needed"
    elif ph < 7.35 or ph > 7.45 or pao2 < 70:
        severity = "MODERATE - Close monitoring and intervention"
    else:
        severity = "MILD - Monitor and reassess"
    
    # Get AI interpretation
    ai_prompt = f"""Interpret this ABG and provide clinical recommendations:
pH: {ph}, PaCO2: {paco2} mmHg, HCO3: {hco3} mEq/L, PaO2: {pao2} mmHg, FiO2: {fio2*100:.0f}%
Clinical context: {abg.clinical_context or 'Not provided'}
Primary disorder identified: {primary}
Compensation: {compensation}
Oxygenation: {oxy_status}

Provide:
1. Concise clinical interpretation (2-3 sentences)
2. 4-6 specific clinical recommendations for the respiratory therapist
3. Reference any relevant AARC or Egan's guidelines"""

    ai_response = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=800,
        system=RT_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": ai_prompt}]
    )
    
    ai_text = ai_response.content[0].text
    lines = [l.strip() for l in ai_text.split('\n') if l.strip()]
    
    interpretation = lines[0] if lines else "See clinical context above."
    recommendations = [l.lstrip("0123456789.-) ") for l in lines[1:] if len(l) > 10][:6]
    if not recommendations:
        recommendations = ["Correlate with clinical presentation", "Repeat ABG in 30-60 min post-intervention"]
    
    return ABGResult(
        primary_disorder=primary,
        compensation=compensation,
        oxygenation_status=oxy_status,
        aa_gradient=round(aa_gradient, 1) if aa_gradient else None,
        pf_ratio=round(pf_ratio, 1),
        interpretation=ai_text,
        clinical_recommendations=recommendations,
        severity=severity
    )

@router.get("/disease/{disease_name}")
async def get_disease_info(disease_name: str, context: str = "adult", current_user: dict = Depends(get_current_user)):
    """Comprehensive disease information for RT"""
    
    response = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=1200,
        system=RT_SYSTEM_PROMPT,
        messages=[{
            "role": "user",
            "content": f"""Provide a comprehensive respiratory therapy-focused overview of {disease_name} in the {context} population. Include:
1. Pathophysiology (RT perspective)
2. Classic ABG findings
3. Pulmonary function patterns
4. RT treatment priorities and interventions
5. Mechanical ventilation strategy (if applicable)
6. Key NBRC exam points
7. Clinical pearls from Egan's"""
        }]
    )
    
    return {"disease": disease_name, "context": context, "content": response.content[0].text}
