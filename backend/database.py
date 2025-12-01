from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "hrnexus")

# Async client for FastAPI
async_client = AsyncIOMotorClient(MONGODB_URL)
async_db = async_client[DATABASE_NAME]

# Sync client for initialization
sync_client = MongoClient(MONGODB_URL)
sync_db = sync_client[DATABASE_NAME]

# Collections
users_collection = async_db["users"]
tasks_collection = async_db["tasks"]
documents_collection = async_db["documents"]

def get_database():
    """Get async database instance"""
    return async_db

def close_database():
    """Close database connections"""
    async_client.close()
    sync_client.close()
