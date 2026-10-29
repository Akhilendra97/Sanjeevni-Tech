from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.constants import UserRole
from app.core.database import get_db
from app.core.dependencies import require_role
from app.schemas.user import (
    UserCreate,
    UserListResponse,
    UserPasswordReset,
    UserResponse,
    UserUpdate,
)
from app.services.user_service import (
    create_user,
    get_user,
    get_users,
    reset_password,
    set_status,
    update_user,
)


router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


@router.get(
    "",
    response_model=UserListResponse,
)
def list_users(
    search: str | None = Query(default=None, max_length=100),
    role: str | None = Query(default=None, max_length=50),
    status_filter: str | None = Query(
        default=None,
        alias="status",
        max_length=30,
    ),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: dict = Depends(require_role(UserRole.ADMIN)),
) -> UserListResponse:
    try:
        return get_users(
            db,
            search=search,
            role=role,
            status=status_filter,
            page=page,
            page_size=page_size,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get(
    "/{user_id}",
    response_model=UserResponse,
)
def get_one_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_role(UserRole.ADMIN)),
) -> UserResponse:
    user = get_user(db, user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    return user_service_response(user)


def user_service_response(user) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "phone": user.phone,
        "role": user.role.name,
        "status": user.status,
        "is_verified": user.is_verified,
        "is_superuser": user.is_superuser,
        "last_login_at": user.last_login_at,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
    }


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_user_api(
    request: UserCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_role(UserRole.ADMIN)),
) -> UserResponse:
    try:
        return create_user(
            db,
            username=request.username,
            email=request.email,
            password=request.password,
            full_name=request.full_name,
            phone=request.phone,
            role=request.role,
            status=request.status,
            is_verified=request.is_verified,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.patch(
    "/{user_id}",
    response_model=UserResponse,
)
def update_user_api(
    user_id: int,
    request: UserUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_role(UserRole.ADMIN)),
) -> UserResponse:
    user = get_user(db, user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    try:
        return update_user(
            db,
            user,
            email=request.email,
            full_name=request.full_name,
            phone=request.phone,
            role=request.role,
            status=request.status,
            is_verified=request.is_verified,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.patch(
    "/{user_id}/status",
    response_model=UserResponse,
)
def update_user_status(
    user_id: int,
    request: UserUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_role(UserRole.ADMIN)),
) -> UserResponse:
    if request.status is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status is required.",
        )

    user = get_user(db, user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    try:
        return set_status(db, user, request.status)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.post(
    "/{user_id}/reset-password",
    status_code=status.HTTP_204_NO_CONTENT,
)
def reset_user_password(
    user_id: int,
    request: UserPasswordReset,
    db: Session = Depends(get_db),
    _: dict = Depends(require_role(UserRole.ADMIN)),
) -> None:
    user = get_user(db, user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    reset_password(db, user, request.password)
