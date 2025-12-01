#!/usr/bin/env python3
"""
Test script for authentication endpoints with organization context.
Tests the JWT token structure and organization signup flow.
"""

import asyncio
import sys
from datetime import datetime
from jose import jwt
import os
from dotenv import load_dotenv
import pytest

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

from database import users_collection, organizations_collection, async_client
from main import create_access_token, hash_password
from models import generate_slug

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "secret")
ALGORITHM = "HS256"

# Configure pytest-asyncio to use function scope
pytest_plugins = ('pytest_asyncio',)

@pytest.fixture(scope="function")
async def cleanup():
    """Cleanup fixture to ensure database connections are properly managed"""
    yield
    # No cleanup needed here as each test handles its own cleanup

@pytest.mark.asyncio
async def test_jwt_token_structure():
    """Test that JWT tokens include organization context"""
    print("\n=== Testing JWT Token Structure ===")
    
    # Create a test token with organization context
    test_data = {
        "sub": "test@example.com",
        "user_id": "507f1f77bcf86cd799439011",
        "organization_id": "507f1f77bcf86cd799439012",
        "role": "admin"
    }
    
    token = create_access_token(data=test_data)
    
    # Decode and verify
    decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    
    print(f"✓ Token created successfully")
    print(f"  - sub: {decoded.get('sub')}")
    print(f"  - user_id: {decoded.get('user_id')}")
    print(f"  - organization_id: {decoded.get('organization_id')}")
    print(f"  - role: {decoded.get('role')}")
    print(f"  - exp: {decoded.get('exp')}")
    
    # Verify all required fields are present
    assert decoded.get("sub") == "test@example.com", "Missing or incorrect 'sub'"
    assert decoded.get("user_id") == "507f1f77bcf86cd799439011", "Missing or incorrect 'user_id'"
    assert decoded.get("organization_id") == "507f1f77bcf86cd799439012", "Missing or incorrect 'organization_id'"
    assert decoded.get("role") == "admin", "Missing or incorrect 'role'"
    assert "exp" in decoded, "Missing expiration"
    
    print("✓ All required fields present in JWT token")
    return True

@pytest.mark.asyncio
async def test_organization_signup_flow():
    """Test the organization signup flow"""
    print("\n=== Testing Organization Signup Flow ===")
    
    # Clean up test data if exists
    test_email = f"test-org-{datetime.utcnow().timestamp()}@example.com"
    test_org_name = f"Test Organization {datetime.utcnow().timestamp()}"
    
    # Test slug generation
    slug = generate_slug(test_org_name)
    print(f"✓ Generated slug: {slug}")
    assert "-" in slug or slug.isalnum(), "Slug should be URL-friendly"
    
    # Simulate organization creation
    new_organization = {
        "name": test_org_name,
        "slug": slug,
        "logo_url": None,
        "settings": {},
        "created_at": datetime.utcnow(),
        "is_active": True
    }
    
    org_result = await organizations_collection.insert_one(new_organization)
    organization_id = str(org_result.inserted_id)
    print(f"✓ Organization created with ID: {organization_id}")
    
    # Simulate user creation
    hashed_password = hash_password("testpassword123")
    new_user = {
        "organization_id": organization_id,
        "email": test_email,
        "hashed_password": hashed_password,
        "role": "admin",
        "is_active": True,
        "is_verified": True,  # Skip verification for test
        "verification_token": None,
        "created_at": datetime.utcnow()
    }
    
    user_result = await users_collection.insert_one(new_user)
    user_id = str(user_result.inserted_id)
    print(f"✓ Admin user created with ID: {user_id}")
    
    # Create JWT token
    token = create_access_token(
        data={
            "sub": test_email,
            "user_id": user_id,
            "organization_id": organization_id,
            "role": "admin"
        }
    )
    
    # Verify token
    decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert decoded.get("organization_id") == organization_id, "Organization ID mismatch in token"
    assert decoded.get("role") == "admin", "Role should be admin"
    print(f"✓ JWT token created with correct organization context")
    
    # Verify user in database
    db_user = await users_collection.find_one({"_id": user_result.inserted_id})
    assert db_user["organization_id"] == organization_id, "Organization ID not saved in user"
    assert db_user["role"] == "admin", "Role not saved correctly"
    print(f"✓ User has correct organization_id and role in database")
    
    # Verify organization in database
    db_org = await organizations_collection.find_one({"_id": org_result.inserted_id})
    assert db_org["name"] == test_org_name, "Organization name mismatch"
    assert db_org["slug"] == slug, "Organization slug mismatch"
    print(f"✓ Organization saved correctly in database")
    
    # Clean up
    await users_collection.delete_one({"_id": user_result.inserted_id})
    await organizations_collection.delete_one({"_id": org_result.inserted_id})
    print(f"✓ Test data cleaned up")
    
    return True

@pytest.mark.asyncio(loop_scope="function")
async def test_login_token_structure():
    """Test that login returns JWT with organization context"""
    print("\n=== Testing Login Token Structure ===")
    
    # Create a test organization and user
    test_email = f"test-login-{datetime.utcnow().timestamp()}@example.com"
    test_org_name = f"Login Test Org {datetime.utcnow().timestamp()}"
    
    # Create organization
    new_organization = {
        "name": test_org_name,
        "slug": generate_slug(test_org_name),
        "logo_url": None,
        "settings": {},
        "created_at": datetime.utcnow(),
        "is_active": True
    }
    
    org_result = await organizations_collection.insert_one(new_organization)
    organization_id = str(org_result.inserted_id)
    
    # Create user
    hashed_password = hash_password("testpassword123")
    new_user = {
        "organization_id": organization_id,
        "email": test_email,
        "hashed_password": hashed_password,
        "role": "employee",
        "is_active": True,
        "is_verified": True,
        "verification_token": None,
        "created_at": datetime.utcnow()
    }
    
    user_result = await users_collection.insert_one(new_user)
    user_id = str(user_result.inserted_id)
    
    # Simulate login - create token as login endpoint would
    token = create_access_token(
        data={
            "sub": test_email,
            "user_id": user_id,
            "organization_id": organization_id,
            "role": "employee"
        }
    )
    
    # Verify token structure
    decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert decoded.get("sub") == test_email, "Email mismatch"
    assert decoded.get("user_id") == user_id, "User ID mismatch"
    assert decoded.get("organization_id") == organization_id, "Organization ID mismatch"
    assert decoded.get("role") == "employee", "Role mismatch"
    
    print(f"✓ Login token contains all required fields:")
    print(f"  - sub: {decoded.get('sub')}")
    print(f"  - user_id: {decoded.get('user_id')}")
    print(f"  - organization_id: {decoded.get('organization_id')}")
    print(f"  - role: {decoded.get('role')}")
    
    # Clean up
    await users_collection.delete_one({"_id": user_result.inserted_id})
    await organizations_collection.delete_one({"_id": org_result.inserted_id})
    print(f"✓ Test data cleaned up")
    
    return True

async def run_tests():
    """Run all tests"""
    print("=" * 60)
    print("Authentication & JWT Tests")
    print("=" * 60)
    
    try:
        # Test 1: JWT token structure
        await test_jwt_token_structure()
        
        # Test 2: Organization signup flow
        await test_organization_signup_flow()
        
        # Test 3: Login token structure
        await test_login_token_structure()
        
        print("\n" + "=" * 60)
        print("✓ All tests passed!")
        print("=" * 60)
        
    except AssertionError as e:
        print(f"\n✗ Test failed: {e}")
        return False
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        # Close database connection
        async_client.close()
    
    return True

if __name__ == "__main__":
    result = asyncio.run(run_tests())
    sys.exit(0 if result else 1)
