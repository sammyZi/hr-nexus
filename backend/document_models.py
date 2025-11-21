from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from models import Base

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    original_filename = Column(String)
    file_path = Column(String)
    file_type = Column(String)  # pdf, docx, txt
    file_size = Column(Integer)  # in bytes
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    category = Column(String, nullable=True)  # Optional: link to HR pillar

# Pydantic Models
class DocumentCreate(BaseModel):
    filename: str
    file_type: str
    category: Optional[str] = None

class DocumentResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    file_type: str
    file_size: int
    uploaded_at: datetime
    category: Optional[str] = None
    
    class Config:
        from_attributes = True
