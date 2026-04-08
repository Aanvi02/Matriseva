from app.database import records_collection
from bson import ObjectId
from datetime import datetime

async def create_record(data: dict, user_id: str) -> dict:
    # Check if record already exists
    existing = await records_collection.find_one({"user_id": user_id})
    if existing:
        # Update existing record
        await records_collection.update_one(
            {"user_id": user_id},
            {"$set": {**data, "updated_at": datetime.utcnow()}}
        )
        return await get_record_by_user(user_id)

    # Create new record
    record = {
        **data,
        "user_id": user_id,
        "created_at": datetime.utcnow(),
        "visits": [],
        "vaccines": [],
        "documents": [],
    }
    result = await records_collection.insert_one(record)
    record["id"] = str(result.inserted_id)
    record.pop("_id", None)
    return record

async def get_record_by_user(user_id: str) -> dict | None:
    record = await records_collection.find_one({"user_id": user_id})
    if not record:
        return None
    record["id"] = str(record["_id"])
    record.pop("_id", None)
    return record