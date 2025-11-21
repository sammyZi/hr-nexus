from sqlalchemy import Column, Integer, String, Boolean, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship, declarative_base
from pydantic import BaseModel, EmailStr
from typing import Optional
import enum

Base = declarative_base()

class TaskCategory(str, enum.Enum):
    Recruiting = "Recruiting"
    Onboarding = "Onboarding"
    Payroll = "Payroll"
    Benefits = "Benefits"
    Learning_Development = "Learning_Development"
    Employee_Relations = "Employee_Relations"
    Performance = "Performance"
    Offboarding = "Offboarding"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True)
    
    tasks = relationship("Task", back_populates="owner")

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    status = Column(String, default="Pending")
    category = Column(SQLEnum(TaskCategory))
    priority = Column(String, default="Medium")
    owner_id = Column(Integer, ForeignKey("users.id"))
    
    owner = relationship("User", back_populates="tasks")

# Pydantic Models
class UserCreate(BaseModel):
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
    id: int
    status: str
    owner_id: Optional[int] = None

    class Config:
        from_attributes = True
