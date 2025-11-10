from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class LoginSessionCreate(BaseModel):
    user_id: int
    ip_address: str | None = None
    user_agent: str | None = None


class LoginSessionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    login_time: datetime
    logout_time: datetime | None
    logout_reason: str | None
    ip_address: str | None
    user_agent: str | None


class LoginSessionUpdate(BaseModel):
    logout_time: datetime | None = None
    logout_reason: str | None = None

