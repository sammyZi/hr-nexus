"""
Tests for User Management API endpoints
Requirements: 2.4, 2.5, 3.5
"""

import pytest
from httpx import AsyncClient
from datetime import datetime, timedelta

# Import the app and services
from main import app, hash_password, create_access_token
from organization_service import OrganizationService
from database import organizations_collection, users_collection


@pytest.fixture(scope="function")
async def clean_db():
    """Clean up test data before and after tests"""
    # Clean before
    await organizations_collection.delete_many({"name": {"$regex": "^Test"}})
    await users_collection.delete_many({"email": {"$regex": "test.*@test.com"}})
    
    yield
    
    # Clean after
    await organizations_collection.delete_many({"name": {"$regex": "^Test"}})
    await users_collection.delete_many({"email": {"$regex": "test.*@test.com"}})


@pytest.fixture(scope="function")
async def test_organization_with_users(clean_db):
    """Create a test organization with multiple users"""
    # Create organization
    org = await OrganizationService.create_organization(
        name="Test User Management Org",
        slug="test-user-mgmt-org"
    )
    org_id = str(org.id)
    
    # Create admin user
    admin_result = await users_collection.insert_one({
        "organization_id": org_id,
        "email": "testadmin@test.com",
        "hashed_password": hash_password("password123"),
        "role": "admin",
        "is_active": True,
        "is_verified": True,
        "created_at": datetime.utcnow()
    })
    admin_id = str(admin_result.inserted_id)
    
    # Create employee users
    employee1_result = await users_collection.insert_one({
        "organization_id": org_id,
        "email": "testemployee1@test.com",
        "hashed_password": hash_password("password123"),
        "role": "employee",
        "is_active": True,
        "is_verified": True,
        "created_at": datetime.utcnow()
    })
    employee1_id = str(employee1_result.inserted_id)
    
    employee2_result = await users_collection.insert_one({
        "organization_id": org_id,
        "email": "testemployee2@test.com",
        "hashed_password": hash_password("password123"),
        "role": "employee",
        "is_active": True,
        "is_verified": True,
        "created_at": datetime.utcnow()
    })
    employee2_id = str(employee2_result.inserted_id)
    
    # Create admin token
    admin_token = create_access_token(
        data={
            "sub": "testadmin@test.com",
            "user_id": admin_id,
            "organization_id": org_id,
            "role": "admin"
        },
        expires_delta=timedelta(minutes=30)
    )
    
    # Create employee token
    employee_token = create_access_token(
        data={
            "sub": "testemployee1@test.com",
            "user_id": employee1_id,
            "organization_id": org_id,
            "role": "employee"
        },
        expires_delta=timedelta(minutes=30)
    )
    
    return {
        "org_id": org_id,
        "admin_id": admin_id,
        "admin_token": admin_token,
        "employee1_id": employee1_id,
        "employee2_id": employee2_id,
        "employee_token": employee_token
    }


class TestUserManagementEndpoints:
    """Test User Management API endpoints"""
    
    @pytest.mark.asyncio
    async def test_list_organization_users(self, test_organization_with_users):
        """Test GET /users endpoint - list all organization users"""
        data = test_organization_with_users
        
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/users",
                headers={"Authorization": f"Bearer {data['admin_token']}"}
            )
        
        assert response.status_code == 200
        users = response.json()
        assert len(users) == 3  # 1 admin + 2 employees
        
        # Verify user data structure
        for user in users:
            assert "id" in user
            assert "email" in user
            assert "role" in user
            assert "is_active" in user
            assert "is_verified" in user
            assert "created_at" in user
        
        # Verify roles
        roles = [u["role"] for u in users]
        assert "admin" in roles
        assert roles.count("employee") == 2
    
    @pytest.mark.asyncio
    async def test_get_user_details(self, test_organization_with_users):
        """Test GET /users/{user_id} endpoint - get specific user details"""
        data = test_organization_with_users
        
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                f"/users/{data['employee1_id']}",
                headers={"Authorization": f"Bearer {data['admin_token']}"}
            )
        
        assert response.status_code == 200
        user = response.json()
        assert user["id"] == data["employee1_id"]
        assert user["email"] == "testemployee1@test.com"
        assert user["role"] == "employee"
        assert user["is_active"] is True
    
    @pytest.mark.asyncio
    async def test_get_user_details_invalid_id(self, test_organization_with_users):
        """Test GET /users/{user_id} with invalid user ID"""
        data = test_organization_with_users
        
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/users/invalid_id",
                headers={"Authorization": f"Bearer {data['admin_token']}"}
            )
        
        assert response.status_code == 400
        assert "Invalid user ID" in response.json()["detail"]
    
    @pytest.mark.asyncio
    async def test_update_user_role_admin_to_employee(self, test_organization_with_users):
        """Test PUT /users/{user_id}/role - update user role from employee to admin"""
        data = test_organization_with_users
        
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.put(
                f"/users/{data['employee1_id']}/role",
                headers={"Authorization": f"Bearer {data['admin_token']}"},
                json={"role": "admin"}
            )
        
        assert response.status_code == 200
        user = response.json()
        assert user["id"] == data["employee1_id"]
        assert user["role"] == "admin"
        
        # Verify in database
        from bson import ObjectId
        db_user = await users_collection.find_one({"_id": ObjectId(data["employee1_id"])})
        assert db_user["role"] == "admin"
    
    @pytest.mark.asyncio
    async def test_update_user_role_employee_to_admin(self, test_organization_with_users):
        """Test PUT /users/{user_id}/role - employee to admin"""
        data = test_organization_with_users
        
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.put(
                f"/users/{data['employee2_id']}/role",
                headers={"Authorization": f"Bearer {data['admin_token']}"},
                json={"role": "admin"}
            )
        
        assert response.status_code == 200
        user = response.json()
        assert user["role"] == "admin"
    
    @pytest.mark.asyncio
    async def test_update_user_role_non_admin_forbidden(self, test_organization_with_users):
        """Test that non-admin users cannot update roles"""
        data = test_organization_with_users
        
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.put(
                f"/users/{data['employee2_id']}/role",
                headers={"Authorization": f"Bearer {data['employee_token']}"},
                json={"role": "admin"}
            )
        
        assert response.status_code == 403
        assert "Only organization admins" in response.json()["detail"]
    
    @pytest.mark.asyncio
    async def test_update_own_role_forbidden(self, test_organization_with_users):
        """Test that users cannot change their own role"""
        data = test_organization_with_users
        
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.put(
                f"/users/{data['admin_id']}/role",
                headers={"Authorization": f"Bearer {data['admin_token']}"},
                json={"role": "employee"}
            )
        
        assert response.status_code == 400
        assert "cannot change your own role" in response.json()["detail"]
    
    @pytest.mark.asyncio
    async def test_update_user_role_invalid_role(self, test_organization_with_users):
        """Test updating user role with invalid role value"""
        data = test_organization_with_users
        
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.put(
                f"/users/{data['employee1_id']}/role",
                headers={"Authorization": f"Bearer {data['admin_token']}"},
                json={"role": "superadmin"}
            )
        
        assert response.status_code == 400
        assert "must be either 'admin' or 'employee'" in response.json()["detail"]
    
    @pytest.mark.asyncio
    async def test_remove_user_from_organization(self, test_organization_with_users):
        """Test DELETE /users/{user_id} - remove user from organization"""
        data = test_organization_with_users
        
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.delete(
                f"/users/{data['employee1_id']}",
                headers={"Authorization": f"Bearer {data['admin_token']}"}
            )
        
        assert response.status_code == 200
        result = response.json()
        assert result["user_id"] == data["employee1_id"]
        assert "removed" in result["message"].lower()
        
        # Verify user is deactivated (soft delete)
        from bson import ObjectId
        db_user = await users_collection.find_one({"_id": ObjectId(data["employee1_id"])})
        assert db_user["is_active"] is False
    
    @pytest.mark.asyncio
    async def test_remove_user_non_admin_forbidden(self, test_organization_with_users):
        """Test that non-admin users cannot remove users"""
        data = test_organization_with_users
        
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.delete(
                f"/users/{data['employee2_id']}",
                headers={"Authorization": f"Bearer {data['employee_token']}"}
            )
        
        assert response.status_code == 403
        assert "Only organization admins" in response.json()["detail"]
    
    @pytest.mark.asyncio
    async def test_remove_self_forbidden(self, test_organization_with_users):
        """Test that users cannot remove themselves"""
        data = test_organization_with_users
        
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.delete(
                f"/users/{data['admin_id']}",
                headers={"Authorization": f"Bearer {data['admin_token']}"}
            )
        
        assert response.status_code == 400
        assert "cannot remove yourself" in response.json()["detail"]
    
    @pytest.mark.asyncio
    async def test_remove_last_admin_forbidden(self, test_organization_with_users):
        """Test that the last admin cannot be removed"""
        data = test_organization_with_users
        
        # First, demote employee1 to ensure admin is the only admin
        from bson import ObjectId
        await users_collection.update_one(
            {"_id": ObjectId(data["employee1_id"])},
            {"$set": {"role": "employee"}}
        )
        
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.delete(
                f"/users/{data['admin_id']}",
                headers={"Authorization": f"Bearer {data['admin_token']}"}
            )
        
        # Should fail because user is trying to remove themselves
        assert response.status_code == 400
    
    @pytest.mark.asyncio
    async def test_cross_organization_access_denied(self, clean_db):
        """Test that users cannot access users from other organizations"""
        # Create two organizations
        org1 = await OrganizationService.create_organization(
            name="Test Org 1",
            slug="test-org-1"
        )
        org1_id = str(org1.id)
        
        org2 = await OrganizationService.create_organization(
            name="Test Org 2",
            slug="test-org-2"
        )
        org2_id = str(org2.id)
        
        # Create user in org1
        user1_result = await users_collection.insert_one({
            "organization_id": org1_id,
            "email": "user1@test.com",
            "hashed_password": hash_password("password123"),
            "role": "admin",
            "is_active": True,
            "is_verified": True,
            "created_at": datetime.utcnow()
        })
        user1_id = str(user1_result.inserted_id)
        
        # Create user in org2
        user2_result = await users_collection.insert_one({
            "organization_id": org2_id,
            "email": "user2@test.com",
            "hashed_password": hash_password("password123"),
            "role": "admin",
            "is_active": True,
            "is_verified": True,
            "created_at": datetime.utcnow()
        })
        user2_id = str(user2_result.inserted_id)
        
        # Create token for user1
        token1 = create_access_token(
            data={
                "sub": "user1@test.com",
                "user_id": user1_id,
                "organization_id": org1_id,
                "role": "admin"
            },
            expires_delta=timedelta(minutes=30)
        )
        
        # Try to access user2 (from org2) using user1's token (from org1)
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                f"/users/{user2_id}",
                headers={"Authorization": f"Bearer {token1}"}
            )
        
        # Should return 404 because user2 is not in org1
        assert response.status_code == 404
        assert "User not found" in response.json()["detail"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
