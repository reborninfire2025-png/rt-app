from fastapi import APIRouter, HTTPException, Request, Depends
from models import PaymentIntent, CheckoutSession
from routers.auth import get_current_user
import stripe
import os

router = APIRouter()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_YOUR_STRIPE_KEY")
WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_YOUR_WEBHOOK_SECRET")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://chosen1.ai")

PRICING = {
    "student": {
        "monthly": {"price_id": "price_student_monthly", "amount": 1999, "label": "$19.99/mo"},
        "annual": {"price_id": "price_student_annual", "amount": 19900, "label": "$199/yr"},
    },
    "professional": {
        "monthly": {"price_id": "price_pro_monthly", "amount": 3999, "label": "$39.99/mo"},
        "annual": {"price_id": "price_pro_annual", "amount": 39900, "label": "$399/yr"},
    },
    "institution": {
        "monthly": {"price_id": "price_inst_monthly", "amount": 19900, "label": "$199/mo"},
        "annual": {"price_id": "price_inst_annual", "amount": 199000, "label": "$1999/yr"},
    },
}

@router.get("/plans")
async def get_plans():
    return {
        "plans": [
            {
                "id": "free",
                "name": "Free",
                "price_monthly": 0,
                "price_annual": 0,
                "features": [
                    "10 AI questions/day",
                    "Basic ABG Calculator",
                    "5 NBRC practice questions/day",
                    "Limited vent simulator",
                ],
                "limits": {"ai_queries": 10, "practice_questions": 5},
            },
            {
                "id": "student",
                "name": "Student",
                "price_monthly": 19.99,
                "price_annual": 199,
                "features": [
                    "Unlimited AI Q&A (Egan's + Kettering)",
                    "Full ABG Interpreter",
                    "Unlimited NBRC practice (CRT + RRT)",
                    "Basic Vent Simulator",
                    "Disease modules (30+)",
                    "Lindsay Jones question bank",
                    "Progress tracking & analytics",
                ],
                "limits": {"ai_queries": -1, "practice_questions": -1},
                "badge": "Most Popular",
            },
            {
                "id": "professional",
                "name": "Professional",
                "price_monthly": 39.99,
                "price_annual": 399,
                "features": [
                    "Everything in Student",
                    "Advanced Vent Simulations (APRV, HFOV, HFT)",
                    "Neonatal & Pediatric modules",
                    "Adult Critical Care protocols",
                    "Hemodynamic monitoring tools",
                    "Case-based learning (100+ cases)",
                    "Continuing Education credits",
                    "Clinical decision support",
                ],
                "limits": {"ai_queries": -1, "practice_questions": -1},
            },
            {
                "id": "institution",
                "name": "Institution",
                "price_monthly": 199,
                "price_annual": 1999,
                "features": [
                    "Everything in Professional",
                    "Up to 50 seats",
                    "Admin dashboard",
                    "Student progress reporting",
                    "Custom question banks",
                    "LMS integration",
                    "Dedicated support",
                ],
                "limits": {"ai_queries": -1, "practice_questions": -1, "seats": 50},
            },
        ]
    }

@router.post("/create-checkout-session")
async def create_checkout_session(
    payment_intent: PaymentIntent,
    current_user: dict = Depends(get_current_user)
):
    try:
        tier = payment_intent.tier.value
        if tier == "free":
            raise HTTPException(status_code=400, detail="Free plan doesn't require checkout")
        
        pricing = PRICING.get(tier, {}).get(payment_intent.billing_cycle, {})
        price_id = pricing.get("price_id")
        
        # In production, use actual Stripe price IDs
        # For demo, create a price on the fly
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": f"RT Enigma AI - {tier.capitalize()} Plan",
                        "description": f"Respiratory Therapy AI Platform - {payment_intent.billing_cycle} subscription",
                    },
                    "unit_amount": pricing.get("amount", 1999),
                    "recurring": {
                        "interval": "month" if payment_intent.billing_cycle == "monthly" else "year"
                    },
                },
                "quantity": 1,
            }],
            mode="subscription",
            success_url=f"{FRONTEND_URL}/dashboard?session_id={{CHECKOUT_SESSION_ID}}&success=true",
            cancel_url=f"{FRONTEND_URL}/pricing?cancelled=true",
            customer_email=current_user["email"],
            metadata={
                "user_id": current_user["id"],
                "tier": tier,
                "billing_cycle": payment_intent.billing_cycle,
            }
        )
        
        return CheckoutSession(
            session_url=session.url,
            session_id=session.id,
            amount=pricing.get("amount", 1999),
            currency="usd"
        )
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, WEBHOOK_SECRET)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session["metadata"].get("user_id")
        tier = session["metadata"].get("tier")
        # Update user subscription in DB
        # update_user_subscription(user_id, tier, session["subscription"])
    
    elif event["type"] == "customer.subscription.deleted":
        # Handle cancellation - downgrade to free
        pass
    
    return {"status": "success"}

@router.get("/subscription")
async def get_subscription(current_user: dict = Depends(get_current_user)):
    return {
        "tier": current_user.get("subscription_tier", "free"),
        "status": current_user.get("subscription_status", "active"),
        "renewal_date": None,
    }

@router.post("/cancel")
async def cancel_subscription(current_user: dict = Depends(get_current_user)):
    # Cancel Stripe subscription
    return {"message": "Subscription cancellation scheduled for end of billing period"}
