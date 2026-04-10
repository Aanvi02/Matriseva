# app/database.py
from supabase import create_client, Client
from app.config import settings

# Initialize Supabase client
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SECRET_KEY)

# Example: reference table
USERS_TABLE = "users"