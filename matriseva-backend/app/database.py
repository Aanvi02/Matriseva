from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client = AsyncIOMotorClient(settings.MONGO_URI)
db = client["matriseva"]

users_collection = db["users"]
records_collection = db["health_records"]
appointments_collection = db["appointments"]