from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user_payload
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services.audit_log_service import record_audit_event
from app.services.auth_service import (
    authenticate_user,
    create_user_access_token,
    register_user,
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db),
) -> UserResponse:
    try:
        user = register_user(
            db,
            username=request.username,
            email=request.email,
            password=request.password,
            full_name=request.full_name,
            phone=request.phone,
            role_name=request.role,
            date_of_birth=request.date_of_birth,
            gender=request.gender,
            blood_group=request.blood_group,
            address=request.address,
            city=request.city,
            state=request.state,
            postal_code=request.postal_code,
            emergency_contact_name=request.emergency_contact_name,
            emergency_contact_phone=request.emergency_contact_phone,
            emergency_contact_relation=request.emergency_contact_relation,
        )

        return UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            phone=user.phone,
            role=user.role.name,
            status=user.status,
            is_verified=user.is_verified,
            is_superuser=user.is_superuser,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed.",
        ) from exc


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    request: LoginRequest,
    http_request: Request,
    db: Session = Depends(get_db),
) -> TokenResponse:
    user = authenticate_user(
        db,
        request.username_or_email,
        request.password,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password.",
            headers={
                "WWW-Authenticate": "Bearer",
            },
        )

    token = create_user_access_token(user)

    # Record only successful authentication. Never store credentials or tokens.
    client_ip = http_request.client.host if http_request.client else None
    user_agent = http_request.headers.get("user-agent")
    record_audit_event(
        db,
        user_id=user.id,
        action="LOGIN_SUCCESS",
        module="Authentication",
        entity_type="User",
        entity_id=user.id,
        description=f"Successful login for account '{user.username}'.",
        ip_address=client_ip,
        user_agent=user_agent,
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
    )


@router.get(
    "/me",
    response_model=dict,
)
def current_user(
    payload: dict = Depends(get_current_user_payload),
) -> dict:
    return {
        "user_id": int(payload["sub"]),
        "role": payload["role"],
        "token_type": payload["type"],
        "issued_at": payload["iat"],
        "expires_at": payload["exp"],
    }
