from fastapi import FastAPI
from app.routers import auth, records, appointments, predict

app = FastAPI(
    title="Matriseva API",
    description="Maternal healthcare backend with ML risk prediction",
    version="1.0.0"
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(records.router, prefix="/records", tags=["Health Records"])
app.include_router(appointments.router, prefix="/appointments", tags=["Appointments"])
app.include_router(predict.router, prefix="/ml", tags=["ML Prediction"])

@app.get("/")
async def root():
    return {"message": "Welcome to Matriseva API"}