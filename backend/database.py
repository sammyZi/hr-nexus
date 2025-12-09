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
organizations_collection = async_db["organizations"]
invitations_collection = async_db["invitations"]
users_collection = async_db["users"]
tasks_collection = async_db["tasks"]
documents_collection = async_db["documents"]
candidates_collection = async_db["candidates"]
chat_history_collection = async_db["chat_history"]
pending_signups_collection = async_db["pending_signups"]  # Temporary storage for unverified signups
cases_collection = async_db["cases"]

def get_database():
    """Get async database instance"""
    return async_db

def close_database():
    """Close database connections"""
    async_client.close()
    sync_client.close()

def create_indexes():
    """Create database indexes for performance"""
    
    # Organizations indexes
    sync_db["organizations"].create_index("slug", unique=True)
    sync_db["organizations"].create_index([("created_at", -1)])
    
    # Invitations indexes
    sync_db["invitations"].create_index("token", unique=True)
    sync_db["invitations"].create_index([("organization_id", 1), ("email", 1)])
    sync_db["invitations"].create_index("expires_at", expireAfterSeconds=0)
    
    # Users indexes (compound indexes for multi-tenancy)
    sync_db["users"].create_index([("organization_id", 1), ("email", 1)])
    sync_db["users"].create_index([("organization_id", 1), ("role", 1)])
    sync_db["users"].create_index("email", unique=True)
    
    # Tasks indexes (compound indexes for multi-tenancy)
    sync_db["tasks"].create_index([("organization_id", 1), ("category", 1)])
    sync_db["tasks"].create_index([("organization_id", 1), ("status", 1)])
    sync_db["tasks"].create_index([("organization_id", 1), ("owner_id", 1)])
    
    # Documents indexes (compound indexes for multi-tenancy)
    sync_db["documents"].create_index([("organization_id", 1), ("uploaded_at", -1)])
    sync_db["documents"].create_index([("organization_id", 1), ("category", 1)])
    
    # Chat history indexes
    sync_db["chat_history"].create_index([("organization_id", 1), ("user_id", 1)])
    sync_db["chat_history"].create_index([("updated_at", -1)])
    
    # Candidates indexes (compound indexes for multi-tenancy)
    sync_db["candidates"].create_index([("organization_id", 1), ("status", 1)])
    sync_db["candidates"].create_index([("organization_id", 1), ("position_applied", 1)])
    sync_db["candidates"].create_index([("organization_id", 1), ("email", 1)])
    sync_db["candidates"].create_index([("organization_id", 1), ("email", 1)])
    sync_db["candidates"].create_index([("organization_id", 1), ("applied_date", -1)])
    
    # Cases indexes
    sync_db["cases"].create_index([("organization_id", 1), ("status", 1)])
    sync_db["cases"].create_index([("organization_id", 1), ("priority", 1)])
    sync_db["cases"].create_index([("organization_id", 1), ("case_type", 1)])
    sync_db["cases"].create_index([("organization_id", 1), ("created_at", -1)])
    
    # Pending signups indexes (with TTL for auto-cleanup after 24 hours)
    sync_db["pending_signups"].create_index("email", unique=True)
    sync_db["pending_signups"].create_index("verification_code_expiry", expireAfterSeconds=86400)  # 24 hours
    
    print("Database indexes created successfully")
