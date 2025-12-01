"""
Invitation Service for Multi-Tenant SaaS

Handles user invitation creation, email sending, and acceptance.
Implements Requirements: 8.1, 8.2, 8.4
"""

from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import HTTPException
import secrets
from bson import ObjectId

from models import Invitation, generate_invitation_token
from database import invitations_collection, users_collection, organizations_collection
from email_utils import send_invitation_email
import bcrypt


class InvitationService:
    """Service for managing user invitations"""
    
    @staticmethod
    async def create_invitation(
        organization_id: str,
        email: str,
        role: str,
        invited_by: str
    ) -> Invitation:
        """
        Create a new invitation for a user to join an organization.
        
        Args:
            organization_id: ID of the organization
            email: Email address of the invitee
            role: Role to assign ("admin" or "employee")
            invited_by: User ID of the person sending the invitation
            
        Returns:
            Invitation object
            
        Raises:
            HTTPException: If validation fails
        """
        # Validate role
        if role not in ["admin", "employee"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid role. Must be 'admin' or 'employee'"
            )
        
        # Check if organization exists
        org = await organizations_collection.find_one({"_id": ObjectId(organization_id)})
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")
        
        # Check if user already exists in this organization
        existing_user = await users_collection.find_one({
            "email": email,
            "organization_id": organization_id
        })
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="User already exists in this organization"
            )
        
        # Check if there's already a pending invitation
        existing_invitation = await invitations_collection.find_one({
            "email": email,
            "organization_id": organization_id,
            "status": "pending"
        })
        if existing_invitation:
            raise HTTPException(
                status_code=400,
                detail="Invitation already sent to this email"
            )
        
        # Generate secure token
        token = generate_invitation_token()
        
        # Create invitation (expires in 7 days)
        invitation_data = {
            "organization_id": organization_id,
            "email": email,
            "role": role,
            "token": token,
            "invited_by": invited_by,
            "expires_at": datetime.utcnow() + timedelta(days=7),
            "status": "pending",
            "created_at": datetime.utcnow()
        }
        
        result = await invitations_collection.insert_one(invitation_data)
        invitation_data["_id"] = result.inserted_id
        
        return Invitation(**invitation_data)
    
    @staticmethod
    async def send_invitation_email(invitation: Invitation) -> bool:
        """
        Send invitation email to the invitee.
        
        Args:
            invitation: Invitation object
            
        Returns:
            True if email sent successfully
            
        Raises:
            HTTPException: If email sending fails
        """
        # Get organization details
        org = await organizations_collection.find_one({
            "_id": ObjectId(invitation.organization_id)
        })
        
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")
        
        organization_name = org["name"]
        
        # Send email using the email utility
        try:
            await send_invitation_email(
                email=invitation.email,
                token=invitation.token,
                organization_name=organization_name
            )
            return True
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to send invitation email: {str(e)}"
            )
    
    @staticmethod
    async def accept_invitation(token: str, password: str) -> dict:
        """
        Accept an invitation and create a new user account.
        
        Args:
            token: Invitation token
            password: Password for the new user account
            
        Returns:
            Dictionary with user_id and organization_id
            
        Raises:
            HTTPException: If invitation is invalid or expired
        """
        # Find invitation by token
        invitation = await invitations_collection.find_one({"token": token})
        
        if not invitation:
            raise HTTPException(status_code=404, detail="Invitation not found")
        
        # Check if invitation is still pending
        if invitation["status"] != "pending":
            raise HTTPException(
                status_code=400,
                detail="Invitation has already been used"
            )
        
        # Check if invitation has expired
        if invitation["expires_at"] < datetime.utcnow():
            # Update status to expired
            await invitations_collection.update_one(
                {"_id": invitation["_id"]},
                {"$set": {"status": "expired"}}
            )
            raise HTTPException(status_code=400, detail="Invitation has expired")
        
        # Check if user already exists globally
        existing_user = await users_collection.find_one({"email": invitation["email"]})
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="User with this email already exists"
            )
        
        # Hash password
        hashed_password = bcrypt.hashpw(
            password.encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')
        
        # Create user
        verification_token = secrets.token_urlsafe(32)
        new_user = {
            "organization_id": invitation["organization_id"],
            "email": invitation["email"],
            "hashed_password": hashed_password,
            "role": invitation["role"],
            "is_active": True,
            "is_verified": True,  # Auto-verify invited users
            "verification_token": verification_token,
            "created_at": datetime.utcnow()
        }
        
        user_result = await users_collection.insert_one(new_user)
        user_id = str(user_result.inserted_id)
        
        # Update invitation status
        await invitations_collection.update_one(
            {"_id": invitation["_id"]},
            {"$set": {"status": "accepted"}}
        )
        
        return {
            "user_id": user_id,
            "organization_id": invitation["organization_id"],
            "email": invitation["email"],
            "role": invitation["role"]
        }
    
    @staticmethod
    async def get_pending_invitations(organization_id: str) -> List[dict]:
        """
        Get all pending invitations for an organization.
        
        Args:
            organization_id: ID of the organization
            
        Returns:
            List of invitation dictionaries
        """
        invitations = await invitations_collection.find({
            "organization_id": organization_id,
            "status": "pending"
        }).sort("created_at", -1).to_list(length=None)
        
        # Convert ObjectId to string
        for inv in invitations:
            inv["id"] = str(inv["_id"])
            del inv["_id"]
        
        return invitations
    
    @staticmethod
    async def revoke_invitation(invitation_id: str, organization_id: str) -> bool:
        """
        Revoke a pending invitation.
        
        Args:
            invitation_id: ID of the invitation
            organization_id: ID of the organization (for verification)
            
        Returns:
            True if revoked successfully
            
        Raises:
            HTTPException: If invitation not found or doesn't belong to organization
        """
        if not ObjectId.is_valid(invitation_id):
            raise HTTPException(status_code=400, detail="Invalid invitation ID")
        
        invitation = await invitations_collection.find_one({
            "_id": ObjectId(invitation_id)
        })
        
        if not invitation:
            raise HTTPException(status_code=404, detail="Invitation not found")
        
        # Verify invitation belongs to the organization
        if invitation["organization_id"] != organization_id:
            raise HTTPException(
                status_code=403,
                detail="Invitation does not belong to your organization"
            )
        
        # Update status to revoked
        await invitations_collection.update_one(
            {"_id": ObjectId(invitation_id)},
            {"$set": {"status": "revoked"}}
        )
        
        return True
