"""
Migration script to update category names in the database.
Removes underscores from Learning_Development and Employee_Relations.
"""

from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

def migrate_categories():
    """Update category names in tasks collection"""
    
    # Get database connection
    MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    client = MongoClient(MONGODB_URL)
    db = client["hr_nexus"]
    tasks_collection = db["tasks"]
    
    # First, show all tasks with old categories
    print("\nTasks with old categories:")
    old_tasks = list(tasks_collection.find({"category": {"$in": ["Learning_Development", "Employee_Relations"]}}))
    for task in old_tasks:
        print(f"  ID: {task.get('_id')}, Category: {task.get('category')}, Org: {task.get('organization_id')}")
    
    # Update Learning_Development to LearningDevelopment
    result1 = tasks_collection.update_many(
        {"category": "Learning_Development"},
        {"$set": {"category": "LearningDevelopment"}}
    )
    print(f"\nUpdated {result1.modified_count} tasks from 'Learning_Development' to 'LearningDevelopment'")
    
    # Update Employee_Relations to EmployeeRelations
    result2 = tasks_collection.update_many(
        {"category": "Employee_Relations"},
        {"$set": {"category": "EmployeeRelations"}}
    )
    print(f"Updated {result2.modified_count} tasks from 'Employee_Relations' to 'EmployeeRelations'")
    
    print("\nMigration completed successfully!")
    
    # Show current category distribution
    print("\nCurrent category distribution:")
    pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    for result in tasks_collection.aggregate(pipeline):
        print(f"  {result['_id']}: {result['count']} tasks")

if __name__ == "__main__":
    print("Starting category migration...")
    migrate_categories()
