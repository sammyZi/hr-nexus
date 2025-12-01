"""
Manual test script for user management endpoints
Run this with: python test_user_endpoints_manual.py
"""

import asyncio
import sys
from httpx import AsyncClient
from datetime import datetime, timedelta

# Import the app and services
from main import app, hash_password, create_access_token
from organization_service import OrganizationService
from database import organizations_collection, users_collection


async def cleanup():
    """Clean up test data"""
    await organizations_collection.delete_many({"name": {"$regex": "^TestManual"}})
    await users_collection.delete_many({"email": {"$regex": "testmanual.*@test.com"}})


async def test_user_management_endpoints():
    """Test all user management endpoints"""
    
    print("\n" + "="*60)
    print("Testing User Management Endpoints")
    print("="*60)
    
    # Cleanup before test
    await cleanup()
    
    try:
        # 1. Create test organization and users
        print("\n1. Setting up test organization and users...")
        org = await OrganizationService.create_organization(
            name="TestManual User Management Org",
            slug="testmanual-user-mgmt-org"
        )
        org_id = str(org.id)
        print(f"   ✓ Created organization: {org_id}")
        
        # Create admin user
        admin_result = await users_collection.insert_one({
            "organization_id": org_id,
            "email": "testmanualadmin@test.com",
            "hashed_password": hash_password("password123"),
            "role": "admin",
            "is_active": True,
            "is_verified": True,
            "created_at": datetime.utcnow()
        })
        admin_id = str(admin_result.inserted_id)
        print(f"   ✓ Created admin user: {admin_id}")
        
        # Create employee users
        employee1_result = await users_collection.insert_one({
            "organization_id": org_id,
            "email": "testmanualemployee1@test.com",
            "hashed_password": hash_password("password123"),
            "role": "employee",
            "is_active": True,
            "is_verified": True,
            "created_at": datetime.utcnow()
        })
        employee1_id = str(employee1_result.inserted_id)
        print(f"   ✓ Created employee1: {employee1_id}")
        
        employee2_result = await users_collection.insert_one({
            "organization_id": org_id,
            "email": "testmanualemployee2@test.com",
            "hashed_password": hash_password("password123"),
            "role": "employee",
            "is_active": True,
            "is_verified": True,
            "created_at": datetime.utcnow()
        })
        employee2_id = str(employee2_result.inserted_id)
        print(f"   ✓ Created employee2: {employee2_id}")
        
        # Create admin token
        admin_token = create_access_token(
            data={
                "sub": "testmanualadmin@test.com",
                "user_id": admin_id,
                "organization_id": org_id,
                "role": "admin"
            },
            expires_delta=timedelta(minutes=30)
        )
        
        # Create employee token
        employee_token = create_access_token(
            data={
                "sub": "testmanualemployee1@test.com",
                "user_id": employee1_id,
                "organization_id": org_id,
                "role": "employee"
            },
            expires_delta=timedelta(minutes=30)
        )
        
        # 2. Test GET /users - List all organization users
        print("\n2. Testing GET /users (list organization users)...")
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/users",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
        
        if response.status_code == 200:
            users = response.json()
            print(f"   ✓ Status: {response.status_code}")
            print(f"   ✓ Found {len(users)} users")
            assert len(users) == 3, f"Expected 3 users, got {len(users)}"
            print("   ✓ Test PASSED")
        else:
            print(f"   ✗ Status: {response.status_code}")
            print(f"   ✗ Response: {response.json()}")
            print("   ✗ Test FAILED")
            return False
        
        # 3. Test GET /users/{user_id} - Get specific user details
        print(f"\n3. Testing GET /users/{employee1_id} (get user details)...")
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                f"/users/{employee1_id}",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
        
        if response.status_code == 200:
            user = response.json()
            print(f"   ✓ Status: {response.status_code}")
            print(f"   ✓ User email: {user['email']}")
            print(f"   ✓ User role: {user['role']}")
            assert user["id"] == employee1_id
            assert user["role"] == "employee"
            print("   ✓ Test PASSED")
        else:
            print(f"   ✗ Status: {response.status_code}")
            print(f"   ✗ Response: {response.json()}")
            print("   ✗ Test FAILED")
            return False
        
        # 4. Test PUT /users/{user_id}/role - Update user role
        print(f"\n4. Testing PUT /users/{employee1_id}/role (update role to admin)...")
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.put(
                f"/users/{employee1_id}/role",
                headers={"Authorization": f"Bearer {admin_token}"},
                json={"role": "admin"}
            )
        
        if response.status_code == 200:
            user = response.json()
            print(f"   ✓ Status: {response.status_code}")
            print(f"   ✓ Updated role: {user['role']}")
            assert user["role"] == "admin"
            print("   ✓ Test PASSED")
        else:
            print(f"   ✗ Status: {response.status_code}")
            print(f"   ✗ Response: {response.json()}")
            print("   ✗ Test FAILED")
            return False
        
        # 5. Test non-admin cannot update roles
        print(f"\n5. Testing PUT /users/{employee2_id}/role (non-admin forbidden)...")
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.put(
                f"/users/{employee2_id}/role",
                headers={"Authorization": f"Bearer {employee_token}"},
                json={"role": "admin"}
            )
        
        if response.status_code == 403:
            print(f"   ✓ Status: {response.status_code} (Forbidden as expected)")
            print("   ✓ Test PASSED")
        else:
            print(f"   ✗ Status: {response.status_code} (Expected 403)")
            print(f"   ✗ Response: {response.json()}")
            print("   ✗ Test FAILED")
            return False
        
        # 6. Test DELETE /users/{user_id} - Remove user
        print(f"\n6. Testing DELETE /users/{employee2_id} (remove user)...")
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.delete(
                f"/users/{employee2_id}",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✓ Status: {response.status_code}")
            print(f"   ✓ Message: {result['message']}")
            print("   ✓ Test PASSED")
        else:
            print(f"   ✗ Status: {response.status_code}")
            print(f"   ✗ Response: {response.json()}")
            print("   ✗ Test FAILED")
            return False
        
        # 7. Test non-admin cannot remove users
        print(f"\n7. Testing DELETE /users/{employee1_id} (non-admin forbidden)...")
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.delete(
                f"/users/{employee1_id}",
                headers={"Authorization": f"Bearer {employee_token}"}
            )
        
        if response.status_code == 403:
            print(f"   ✓ Status: {response.status_code} (Forbidden as expected)")
            print("   ✓ Test PASSED")
        else:
            print(f"   ✗ Status: {response.status_code} (Expected 403)")
            print(f"   ✗ Response: {response.json()}")
            print("   ✗ Test FAILED")
            return False
        
        # 8. Test cross-organization access denied
        print("\n8. Testing cross-organization access (should be denied)...")
        
        # Create second organization
        org2 = await OrganizationService.create_organization(
            name="TestManual Org 2",
            slug="testmanual-org-2"
        )
        org2_id = str(org2.id)
        
        # Create user in org2
        user2_result = await users_collection.insert_one({
            "organization_id": org2_id,
            "email": "testmanualuser2@test.com",
            "hashed_password": hash_password("password123"),
            "role": "admin",
            "is_active": True,
            "is_verified": True,
            "created_at": datetime.utcnow()
        })
        user2_id = str(user2_result.inserted_id)
        
        # Try to access user2 (from org2) using admin token (from org1)
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                f"/users/{user2_id}",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
        
        if response.status_code == 404:
            print(f"   ✓ Status: {response.status_code} (Not found as expected)")
            print("   ✓ Test PASSED - Cross-organization access properly blocked")
        else:
            print(f"   ✗ Status: {response.status_code} (Expected 404)")
            print(f"   ✗ Response: {response.json()}")
            print("   ✗ Test FAILED")
            return False
        
        print("\n" + "="*60)
        print("✓ ALL TESTS PASSED!")
        print("="*60)
        return True
        
    except Exception as e:
        print(f"\n✗ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        # Cleanup after test
        await cleanup()
        print("\n✓ Cleanup completed")


if __name__ == "__main__":
    result = asyncio.run(test_user_management_endpoints())
    sys.exit(0 if result else 1)
