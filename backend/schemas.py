from pydantic import BaseModel, Field
from typing import Optional, Any, List


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


class AlertCreate(BaseModel):
    type: str = Field(..., description='medical | disaster | safety')
    note: Optional[str]
    location: Location
    attachments: Optional[List[Any]] = []


class AlertOut(AlertCreate):
    id: str
    user_id: str
    status: str
