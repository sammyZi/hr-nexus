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
    def validate(cls, v, validation_info=None):
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
    LearningDevelopment = "Learning Development"
    EmployeeRelations = "Employee Relations"
    Performance = "Performance"
    Offboarding = "Offboarding"

class CandidateStatus(str, enum.Enum):
    Applied = "Applied"
    Screening = "Screening"
    PhoneInterview = "Phone Interview"
    TechnicalInterview = "Technical Interview"
    FinalInterview = "Final Interview"
    OfferExtended = "Offer Extended"
    Hired = "Hired"
    Rejected = "Rejected"
    Withdrawn = "Withdrawn"

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

class CandidateInDB(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    organization_id: str  # Link to organization
    
    # Personal Information
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    
    # Job Application Details
    position_applied: str
    department: Optional[str] = None
    source: Optional[str] = None  # LinkedIn, Referral, Job Board, etc.
    
    # Status & Timeline
    status: CandidateStatus = CandidateStatus.Applied
    applied_date: datetime = Field(default_factory=datetime.utcnow)
    
    # Compensation
    expected_salary: Optional[str] = None
    notice_period: Optional[str] = None
    
    # Experience & Skills
    years_of_experience: Optional[int] = None
    skills: List[str] = Field(default_factory=list)
    education: Optional[str] = None
    
    # Interview Process
    interview_notes: Optional[str] = None
    interviewer_ids: List[str] = Field(default_factory=list)
    interview_dates: List[datetime] = Field(default_factory=list)
    
    # Documents
    resume_url: Optional[str] = None
    cover_letter_url: Optional[str] = None
    
    # Metadata
    rating: Optional[int] = None  # 1-5 stars
    tags: List[str] = Field(default_factory=list)
    notes: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = None

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

class VerifyEmail(BaseModel):
    email: EmailStr
    code: str

class ResendVerification(BaseModel):
    email: EmailStr

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

class OrganizationResponse(BaseModel):
    id: str
    name: str
    slug: str
    logo_url: Optional[str] = None
    settings: Dict = Field(default_factory=dict)
    created_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    settings: Optional[Dict] = None

class OrganizationStats(BaseModel):
    active_users: int
    total_documents: int
    total_tasks: int
    completed_tasks: int
    pending_tasks: int

class InvitationCreate(BaseModel):
    email: EmailStr
    role: str  # "admin" or "employee"

class InvitationResponse(BaseModel):
    id: str
    organization_id: str
    email: EmailStr
    role: str
    status: str
    invited_by: str
    expires_at: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True

class InvitationAccept(BaseModel):
    password: str

# User Management Models
class UserResponse(BaseModel):
    id: str
    email: EmailStr
    role: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserRoleUpdate(BaseModel):
    role: str  # "admin" or "employee"

# Candidate API Models
class CandidateCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    position_applied: str
    department: Optional[str] = None
    source: Optional[str] = None
    expected_salary: Optional[str] = None
    notice_period: Optional[str] = None
    years_of_experience: Optional[int] = None
    skills: List[str] = Field(default_factory=list)
    education: Optional[str] = None
    notes: Optional[str] = None

class CandidateUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    position_applied: Optional[str] = None
    department: Optional[str] = None
    source: Optional[str] = None
    status: Optional[CandidateStatus] = None
    expected_salary: Optional[str] = None
    notice_period: Optional[str] = None
    years_of_experience: Optional[int] = None
    skills: Optional[List[str]] = None
    education: Optional[str] = None
    interview_notes: Optional[str] = None
    rating: Optional[int] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None

class CandidateResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    position_applied: str
    department: Optional[str] = None
    source: Optional[str] = None
    status: CandidateStatus
    applied_date: datetime
    expected_salary: Optional[str] = None
    notice_period: Optional[str] = None
    years_of_experience: Optional[int] = None
    skills: List[str] = Field(default_factory=list)
    education: Optional[str] = None
    interview_notes: Optional[str] = None
    interviewer_ids: List[str] = Field(default_factory=list)
    interview_dates: List[datetime] = Field(default_factory=list)
    resume_url: Optional[str] = None
    cover_letter_url: Optional[str] = None
    rating: Optional[int] = None
    tags: List[str] = Field(default_factory=list)
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    
    class Config:
        from_attributes = True
