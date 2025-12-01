#!/usr/bin/env python3
"""
Test script for tenant context middleware.
Tests that the middleware correctly extracts organization context from JWT tokens.
"""

import pytest
from fastapi.testclient import TestClient
from main import app, create_access_token
from datetime import timedelta

client = TestClient(app)

def test_middleware_allows_public_endpoints():
    """Test that public endpoints don't require authentication"""
    # Health check should work without auth
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "mongodb"}
    
    print("✓ Public endpoints accessible without authentication")

def test_middleware_blocks_protected_endpoints():
    """Test that protected endpoints require authentication"""
    # Try to access tasks without auth
    response = client.get("/tasks")
    assert response.status_code == 401
    assert "Not authenticated" in response.json()["detail"]
    
    print("✓ Protected endpoints blocked without authentication")

def test_middleware_extracts_organization_context():
    """Test that middleware extracts organization context from JWT"""
    # Create a valid JWT token with organization context
    token = create_access_token(
        data={
            "sub": "test@example.com",
            "user_id": "507f1f77bcf86cd799439011",
            "organization_id": "507f1f77bcf86cd799439012",
            "role": "admin"
        },
        expires_delta=timedelta(minutes=30)
    )
    
    # Try to access protected endpoint with valid token
    # Note: This will fail at the endpoint level (no data in DB), but middleware should pass
    response = client.get(
        "/tasks",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Should not be 401 (authentication error)
    # Will be 200 with empty list since no tasks exist
    assert response.status_code == 200
    
    print("✓ Middleware successfully extracts organization context from JWT")

def test_middleware_rejects_invalid_token():
    """Test that middleware rejects invalid JWT tokens"""
    # Try with invalid token
    response = client.get(
        "/tasks",
        headers={"Authorization": "Bearer invalid_token_here"}
    )
    
    assert response.status_code == 401
    assert "Invalid authentication token" in response.json()["detail"]
    
    print("✓ Middleware rejects invalid JWT tokens")

def test_middleware_skips_options_requests():
    """Test that middleware allows OPTIONS requests (CORS preflight)"""
    response = client.options("/tasks")
    # Should not be 401
    assert response.status_code != 401
    
    print("✓ Middleware allows OPTIONS requests for CORS")

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("Tenant Context Middleware Tests")
    print("=" * 60 + "\n")
    
    test_middleware_allows_public_endpoints()
    test_middleware_blocks_protected_endpoints()
    test_middleware_extracts_organization_context()
    test_middleware_rejects_invalid_token()
    test_middleware_skips_options_requests()
    
    print("\n" + "=" * 60)
    print("✓ All middleware tests passed!")
    print("=" * 60)
