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

class CaseType(str, enum.Enum):
    Disciplinary = "Disciplinary"
    Grievance = "Grievance"
    Performance = "Performance"
    Investigation = "Investigation"
    PolicyViolation = "Policy Violation"

class CaseStatus(str, enum.Enum):
    Open = "Open"
    Investigating = "Investigating"
    ActionRequired = "Action Required"
    Resolved = "Resolved"
    Closed = "Closed"

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

# Interview Model (nested in Candidate)
class Interview(BaseModel):
    date: datetime
    interview_type: str  # Phone, Technical, Final, etc.
    interviewer_id: Optional[str] = None
    interviewer_name: Optional[str] = None
    status: str = "Scheduled"  # Scheduled, Completed, Cancelled
    notes: Optional[str] = None
    duration_minutes: Optional[int] = 60
    meeting_link: Optional[str] = None

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
    
    # Interview Process - Enhanced
    interviews: List[Interview] = Field(default_factory=list)
    interview_notes: Optional[str] = None
    next_interview_date: Optional[datetime] = None
    
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

# Employee Relations Case Model
class EmployeeCase(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    organization_id: str
    
    title: str
    description: str
    case_type: CaseType
    status: CaseStatus = CaseStatus.Open
    priority: str = "Medium"  # Low, Medium, High, Critical
    
    # People involved
    employee_name: str
    employee_id: Optional[str] = None
    reporter_name: str
    reporter_id: Optional[str] = None
    handler_id: Optional[str] = None  # HR rep handling the case
    
    # Details
    date_reported: datetime = Field(default_factory=datetime.utcnow)
    incident_date: Optional[datetime] = None
    location: Optional[str] = None
    
    # Outcomes
    actions_taken: List[str] = Field(default_factory=list)
    resolution_notes: Optional[str] = None
    closed_at: Optional[datetime] = None
    
    # Metadata
    tags: List[str] = Field(default_factory=list)
    is_confidential: bool = True
    documents: List[str] = Field(default_factory=list)  # URLs to docs
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

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
    interviews: List[Interview] = Field(default_factory=list)
    interview_notes: Optional[str] = None
    next_interview_date: Optional[datetime] = None
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

# Case API Models
class CaseCreate(BaseModel):
    title: str
    description: str
    case_type: CaseType
    priority: str = "Medium"
    employee_name: str
    incident_date: Optional[datetime] = None
    location: Optional[str] = None
    is_confidential: bool = True

class CaseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    case_type: Optional[CaseType] = None
    status: Optional[CaseStatus] = None
    priority: Optional[str] = None
    actions_taken: Optional[List[str]] = None
    resolution_notes: Optional[str] = None
    handler_id: Optional[str] = None

class CaseResponse(BaseModel):
    id: str
    organization_id: str
    title: str
    description: str
    case_type: CaseType
    status: CaseStatus
    priority: str
    employee_name: str
    reporter_name: str
    date_reported: datetime
    incident_date: Optional[datetime] = None
    actions_taken: List[str] = []
    is_confidential: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Payroll Models
class PayrollStatus(str, enum.Enum):
    Draft = "Draft"
    Pending = "Pending"
    Approved = "Approved"
    Processing = "Processing"
    Paid = "Paid"
    Failed = "Failed"

class PayrollRecord(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    organization_id: str
    
    # Employee Information
    employee_id: str
    employee_name: str
    employee_email: EmailStr
    department: Optional[str] = None
    position: Optional[str] = None
    
    # Pay Period
    pay_period_start: datetime
    pay_period_end: datetime
    payment_date: datetime
    
    # Compensation
    base_salary: float
    overtime_hours: float = 0.0
    overtime_rate: float = 0.0
    overtime_pay: float = 0.0
    bonus: float = 0.0
    commission: float = 0.0
    
    # Deductions
    tax_deduction: float = 0.0
    health_insurance: float = 0.0
    retirement_contribution: float = 0.0
    other_deductions: float = 0.0
    
    # Totals
    gross_pay: float
    total_deductions: float
    net_pay: float
    
    # Status & Metadata
    status: PayrollStatus = PayrollStatus.Draft
    payment_method: str = "Direct Deposit"  # Direct Deposit, Check, Cash
    bank_account_last4: Optional[str] = None
    notes: Optional[str] = None
    
    # Approval
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    processed_by: Optional[str] = None
    processed_at: Optional[datetime] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = None
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# Payroll API Models
class PayrollCreate(BaseModel):
    employee_id: str
    employee_name: str
    employee_email: EmailStr
    department: Optional[str] = None
    position: Optional[str] = None
    pay_period_start: datetime
    pay_period_end: datetime
    payment_date: datetime
    base_salary: float
    overtime_hours: float = 0.0
    overtime_rate: float = 0.0
    bonus: float = 0.0
    commission: float = 0.0
    tax_deduction: float = 0.0
    health_insurance: float = 0.0
    retirement_contribution: float = 0.0
    other_deductions: float = 0.0
    payment_method: str = "Direct Deposit"
    bank_account_last4: Optional[str] = None
    notes: Optional[str] = None

class PayrollUpdate(BaseModel):
    employee_name: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    payment_date: Optional[datetime] = None
    base_salary: Optional[float] = None
    overtime_hours: Optional[float] = None
    overtime_rate: Optional[float] = None
    bonus: Optional[float] = None
    commission: Optional[float] = None
    tax_deduction: Optional[float] = None
    health_insurance: Optional[float] = None
    retirement_contribution: Optional[float] = None
    other_deductions: Optional[float] = None
    status: Optional[PayrollStatus] = None
    payment_method: Optional[str] = None
    bank_account_last4: Optional[str] = None
    notes: Optional[str] = None

class PayrollResponse(BaseModel):
    id: str
    organization_id: str
    employee_id: str
    employee_name: str
    employee_email: EmailStr
    department: Optional[str] = None
    position: Optional[str] = None
    pay_period_start: datetime
    pay_period_end: datetime
    payment_date: datetime
    base_salary: float
    overtime_hours: float
    overtime_rate: float
    overtime_pay: float
    bonus: float
    commission: float
    tax_deduction: float
    health_insurance: float
    retirement_contribution: float
    other_deductions: float
    gross_pay: float
    total_deductions: float
    net_pay: float
    status: PayrollStatus
    payment_method: str
    bank_account_last4: Optional[str] = None
    notes: Optional[str] = None
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    
    class Config:
        from_attributes = True

# Benefits Models
class BenefitType(str, enum.Enum):
    HealthInsurance = "Health Insurance"
    DentalInsurance = "Dental Insurance"
    VisionInsurance = "Vision Insurance"
    LifeInsurance = "Life Insurance"
    RetirementPlan = "Retirement Plan"
    PaidTimeOff = "Paid Time Off"
    Wellness = "Wellness Program"
    EducationAssistance = "Education Assistance"
    ChildCare = "Child Care"
    Other = "Other"

class EnrollmentStatus(str, enum.Enum):
    Pending = "Pending"
    Active = "Active"
    Declined = "Declined"
    Terminated = "Terminated"
    Expired = "Expired"

class BenefitPlan(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    organization_id: str
    
    # Plan Information
    plan_name: str
    benefit_type: BenefitType
    provider: Optional[str] = None
    description: str
    
    # Coverage Details
    coverage_level: str  # Individual, Family, Employee+Spouse, etc.
    coverage_amount: Optional[str] = None  # e.g., "$50,000", "100%", etc.
    
    # Cost Information
    monthly_premium: float
    employer_contribution: float  # Amount or percentage
    employee_contribution: float  # Amount or percentage
    deductible: Optional[float] = None
    copay: Optional[float] = None
    out_of_pocket_max: Optional[float] = None
    
    # Eligibility
    eligibility_criteria: str  # e.g., "Full-time employees"
    waiting_period_days: int = 0  # Days before eligible
    
    # Plan Details
    plan_year_start: datetime
    plan_year_end: datetime
    enrollment_start: datetime
    enrollment_end: datetime
    
    # Features
    features: List[str] = Field(default_factory=list)
    exclusions: List[str] = Field(default_factory=list)
    
    # Status
    is_active: bool = True
    max_enrollments: Optional[int] = None  # Max number of employees
    current_enrollments: int = 0
    
    # Documents
    plan_documents: List[str] = Field(default_factory=list)  # URLs to documents
    
    # Metadata
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = None
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class BenefitEnrollment(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    organization_id: str
    
    # Employee Information
    employee_id: str
    employee_name: str
    employee_email: EmailStr
    department: Optional[str] = None
    position: Optional[str] = None
    
    # Benefit Plan Reference
    plan_id: str
    plan_name: str
    benefit_type: BenefitType
    
    # Enrollment Details
    enrollment_date: datetime
    effective_date: datetime
    termination_date: Optional[datetime] = None
    status: EnrollmentStatus = EnrollmentStatus.Pending
    
    # Coverage
    coverage_level: str
    dependents: List[Dict] = Field(default_factory=list)  # List of dependent info
    
    # Cost Breakdown
    monthly_premium: float
    employer_contribution: float
    employee_contribution: float
    annual_cost: float  # Total annual cost
    
    # Payment
    payment_frequency: str = "Monthly"  # Monthly, Bi-weekly, etc.
    deduction_start_date: Optional[datetime] = None
    
    # Documents
    enrollment_documents: List[str] = Field(default_factory=list)
    
    # Approval
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    declined_reason: Optional[str] = None
    
    # Metadata
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = None
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# Benefits API Models
class BenefitPlanCreate(BaseModel):
    plan_name: str
    benefit_type: BenefitType
    provider: Optional[str] = None
    description: str
    coverage_level: str
    coverage_amount: Optional[str] = None
    monthly_premium: float
    employer_contribution: float
    employee_contribution: float
    deductible: Optional[float] = None
    copay: Optional[float] = None
    out_of_pocket_max: Optional[float] = None
    eligibility_criteria: str
    waiting_period_days: int = 0
    plan_year_start: datetime
    plan_year_end: datetime
    enrollment_start: datetime
    enrollment_end: datetime
    features: List[str] = Field(default_factory=list)
    exclusions: List[str] = Field(default_factory=list)
    max_enrollments: Optional[int] = None
    notes: Optional[str] = None

class BenefitPlanUpdate(BaseModel):
    plan_name: Optional[str] = None
    provider: Optional[str] = None
    description: Optional[str] = None
    coverage_level: Optional[str] = None
    coverage_amount: Optional[str] = None
    monthly_premium: Optional[float] = None
    employer_contribution: Optional[float] = None
    employee_contribution: Optional[float] = None
    deductible: Optional[float] = None
    copay: Optional[float] = None
    out_of_pocket_max: Optional[float] = None
    eligibility_criteria: Optional[str] = None
    waiting_period_days: Optional[int] = None
    enrollment_start: Optional[datetime] = None
    enrollment_end: Optional[datetime] = None
    features: Optional[List[str]] = None
    exclusions: Optional[List[str]] = None
    is_active: Optional[bool] = None
    max_enrollments: Optional[int] = None
    notes: Optional[str] = None

class BenefitPlanResponse(BaseModel):
    id: str
    organization_id: str
    plan_name: str
    benefit_type: BenefitType
    provider: Optional[str] = None
    description: str
    coverage_level: str
    coverage_amount: Optional[str] = None
    monthly_premium: float
    employer_contribution: float
    employee_contribution: float
    deductible: Optional[float] = None
    copay: Optional[float] = None
    out_of_pocket_max: Optional[float] = None
    eligibility_criteria: str
    waiting_period_days: int
    plan_year_start: datetime
    plan_year_end: datetime
    enrollment_start: datetime
    enrollment_end: datetime
    features: List[str]
    exclusions: List[str]
    is_active: bool
    max_enrollments: Optional[int] = None
    current_enrollments: int
    plan_documents: List[str]
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    
    class Config:
        from_attributes = True

class BenefitEnrollmentCreate(BaseModel):
    employee_id: str
    employee_name: str
    employee_email: EmailStr
    department: Optional[str] = None
    position: Optional[str] = None
    plan_id: str
    enrollment_date: datetime
    effective_date: datetime
    coverage_level: str
    dependents: List[Dict] = Field(default_factory=list)
    payment_frequency: str = "Monthly"
    deduction_start_date: Optional[datetime] = None
    notes: Optional[str] = None

class BenefitEnrollmentUpdate(BaseModel):
    employee_name: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    effective_date: Optional[datetime] = None
    termination_date: Optional[datetime] = None
    status: Optional[EnrollmentStatus] = None
    coverage_level: Optional[str] = None
    dependents: Optional[List[Dict]] = None
    payment_frequency: Optional[str] = None
    deduction_start_date: Optional[datetime] = None
    declined_reason: Optional[str] = None
    notes: Optional[str] = None

class BenefitEnrollmentResponse(BaseModel):
    id: str
    organization_id: str
    employee_id: str
    employee_name: str
    employee_email: EmailStr
    department: Optional[str] = None
    position: Optional[str] = None
    plan_id: str
    plan_name: str
    benefit_type: BenefitType
    enrollment_date: datetime
    effective_date: datetime
    termination_date: Optional[datetime] = None
    status: EnrollmentStatus
    coverage_level: str
    dependents: List[Dict]
    monthly_premium: float
    employer_contribution: float
    employee_contribution: float
    annual_cost: float
    payment_frequency: str
    deduction_start_date: Optional[datetime] = None
    enrollment_documents: List[str]
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    declined_reason: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    
    class Config:
        from_attributes = True
