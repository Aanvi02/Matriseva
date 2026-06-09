from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict
from google import genai
from google.genai import types
from app.config import settings
import asyncio

class ChatRequest(BaseModel):
    message: str
    history: List[Dict] = []

router = APIRouter(prefix="/ai", tags=["AI Assistant"])

client = genai.Client(api_key=settings.gemini_api_key)

SYSTEM_PROMPT = """You are Matriseva AI — a maternal health assistant for rural India.
Always reply in the SAME language the user writes in (Hindi, English, or Hinglish).
Give simple, clear, actionable advice. Never diagnose — only guide.
For emergencies say: Turant doctor se milo."""

@router.post("/chat")
async def chat(request: ChatRequest):
    try:
        contents = []
        for msg in request.history[-6:]:
            role = "model" if msg.get("role") == "model" else "user"
            content = msg.get("content", "")
            if content:
                contents.append(types.Content(
                    role=role,
                    parts=[types.Part(text=content)]
                ))

        contents.append(types.Content(
            role="user",
            parts=[types.Part(text=request.message)]
        ))

        # ✅ 3 baar try karo — 503 pe wait karke retry
        for attempt in range(3):
            try:
                response = client.models.generate_content(
                    model="models/gemini-2.5-flash",
                    contents=contents,
                    config=types.GenerateContentConfig(
                        system_instruction=SYSTEM_PROMPT,
                        max_output_tokens=500,
                    )
                )
                return {"reply": response.text, "status": "success"}

            except Exception as e:
                if "503" in str(e) and attempt < 2:
                    await asyncio.sleep(2)  # 2 sec wait karke retry
                    continue
                raise e

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/models")
async def list_models():
    try:
        models = client.models.list()
        return {"models": [m.name for m in models]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))