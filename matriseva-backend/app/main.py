"""
app/main.py
-----------
FastAPI entry point — includes all routers.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, records, appointments, predict, patients
from app.routers import ai_assistant

app = FastAPI(
    title="Matriseva API",
    description="Maternal healthcare backend with ML risk prediction",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://matriseva.vercel.app",
        "https://matriseva-git-main-aanvi-rohilla-s-projects.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,         prefix="/auth",         tags=["Auth"])
app.include_router(records.router,      prefix="/records",      tags=["Health Records"])
app.include_router(appointments.router, prefix="/appointments", tags=["Appointments"])
app.include_router(predict.router,      prefix="/ml",           tags=["ML Prediction"])
app.include_router(patients.router,     prefix="/patients",     tags=["Patients"])
app.include_router(ai_assistant.router)

@app.get("/")
async def root():
    return {"message": "Welcome to Matriseva API"}