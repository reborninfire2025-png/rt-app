from fastapi import APIRouter, HTTPException, Depends
from models import QuestionRequest
from routers.auth import get_current_user
from anthropic import Anthropic
import os
import json
import random

router = APIRouter()
client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

QUESTION_SYSTEM = """You are an NBRC exam question writer with 20+ years experience. Generate realistic NBRC-style multiple choice questions that mirror actual exam format and difficulty.

For each question:
- Write at clinical application or analysis level (not just recall)
- Include a patient scenario when appropriate
- Make all 4 distractors plausible
- Base on current AARC guidelines and Egan's content
- Format as valid JSON array

Return ONLY a JSON array with this exact structure:
[
  {
    "id": "q1",
    "question": "...",
    "options": {"A": "...", "B": "...", "C": "...", "D": "..."},
    "correct": "A",
    "explanation": "...",
    "reference": "Egan's Chapter X / AARC CPG ...",
    "category": "...",
    "difficulty": "application|analysis|recall",
    "nbrc_type": "CRT|RRT|Both"
  }
]"""

CATEGORY_PROMPTS = {
    "nbrc_rrt": "Write RRT-level NBRC practice questions focusing on advanced clinical decision making, complex ventilator management, and critical care scenarios.",
    "nbrc_crt": "Write CRT-level NBRC practice questions covering entry-level respiratory therapy skills, basic ABG interpretation, oxygen therapy, and common disease management.",
    "egan": "Write questions based on Egan's Fundamentals of Respiratory Care covering pathophysiology, equipment, pharmacology, and clinical assessment.",
    "neonatal": "Write questions specifically about neonatal respiratory care: RDS, surfactant therapy, nHFOV, iNO, ECMO, BPD, PPHN, and NTE management.",
    "critical_care": "Write adult critical care questions: ARDS management, weaning protocols, hemodynamics, APRV, prone positioning, neuromuscular blockade, sedation protocols.",
    "pharmacology": "Write questions about respiratory pharmacology: bronchodilators (SABA, LABA, anticholinergics), corticosteroids, mucolytics, antibiotics, diuretics, vasopressors in respiratory failure.",
    "pfts": "Write questions about pulmonary function testing: spirometry interpretation, lung volumes, DLCO, flow-volume loops, bronchoprovocation testing.",
    "airway": "Write questions about airway management: intubation, LMA, surgical airways, difficult airway algorithm, cuff management, tracheostomy care.",
}

@router.post("/questions")
async def get_practice_questions(request: QuestionRequest, current_user: dict = Depends(get_current_user)):
    """Generate NBRC-style practice questions"""
    
    category_prompt = CATEGORY_PROMPTS.get(request.category, CATEGORY_PROMPTS["nbrc_rrt"])
    topic_focus = ""
    if request.topics:
        topic_focus = f"\n\nFocus on these specific topics: {', '.join(request.topics)}"
    
    count = min(request.count, 20)  # Max 20 per request
    
    response = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=4000,
        system=QUESTION_SYSTEM,
        messages=[{
            "role": "user",
            "content": f"{category_prompt}\n\nGenerate exactly {count} questions. Difficulty: {request.difficulty}.{topic_focus}"
        }]
    )
    
    try:
        text = response.content[0].text.strip()
        # Clean up any markdown code blocks
        if text.startswith("```"):
            text = text[text.find("["):text.rfind("]")+1]
        questions = json.loads(text)
    except:
        questions = [{"error": "Failed to parse questions", "raw": response.content[0].text[:500]}]
    
    return {
        "questions": questions,
        "category": request.category,
        "count": len(questions)
    }

@router.post("/submit-answer")
async def submit_answer(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Submit answer and get explanation"""
    question_id = data.get("question_id")
    user_answer = data.get("answer")
    correct_answer = data.get("correct_answer")
    question_text = data.get("question")
    explanation = data.get("explanation", "")
    
    is_correct = user_answer == correct_answer
    
    # Get AI to elaborate on explanation if wrong
    elaboration = ""
    if not is_correct:
        response = client.messages.create(
            model="claude-opus-4-5",
            max_tokens=400,
            system="You are an RT educator. Explain briefly why the correct answer is right and the chosen answer is wrong. Be concise and educational.",
            messages=[{
                "role": "user",
                "content": f"Question: {question_text}\nStudent chose: {user_answer}\nCorrect answer: {correct_answer}\nExplanation: {explanation}\n\nGive a brief teaching point (2-3 sentences)."
            }]
        )
        elaboration = response.content[0].text
    
    return {
        "correct": is_correct,
        "correct_answer": correct_answer,
        "explanation": explanation,
        "teaching_point": elaboration,
    }

@router.get("/categories")
async def get_categories():
    return {
        "categories": [
            {"id": "nbrc_rrt", "name": "NBRC RRT Exam", "description": "Advanced RRT-level clinical scenarios", "icon": "🏥"},
            {"id": "nbrc_crt", "name": "NBRC CRT Exam", "description": "Entry-level CRT exam preparation", "icon": "📋"},
            {"id": "egan", "name": "Egan's Fundamentals", "description": "Core RT knowledge from Egan's textbook", "icon": "📚"},
            {"id": "neonatal", "name": "Neonatal/Pediatric", "description": "NICU and pediatric respiratory care", "icon": "👶"},
            {"id": "critical_care", "name": "Adult Critical Care", "description": "ICU management, ARDS, advanced ventilation", "icon": "⚡"},
            {"id": "pharmacology", "name": "RT Pharmacology", "description": "Drugs used in respiratory care", "icon": "💊"},
            {"id": "pfts", "name": "Pulmonary Function", "description": "PFT interpretation and concepts", "icon": "📊"},
            {"id": "airway", "name": "Airway Management", "description": "Intubation, airways, tracheostomy", "icon": "🫁"},
        ]
    }

@router.get("/stats/{user_id}")
async def get_stats(user_id: str, current_user: dict = Depends(get_current_user)):
    # Return practice statistics
    return {
        "total_questions": current_user.get("practice_stats", {}).get("questions_answered", 0),
        "correct": current_user.get("practice_stats", {}).get("correct", 0),
        "accuracy": 0,
        "streak": current_user.get("practice_stats", {}).get("streak", 0),
        "by_category": {},
        "weak_areas": [],
    }
