"""Check what tasks exist in the database"""

from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
client = MongoClient(MONGODB_URL)
db = client["hr_nexus"]

print("Checking all tasks in database...")
print("\nAll tasks:")
for task in db["tasks"].find():
    print(f"  ID: {task.get('_id')}, Category: {task.get('category')}, Org: {task.get('organization_id')}")

print(f"\nTotal tasks: {db['tasks'].count_documents({})}")
