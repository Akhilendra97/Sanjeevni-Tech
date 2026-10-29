from collections.abc import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.constants import UserRole
from app.core.permissions import require_permissions
from app.core.security import decode_access_token


bearer_scheme = HTTPBearer(
    auto_error=False,
)


def get_current_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme
    ),
) -> str:
    """
    Extract a Bearer token from the Authorization header.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials are required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication scheme.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return credentials.credentials


def get_current_user_payload(
    token: str = Depends(get_current_token),
) -> dict:
    """
    Validate the JWT and return its payload.
    """
    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload


def require_role(
    *allowed_roles: UserRole,
) -> Callable:
    """
    Create a dependency that allows only selected roles.
    """

    allowed_values = {role.value for role in allowed_roles}

    def role_dependency(
        payload: dict = Depends(get_current_user_payload),
    ) -> dict:
        current_role = payload.get("role")

        if current_role not in allowed_values:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this resource.",
            )

        return payload

    return role_dependency


def require_permission(
    permission: str,
) -> Callable:
    """
    Create a dependency that allows access only when
    the authenticated user's role has the requested permission.
    """

    def permission_dependency(
        payload: dict = Depends(get_current_user_payload),
    ) -> dict:
        role_value = payload.get("role")

        try:
            current_role = UserRole(role_value)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )

        require_permissions(
            current_role,
            [permission],
        )

        return payload

    return permission_dependency
