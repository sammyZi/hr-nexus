from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Query, Request
import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
import secrets
import os
from typing import List, Optional
from dotenv import load_dotenv
import shutil
import uuid
import asyncio
from bson import ObjectId

from models import (
    UserInDB, TaskInDB, DocumentInDB,
    UserCreate, OrganizationSignup, UserLogin, Token, TaskCreate, TaskResponse,
    DocumentResponse, TaskCategory, generate_slug,
    OrganizationResponse, OrganizationUpdate, OrganizationStats,
    InvitationCreate, InvitationResponse, InvitationAccept,
    UserResponse, UserRoleUpdate, VerifyEmail, ResendVerification,
    CandidateStatus, CandidateCreate, CandidateUpdate, CandidateResponse,
    CaseCreate, CaseUpdate, CaseResponse, EmployeeCase, CaseStatus, CaseType,
    PayrollCreate, PayrollUpdate, PayrollResponse, PayrollStatus,
    BenefitType, EnrollmentStatus,
    BenefitPlanCreate, BenefitPlanUpdate, BenefitPlanResponse,
    BenefitEnrollmentCreate, BenefitEnrollmentUpdate, BenefitEnrollmentResponse
)
import models
from database import (
    users_collection, tasks_collection, documents_collection, 
    organizations_collection, close_database, pending_signups_collection,
    candidates_collection, cases_collection, payroll_records_collection,
    benefit_plans_collection, benefit_enrollments_collection
)
from email_utils import send_verification_email
from rag_utils import process_document, get_answer_with_fallback
from organization_service import OrganizationService
from invitation_service import InvitationService

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 525600  # 1 year (365 days * 24 hours * 60 minutes)
UPLOAD_DIR = "./uploads"

# Create uploads directory if it doesn't exist
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Password hashing functions using bcrypt
def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

app = FastAPI(title="HR Nexus API")

# Global exception handler to log validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"[VALIDATION ERROR] Path: {request.url.path}", flush=True)
    print(f"[VALIDATION ERROR] Details: {exc.errors()}", flush=True)
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"[GLOBAL ERROR] Path: {request.url.path}", flush=True)
    print(f"[GLOBAL ERROR] Type: {type(exc).__name__}", flush=True)
    print(f"[GLOBAL ERROR] Message: {str(exc)}", flush=True)
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"}
    )

# Tenant Context Middleware
class TenantContextMiddleware(BaseHTTPMiddleware):
    """
    Middleware to extract organization context from JWT and inject into request state.
    Automatically filters all queries by organization_id for data isolation.
    """
    
    # Public endpoints that don't require authentication
    PUBLIC_PATHS = [
        "/health",
        "/auth/signup",
        "/auth/login",
        "/auth/verify",
        "/organizations/signup",
        "/invitations/accept/",  # Allow invitation acceptance without auth
        "/invitations/token/",  # Allow getting invitation details without auth
        "/docs",
        "/openapi.json",
        "/redoc"
    ]
    
    async def dispatch(self, request: Request, call_next):
        # Skip authentication for public endpoints
        path = request.url.path
        
        # Check if path starts with any public path
        is_public = any(path.startswith(public_path) for public_path in self.PUBLIC_PATHS)
        
        # Also skip OPTIONS requests (CORS preflight)
        if is_public or request.method == "OPTIONS":
            return await call_next(request)
        
        # Extract JWT token from Authorization header
        auth_header = request.headers.get("Authorization", "")
        
        if not auth_header.startswith("Bearer "):
            print(f"[AUTH] No Bearer token in request to {path}", flush=True)
            print(f"[AUTH] Authorization header: {auth_header[:50] if auth_header else 'None'}", flush=True)
            return Response(
                content='{"detail":"Not authenticated"}',
                status_code=401,
                media_type="application/json"
            )
        
        token = auth_header.replace("Bearer ", "")
        
        try:
            # Decode JWT token
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            
            # Extract organization context from token
            organization_id = payload.get("organization_id")
            user_id = payload.get("user_id")
            role = payload.get("role")
            email = payload.get("sub")
            
            # Inject into request state for use in endpoints
            request.state.organization_id = organization_id
            request.state.user_id = user_id
            request.state.role = role
            request.state.email = email
            
            # Log for debugging (optional)
            print(f"[TENANT] Request from org={organization_id}, user={user_id}, role={role}", flush=True)
            
        except JWTError as e:
            return Response(
                content=f'{{"detail":"Invalid authentication token: {str(e)}"}}',
                status_code=401,
                media_type="application/json"
            )
        except Exception as e:
            return Response(
                content=f'{{"detail":"Authentication error: {str(e)}"}}',
                status_code=401,
                media_type="application/json"
            )
        
        # Continue processing the request
        response = await call_next(request)
        return response

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://192.168.1.2:3000",
        "http://192.168.1.3:3000",
        "http://192.168.163.1:3000",
        "*"  # Allow all for development
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Apply Tenant Context Middleware
app.add_middleware(TenantContextMiddleware)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    """
    Create JWT access token with organization context.
    
    Expected data keys:
    - sub: user email
    - user_id: user ID
    - organization_id: organization ID
    - role: user role ("admin" or "employee")
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@app.on_event("shutdown")
async def shutdown_event():
    close_database()

@app.get("/health")
def health_check():
    return {"status": "ok", "database": "mongodb"}

@app.options("/auth/signup")
async def signup_options():
    return {}

@app.post("/auth/signup", response_model=Token)
async def signup(user: UserCreate):
    # Check if user exists
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = hash_password(user.password)
    verification_token = secrets.token_urlsafe(32)
    
    new_user = {
        "email": user.email,
        "hashed_password": hashed_password,
        "is_active": True,
        "is_verified": False,
        "verification_token": verification_token,
        "created_at": datetime.utcnow()
    }
    
    result = await users_collection.insert_one(new_user)
    
    # Send verification email (optional - skip if email service not configured)
    try:
        await send_verification_email(user.email, verification_token)
    except Exception as e:
        print(f"Warning: Could not send verification email: {e}")
        # Continue anyway - user can verify later or skip verification in dev
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.options("/organizations/signup")
async def organization_signup_options():
    return {}

@app.post("/organizations/signup")
async def organization_signup(signup_data: OrganizationSignup):
    """
    Store signup data temporarily and send verification code.
    User and organization will be created only after email verification.
    """
    try:
        print(f"[SIGNUP] Attempting signup for email: {signup_data.email}, org: {signup_data.organization_name}", flush=True)
        
        # Check if email already exists in users or pending signups
        existing_user = await users_collection.find_one({"email": signup_data.email})
        if existing_user:
            print(f"[SIGNUP] Email already registered: {signup_data.email}", flush=True)
            raise HTTPException(status_code=400, detail="Email already registered")
        
        existing_pending = await pending_signups_collection.find_one({"email": signup_data.email})
        if existing_pending:
            # Delete old pending signup
            await pending_signups_collection.delete_one({"email": signup_data.email})
        
        # Generate organization slug
        base_slug = generate_slug(signup_data.organization_name)
        slug = base_slug
        counter = 1
        
        # Ensure slug is unique
        while await organizations_collection.find_one({"slug": slug}):
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        # Hash password
        hashed_password = hash_password(signup_data.password)
        
        # Generate 6-digit verification code
        import random
        verification_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        
        # Set expiry time (10 minutes from now)
        verification_expiry = datetime.utcnow() + timedelta(minutes=10)
        
        # Store in pending_signups collection (temporary storage)
        pending_signup = {
            "email": signup_data.email,
            "hashed_password": hashed_password,
            "organization_name": signup_data.organization_name,
            "organization_slug": slug,
            "verification_code": verification_code,
            "verification_code_expiry": verification_expiry,
            "created_at": datetime.utcnow()
        }
        
        await pending_signups_collection.insert_one(pending_signup)
        print(f"[SIGNUP] Pending signup stored for: {signup_data.email}", flush=True)
        
        # Send verification email with code
        try:
            await send_verification_email(signup_data.email, verification_code)
            print(f"[SIGNUP] Verification code sent to: {signup_data.email}", flush=True)
        except Exception as e:
            print(f"[SIGNUP] ERROR: Failed to send verification email: {e}", flush=True)
            # Delete pending signup if email fails
            await pending_signups_collection.delete_one({"email": signup_data.email})
            raise HTTPException(
                status_code=500,
                detail="Failed to send verification email. Please try again."
            )
        
        print(f"[SIGNUP] Signup initiated for: {signup_data.email}. Awaiting verification.", flush=True)
        
        # Return success message - user must verify to complete signup
        return {
            "message": "Verification code sent to your email. Please verify to complete signup.",
            "email": signup_data.email,
            "requires_verification": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[SIGNUP] ERROR: {type(e).__name__}: {str(e)}", flush=True)
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Signup failed: {str(e)}")

@app.post("/auth/verify")
async def verify_email(verify_data: models.VerifyEmail):
    """
    Verify email with 6-digit code and create organization + user.
    
    Args:
        verify_data: Email and verification code
    """
    print(f"[VERIFY] Attempting verification for: {verify_data.email}", flush=True)
    
    # Check pending signups
    pending = await pending_signups_collection.find_one({"email": verify_data.email})
    if not pending:
        raise HTTPException(status_code=400, detail="No pending signup found for this email")
    
    # Check if code matches
    if pending.get("verification_code") != verify_data.code:
        print(f"[VERIFY] Invalid code provided for: {verify_data.email}", flush=True)
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    # Check if code has expired
    if pending.get("verification_code_expiry") and pending["verification_code_expiry"] < datetime.utcnow():
        print(f"[VERIFY] Expired code for: {verify_data.email}", flush=True)
        raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new one.")
    
    # Code is valid - create organization and user
    try:
        # Create organization
        new_organization = {
            "name": pending["organization_name"],
            "slug": pending["organization_slug"],
            "logo_url": None,
            "settings": {},
            "created_at": datetime.utcnow(),
            "is_active": True
        }
        
        org_result = await organizations_collection.insert_one(new_organization)
        organization_id = str(org_result.inserted_id)
        print(f"[VERIFY] Organization created with ID: {organization_id}", flush=True)
        
        # Create user
        new_user = {
            "organization_id": organization_id,
            "email": pending["email"],
            "hashed_password": pending["hashed_password"],
            "role": "admin",
            "is_active": True,
            "is_verified": True,  # Already verified
            "created_at": datetime.utcnow()
        }
        
        user_result = await users_collection.insert_one(new_user)
        user_id = str(user_result.inserted_id)
        print(f"[VERIFY] User created with ID: {user_id}", flush=True)
        
        # Delete pending signup
        await pending_signups_collection.delete_one({"email": verify_data.email})
        print(f"[VERIFY] Pending signup removed for: {verify_data.email}", flush=True)
        
        # Create JWT token for auto-login
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={
                "sub": pending["email"],
                "user_id": user_id,
                "organization_id": organization_id,
                "role": "admin"
            },
            expires_delta=access_token_expires
        )
        
        print(f"[VERIFY] Verification successful for: {verify_data.email}", flush=True)
        
        return {
            "message": "Email verified successfully. You can now login.",
            "access_token": access_token,
            "token_type": "bearer"
        }
        
    except Exception as e:
        print(f"[VERIFY] ERROR creating user/org: {e}", flush=True)
        raise HTTPException(status_code=500, detail="Failed to create account after verification")

@app.post("/auth/resend-verification")
async def resend_verification_code(resend_data: models.ResendVerification):
    """
    Resend verification code to user's email.
    
    Args:
        resend_data: Email address
    """
    # Check pending signups
    pending = await pending_signups_collection.find_one({"email": resend_data.email})
    if not pending:
        raise HTTPException(status_code=400, detail="No pending signup found for this email")
    
    # Generate new 6-digit verification code
    import random
    verification_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    
    # Set new expiry time (10 minutes from now)
    verification_expiry = datetime.utcnow() + timedelta(minutes=10)
    
    # Update pending signup with new code
    await pending_signups_collection.update_one(
        {"email": resend_data.email},
        {"$set": {
            "verification_code": verification_code,
            "verification_code_expiry": verification_expiry
        }}
    )
    
    # Send verification email
    try:
        await send_verification_email(resend_data.email, verification_code)
        print(f"[RESEND] New verification code sent to: {resend_data.email}", flush=True)
        return {"message": "Verification code sent successfully"}
    except Exception as e:
        print(f"[RESEND] Failed to send verification email: {e}", flush=True)
        raise HTTPException(status_code=500, detail="Failed to send verification email")

@app.options("/auth/login")
async def login_options():
    return {}

@app.post("/auth/login", response_model=Token)
async def login(user: UserLogin):
    """
    Login user and return JWT with organization context.
    """
    db_user = await users_collection.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    if not db_user["is_verified"]:
        raise HTTPException(status_code=400, detail="Email not verified. Please check your email for verification link.")
    
    # Create JWT with organization context
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": db_user["email"],
            "user_id": str(db_user["_id"]),
            "organization_id": db_user.get("organization_id"),
            "role": db_user.get("role", "employee")
        },
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

# Organization endpoints
@app.get("/organizations/me", response_model=OrganizationResponse)
async def get_current_organization(request: Request):
    """
    Get current user's organization.
    Requires authentication via JWT token.
    """
    organization_id = request.state.organization_id
    
    if not organization_id:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    organization = await OrganizationService.get_organization(organization_id)
    
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    return OrganizationResponse(
        id=str(organization.id),
        name=organization.name,
        slug=organization.slug,
        logo_url=organization.logo_url,
        settings=organization.settings,
        created_at=organization.created_at,
        is_active=organization.is_active
    )

@app.put("/organizations/me", response_model=OrganizationResponse)
async def update_current_organization(request: Request, update_data: OrganizationUpdate):
    """
    Update current user's organization.
    Only organization admins can update organization settings.
    """
    organization_id = request.state.organization_id
    role = request.state.role
    
    # Check if user is admin
    if role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only organization admins can update organization settings"
        )
    
    if not organization_id:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Convert to dict and remove None values
    update_dict = update_data.model_dump(exclude_none=True)
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    organization = await OrganizationService.update_organization(organization_id, update_dict)
    
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    return OrganizationResponse(
        id=str(organization.id),
        name=organization.name,
        slug=organization.slug,
        logo_url=organization.logo_url,
        settings=organization.settings,
        created_at=organization.created_at,
        is_active=organization.is_active
    )

@app.get("/organizations/me/stats", response_model=OrganizationStats)
async def get_organization_statistics(request: Request):
    """
    Get statistics for current user's organization.
    Returns counts of users, documents, tasks, etc.
    """
    organization_id = request.state.organization_id
    
    if not organization_id:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    stats = await OrganizationService.get_organization_stats(organization_id)
    
    return OrganizationStats(**stats)

# Invitation endpoints
@app.post("/invitations", response_model=InvitationResponse)
async def create_invitation(request: Request, invitation_data: InvitationCreate):
    """
    Create and send an invitation to join the organization.
    Only organization admins can send invitations.
    
    Requirements: 2.2, 8.1
    """
    organization_id = request.state.organization_id
    user_id = request.state.user_id
    role = request.state.role
    
    # Check if user is admin
    if role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only organization admins can send invitations"
        )
    
    # Create invitation
    invitation = await InvitationService.create_invitation(
        organization_id=organization_id,
        email=invitation_data.email,
        role=invitation_data.role,
        invited_by=user_id
    )
    
    # Send invitation email
    await InvitationService.send_invitation_email(invitation)
    
    return InvitationResponse(
        id=str(invitation.id),
        organization_id=invitation.organization_id,
        email=invitation.email,
        role=invitation.role,
        status=invitation.status,
        invited_by=invitation.invited_by,
        expires_at=invitation.expires_at,
        created_at=invitation.created_at
    )

@app.get("/invitations", response_model=List[InvitationResponse])
async def list_pending_invitations(request: Request):
    """
    List all pending invitations for the organization.
    Only organization admins can view invitations.
    
    Requirements: 8.1
    """
    organization_id = request.state.organization_id
    role = request.state.role
    
    # Check if user is admin
    if role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only organization admins can view invitations"
        )
    
    invitations = await InvitationService.get_pending_invitations(organization_id)
    
    return [
        InvitationResponse(
            id=inv["id"],
            organization_id=inv["organization_id"],
            email=inv["email"],
            role=inv["role"],
            status=inv["status"],
            invited_by=inv["invited_by"],
            expires_at=inv["expires_at"],
            created_at=inv["created_at"]
        )
        for inv in invitations
    ]

@app.get("/invitations/token/{token}", response_model=InvitationResponse)
async def get_invitation_by_token(token: str):
    """
    Get invitation details by token (for invitation acceptance page).
    Public endpoint - no authentication required.
    
    Requirements: 8.3
    """
    invitation = await InvitationService.get_invitation_by_token(token)
    
    if not invitation:
        raise HTTPException(
            status_code=404,
            detail="Invitation not found"
        )
    
    return InvitationResponse(
        id=str(invitation["_id"]),
        organization_id=invitation["organization_id"],
        email=invitation["email"],
        role=invitation["role"],
        status=invitation["status"],
        invited_by=invitation["invited_by"],
        expires_at=invitation["expires_at"],
        created_at=invitation["created_at"]
    )

@app.post("/invitations/accept/{token}", response_model=Token)
async def accept_invitation(token: str, accept_data: InvitationAccept):
    """
    Accept an invitation and create a new user account.
    Returns JWT with organization context for auto-login.
    
    Requirements: 8.3, 8.5
    """
    # Accept invitation and create user
    user_data = await InvitationService.accept_invitation(
        token=token,
        password=accept_data.password
    )
    
    # Create JWT with organization context for auto-login
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user_data["email"],
            "user_id": user_data["user_id"],
            "organization_id": user_data["organization_id"],
            "role": user_data["role"]
        },
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.delete("/invitations/{invitation_id}")
async def revoke_invitation(request: Request, invitation_id: str):
    """
    Revoke a pending invitation.
    Only organization admins can revoke invitations.
    
    Requirements: 8.5
    """
    organization_id = request.state.organization_id
    role = request.state.role
    
    # Check if user is admin
    if role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only organization admins can revoke invitations"
        )
    
    await InvitationService.revoke_invitation(invitation_id, organization_id)
    
    return {"message": "Invitation revoked successfully", "invitation_id": invitation_id}

# User Management endpoints
@app.get("/users", response_model=List[UserResponse])
async def list_organization_users(request: Request):
    """
    List all users in the current organization.
    Returns user details including role and status.
    
    Requirements: 2.4, 2.5, 3.5
    """
    organization_id = request.state.organization_id
    
    # Find all users in the organization
    users = await users_collection.find({
        "organization_id": organization_id
    }).sort("created_at", -1).to_list(length=None)
    
    return [
        UserResponse(
            id=str(user["_id"]),
            email=user["email"],
            role=user.get("role", "employee"),
            is_active=user.get("is_active", True),
            is_verified=user.get("is_verified", False),
            created_at=user["created_at"]
        )
        for user in users
    ]

@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user_details(request: Request, user_id: str):
    """
    Get details of a specific user in the organization.
    
    Requirements: 2.4, 2.5, 3.5
    """
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    organization_id = request.state.organization_id
    
    # Find user and verify they belong to the same organization
    user = await users_collection.find_one({
        "_id": ObjectId(user_id),
        "organization_id": organization_id
    })
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        role=user.get("role", "employee"),
        is_active=user.get("is_active", True),
        is_verified=user.get("is_verified", False),
        created_at=user["created_at"]
    )

@app.put("/users/{user_id}/role", response_model=UserResponse)
async def update_user_role(request: Request, user_id: str, role_update: UserRoleUpdate):
    """
    Update a user's role within the organization.
    Only organization admins can update user roles.
    
    Requirements: 2.4, 2.5, 3.5
    """
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    organization_id = request.state.organization_id
    current_user_role = request.state.role
    current_user_id = request.state.user_id
    
    # Check if current user is admin
    if current_user_role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only organization admins can update user roles"
        )
    
    # Validate role value
    if role_update.role not in ["admin", "employee"]:
        raise HTTPException(
            status_code=400,
            detail="Role must be either 'admin' or 'employee'"
        )
    
    # Find user and verify they belong to the same organization
    user = await users_collection.find_one({
        "_id": ObjectId(user_id),
        "organization_id": organization_id
    })
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent user from changing their own role
    if str(user["_id"]) == current_user_id:
        raise HTTPException(
            status_code=400,
            detail="You cannot change your own role"
        )
    
    # Update user role
    await users_collection.update_one(
        {"_id": ObjectId(user_id), "organization_id": organization_id},
        {"$set": {"role": role_update.role}}
    )
    
    # Fetch updated user
    updated_user = await users_collection.find_one({"_id": ObjectId(user_id)})
    
    return UserResponse(
        id=str(updated_user["_id"]),
        email=updated_user["email"],
        role=updated_user["role"],
        is_active=updated_user.get("is_active", True),
        is_verified=updated_user.get("is_verified", False),
        created_at=updated_user["created_at"]
    )

@app.delete("/users/{user_id}")
async def remove_user_from_organization(request: Request, user_id: str):
    """
    Remove a user from the organization.
    Only organization admins can remove users.
    Users cannot remove themselves.
    
    Requirements: 2.4, 2.5, 3.5
    """
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    organization_id = request.state.organization_id
    current_user_role = request.state.role
    current_user_id = request.state.user_id
    
    # Check if current user is admin
    if current_user_role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only organization admins can remove users"
        )
    
    # Find user and verify they belong to the same organization
    user = await users_collection.find_one({
        "_id": ObjectId(user_id),
        "organization_id": organization_id
    })
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent user from removing themselves
    if str(user["_id"]) == current_user_id:
        raise HTTPException(
            status_code=400,
            detail="You cannot remove yourself from the organization"
        )
    
    # Check if this is the last admin
    admin_count = await users_collection.count_documents({
        "organization_id": organization_id,
        "role": "admin",
        "is_active": True
    })
    
    if user.get("role") == "admin" and admin_count <= 1:
        raise HTTPException(
            status_code=400,
            detail="Cannot remove the last admin from the organization"
        )
    
    # Soft delete: deactivate the user instead of hard delete
    await users_collection.update_one(
        {"_id": ObjectId(user_id), "organization_id": organization_id},
        {"$set": {"is_active": False}}
    )
    
    return {
        "message": "User removed from organization successfully",
        "user_id": user_id,
        "email": user["email"]
    }

# Task endpoints
@app.get("/tasks", response_model=List[TaskResponse])
async def get_tasks(request: Request, category: str = None):
    """
    Get all tasks for the current organization.
    Automatically filters by organization_id from JWT token.
    
    Requirements: 4.1, 10.2
    """
    # Get organization_id from request state (injected by middleware)
    organization_id = request.state.organization_id
    
    # Build query with organization filter
    query = {"organization_id": organization_id}
    
    # Maintain existing category filter
    if category and category != "All":
        query["category"] = category
    
    tasks = await tasks_collection.find(query).to_list(length=None)
    
    # Convert MongoDB documents to response format
    return [
        TaskResponse(
            id=str(task["_id"]),
            title=task["title"],
            description=task.get("description"),
            category=task["category"],
            priority=task["priority"],
            status=task["status"],
            owner_id=task.get("owner_id"),
            created_at=task["created_at"],
            updated_at=task["updated_at"]
        )
        for task in tasks
    ]

@app.post("/tasks", response_model=TaskResponse)
async def create_task(request: Request, task: TaskCreate):
    """
    Create a new task for the current organization.
    Automatically adds organization_id from JWT token.
    
    Requirements: 4.1, 10.2
    """
    # Get organization_id and user_id from request state (injected by middleware)
    organization_id = request.state.organization_id
    user_id = request.state.user_id
    
    # Create new task with organization_id
    new_task = {
        "organization_id": organization_id,
        "title": task.title,
        "description": task.description,
        "category": task.category,
        "priority": task.priority,
        "status": "Pending",
        "owner_id": user_id,  # Use current user as owner
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await tasks_collection.insert_one(new_task)
    new_task["_id"] = result.inserted_id
    
    return TaskResponse(
        id=str(new_task["_id"]),
        title=new_task["title"],
        description=new_task["description"],
        category=new_task["category"],
        priority=new_task["priority"],
        status=new_task["status"],
        owner_id=new_task["owner_id"],
        created_at=new_task["created_at"],
        updated_at=new_task["updated_at"]
    )

@app.put("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(request: Request, task_id: str, task: TaskCreate):
    """
    Update a task.
    Verifies task belongs to user's organization before updating.
    
    Requirements: 4.3, 10.2
    """
    if not ObjectId.is_valid(task_id):
        raise HTTPException(status_code=400, detail="Invalid task ID")
    
    # Get organization_id from request state
    organization_id = request.state.organization_id
    
    # Find task and verify it belongs to user's organization
    db_task = await tasks_collection.find_one({
        "_id": ObjectId(task_id),
        "organization_id": organization_id
    })
    
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Maintain existing update logic
    update_data = {
        "title": task.title,
        "description": task.description,
        "category": task.category,
        "priority": task.priority,
        "updated_at": datetime.utcnow()
    }
    
    await tasks_collection.update_one(
        {"_id": ObjectId(task_id), "organization_id": organization_id},
        {"$set": update_data}
    )
    
    updated_task = await tasks_collection.find_one({"_id": ObjectId(task_id)})
    
    return TaskResponse(
        id=str(updated_task["_id"]),
        title=updated_task["title"],
        description=updated_task["description"],
        category=updated_task["category"],
        priority=updated_task["priority"],
        status=updated_task["status"],
        owner_id=updated_task["owner_id"],
        created_at=updated_task["created_at"],
        updated_at=updated_task["updated_at"]
    )

@app.patch("/tasks/{task_id}/status")
async def update_task_status(request: Request, task_id: str, status: str = Query(...)):
    """
    Update task status.
    Verifies task belongs to user's organization before updating.
    
    Requirements: 4.3, 10.2
    """
    print(f"[TASK] Updating task {task_id} status to: {status}", flush=True)
    
    if not ObjectId.is_valid(task_id):
        raise HTTPException(status_code=400, detail="Invalid task ID")
    
    # Get organization_id from request state
    organization_id = request.state.organization_id
    
    # Find task and verify it belongs to user's organization
    db_task = await tasks_collection.find_one({
        "_id": ObjectId(task_id),
        "organization_id": organization_id
    })
    
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    old_status = db_task["status"]
    
    # Maintain existing status update logic
    await tasks_collection.update_one(
        {"_id": ObjectId(task_id), "organization_id": organization_id},
        {"$set": {"status": status, "updated_at": datetime.utcnow()}}
    )
    
    print(f"[TASK] Task {task_id} status changed: {old_status} -> {status}", flush=True)
    return {"message": "Task status updated", "task_id": task_id, "status": status}

@app.delete("/tasks/{task_id}")
async def delete_task(request: Request, task_id: str):
    """
    Delete a task.
    Verifies task belongs to user's organization before deleting.
    
    Requirements: 4.3, 10.2
    """
    if not ObjectId.is_valid(task_id):
        raise HTTPException(status_code=400, detail="Invalid task ID")
    
    # Get organization_id from request state
    organization_id = request.state.organization_id
    
    # Delete task only if it belongs to user's organization
    result = await tasks_collection.delete_one({
        "_id": ObjectId(task_id),
        "organization_id": organization_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {"message": "Task deleted successfully", "task_id": task_id}

# Candidate endpoints
@app.post("/candidates", response_model=CandidateResponse)
async def create_candidate(request: Request, candidate: CandidateCreate):
    """
    Create a new candidate for the organization.
    Automatically adds organization_id and created_by from JWT token.
    """
    organization_id = request.state.organization_id
    user_id = request.state.user_id
    
    # Create new candidate with organization_id
    new_candidate = {
        "organization_id": organization_id,
        "first_name": candidate.first_name,
        "last_name": candidate.last_name,
        "email": candidate.email,
        "phone": candidate.phone,
        "location": candidate.location,
        "linkedin_url": candidate.linkedin_url,
        "portfolio_url": candidate.portfolio_url,
        "position_applied": candidate.position_applied,
        "department": candidate.department,
        "source": candidate.source,
        "status": CandidateStatus.Applied,
        "applied_date": datetime.utcnow(),
        "expected_salary": candidate.expected_salary,
        "notice_period": candidate.notice_period,
        "years_of_experience": candidate.years_of_experience,
        "skills": candidate.skills,
        "education": candidate.education,
        "interviews": [],
        "interview_notes": None,
        "next_interview_date": None,
        "resume_url": None,
        "cover_letter_url": None,
        "rating": None,
        "tags": [],
        "notes": candidate.notes,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "created_by": user_id
    }
    
    result = await candidates_collection.insert_one(new_candidate)
    new_candidate["_id"] = result.inserted_id
    
    return CandidateResponse(
        id=str(new_candidate["_id"]),
        first_name=new_candidate["first_name"],
        last_name=new_candidate["last_name"],
        email=new_candidate["email"],
        phone=new_candidate["phone"],
        location=new_candidate["location"],
        linkedin_url=new_candidate["linkedin_url"],
        portfolio_url=new_candidate["portfolio_url"],
        position_applied=new_candidate["position_applied"],
        department=new_candidate["department"],
        source=new_candidate["source"],
        status=new_candidate["status"],
        applied_date=new_candidate["applied_date"],
        expected_salary=new_candidate["expected_salary"],
        notice_period=new_candidate["notice_period"],
        years_of_experience=new_candidate["years_of_experience"],
        skills=new_candidate["skills"],
        education=new_candidate["education"],
        interviews=new_candidate["interviews"],
        interview_notes=new_candidate["interview_notes"],
        next_interview_date=new_candidate["next_interview_date"],
        resume_url=new_candidate["resume_url"],
        cover_letter_url=new_candidate["cover_letter_url"],
        rating=new_candidate["rating"],
        tags=new_candidate["tags"],
        notes=new_candidate["notes"],
        created_at=new_candidate["created_at"],
        updated_at=new_candidate["updated_at"],
        created_by=new_candidate["created_by"]
    )

@app.get("/candidates", response_model=List[CandidateResponse])
async def get_candidates(
    request: Request, 
    status: Optional[str] = None, 
    position: Optional[str] = None,
    department: Optional[str] = None
):
    """
    Get all candidates for the current organization.
    Supports filtering by status, position, and department.
    """
    organization_id = request.state.organization_id
    
    # Build query with organization filter
    query = {"organization_id": organization_id}
    
    # Add optional filters
    if status and status != "All":
        query["status"] = status
    if position:
        query["position_applied"] = position
    if department:
        query["department"] = department
    
    candidates = await candidates_collection.find(query).sort("applied_date", -1).to_list(length=None)
    
    return [
        CandidateResponse(
            id=str(candidate["_id"]),
            first_name=candidate["first_name"],
            last_name=candidate["last_name"],
            email=candidate["email"],
            phone=candidate.get("phone"),
            location=candidate.get("location"),
            linkedin_url=candidate.get("linkedin_url"),
            portfolio_url=candidate.get("portfolio_url"),
            position_applied=candidate["position_applied"],
            department=candidate.get("department"),
            source=candidate.get("source"),
            status=candidate["status"],
            applied_date=candidate["applied_date"],
            expected_salary=candidate.get("expected_salary"),
            notice_period=candidate.get("notice_period"),
            years_of_experience=candidate.get("years_of_experience"),
            skills=candidate.get("skills", []),
            education=candidate.get("education"),
            interviews=candidate.get("interviews", []),
            interview_notes=candidate.get("interview_notes"),
            next_interview_date=candidate.get("next_interview_date"),
            resume_url=candidate.get("resume_url"),
            cover_letter_url=candidate.get("cover_letter_url"),
            rating=candidate.get("rating"),
            tags=candidate.get("tags", []),
            notes=candidate.get("notes"),
            created_at=candidate["created_at"],
            updated_at=candidate["updated_at"],
            created_by=candidate.get("created_by")
        )
        for candidate in candidates
    ]

@app.get("/candidates/{candidate_id}", response_model=CandidateResponse)
async def get_candidate(request: Request, candidate_id: str):
    """
    Get a specific candidate by ID.
    Verifies candidate belongs to user's organization.
    """
    if not ObjectId.is_valid(candidate_id):
        raise HTTPException(status_code=400, detail="Invalid candidate ID")
    
    organization_id = request.state.organization_id
    
    candidate = await candidates_collection.find_one({
        "_id": ObjectId(candidate_id),
        "organization_id": organization_id
    })
    
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    return CandidateResponse(
        id=str(candidate["_id"]),
        first_name=candidate["first_name"],
        last_name=candidate["last_name"],
        email=candidate["email"],
        phone=candidate.get("phone"),
        location=candidate.get("location"),
        linkedin_url=candidate.get("linkedin_url"),
        portfolio_url=candidate.get("portfolio_url"),
        position_applied=candidate["position_applied"],
        department=candidate.get("department"),
        source=candidate.get("source"),
        status=candidate["status"],
        applied_date=candidate["applied_date"],
        expected_salary=candidate.get("expected_salary"),
        notice_period=candidate.get("notice_period"),
        years_of_experience=candidate.get("years_of_experience"),
        skills=candidate.get("skills", []),
        education=candidate.get("education"),
        interviews=candidate.get("interviews", []),
        interview_notes=candidate.get("interview_notes"),
        next_interview_date=candidate.get("next_interview_date"),
        resume_url=candidate.get("resume_url"),
        cover_letter_url=candidate.get("cover_letter_url"),
        rating=candidate.get("rating"),
        tags=candidate.get("tags", []),
        notes=candidate.get("notes"),
        created_at=candidate["created_at"],
        updated_at=candidate["updated_at"],
        created_by=candidate.get("created_by")
    )

@app.put("/candidates/{candidate_id}", response_model=CandidateResponse)
async def update_candidate(request: Request, candidate_id: str, candidate: CandidateUpdate):
    """
    Update a candidate.
    Verifies candidate belongs to user's organization before updating.
    """
    if not ObjectId.is_valid(candidate_id):
        raise HTTPException(status_code=400, detail="Invalid candidate ID")
    
    organization_id = request.state.organization_id
    
    # Find candidate and verify it belongs to user's organization
    db_candidate = await candidates_collection.find_one({
        "_id": ObjectId(candidate_id),
        "organization_id": organization_id
    })
    
    if not db_candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Build update data from non-None fields
    update_data = {k: v for k, v in candidate.model_dump(exclude_none=True).items()}
    update_data["updated_at"] = datetime.utcnow()
    
    # Update candidate
    await candidates_collection.update_one(
        {"_id": ObjectId(candidate_id), "organization_id": organization_id},
        {"$set": update_data}
    )
    
    updated_candidate = await candidates_collection.find_one({"_id": ObjectId(candidate_id)})
    
    return CandidateResponse(
        id=str(updated_candidate["_id"]),
        first_name=updated_candidate["first_name"],
        last_name=updated_candidate["last_name"],
        email=updated_candidate["email"],
        phone=updated_candidate.get("phone"),
        location=updated_candidate.get("location"),
        linkedin_url=updated_candidate.get("linkedin_url"),
        portfolio_url=updated_candidate.get("portfolio_url"),
        position_applied=updated_candidate["position_applied"],
        department=updated_candidate.get("department"),
        source=updated_candidate.get("source"),
        status=updated_candidate["status"],
        applied_date=updated_candidate["applied_date"],
        expected_salary=updated_candidate.get("expected_salary"),
        notice_period=updated_candidate.get("notice_period"),
        years_of_experience=updated_candidate.get("years_of_experience"),
        skills=updated_candidate.get("skills", []),
        education=updated_candidate.get("education"),
        interviews=updated_candidate.get("interviews", []),
        interview_notes=updated_candidate.get("interview_notes"),
        next_interview_date=updated_candidate.get("next_interview_date"),
        resume_url=updated_candidate.get("resume_url"),
        cover_letter_url=updated_candidate.get("cover_letter_url"),
        rating=updated_candidate.get("rating"),
        tags=updated_candidate.get("tags", []),
        notes=updated_candidate.get("notes"),
        created_at=updated_candidate["created_at"],
        updated_at=updated_candidate["updated_at"],
        created_by=updated_candidate.get("created_by")
    )

@app.patch("/candidates/{candidate_id}/status")
async def update_candidate_status(request: Request, candidate_id: str, status: str = Query(...)):
    """
    Update candidate status in the hiring pipeline.
    Verifies candidate belongs to user's organization before updating.
    """
    if not ObjectId.is_valid(candidate_id):
        raise HTTPException(status_code=400, detail="Invalid candidate ID")
    
    organization_id = request.state.organization_id
    
    # Verify candidate belongs to organization
    db_candidate = await candidates_collection.find_one({
        "_id": ObjectId(candidate_id),
        "organization_id": organization_id
    })
    
    if not db_candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Update status
    await candidates_collection.update_one(
        {"_id": ObjectId(candidate_id), "organization_id": organization_id},
        {"$set": {"status": status, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Candidate status updated", "candidate_id": candidate_id, "status": status}

@app.delete("/candidates/{candidate_id}")
async def delete_candidate(request: Request, candidate_id: str):
    """
    Delete a candidate.
    Verifies candidate belongs to user's organization before deleting.
    """
    if not ObjectId.is_valid(candidate_id):
        raise HTTPException(status_code=400, detail="Invalid candidate ID")
    
    organization_id = request.state.organization_id
    
    # Delete candidate only if it belongs to user's organization
    result = await candidates_collection.delete_one({
        "_id": ObjectId(candidate_id),
        "organization_id": organization_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    return {"message": "Candidate deleted successfully", "candidate_id": candidate_id}

@app.post("/candidates/{candidate_id}/interview")
async def schedule_interview(
    request: Request,
    candidate_id: str,
    interview_date: datetime,
    interview_type: str,
    interviewer_name: Optional[str] = None,
    meeting_link: Optional[str] = None,
    duration_minutes: int = 60,
    notes: Optional[str] = None
):
    """
    Schedule an interview for a candidate.
    Adds interview to candidate's interviews array and updates next_interview_date.
    """
    if not ObjectId.is_valid(candidate_id):
        raise HTTPException(status_code=400, detail="Invalid candidate ID")
    
    organization_id = request.state.organization_id
    user_id = request.state.user_id
    
    # Verify candidate belongs to organization
    db_candidate = await candidates_collection.find_one({
        "_id": ObjectId(candidate_id),
        "organization_id": organization_id
    })
    
    if not db_candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Create new interview
    new_interview = {
        "date": interview_date,
        "interview_type": interview_type,
        "interviewer_id": user_id,
        "interviewer_name": interviewer_name,
        "status": "Scheduled",
        "notes": notes,
        "duration_minutes": duration_minutes,
        "meeting_link": meeting_link
    }
    
    # Add interview to array and update next_interview_date
    await candidates_collection.update_one(
        {"_id": ObjectId(candidate_id), "organization_id": organization_id},
        {
            "$push": {"interviews": new_interview},
            "$set": {
                "next_interview_date": interview_date,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {
        "message": "Interview scheduled successfully",
        "candidate_id": candidate_id,
        "interview": new_interview
    }

# Document endpoints
from fastapi import BackgroundTasks

# Store processing status
processing_status = {}

def process_document_background(doc_id: str, file_path: str, file_ext: str, organization_id: str):
    """Background task to process document with organization context"""
    try:
        processing_status[doc_id] = {"status": "processing", "progress": 0}
        print(f"[DOC {doc_id}] Starting processing for org {organization_id}...")
        
        # Process document with organization_id for vector DB isolation
        result = process_document(file_path, file_ext, organization_id)
        
        if result.get("success"):
            processing_status[doc_id] = {
                "status": "completed",
                "progress": 100,
                "message": result.get("message"),
                "num_chunks": result.get("num_chunks")
            }
            print(f"[DOC {doc_id}] ✓ Processing completed - {result.get('num_chunks')} chunks created")
        else:
            processing_status[doc_id] = {
                "status": "failed",
                "progress": 0,
                "message": result.get("message")
            }
            print(f"[DOC {doc_id}] ✗ Processing failed: {result.get('message')}")
    except Exception as e:
        processing_status[doc_id] = {
            "status": "failed",
            "progress": 0,
            "message": str(e)
        }
        print(f"[DOC {doc_id}] ✗ Processing error: {str(e)}")

@app.get("/documents/{doc_id}/status")
async def get_document_status(request: Request, doc_id: str):
    """Get processing status of a document"""
    if not ObjectId.is_valid(doc_id):
        raise HTTPException(status_code=400, detail="Invalid document ID")
    
    # Get organization_id from request state
    organization_id = request.state.organization_id
    
    # Verify document belongs to user's organization
    doc = await documents_collection.find_one({
        "_id": ObjectId(doc_id),
        "organization_id": organization_id
    })
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    status = processing_status.get(doc_id, {"status": "unknown"})
    return status

@app.post("/documents/upload", response_model=DocumentResponse)
async def upload_document(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    category: Optional[str] = Form(None)
):
    """
    Upload a document for the current organization.
    Automatically adds organization_id and organizes files by organization.
    
    Requirements: 4.4, 10.3
    """
    # Get organization_id from request state (injected by middleware)
    organization_id = request.state.organization_id
    
    # Validate file type
    allowed_extensions = ['pdf', 'docx', 'doc', 'txt']
    file_ext = file.filename.split('.')[-1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"File type not supported. Allowed: {', '.join(allowed_extensions)}")
    
    # Organize uploads by organization (./uploads/{org_id}/)
    org_upload_dir = os.path.join(UPLOAD_DIR, organization_id)
    os.makedirs(org_upload_dir, exist_ok=True)
    
    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(org_upload_dir, unique_filename)
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        file_size = os.path.getsize(file_path)
        
        # Save to database with organization_id
        new_doc = {
            "organization_id": organization_id,  # NEW: Add organization_id
            "filename": unique_filename,
            "original_filename": file.filename,
            "file_path": file_path,
            "file_type": file_ext,
            "file_size": file_size,
            "uploaded_at": datetime.utcnow(),
            "category": category
        }
        
        result = await documents_collection.insert_one(new_doc)
        doc_id = str(result.inserted_id)
        
        # Process document in background with organization_id
        processing_status[doc_id] = {"status": "queued", "progress": 0}
        background_tasks.add_task(process_document_background, doc_id, file_path, file_ext, organization_id)
        
        return DocumentResponse(
            id=doc_id,
            filename=unique_filename,
            original_filename=file.filename,
            file_type=file_ext,
            file_size=file_size,
            uploaded_at=new_doc["uploaded_at"],
            category=category
        )
    
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Error uploading document: {str(e)}")

@app.get("/documents", response_model=List[DocumentResponse])
async def get_documents(request: Request, category: Optional[str] = None):
    """
    Get all documents for the current organization.
    Automatically filters by organization_id from JWT token.
    
    Requirements: 4.1, 10.3
    """
    # Get organization_id from request state (injected by middleware)
    organization_id = request.state.organization_id
    
    # Build query with organization filter
    query = {"organization_id": organization_id}
    
    # Maintain existing category filter
    if category:
        query["category"] = category
    
    documents = await documents_collection.find(query).sort("uploaded_at", -1).to_list(length=None)
    
    return [
        DocumentResponse(
            id=str(doc["_id"]),
            filename=doc["filename"],
            original_filename=doc["original_filename"],
            file_type=doc["file_type"],
            file_size=doc["file_size"],
            uploaded_at=doc["uploaded_at"],
            category=doc.get("category")
        )
        for doc in documents
    ]

@app.get("/documents/{doc_id}/view")
async def view_document(request: Request, doc_id: str):
    """
    View a document inline in browser.
    Verifies document belongs to user's organization before serving.
    
    Requirements: 4.3, 10.3
    """
    if not ObjectId.is_valid(doc_id):
        raise HTTPException(status_code=400, detail="Invalid document ID")
    
    # Get organization_id from request state
    organization_id = request.state.organization_id
    
    # Find document and verify it belongs to user's organization
    doc = await documents_collection.find_one({
        "_id": ObjectId(doc_id),
        "organization_id": organization_id
    })
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if not os.path.exists(doc["file_path"]):
        raise HTTPException(status_code=404, detail="File not found on server")
    
    from fastapi.responses import FileResponse
    
    media_type_map = {
        'pdf': 'application/pdf',
        'txt': 'text/plain',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'doc': 'application/msword'
    }
    
    media_type = media_type_map.get(doc["file_type"], 'application/octet-stream')
    
    return FileResponse(
        path=doc["file_path"],
        filename=doc["original_filename"],
        media_type=media_type,
        headers={
            "Content-Disposition": f"inline; filename={doc['original_filename']}"
        }
    )

@app.get("/documents/view-by-name/{filename:path}")
async def view_document_by_name(request: Request, filename: str):
    """
    View a document by its original filename (used by AI citations).
    Verifies document belongs to user's organization before serving.
    
    Requirements: 4.3, 10.3
    """
    from urllib.parse import unquote
    
    # Get organization_id from request state
    organization_id = request.state.organization_id
    
    decoded_filename = unquote(filename)
    print(f"[DOC] Looking for document: {decoded_filename} in org: {organization_id}", flush=True)
    
    # Find document with organization filter
    doc = await documents_collection.find_one({
        "original_filename": decoded_filename,
        "organization_id": organization_id
    })
    
    if not doc:
        # Try case-insensitive search with organization filter
        doc = await documents_collection.find_one({
            "original_filename": {"$regex": decoded_filename, "$options": "i"},
            "organization_id": organization_id
        })
    
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document '{decoded_filename}' not found")
    
    if not os.path.exists(doc["file_path"]):
        raise HTTPException(status_code=404, detail="File not found on server")
    
    from fastapi.responses import FileResponse
    
    media_type_map = {
        'pdf': 'application/pdf',
        'txt': 'text/plain',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'doc': 'application/msword'
    }
    
    media_type = media_type_map.get(doc["file_type"], 'application/octet-stream')
    
    print(f"[DOC] Found document: {doc['original_filename']} (ID: {str(doc['_id'])})", flush=True)
    
    return FileResponse(
        path=doc["file_path"],
        filename=doc["original_filename"],
        media_type=media_type,
        headers={
            "Content-Disposition": f"inline; filename={doc['original_filename']}"
        }
    )

@app.get("/documents/{doc_id}/download")
async def download_document(request: Request, doc_id: str):
    """
    Download a document.
    Verifies document belongs to user's organization before serving.
    
    Requirements: 4.3, 10.3
    """
    if not ObjectId.is_valid(doc_id):
        raise HTTPException(status_code=400, detail="Invalid document ID")
    
    # Get organization_id from request state
    organization_id = request.state.organization_id
    
    # Find document and verify it belongs to user's organization
    doc = await documents_collection.find_one({
        "_id": ObjectId(doc_id),
        "organization_id": organization_id
    })
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if not os.path.exists(doc["file_path"]):
        raise HTTPException(status_code=404, detail="File not found on server")
    
    from fastapi.responses import FileResponse
    return FileResponse(
        path=doc["file_path"],
        filename=doc["original_filename"],
        media_type='application/octet-stream',
        headers={
            "Content-Disposition": f"attachment; filename={doc['original_filename']}"
        }
    )

@app.delete("/documents/{doc_id}")
async def delete_document(request: Request, doc_id: str):
    """
    Delete a document.
    Verifies document belongs to user's organization before deleting.
    Maintains existing delete logic including vector DB cleanup.
    
    Requirements: 4.3, 10.3
    """
    if not ObjectId.is_valid(doc_id):
        raise HTTPException(status_code=400, detail="Invalid document ID")
    
    # Get organization_id from request state
    organization_id = request.state.organization_id
    
    # Find document and verify it belongs to user's organization
    doc = await documents_collection.find_one({
        "_id": ObjectId(doc_id),
        "organization_id": organization_id
    })
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete from vector database with organization filter
    try:
        from langchain_community.embeddings import OllamaEmbeddings
        from langchain_chroma import Chroma
        
        PERSIST_DIRECTORY = "./chroma_db"
        OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        
        if os.path.exists(PERSIST_DIRECTORY):
            embeddings = OllamaEmbeddings(
                base_url=OLLAMA_BASE_URL,
                model="nomic-embed-text"
            )
            vectordb = Chroma(persist_directory=PERSIST_DIRECTORY, embedding_function=embeddings)
            
            # Filter by both file_path and organization_id to ensure only organization's documents are deleted
            vectordb.delete(where={
                "source_file": doc["file_path"],
                "organization_id": organization_id
            })
            print(f"Deleted document chunks from vector DB: {doc['file_path']} (org: {organization_id})")
    except Exception as e:
        print(f"Error deleting from vector DB: {e}")
    
    # Delete physical file
    if os.path.exists(doc["file_path"]):
        os.remove(doc["file_path"])
    
    # Delete from database
    await documents_collection.delete_one({
        "_id": ObjectId(doc_id),
        "organization_id": organization_id
    })
    
    return {"message": "Document deleted successfully from all locations", "doc_id": doc_id}

# Chat endpoint
@app.options("/chat")
async def chat_options():
    return {}

from fastapi.responses import StreamingResponse
import json as json_lib

@app.post("/chat")
async def chat(
    request: Request,
    query: str = Form(...), 
    file: Optional[UploadFile] = File(None),
    history: Optional[str] = Form(None),
    stream: Optional[str] = Form("false")
):
    """
    Chat endpoint with AI assistant using RAG.
    Automatically filters by organization context for multi-tenant isolation.
    
    Requirements: 5.1, 5.4, 10.4
    """
    try:
        # Extract organization_id from request.state (injected by middleware)
        organization_id = getattr(request.state, "organization_id", None)
        
        if file:
            file_ext = file.filename.split('.')[-1].lower()
            temp_path = f"temp_{uuid.uuid4()}_{file.filename}"
            
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Pass organization_id to process_document for multi-tenant isolation
            result = process_document(temp_path, file_ext, organization_id)
            os.remove(temp_path)
            
            if not result.get("success"):
                raise HTTPException(status_code=500, detail=result.get("message"))
        
        if query:
            conversation_history = []
            if history:
                try:
                    conversation_history = json_lib.loads(history)
                except:
                    conversation_history = []
            
            if stream == "true":
                async def generate():
                    try:
                        # Pass organization_id to RAG function for filtering
                        for chunk, source, done in get_answer_with_fallback(query, conversation_history, stream=True, organization_id=organization_id):
                            yield f"data: {json_lib.dumps({'chunk': chunk, 'done': done, 'source': source})}\n\n"
                            await asyncio.sleep(0)
                    except Exception as e:
                        yield f"data: {json_lib.dumps({'chunk': f'Error: {str(e)}', 'done': True, 'source': 'error'})}\n\n"
                
                return StreamingResponse(generate(), media_type="text/event-stream")
            else:
                # Pass organization_id to RAG function for filtering
                answer, source = get_answer_with_fallback(query, conversation_history, organization_id=organization_id)
                return {"answer": answer, "query": query, "source": source}
        else:
            return {"message": "Document processed successfully", "query": ""}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")


# ============================================================================
# EMPLOYEE RELATIONS - CASE MANAGEMENT ENDPOINTS
# ============================================================================

@app.get("/cases", response_model=List[CaseResponse])
async def get_all_cases(request: Request, status: Optional[str] = None):
    """
    Get all employee relations cases for the organization.
    Optionally filter by status.
    
    Args:
        request: Request object with organization context
        status: Optional status filter (Open, Investigating, Action Required, Resolved, Closed)
    """
    organization_id = request.state.organization_id
    
    # Build query filter
    query_filter = {"organization_id": organization_id}
    if status and status != "All":
        query_filter["status"] = status
    
    # Fetch cases from database
    cases_cursor = cases_collection.find(query_filter).sort("created_at", -1)
    cases_list = await cases_cursor.to_list(length=None)
    
    # Convert to response model
    return [
        CaseResponse(
            id=str(case["_id"]),
            organization_id=case["organization_id"],
            title=case["title"],
            description=case["description"],
            case_type=case["case_type"],
            status=case["status"],
            priority=case["priority"],
            employee_name=case["employee_name"],
            reporter_name=case.get("reporter_name", "Unknown"),
            date_reported=case.get("date_reported", case["created_at"]),
            incident_date=case.get("incident_date"),
            actions_taken=case.get("actions_taken", []),
            is_confidential=case.get("is_confidential", True),
            created_at=case["created_at"],
            updated_at=case["updated_at"]
        )
        for case in cases_list
    ]

@app.get("/cases/{case_id}", response_model=CaseResponse)
async def get_case_by_id(request: Request, case_id: str):
    """
    Get a specific employee relations case by ID.
    Verifies the case belongs to the user's organization.
    
    Args:
        request: Request object with organization context
        case_id: Case ID to retrieve
    """
    if not ObjectId.is_valid(case_id):
        raise HTTPException(status_code=400, detail="Invalid case ID")
    
    organization_id = request.state.organization_id
    
    # Find case and verify organization
    case = await cases_collection.find_one({
        "_id": ObjectId(case_id),
        "organization_id": organization_id
    })
    
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    return CaseResponse(
        id=str(case["_id"]),
        organization_id=case["organization_id"],
        title=case["title"],
        description=case["description"],
        case_type=case["case_type"],
        status=case["status"],
        priority=case["priority"],
        employee_name=case["employee_name"],
        reporter_name=case.get("reporter_name", "Unknown"),
        date_reported=case.get("date_reported", case["created_at"]),
        incident_date=case.get("incident_date"),
        actions_taken=case.get("actions_taken", []),
        is_confidential=case.get("is_confidential", True),
        created_at=case["created_at"],
        updated_at=case["updated_at"]
    )

@app.post("/cases", response_model=CaseResponse)
async def create_case(request: Request, case_data: CaseCreate):
    """
    Create a new employee relations case.
    Auto-populates organization_id and reporter information from JWT.
    
    Args:
        request: Request object with organization context
        case_data: Case creation data
    """
    organization_id = request.state.organization_id
    user_email = request.state.email
    
    # Create new case document
    new_case = {
        "organization_id": organization_id,
        "title": case_data.title,
        "description": case_data.description,
        "case_type": case_data.case_type,
        "status": CaseStatus.Open,
        "priority": case_data.priority,
        "employee_name": case_data.employee_name,
        "reporter_name": user_email,  # Use current user's email as reporter
        "date_reported": datetime.utcnow(),
        "incident_date": case_data.incident_date,
        "location": case_data.location,
        "actions_taken": [],
        "is_confidential": case_data.is_confidential,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # Insert into database
    result = await cases_collection.insert_one(new_case)
    
    # Fetch the created case
    created_case = await cases_collection.find_one({"_id": result.inserted_id})
    
    return CaseResponse(
        id=str(created_case["_id"]),
        organization_id=created_case["organization_id"],
        title=created_case["title"],
        description=created_case["description"],
        case_type=created_case["case_type"],
        status=created_case["status"],
        priority=created_case["priority"],
        employee_name=created_case["employee_name"],
        reporter_name=created_case["reporter_name"],
        date_reported=created_case["date_reported"],
        incident_date=created_case.get("incident_date"),
        actions_taken=created_case["actions_taken"],
        is_confidential=created_case["is_confidential"],
        created_at=created_case["created_at"],
        updated_at=created_case["updated_at"]
    )

@app.patch("/cases/{case_id}", response_model=CaseResponse)
async def update_case(request: Request, case_id: str, case_update: CaseUpdate):
    """
    Update an existing employee relations case.
    Verifies the case belongs to the user's organization.
    
    Args:
        request: Request object with organization context
        case_id: Case ID to update
        case_update: Update data
    """
    if not ObjectId.is_valid(case_id):
        raise HTTPException(status_code=400, detail="Invalid case ID")
    
    organization_id = request.state.organization_id
    
    # Verify case exists and belongs to organization
    existing_case = await cases_collection.find_one({
        "_id": ObjectId(case_id),
        "organization_id": organization_id
    })
    
    if not existing_case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Build update document
    update_dict = case_update.model_dump(exclude_none=True)
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Always update the updated_at timestamp
    update_dict["updated_at"] = datetime.utcnow()
    
    # Update the case
    await cases_collection.update_one(
        {"_id": ObjectId(case_id)},
        {"$set": update_dict}
    )
    
    # Fetch updated case
    updated_case = await cases_collection.find_one({"_id": ObjectId(case_id)})
    
    return CaseResponse(
        id=str(updated_case["_id"]),
        organization_id=updated_case["organization_id"],
        title=updated_case["title"],
        description=updated_case["description"],
        case_type=updated_case["case_type"],
        status=updated_case["status"],
        priority=updated_case["priority"],
        employee_name=updated_case["employee_name"],
        reporter_name=updated_case.get("reporter_name", "Unknown"),
        date_reported=updated_case.get("date_reported", updated_case["created_at"]),
        incident_date=updated_case.get("incident_date"),
        actions_taken=updated_case.get("actions_taken", []),
        is_confidential=updated_case.get("is_confidential", True),
        created_at=updated_case["created_at"],
        updated_at=updated_case["updated_at"]
    )


# ============================================================================
# PAYROLL ENDPOINTS
# ============================================================================

@app.get("/payroll", response_model=List[PayrollResponse])
async def get_payroll_records(
    request: Request,
    status: Optional[str] = Query(None),
    employee_id: Optional[str] = Query(None)
):
    """
    Get all payroll records for the organization.
    Optionally filter by status or employee_id.
    
    Args:
        request: Request object with organization context
        status: Optional status filter
        employee_id: Optional employee ID filter
    """
    organization_id = request.state.organization_id
    
    # Build query filter
    query_filter = {"organization_id": organization_id}
    
    if status and status != "All":
        query_filter["status"] = status
    
    if employee_id:
        query_filter["employee_id"] = employee_id
    
    # Fetch payroll records
    payroll_records = await payroll_records_collection.find(query_filter).sort("payment_date", -1).to_list(length=None)
    
    return [
        PayrollResponse(
            id=str(record["_id"]),
            organization_id=record["organization_id"],
            employee_id=record["employee_id"],
            employee_name=record["employee_name"],
            employee_email=record["employee_email"],
            department=record.get("department"),
            position=record.get("position"),
            pay_period_start=record["pay_period_start"],
            pay_period_end=record["pay_period_end"],
            payment_date=record["payment_date"],
            base_salary=record["base_salary"],
            overtime_hours=record.get("overtime_hours", 0.0),
            overtime_rate=record.get("overtime_rate", 0.0),
            overtime_pay=record.get("overtime_pay", 0.0),
            bonus=record.get("bonus", 0.0),
            commission=record.get("commission", 0.0),
            tax_deduction=record.get("tax_deduction", 0.0),
            health_insurance=record.get("health_insurance", 0.0),
            retirement_contribution=record.get("retirement_contribution", 0.0),
            other_deductions=record.get("other_deductions", 0.0),
            gross_pay=record["gross_pay"],
            total_deductions=record["total_deductions"],
            net_pay=record["net_pay"],
            status=record.get("status", "Draft"),
            payment_method=record.get("payment_method", "Direct Deposit"),
            bank_account_last4=record.get("bank_account_last4"),
            notes=record.get("notes"),
            approved_by=record.get("approved_by"),
            approved_at=record.get("approved_at"),
            created_at=record["created_at"],
            updated_at=record["updated_at"],
            created_by=record.get("created_by")
        )
        for record in payroll_records
    ]

@app.get("/payroll/{payroll_id}", response_model=PayrollResponse)
async def get_payroll_record(request: Request, payroll_id: str):
    """
    Get a specific payroll record by ID.
    Verifies the record belongs to the user's organization.
    
    Args:
        request: Request object with organization context
        payroll_id: Payroll record ID
    """
    if not ObjectId.is_valid(payroll_id):
        raise HTTPException(status_code=400, detail="Invalid payroll ID")
    
    organization_id = request.state.organization_id
    
    # Fetch payroll record
    record = await payroll_records_collection.find_one({
        "_id": ObjectId(payroll_id),
        "organization_id": organization_id
    })
    
    if not record:
        raise HTTPException(status_code=404, detail="Payroll record not found")
    
    return PayrollResponse(
        id=str(record["_id"]),
        organization_id=record["organization_id"],
        employee_id=record["employee_id"],
        employee_name=record["employee_name"],
        employee_email=record["employee_email"],
        department=record.get("department"),
        position=record.get("position"),
        pay_period_start=record["pay_period_start"],
        pay_period_end=record["pay_period_end"],
        payment_date=record["payment_date"],
        base_salary=record["base_salary"],
        overtime_hours=record.get("overtime_hours", 0.0),
        overtime_rate=record.get("overtime_rate", 0.0),
        overtime_pay=record.get("overtime_pay", 0.0),
        bonus=record.get("bonus", 0.0),
        commission=record.get("commission", 0.0),
        tax_deduction=record.get("tax_deduction", 0.0),
        health_insurance=record.get("health_insurance", 0.0),
        retirement_contribution=record.get("retirement_contribution", 0.0),
        other_deductions=record.get("other_deductions", 0.0),
        gross_pay=record["gross_pay"],
        total_deductions=record["total_deductions"],
        net_pay=record["net_pay"],
        status=record.get("status", "Draft"),
        payment_method=record.get("payment_method", "Direct Deposit"),
        bank_account_last4=record.get("bank_account_last4"),
        notes=record.get("notes"),
        approved_by=record.get("approved_by"),
        approved_at=record.get("approved_at"),
        created_at=record["created_at"],
        updated_at=record["updated_at"],
        created_by=record.get("created_by")
    )

@app.post("/payroll", response_model=PayrollResponse)
async def create_payroll_record(request: Request, payroll_data: PayrollCreate):
    """
    Create a new payroll record.
    Automatically calculates overtime pay, gross pay, total deductions, and net pay.
    
    Args:
        request: Request object with organization context
        payroll_data: Payroll record data
    """
    organization_id = request.state.organization_id
    user_id = request.state.user_id
    
    # Calculate overtime pay
    overtime_pay = payroll_data.overtime_hours * payroll_data.overtime_rate
    
    # Calculate gross pay
    gross_pay = (
        payroll_data.base_salary +
        overtime_pay +
        payroll_data.bonus +
        payroll_data.commission
    )
    
    # Calculate total deductions
    total_deductions = (
        payroll_data.tax_deduction +
        payroll_data.health_insurance +
        payroll_data.retirement_contribution +
        payroll_data.other_deductions
    )
    
    # Calculate net pay
    net_pay = gross_pay - total_deductions
    
    # Create payroll record
    new_record = {
        "organization_id": organization_id,
        "employee_id": payroll_data.employee_id,
        "employee_name": payroll_data.employee_name,
        "employee_email": payroll_data.employee_email,
        "department": payroll_data.department,
        "position": payroll_data.position,
        "pay_period_start": payroll_data.pay_period_start,
        "pay_period_end": payroll_data.pay_period_end,
        "payment_date": payroll_data.payment_date,
        "base_salary": payroll_data.base_salary,
        "overtime_hours": payroll_data.overtime_hours,
        "overtime_rate": payroll_data.overtime_rate,
        "overtime_pay": overtime_pay,
        "bonus": payroll_data.bonus,
        "commission": payroll_data.commission,
        "tax_deduction": payroll_data.tax_deduction,
        "health_insurance": payroll_data.health_insurance,
        "retirement_contribution": payroll_data.retirement_contribution,
        "other_deductions": payroll_data.other_deductions,
        "gross_pay": gross_pay,
        "total_deductions": total_deductions,
        "net_pay": net_pay,
        "status": "Draft",
        "payment_method": payroll_data.payment_method,
        "bank_account_last4": payroll_data.bank_account_last4,
        "notes": payroll_data.notes,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "created_by": user_id
    }
    
    result = await payroll_records_collection.insert_one(new_record)
    created_record = await payroll_records_collection.find_one({"_id": result.inserted_id})
    
    return PayrollResponse(
        id=str(created_record["_id"]),
        organization_id=created_record["organization_id"],
        employee_id=created_record["employee_id"],
        employee_name=created_record["employee_name"],
        employee_email=created_record["employee_email"],
        department=created_record.get("department"),
        position=created_record.get("position"),
        pay_period_start=created_record["pay_period_start"],
        pay_period_end=created_record["pay_period_end"],
        payment_date=created_record["payment_date"],
        base_salary=created_record["base_salary"],
        overtime_hours=created_record["overtime_hours"],
        overtime_rate=created_record["overtime_rate"],
        overtime_pay=created_record["overtime_pay"],
        bonus=created_record["bonus"],
        commission=created_record["commission"],
        tax_deduction=created_record["tax_deduction"],
        health_insurance=created_record["health_insurance"],
        retirement_contribution=created_record["retirement_contribution"],
        other_deductions=created_record["other_deductions"],
        gross_pay=created_record["gross_pay"],
        total_deductions=created_record["total_deductions"],
        net_pay=created_record["net_pay"],
        status=created_record["status"],
        payment_method=created_record["payment_method"],
        bank_account_last4=created_record.get("bank_account_last4"),
        notes=created_record.get("notes"),
        approved_by=created_record.get("approved_by"),
        approved_at=created_record.get("approved_at"),
        created_at=created_record["created_at"],
        updated_at=created_record["updated_at"],
        created_by=created_record.get("created_by")
    )

@app.patch("/payroll/{payroll_id}", response_model=PayrollResponse)
async def update_payroll_record(request: Request, payroll_id: str, payroll_update: PayrollUpdate):
    """
    Update a payroll record.
    Recalculates totals if compensation or deduction fields are updated.
    
    Args:
        request: Request object with organization context
        payroll_id: Payroll record ID to update
        payroll_update: Update data
    """
    if not ObjectId.is_valid(payroll_id):
        raise HTTPException(status_code=400, detail="Invalid payroll ID")
    
    organization_id = request.state.organization_id
    
    # Verify record exists and belongs to organization
    existing_record = await payroll_records_collection.find_one({
        "_id": ObjectId(payroll_id),
        "organization_id": organization_id
    })
    
    if not existing_record:
        raise HTTPException(status_code=404, detail="Payroll record not found")
    
    # Build update document
    update_dict = payroll_update.model_dump(exclude_none=True)
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Recalculate if any compensation or deduction fields are updated
    needs_recalculation = any(key in update_dict for key in [
        "base_salary", "overtime_hours", "overtime_rate", "bonus", "commission",
        "tax_deduction", "health_insurance", "retirement_contribution", "other_deductions"
    ])
    
    if needs_recalculation:
        # Get current values
        base_salary = update_dict.get("base_salary", existing_record.get("base_salary", 0))
        overtime_hours = update_dict.get("overtime_hours", existing_record.get("overtime_hours", 0))
        overtime_rate = update_dict.get("overtime_rate", existing_record.get("overtime_rate", 0))
        bonus = update_dict.get("bonus", existing_record.get("bonus", 0))
        commission = update_dict.get("commission", existing_record.get("commission", 0))
        tax_deduction = update_dict.get("tax_deduction", existing_record.get("tax_deduction", 0))
        health_insurance = update_dict.get("health_insurance", existing_record.get("health_insurance", 0))
        retirement_contribution = update_dict.get("retirement_contribution", existing_record.get("retirement_contribution", 0))
        other_deductions = update_dict.get("other_deductions", existing_record.get("other_deductions", 0))
        
        # Recalculate
        overtime_pay = overtime_hours * overtime_rate
        gross_pay = base_salary + overtime_pay + bonus + commission
        total_deductions = tax_deduction + health_insurance + retirement_contribution + other_deductions
        net_pay = gross_pay - total_deductions
        
        update_dict["overtime_pay"] = overtime_pay
        update_dict["gross_pay"] = gross_pay
        update_dict["total_deductions"] = total_deductions
        update_dict["net_pay"] = net_pay
    
    # Always update the updated_at timestamp
    update_dict["updated_at"] = datetime.utcnow()
    
    # Update the record
    await payroll_records_collection.update_one(
        {"_id": ObjectId(payroll_id)},
        {"$set": update_dict}
    )
    
    # Fetch updated record
    updated_record = await payroll_records_collection.find_one({"_id": ObjectId(payroll_id)})
    
    return PayrollResponse(
        id=str(updated_record["_id"]),
        organization_id=updated_record["organization_id"],
        employee_id=updated_record["employee_id"],
        employee_name=updated_record["employee_name"],
        employee_email=updated_record["employee_email"],
        department=updated_record.get("department"),
        position=updated_record.get("position"),
        pay_period_start=updated_record["pay_period_start"],
        pay_period_end=updated_record["pay_period_end"],
        payment_date=updated_record["payment_date"],
        base_salary=updated_record["base_salary"],
        overtime_hours=updated_record["overtime_hours"],
        overtime_rate=updated_record["overtime_rate"],
        overtime_pay=updated_record["overtime_pay"],
        bonus=updated_record["bonus"],
        commission=updated_record["commission"],
        tax_deduction=updated_record["tax_deduction"],
        health_insurance=updated_record["health_insurance"],
        retirement_contribution=updated_record["retirement_contribution"],
        other_deductions=updated_record["other_deductions"],
        gross_pay=updated_record["gross_pay"],
        total_deductions=updated_record["total_deductions"],
        net_pay=updated_record["net_pay"],
        status=updated_record["status"],
        payment_method=updated_record["payment_method"],
        bank_account_last4=updated_record.get("bank_account_last4"),
        notes=updated_record.get("notes"),
        approved_by=updated_record.get("approved_by"),
        approved_at=updated_record.get("approved_at"),
        created_at=updated_record["created_at"],
        updated_at=updated_record["updated_at"],
        created_by=updated_record.get("created_by")
    )

@app.delete("/payroll/{payroll_id}")
async def delete_payroll_record(request: Request, payroll_id: str):
    """
    Delete a payroll record.
    Only draft records can be deleted.
    
    Args:
        request: Request object with organization context
        payroll_id: Payroll record ID to delete
    """
    if not ObjectId.is_valid(payroll_id):
        raise HTTPException(status_code=400, detail="Invalid payroll ID")
    
    organization_id = request.state.organization_id
    
    # Verify record exists and belongs to organization
    existing_record = await payroll_records_collection.find_one({
        "_id": ObjectId(payroll_id),
        "organization_id": organization_id
    })
    
    if not existing_record:
        raise HTTPException(status_code=404, detail="Payroll record not found")
    
    # Only allow deletion of draft records
    if existing_record.get("status") != "Draft":
        raise HTTPException(
            status_code=400,
            detail="Only draft payroll records can be deleted"
        )
    
    # Delete the record
    await payroll_records_collection.delete_one({"_id": ObjectId(payroll_id)})
    
    return {"message": "Payroll record deleted successfully", "id": payroll_id}

@app.patch("/payroll/{payroll_id}/approve")
async def approve_payroll_record(request: Request, payroll_id: str):
    """
    Approve a payroll record.
    Changes status from Draft/Pending to Approved.
    
    Args:
        request: Request object with organization context
        payroll_id: Payroll record ID to approve
    """
    if not ObjectId.is_valid(payroll_id):
        raise HTTPException(status_code=400, detail="Invalid payroll ID")
    
    organization_id = request.state.organization_id
    user_id = request.state.user_id
    
    # Verify record exists and belongs to organization
    existing_record = await payroll_records_collection.find_one({
        "_id": ObjectId(payroll_id),
        "organization_id": organization_id
    })
    
    if not existing_record:
        raise HTTPException(status_code=404, detail="Payroll record not found")
    
    # Update status to Approved
    await payroll_records_collection.update_one(
        {"_id": ObjectId(payroll_id)},
        {"$set": {
            "status": "Approved",
            "approved_by": user_id,
            "approved_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }}
    )
    
    return {"message": "Payroll record approved successfully", "id": payroll_id}


# ============================================================================
# BENEFITS API ENDPOINTS
# ============================================================================

# Benefit Plans Endpoints

@app.get("/benefits/plans", response_model=List[BenefitPlanResponse])
async def get_all_benefit_plans(
    request: Request,
    benefit_type: Optional[str] = None,
    is_active: Optional[bool] = None
):
    """
    Get all benefit plans for the organization.
    Optionally filter by benefit type and active status.
    """
    organization_id = request.state.organization_id
    
    # Build query
    query = {"organization_id": organization_id}
    if benefit_type and benefit_type != "All":
        query["benefit_type"] = benefit_type
    if is_active is not None:
        query["is_active"] = is_active
    
    plans = await benefit_plans_collection.find(query).sort("created_at", -1).to_list(length=None)
    
    return [
        BenefitPlanResponse(
            id=str(plan["_id"]),
            organization_id=plan["organization_id"],
            plan_name=plan["plan_name"],
            benefit_type=plan["benefit_type"],
            provider=plan.get("provider"),
            description=plan["description"],
            coverage_level=plan["coverage_level"],
            coverage_amount=plan.get("coverage_amount"),
            monthly_premium=plan["monthly_premium"],
            employer_contribution=plan["employer_contribution"],
            employee_contribution=plan["employee_contribution"],
            deductible=plan.get("deductible"),
            copay=plan.get("copay"),
            out_of_pocket_max=plan.get("out_of_pocket_max"),
            eligibility_criteria=plan["eligibility_criteria"],
            waiting_period_days=plan.get("waiting_period_days", 0),
            plan_year_start=plan["plan_year_start"],
            plan_year_end=plan["plan_year_end"],
            enrollment_start=plan["enrollment_start"],
            enrollment_end=plan["enrollment_end"],
            features=plan.get("features", []),
            exclusions=plan.get("exclusions", []),
            is_active=plan.get("is_active", True),
            max_enrollments=plan.get("max_enrollments"),
            current_enrollments=plan.get("current_enrollments", 0),
            plan_documents=plan.get("plan_documents", []),
            notes=plan.get("notes"),
            created_at=plan["created_at"],
            updated_at=plan["updated_at"],
            created_by=plan.get("created_by")
        )
        for plan in plans
    ]

@app.get("/benefits/plans/{plan_id}", response_model=BenefitPlanResponse)
async def get_benefit_plan(request: Request, plan_id: str):
    """Get a specific benefit plan by ID."""
    if not ObjectId.is_valid(plan_id):
        raise HTTPException(status_code=400, detail="Invalid plan ID")
    
    organization_id = request.state.organization_id
    
    plan = await benefit_plans_collection.find_one({
        "_id": ObjectId(plan_id),
        "organization_id": organization_id
    })
    
    if not plan:
        raise HTTPException(status_code=404, detail="Benefit plan not found")
    
    return BenefitPlanResponse(
        id=str(plan["_id"]),
        organization_id=plan["organization_id"],
        plan_name=plan["plan_name"],
        benefit_type=plan["benefit_type"],
        provider=plan.get("provider"),
        description=plan["description"],
        coverage_level=plan["coverage_level"],
        coverage_amount=plan.get("coverage_amount"),
        monthly_premium=plan["monthly_premium"],
        employer_contribution=plan["employer_contribution"],
        employee_contribution=plan["employee_contribution"],
        deductible=plan.get("deductible"),
        copay=plan.get("copay"),
        out_of_pocket_max=plan.get("out_of_pocket_max"),
        eligibility_criteria=plan["eligibility_criteria"],
        waiting_period_days=plan.get("waiting_period_days", 0),
        plan_year_start=plan["plan_year_start"],
        plan_year_end=plan["plan_year_end"],
        enrollment_start=plan["enrollment_start"],
        enrollment_end=plan["enrollment_end"],
        features=plan.get("features", []),
        exclusions=plan.get("exclusions", []),
        is_active=plan.get("is_active", True),
        max_enrollments=plan.get("max_enrollments"),
        current_enrollments=plan.get("current_enrollments", 0),
        plan_documents=plan.get("plan_documents", []),
        notes=plan.get("notes"),
        created_at=plan["created_at"],
        updated_at=plan["updated_at"],
        created_by=plan.get("created_by")
    )

@app.post("/benefits/plans", response_model=BenefitPlanResponse)
async def create_benefit_plan(request: Request, plan_data: BenefitPlanCreate):
    """Create a new benefit plan."""
    organization_id = request.state.organization_id
    user_id = request.state.user_id
    
    new_plan = {
        "organization_id": organization_id,
        "plan_name": plan_data.plan_name,
        "benefit_type": plan_data.benefit_type,
        "provider": plan_data.provider,
        "description": plan_data.description,
        "coverage_level": plan_data.coverage_level,
        "coverage_amount": plan_data.coverage_amount,
        "monthly_premium": plan_data.monthly_premium,
        "employer_contribution": plan_data.employer_contribution,
        "employee_contribution": plan_data.employee_contribution,
        "deductible": plan_data.deductible,
        "copay": plan_data.copay,
        "out_of_pocket_max": plan_data.out_of_pocket_max,
        "eligibility_criteria": plan_data.eligibility_criteria,
        "waiting_period_days": plan_data.waiting_period_days,
        "plan_year_start": plan_data.plan_year_start,
        "plan_year_end": plan_data.plan_year_end,
        "enrollment_start": plan_data.enrollment_start,
        "enrollment_end": plan_data.enrollment_end,
        "features": plan_data.features,
        "exclusions": plan_data.exclusions,
        "is_active": True,
        "max_enrollments": plan_data.max_enrollments,
        "current_enrollments": 0,
        "plan_documents": [],
        "notes": plan_data.notes,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "created_by": user_id
    }
    
    result = await benefit_plans_collection.insert_one(new_plan)
    created_plan = await benefit_plans_collection.find_one({"_id": result.inserted_id})
    
    return BenefitPlanResponse(
        id=str(created_plan["_id"]),
        organization_id=created_plan["organization_id"],
        plan_name=created_plan["plan_name"],
        benefit_type=created_plan["benefit_type"],
        provider=created_plan.get("provider"),
        description=created_plan["description"],
        coverage_level=created_plan["coverage_level"],
        coverage_amount=created_plan.get("coverage_amount"),
        monthly_premium=created_plan["monthly_premium"],
        employer_contribution=created_plan["employer_contribution"],
        employee_contribution=created_plan["employee_contribution"],
        deductible=created_plan.get("deductible"),
        copay=created_plan.get("copay"),
        out_of_pocket_max=created_plan.get("out_of_pocket_max"),
        eligibility_criteria=created_plan["eligibility_criteria"],
        waiting_period_days=created_plan["waiting_period_days"],
        plan_year_start=created_plan["plan_year_start"],
        plan_year_end=created_plan["plan_year_end"],
        enrollment_start=created_plan["enrollment_start"],
        enrollment_end=created_plan["enrollment_end"],
        features=created_plan["features"],
        exclusions=created_plan["exclusions"],
        is_active=created_plan["is_active"],
        max_enrollments=created_plan.get("max_enrollments"),
        current_enrollments=created_plan["current_enrollments"],
        plan_documents=created_plan["plan_documents"],
        notes=created_plan.get("notes"),
        created_at=created_plan["created_at"],
        updated_at=created_plan["updated_at"],
        created_by=created_plan.get("created_by")
    )

@app.patch("/benefits/plans/{plan_id}", response_model=BenefitPlanResponse)
async def update_benefit_plan(request: Request, plan_id: str, plan_update: BenefitPlanUpdate):
    """Update a benefit plan."""
    if not ObjectId.is_valid(plan_id):
        raise HTTPException(status_code=400, detail="Invalid plan ID")
    
    organization_id = request.state.organization_id
    
    # Verify plan exists
    existing_plan = await benefit_plans_collection.find_one({
        "_id": ObjectId(plan_id),
        "organization_id": organization_id
    })
    
    if not existing_plan:
        raise HTTPException(status_code=404, detail="Benefit plan not found")
    
    # Build update document
    update_dict = plan_update.model_dump(exclude_none=True)
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_dict["updated_at"] = datetime.utcnow()
    
    # Update the plan
    await benefit_plans_collection.update_one(
        {"_id": ObjectId(plan_id)},
        {"$set": update_dict}
    )
    
    updated_plan = await benefit_plans_collection.find_one({"_id": ObjectId(plan_id)})
    
    return BenefitPlanResponse(
        id=str(updated_plan["_id"]),
        organization_id=updated_plan["organization_id"],
        plan_name=updated_plan["plan_name"],
        benefit_type=updated_plan["benefit_type"],
        provider=updated_plan.get("provider"),
        description=updated_plan["description"],
        coverage_level=updated_plan["coverage_level"],
        coverage_amount=updated_plan.get("coverage_amount"),
        monthly_premium=updated_plan["monthly_premium"],
        employer_contribution=updated_plan["employer_contribution"],
        employee_contribution=updated_plan["employee_contribution"],
        deductible=updated_plan.get("deductible"),
        copay=updated_plan.get("copay"),
        out_of_pocket_max=updated_plan.get("out_of_pocket_max"),
        eligibility_criteria=updated_plan["eligibility_criteria"],
        waiting_period_days=updated_plan["waiting_period_days"],
        plan_year_start=updated_plan["plan_year_start"],
        plan_year_end=updated_plan["plan_year_end"],
        enrollment_start=updated_plan["enrollment_start"],
        enrollment_end=updated_plan["enrollment_end"],
        features=updated_plan["features"],
        exclusions=updated_plan["exclusions"],
        is_active=updated_plan["is_active"],
        max_enrollments=updated_plan.get("max_enrollments"),
        current_enrollments=updated_plan["current_enrollments"],
        plan_documents=updated_plan["plan_documents"],
        notes=updated_plan.get("notes"),
        created_at=updated_plan["created_at"],
        updated_at=updated_plan["updated_at"],
        created_by=updated_plan.get("created_by")
    )

@app.delete("/benefits/plans/{plan_id}")
async def delete_benefit_plan(request: Request, plan_id: str):
    """Delete a benefit plan. Only plans with no active enrollments can be deleted."""
    if not ObjectId.is_valid(plan_id):
        raise HTTPException(status_code=400, detail="Invalid plan ID")
    
    organization_id = request.state.organization_id
    
    # Verify plan exists
    existing_plan = await benefit_plans_collection.find_one({
        "_id": ObjectId(plan_id),
        "organization_id": organization_id
    })
    
    if not existing_plan:
        raise HTTPException(status_code=404, detail="Benefit plan not found")
    
    # Check for active enrollments
    active_enrollments = await benefit_enrollments_collection.count_documents({
        "plan_id": plan_id,
        "organization_id": organization_id,
        "status": {"$in": ["Pending", "Active"]}
    })
    
    if active_enrollments > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete plan with {active_enrollments} active enrollment(s)"
        )
    
    # Delete the plan
    await benefit_plans_collection.delete_one({"_id": ObjectId(plan_id)})
    
    return {"message": "Benefit plan deleted successfully", "id": plan_id}

# Benefit Enrollments Endpoints

@app.get("/benefits/enrollments", response_model=List[BenefitEnrollmentResponse])
async def get_all_enrollments(
    request: Request,
    status: Optional[str] = None,
    employee_id: Optional[str] = None,
    plan_id: Optional[str] = None
):
    """
    Get all benefit enrollments for the organization.
    Optionally filter by status, employee, or plan.
    """
    organization_id = request.state.organization_id
    
    # Build query
    query = {"organization_id": organization_id}
    if status and status != "All":
        query["status"] = status
    if employee_id:
        query["employee_id"] = employee_id
    if plan_id:
        query["plan_id"] = plan_id
    
    enrollments = await benefit_enrollments_collection.find(query).sort("created_at", -1).to_list(length=None)
    
    return [
        BenefitEnrollmentResponse(
            id=str(enrollment["_id"]),
            organization_id=enrollment["organization_id"],
            employee_id=enrollment["employee_id"],
            employee_name=enrollment["employee_name"],
            employee_email=enrollment["employee_email"],
            department=enrollment.get("department"),
            position=enrollment.get("position"),
            plan_id=enrollment["plan_id"],
            plan_name=enrollment["plan_name"],
            benefit_type=enrollment["benefit_type"],
            enrollment_date=enrollment["enrollment_date"],
            effective_date=enrollment["effective_date"],
            termination_date=enrollment.get("termination_date"),
            status=enrollment["status"],
            coverage_level=enrollment["coverage_level"],
            dependents=enrollment.get("dependents", []),
            monthly_premium=enrollment["monthly_premium"],
            employer_contribution=enrollment["employer_contribution"],
            employee_contribution=enrollment["employee_contribution"],
            annual_cost=enrollment["annual_cost"],
            payment_frequency=enrollment.get("payment_frequency", "Monthly"),
            deduction_start_date=enrollment.get("deduction_start_date"),
            enrollment_documents=enrollment.get("enrollment_documents", []),
            approved_by=enrollment.get("approved_by"),
            approved_at=enrollment.get("approved_at"),
            declined_reason=enrollment.get("declined_reason"),
            notes=enrollment.get("notes"),
            created_at=enrollment["created_at"],
            updated_at=enrollment["updated_at"],
            created_by=enrollment.get("created_by")
        )
        for enrollment in enrollments
    ]

@app.get("/benefits/enrollments/{enrollment_id}", response_model=BenefitEnrollmentResponse)
async def get_enrollment(request: Request, enrollment_id: str):
    """Get a specific benefit enrollment by ID."""
    if not ObjectId.is_valid(enrollment_id):
        raise HTTPException(status_code=400, detail="Invalid enrollment ID")
    
    organization_id = request.state.organization_id
    
    enrollment = await benefit_enrollments_collection.find_one({
        "_id": ObjectId(enrollment_id),
        "organization_id": organization_id
    })
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Benefit enrollment not found")
    
    return BenefitEnrollmentResponse(
        id=str(enrollment["_id"]),
        organization_id=enrollment["organization_id"],
        employee_id=enrollment["employee_id"],
        employee_name=enrollment["employee_name"],
        employee_email=enrollment["employee_email"],
        department=enrollment.get("department"),
        position=enrollment.get("position"),
        plan_id=enrollment["plan_id"],
        plan_name=enrollment["plan_name"],
        benefit_type=enrollment["benefit_type"],
        enrollment_date=enrollment["enrollment_date"],
        effective_date=enrollment["effective_date"],
        termination_date=enrollment.get("termination_date"),
        status=enrollment["status"],
        coverage_level=enrollment["coverage_level"],
        dependents=enrollment.get("dependents", []),
        monthly_premium=enrollment["monthly_premium"],
        employer_contribution=enrollment["employer_contribution"],
        employee_contribution=enrollment["employee_contribution"],
        annual_cost=enrollment["annual_cost"],
        payment_frequency=enrollment.get("payment_frequency", "Monthly"),
        deduction_start_date=enrollment.get("deduction_start_date"),
        enrollment_documents=enrollment.get("enrollment_documents", []),
        approved_by=enrollment.get("approved_by"),
        approved_at=enrollment.get("approved_at"),
        declined_reason=enrollment.get("declined_reason"),
        notes=enrollment.get("notes"),
        created_at=enrollment["created_at"],
        updated_at=enrollment["updated_at"],
        created_by=enrollment.get("created_by")
    )

@app.post("/benefits/enrollments", response_model=BenefitEnrollmentResponse)
async def create_enrollment(request: Request, enrollment_data: BenefitEnrollmentCreate):
    """Create a new benefit enrollment."""
    organization_id = request.state.organization_id
    user_id = request.state.user_id
    
    # Get the plan details
    plan = await benefit_plans_collection.find_one({
        "_id": ObjectId(enrollment_data.plan_id),
        "organization_id": organization_id
    })
    
    if not plan:
        raise HTTPException(status_code=404, detail="Benefit plan not found")
    
    # Check if plan is active
    if not plan.get("is_active", True):
        raise HTTPException(status_code=400, detail="Cannot enroll in inactive plan")
    
    # Check max enrollments
    if plan.get("max_enrollments") and plan.get("current_enrollments", 0) >= plan["max_enrollments"]:
        raise HTTPException(status_code=400, detail="Plan has reached maximum enrollments")
    
    # Calculate annual cost
    annual_cost = plan["monthly_premium"] * 12
    
    new_enrollment = {
        "organization_id": organization_id,
        "employee_id": enrollment_data.employee_id,
        "employee_name": enrollment_data.employee_name,
        "employee_email": enrollment_data.employee_email,
        "department": enrollment_data.department,
        "position": enrollment_data.position,
        "plan_id": enrollment_data.plan_id,
        "plan_name": plan["plan_name"],
        "benefit_type": plan["benefit_type"],
        "enrollment_date": enrollment_data.enrollment_date,
        "effective_date": enrollment_data.effective_date,
        "termination_date": None,
        "status": "Pending",
        "coverage_level": enrollment_data.coverage_level,
        "dependents": enrollment_data.dependents,
        "monthly_premium": plan["monthly_premium"],
        "employer_contribution": plan["employer_contribution"],
        "employee_contribution": plan["employee_contribution"],
        "annual_cost": annual_cost,
        "payment_frequency": enrollment_data.payment_frequency,
        "deduction_start_date": enrollment_data.deduction_start_date,
        "enrollment_documents": [],
        "approved_by": None,
        "approved_at": None,
        "declined_reason": None,
        "notes": enrollment_data.notes,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "created_by": user_id
    }
    
    result = await benefit_enrollments_collection.insert_one(new_enrollment)
    
    # Increment plan enrollment count
    await benefit_plans_collection.update_one(
        {"_id": ObjectId(enrollment_data.plan_id)},
        {"$inc": {"current_enrollments": 1}}
    )
    
    created_enrollment = await benefit_enrollments_collection.find_one({"_id": result.inserted_id})
    
    return BenefitEnrollmentResponse(
        id=str(created_enrollment["_id"]),
        organization_id=created_enrollment["organization_id"],
        employee_id=created_enrollment["employee_id"],
        employee_name=created_enrollment["employee_name"],
        employee_email=created_enrollment["employee_email"],
        department=created_enrollment.get("department"),
        position=created_enrollment.get("position"),
        plan_id=created_enrollment["plan_id"],
        plan_name=created_enrollment["plan_name"],
        benefit_type=created_enrollment["benefit_type"],
        enrollment_date=created_enrollment["enrollment_date"],
        effective_date=created_enrollment["effective_date"],
        termination_date=created_enrollment.get("termination_date"),
        status=created_enrollment["status"],
        coverage_level=created_enrollment["coverage_level"],
        dependents=created_enrollment["dependents"],
        monthly_premium=created_enrollment["monthly_premium"],
        employer_contribution=created_enrollment["employer_contribution"],
        employee_contribution=created_enrollment["employee_contribution"],
        annual_cost=created_enrollment["annual_cost"],
        payment_frequency=created_enrollment["payment_frequency"],
        deduction_start_date=created_enrollment.get("deduction_start_date"),
        enrollment_documents=created_enrollment["enrollment_documents"],
        approved_by=created_enrollment.get("approved_by"),
        approved_at=created_enrollment.get("approved_at"),
        declined_reason=created_enrollment.get("declined_reason"),
        notes=created_enrollment.get("notes"),
        created_at=created_enrollment["created_at"],
        updated_at=created_enrollment["updated_at"],
        created_by=created_enrollment.get("created_by")
    )

@app.patch("/benefits/enrollments/{enrollment_id}", response_model=BenefitEnrollmentResponse)
async def update_enrollment(request: Request, enrollment_id: str, enrollment_update: BenefitEnrollmentUpdate):
    """Update a benefit enrollment."""
    if not ObjectId.is_valid(enrollment_id):
        raise HTTPException(status_code=400, detail="Invalid enrollment ID")
    
    organization_id = request.state.organization_id
    
    # Verify enrollment exists
    existing_enrollment = await benefit_enrollments_collection.find_one({
        "_id": ObjectId(enrollment_id),
        "organization_id": organization_id
    })
    
    if not existing_enrollment:
        raise HTTPException(status_code=404, detail="Benefit enrollment not found")
    
    # Build update document
    update_dict = enrollment_update.model_dump(exclude_none=True)
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_dict["updated_at"] = datetime.utcnow()
    
    # Update the enrollment
    await benefit_enrollments_collection.update_one(
        {"_id": ObjectId(enrollment_id)},
        {"$set": update_dict}
    )
    
    updated_enrollment = await benefit_enrollments_collection.find_one({"_id": ObjectId(enrollment_id)})
    
    return BenefitEnrollmentResponse(
        id=str(updated_enrollment["_id"]),
        organization_id=updated_enrollment["organization_id"],
        employee_id=updated_enrollment["employee_id"],
        employee_name=updated_enrollment["employee_name"],
        employee_email=updated_enrollment["employee_email"],
        department=updated_enrollment.get("department"),
        position=updated_enrollment.get("position"),
        plan_id=updated_enrollment["plan_id"],
        plan_name=updated_enrollment["plan_name"],
        benefit_type=updated_enrollment["benefit_type"],
        enrollment_date=updated_enrollment["enrollment_date"],
        effective_date=updated_enrollment["effective_date"],
        termination_date=updated_enrollment.get("termination_date"),
        status=updated_enrollment["status"],
        coverage_level=updated_enrollment["coverage_level"],
        dependents=updated_enrollment["dependents"],
        monthly_premium=updated_enrollment["monthly_premium"],
        employer_contribution=updated_enrollment["employer_contribution"],
        employee_contribution=updated_enrollment["employee_contribution"],
        annual_cost=updated_enrollment["annual_cost"],
        payment_frequency=updated_enrollment["payment_frequency"],
        deduction_start_date=updated_enrollment.get("deduction_start_date"),
        enrollment_documents=updated_enrollment["enrollment_documents"],
        approved_by=updated_enrollment.get("approved_by"),
        approved_at=updated_enrollment.get("approved_at"),
        declined_reason=updated_enrollment.get("declined_reason"),
        notes=updated_enrollment.get("notes"),
        created_at=updated_enrollment["created_at"],
        updated_at=updated_enrollment["updated_at"],
        created_by=updated_enrollment.get("created_by")
    )

@app.patch("/benefits/enrollments/{enrollment_id}/approve")
async def approve_enrollment(request: Request, enrollment_id: str):
    """Approve a benefit enrollment."""
    if not ObjectId.is_valid(enrollment_id):
        raise HTTPException(status_code=400, detail="Invalid enrollment ID")
    
    organization_id = request.state.organization_id
    user_id = request.state.user_id
    
    # Verify enrollment exists
    existing_enrollment = await benefit_enrollments_collection.find_one({
        "_id": ObjectId(enrollment_id),
        "organization_id": organization_id
    })
    
    if not existing_enrollment:
        raise HTTPException(status_code=404, detail="Benefit enrollment not found")
    
    # Update status to Active
    await benefit_enrollments_collection.update_one(
        {"_id": ObjectId(enrollment_id)},
        {"$set": {
            "status": "Active",
            "approved_by": user_id,
            "approved_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }}
    )
    
    return {"message": "Benefit enrollment approved successfully", "id": enrollment_id}

@app.delete("/benefits/enrollments/{enrollment_id}")
async def delete_enrollment(request: Request, enrollment_id: str):
    """Delete a benefit enrollment. Only pending enrollments can be deleted."""
    if not ObjectId.is_valid(enrollment_id):
        raise HTTPException(status_code=400, detail="Invalid enrollment ID")
    
    organization_id = request.state.organization_id
    
    # Verify enrollment exists
    existing_enrollment = await benefit_enrollments_collection.find_one({
        "_id": ObjectId(enrollment_id),
        "organization_id": organization_id
    })
    
    if not existing_enrollment:
        raise HTTPException(status_code=404, detail="Benefit enrollment not found")
    
    # Only allow deletion of pending enrollments
    if existing_enrollment.get("status") not in ["Pending", "Declined"]:
        raise HTTPException(
            status_code=400,
            detail="Only pending or declined enrollments can be deleted"
        )
    
    # Decrement plan enrollment count
    await benefit_plans_collection.update_one(
        {"_id": ObjectId(existing_enrollment["plan_id"])},
        {"$inc": {"current_enrollments": -1}}
    )
    
    # Delete the enrollment
    await benefit_enrollments_collection.delete_one({"_id": ObjectId(enrollment_id)})
    
    return {"message": "Benefit enrollment deleted successfully", "id": enrollment_id}





if __name__ == "__main__":
    import uvicorn
    
    # Run on localhost for local development
    print(f"[SERVER] Starting with HTTP on http://127.0.0.1:8000", flush=True)
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )
