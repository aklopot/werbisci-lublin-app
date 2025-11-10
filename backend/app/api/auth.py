from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.deps import get_db, require_user
from app.core.security import create_access_token
from app.modules.users.schemas import Token
from app.modules.users.services import UserService
from app.modules.login_sessions.services import LoginSessionService
from app.modules.users.models import User


class LoginRequest(BaseModel):
    login: str
    password: str


router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)) -> Token:
    service = UserService()
    user = service.authenticate(
        db,
        login=payload.login,
        password=payload.password,
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    token = create_access_token(
        user.id,
        {"role": user.role, "full_name": user.full_name},
    )
    
    # Create login session record
    # TODO: Temporarily disabled until table schema is fixed
    try:
        session_service = LoginSessionService()
        client_ip = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
        session_service.create_session(
            db,
            user_id=user.id,
            ip_address=client_ip,
            user_agent=user_agent,
        )
    except Exception as e:
        # Silently ignore session creation errors to allow login
        print(f"Warning: Could not create login session: {e}")
    
    return Token(access_token=token)


class LogoutRequest(BaseModel):
    reason: str = "manual"


@router.post("/logout")
def logout(
    payload: LogoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user),
) -> dict:
    """
    Mark the user's most recent active session as logged out.
    This is called from frontend when user logs out (manual, inactivity, or token_expired).
    """
    session_service = LoginSessionService()
    
    # Find the most recent active session for this user and mark it as logged out
    sessions = session_service.search_sessions(
        db,
        user_id=current_user.id,
        active_only=True,
        limit=1,
        sort_field="login_time",
        sort_direction="desc",
    )
    
    if sessions:
        session_service.logout_session(
            db,
            session_id=sessions[0].id,
            logout_reason=payload.reason,
        )
    
    return {"message": "Logged out successfully"}
