"""
Tests for Organization Service and API endpoints
"""

import pytest
from httpx import AsyncClient
from fastapi.testclient import TestClient
from datetime import datetime
import asyncio

# Import the app and services
from main import app
from organization_service import OrganizationService
from database import organizations_collection, users_collection, tasks_collection, documents_collection


@pytest.fixture
async def clean_db():
    """Clean up test data before and after tests"""
    # Clean before
    await organizations_collection.delete_many({"name": {"$regex": "^Test"}})
    await users_collection.delete_many({"email": {"$regex": "test.*@test.com"}})
    await tasks_collection.delete_many({})
    await documents_collection.delete_many({})
    
    yield
    
    # Clean after
    await organizations_collection.delete_many({"name": {"$regex": "^Test"}})
    await users_collection.delete_many({"email": {"$regex": "test.*@test.com"}})
    await tasks_collection.delete_many({})
    await documents_collection.delete_many({})


class TestOrganizationService:
    """Test OrganizationService class"""
    
    @pytest.mark.asyncio
    async def test_create_organization(self, clean_db):
        """Test creating an organization"""
        org = await OrganizationService.create_organization(
            name="Test Organization",
            slug="test-organization"
        )
        
        assert org is not None
        assert org.name == "Test Organization"
        assert org.slug == "test-organization"
        assert org.is_active is True
        assert org.id is not None
    
    @pytest.mark.asyncio
    async def test_get_organization(self, clean_db):
        """Test retrieving an organization"""
        # Create org first
        created_org = await OrganizationService.create_organization(
            name="Test Get Org",
            slug="test-get-org"
        )
        
        # Retrieve it
        org = await OrganizationService.get_organization(str(created_org.id))
        
        assert org is not None
        assert org.name == "Test Get Org"
        assert org.slug == "test-get-org"
    
    @pytest.mark.asyncio
    async def test_update_organization(self, clean_db):
        """Test updating an organization"""
        # Create org first
        created_org = await OrganizationService.create_organization(
            name="Test Update Org",
            slug="test-update-org"
        )
        
        # Update it
        updated_org = await OrganizationService.update_organization(
            str(created_org.id),
            {"name": "Updated Organization", "logo_url": "https://example.com/logo.png"}
        )
        
        assert updated_org is not None
        assert updated_org.name == "Updated Organization"
        assert updated_org.logo_url == "https://example.com/logo.png"
    
    @pytest.mark.asyncio
    async def test_get_organization_stats(self, clean_db):
        """Test getting organization statistics"""
        # Create org
        org = await OrganizationService.create_organization(
            name="Test Stats Org",
            slug="test-stats-org"
        )
        org_id = str(org.id)
        
        # Create some test data
        await users_collection.insert_one({
            "organization_id": org_id,
            "email": "testuser@test.com",
            "hashed_password": "hash",
            "role": "employee",
            "is_active": True,
            "is_verified": True,
            "created_at": datetime.utcnow()
        })
        
        await tasks_collection.insert_many([
            {
                "organization_id": org_id,
                "title": "Task 1",
                "status": "Pending",
                "category": "Recruiting",
                "priority": "High",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            {
                "organization_id": org_id,
                "title": "Task 2",
                "status": "Completed",
                "category": "Onboarding",
                "priority": "Medium",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        ])
        
        await documents_collection.insert_one({
            "organization_id": org_id,
            "filename": "test.pdf",
            "original_filename": "test.pdf",
            "file_path": "/tmp/test.pdf",
            "file_type": "pdf",
            "file_size": 1024,
            "uploaded_at": datetime.utcnow()
        })
        
        # Get stats
        stats = await OrganizationService.get_organization_stats(org_id)
        
        assert stats["active_users"] == 1
        assert stats["total_tasks"] == 2
        assert stats["completed_tasks"] == 1
        assert stats["pending_tasks"] == 1
        assert stats["total_documents"] == 1


class TestOrganizationEndpoints:
    """Test Organization API endpoints"""
    
    @pytest.mark.asyncio
    async def test_get_organization_me_endpoint(self, clean_db):
        """Test GET /organizations/me endpoint"""
        # Create organization and user
        from models import generate_slug
        from main import hash_password, create_access_token
        from datetime import timedelta
        
        org = await OrganizationService.create_organization(
            name="Test API Org",
            slug="test-api-org"
        )
        org_id = str(org.id)
        
        # Create user
        user_result = await users_collection.insert_one({
            "organization_id": org_id,
            "email": "testapi@test.com",
            "hashed_password": hash_password("password123"),
            "role": "admin",
            "is_active": True,
            "is_verified": True,
            "created_at": datetime.utcnow()
        })
        user_id = str(user_result.inserted_id)
        
        # Create token
        token = create_access_token(
            data={
                "sub": "testapi@test.com",
                "user_id": user_id,
                "organization_id": org_id,
                "role": "admin"
            },
            expires_delta=timedelta(minutes=30)
        )
        
        # Test endpoint
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/organizations/me",
                headers={"Authorization": f"Bearer {token}"}
            )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test API Org"
        assert data["slug"] == "test-api-org"
    
    @pytest.mark.asyncio
    async def test_get_organization_stats_endpoint(self, clean_db):
        """Test GET /organizations/me/stats endpoint"""
        from main import hash_password, create_access_token
        from datetime import timedelta
        
        # Create organization
        org = await OrganizationService.create_organization(
            name="Test Stats API Org",
            slug="test-stats-api-org"
        )
        org_id = str(org.id)
        
        # Create user
        user_result = await users_collection.insert_one({
            "organization_id": org_id,
            "email": "teststats@test.com",
            "hashed_password": hash_password("password123"),
            "role": "admin",
            "is_active": True,
            "is_verified": True,
            "created_at": datetime.utcnow()
        })
        user_id = str(user_result.inserted_id)
        
        # Create token
        token = create_access_token(
            data={
                "sub": "teststats@test.com",
                "user_id": user_id,
                "organization_id": org_id,
                "role": "admin"
            },
            expires_delta=timedelta(minutes=30)
        )
        
        # Test endpoint
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/organizations/me/stats",
                headers={"Authorization": f"Bearer {token}"}
            )
        
        assert response.status_code == 200
        data = response.json()
        assert "active_users" in data
        assert "total_tasks" in data
        assert "total_documents" in data
        assert data["active_users"] == 1  # The user we created


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
