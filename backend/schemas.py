from pydantic import BaseModel, Field
from typing import Optional, Any, List
from datetime import datetime


class OTPRequest(BaseModel):
    phone: str
    purpose: str = 'login'


class OTPVerify(BaseModel):
    phone: str
    code: str


class UserCreate(BaseModel):
    name: Optional[str]
    phone: str
    email: Optional[str]


class Location(BaseModel):
    lat: float
    lng: float
    accuracy: Optional[float]
    address: Optional[str] = None


class AlertCreate(BaseModel):
    type: str = Field(..., description='medical | disaster | safety | fire | accident | crime')
    note: Optional[str]
    location: Location
    attachments: Optional[List[Any]] = []
    severity: Optional[int] = Field(3, ge=1, le=5, description='Severity level 1-5')
    photo_urls: Optional[List[str]] = []
    audio_url: Optional[str] = None


class AlertOut(AlertCreate):
    id: str
    user_id: str
    status: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    assigned_to: Optional[str] = None
    verified: Optional[bool] = False
    marked_done_at: Optional[str] = None
    resolved_at: Optional[str] = None


class AlertStatusUpdate(BaseModel):
    status: str = Field(..., description='pending | assigned | in_progress | resolved | cancelled')
    note: Optional[str] = None


class AlertSummary(BaseModel):
    """Summary for dashboard display"""
    pending_count: int
    in_progress_count: int
    resolved_count: int
    total_count: int


class EmergencyContactCreate(BaseModel):
    name: str
    phone: str
    relationship: str = 'personal'
    priority: int = 10
