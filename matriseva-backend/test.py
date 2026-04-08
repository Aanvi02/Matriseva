from pymongo import MongoClient

client = MongoClient("mongodb+srv://db_01:hehe123@cluster0.rxifwok.mongodb.net/matriseva?retryWrites=true&w=majority")

db = client["matriseva"]

print("✅ Connected successfully!")