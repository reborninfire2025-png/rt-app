from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import uvicorn
from routers import auth, payments, ai_engine, practice, simulations

app = FastAPI(
    title="RT Enigma AI - Respiratory Therapy Platform",
    description="AI-powered respiratory therapy education and clinical tools",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://chosen1.ai", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])
app.include_router(ai_engine.router, prefix="/api/ai", tags=["AI Engine"])
app.include_router(practice.router, prefix="/api/practice", tags=["Practice"])
app.include_router(simulations.router, prefix="/api/simulations", tags=["Simulations"])

@app.get("/")
def root():
    return {"status": "RT Enigma AI Platform Running", "version": "2.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
