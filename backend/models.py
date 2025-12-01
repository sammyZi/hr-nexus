from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict
from datetime import datetime, timedelta
from bson import ObjectId
import enum
import secrets
import re

# Custom ObjectId type for Pydantic
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")

# Utility functions
def generate_slug(name: str) -> str:
    """Generate URL-friendly slug from organization name"""
    slug = name.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = slug.strip('-')
    return slug

def generate_invitation_token() -> str:
    """Generate secure random token for invitations"""
    return secrets.token_urlsafe(32)

class TaskCategory(str, enum.Enum):
    Recruiting = "Recruiting"
    Onboarding = "Onboarding"
    Payroll = "Payroll"
    Benefits = "Benefits"
    Learning_Development = "Learning_Development"
    Employee_Relations = "Employee_Relations"
    Performance = "Performance"
    Offboarding = "Offboarding"

# MongoDB Models (Pydantic)

# Organization Model
class Organization(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    name: str
    slug: str
    logo_url: Optional[str] = None
    settings: Dict = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# Invitation Model
class Invitation(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    organization_id: str
    email: EmailStr
    role: str  # "admin" or "employee"
    token: str
    invited_by: str  # User ID of inviter
    expires_at: datetime
    status: str = "pending"  # "pending", "accepted", "expired"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# ChatHistory Model
class ChatHistory(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    organization_id: str
    user_id: str
    messages: List[Dict] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class UserInDB(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    organization_id: str  # Link to organization
    email: EmailStr
    hashed_password: str
    role: str  # "admin" or "employee"
    is_active: bool = True
    is_verified: bool = False
    verification_token: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class TaskInDB(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    organization_id: str  # Link to organization
    title: str
    description: Optional[str] = None
    status: str = "Pending"
    category: TaskCategory
    priority: str = "Medium"
    owner_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class DocumentInDB(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    organization_id: str  # Link to organization
    filename: str
    original_filename: str
    file_path: str
    file_type: str
    file_size: int
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    category: Optional[str] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# API Request/Response Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class OrganizationSignup(BaseModel):
    organization_name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: TaskCategory
    priority: str = "Medium"

class TaskCreate(TaskBase):
    pass

class TaskResponse(TaskBase):
    id: str
    status: str
    owner_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DocumentCreate(BaseModel):
    filename: str
    file_type: str
    category: Optional[str] = None

class DocumentResponse(BaseModel):
    id: str
    filename: str
    original_filename: str
    file_type: str
    file_size: int
    uploaded_at: datetime
    category: Optional[str] = None
    
    class Config:
        from_attributes = True
