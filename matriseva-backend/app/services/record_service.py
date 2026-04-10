from app.database import supabase
from datetime import datetime

RECORDS_TABLE = "health_records"

def map_fields(data: dict) -> dict:
    """Map camelCase frontend keys to snake_case Supabase columns."""
    return {
        "name":                data.get("name"),
        "age":                 data.get("age"),
        "phone":               data.get("phone"),
        "guardian":            data.get("guardian"),
        "religion":            data.get("religion"),
        "caste":               data.get("caste"),
        "education":           data.get("education"),

        # Pregnancy
        "lmp":                 data.get("lmp") or None,
        "edd":                 data.get("edd") or None,
        "weeks":               data.get("weeks"),
        "gravida":             data.get("gravida"),
        "para":                data.get("para"),
        "abortions":           data.get("abortions"),
        "living":              data.get("living"),
        "anc_done":            data.get("ancDone"),
        "pregnancy_type":      data.get("pregnancyType"),
        "prev_complications":  data.get("prevComplications"),

        # Vitals
        "bp_sys":              data.get("bpSys"),
        "bp_dia":              data.get("bpDia"),
        "hb":                  data.get("hb"),
        "weight":              data.get("weight"),
        "sugar":               data.get("sugar"),
        "blood_group":         data.get("bloodGroup"),
        "anemia":              data.get("anemia"),
        "hiv":                 data.get("hiv"),

        # Location
        "asha_name":           data.get("ashaName"),
        "asha_mobile":         data.get("ashaMobile"),
        "district":            data.get("district"),
        "block":               data.get("block"),
        "village":             data.get("village"),
        "pin":                 data.get("pin"),
        "hospital":            data.get("hospital"),
        "transport":           data.get("transport"),

        # Risk (computed on frontend, stored here)
        "risk":                data.get("level"),   # computeRisk returns {level, score, flags}
        "risk_score":          data.get("score"),
        "risk_flags":          data.get("flags", []),
    }


async def create_record(data: dict, user_id: str) -> dict:
    mapped = map_fields(data)

    # Check if record already exists for this user
    res = supabase.table(RECORDS_TABLE).select("*").eq("user_id", user_id).execute()

    if res.data:
        # Update existing record
        supabase.table(RECORDS_TABLE).update({
            **mapped,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("user_id", user_id).execute()
        return await get_record_by_user(user_id)

    # Insert new record
    record = {
        **mapped,
        "user_id":    user_id,
        "created_at": datetime.utcnow().isoformat(),
        "visits":     [],
        "vaccines":   [],
        "documents":  [],
    }
    insert_res = supabase.table(RECORDS_TABLE).insert(record).execute()
    return insert_res.data[0]


async def get_record_by_user(user_id: str) -> dict | None:
    res = supabase.table(RECORDS_TABLE).select("*").eq("user_id", user_id).execute()
    if not res.data:
        return None
    return res.data[0]