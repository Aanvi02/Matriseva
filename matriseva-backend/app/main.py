from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, records, appointments, predict

app = FastAPI(
    title="Matriseva API",
    description="Maternal healthcare backend with ML risk prediction",
    version="1.0.0"
)

# CORS settings - allow React dev server
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(records.router, prefix="/records", tags=["Health Records"])
app.include_router(appointments.router, prefix="/appointments", tags=["Appointments"])
app.include_router(predict.router, prefix="/ml", tags=["ML Prediction"])

# Root endpoint to test server
@app.get("/")
async def root():
    return {"message": "Welcome to Matriseva API"}