"""
Organization Service
Handles organization CRUD operations and statistics.
"""

from typing import Optional, Dict
from datetime import datetime
from bson import ObjectId

from models import Organization
from database import (
    organizations_collection,
    users_collection,
    tasks_collection,
    documents_collection
)


class OrganizationService:
    """Service for managing organizations"""
    
    @staticmethod
    async def create_organization(name: str, slug: str, logo_url: Optional[str] = None) -> Organization:
        """
        Create a new organization.
        
        Args:
            name: Organization name
            slug: URL-friendly slug
            logo_url: Optional logo URL
            
        Returns:
            Created Organization object
        """
        new_org = {
            "name": name,
            "slug": slug,
            "logo_url": logo_url,
            "settings": {},
            "created_at": datetime.utcnow(),
            "is_active": True
        }
        
        result = await organizations_collection.insert_one(new_org)
        new_org["_id"] = result.inserted_id
        
        return Organization(**new_org)
    
    @staticmethod
    async def get_organization(org_id: str) -> Optional[Organization]:
        """
        Get organization by ID.
        
        Args:
            org_id: Organization ID
            
        Returns:
            Organization object or None if not found
        """
        if not ObjectId.is_valid(org_id):
            return None
        
        org = await organizations_collection.find_one({"_id": ObjectId(org_id)})
        
        if not org:
            return None
        
        return Organization(**org)
    
    @staticmethod
    async def update_organization(org_id: str, update_data: Dict) -> Optional[Organization]:
        """
        Update organization details.
        
        Args:
            org_id: Organization ID
            update_data: Dictionary of fields to update
            
        Returns:
            Updated Organization object or None if not found
        """
        if not ObjectId.is_valid(org_id):
            return None
        
        # Filter allowed fields
        allowed_fields = ["name", "logo_url", "settings"]
        filtered_data = {k: v for k, v in update_data.items() if k in allowed_fields}
        
        if not filtered_data:
            return await OrganizationService.get_organization(org_id)
        
        result = await organizations_collection.update_one(
            {"_id": ObjectId(org_id)},
            {"$set": filtered_data}
        )
        
        if result.matched_count == 0:
            return None
        
        return await OrganizationService.get_organization(org_id)
    
    @staticmethod
    async def delete_organization(org_id: str) -> bool:
        """
        Delete an organization (soft delete by setting is_active to False).
        
        Args:
            org_id: Organization ID
            
        Returns:
            True if deleted, False if not found
        """
        if not ObjectId.is_valid(org_id):
            return False
        
        result = await organizations_collection.update_one(
            {"_id": ObjectId(org_id)},
            {"$set": {"is_active": False}}
        )
        
        return result.matched_count > 0
    
    @staticmethod
    async def get_organization_stats(org_id: str) -> Dict:
        """
        Get organization statistics.
        
        Args:
            org_id: Organization ID
            
        Returns:
            Dictionary containing statistics:
            - active_users: Number of active users
            - total_documents: Number of documents
            - total_tasks: Number of tasks
            - completed_tasks: Number of completed tasks
            - pending_tasks: Number of pending tasks
        """
        if not ObjectId.is_valid(org_id):
            return {
                "active_users": 0,
                "total_documents": 0,
                "total_tasks": 0,
                "completed_tasks": 0,
                "pending_tasks": 0
            }
        
        # Count active users
        active_users = await users_collection.count_documents({
            "organization_id": org_id,
            "is_active": True
        })
        
        # Count documents
        total_documents = await documents_collection.count_documents({
            "organization_id": org_id
        })
        
        # Count tasks
        total_tasks = await tasks_collection.count_documents({
            "organization_id": org_id
        })
        
        completed_tasks = await tasks_collection.count_documents({
            "organization_id": org_id,
            "status": "Completed"
        })
        
        pending_tasks = await tasks_collection.count_documents({
            "organization_id": org_id,
            "status": "Pending"
        })
        
        return {
            "active_users": active_users,
            "total_documents": total_documents,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "pending_tasks": pending_tasks
        }
