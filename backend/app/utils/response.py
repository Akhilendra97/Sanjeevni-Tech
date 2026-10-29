from __future__ import annotations

from typing import Any


def success_response(
    data: Any = None,
    message: str = "Operation completed successfully.",
    status_code: int = 200,
) -> dict[str, Any]:
    """Build a standard successful API response."""
    return {
        "success": True,
        "status_code": status_code,
        "message": message,
        "data": data,
    }


def error_response(
    message: str,
    status_code: int = 400,
    errors: Any = None,
) -> dict[str, Any]:
    """Build a standard API error response."""
    if not message or not message.strip():
        message = "An error occurred."

    return {
        "success": False,
        "status_code": status_code,
        "message": message,
        "errors": errors,
        "data": None,
    }


def validation_error_response(
    errors: Any,
    message: str = "Validation failed.",
) -> dict[str, Any]:
    """Build a standard validation-error response."""
    return error_response(
        message=message,
        status_code=422,
        errors=errors,
    )


def not_found_response(
    message: str = "Requested resource was not found.",
) -> dict[str, Any]:
    """Build a standard not-found response."""
    return error_response(
        message=message,
        status_code=404,
    )


def unauthorized_response(
    message: str = "Authentication is required.",
) -> dict[str, Any]:
    """Build a standard unauthorized response."""
    return error_response(
        message=message,
        status_code=401,
    )


def forbidden_response(
    message: str = "You do not have permission to perform this action.",
) -> dict[str, Any]:
    """Build a standard forbidden response."""
    return error_response(
        message=message,
        status_code=403,
    )


def conflict_response(
    message: str = "The requested operation conflicts with existing data.",
) -> dict[str, Any]:
    """Build a standard conflict response."""
    return error_response(
        message=message,
        status_code=409,
    )


def pagination_response(
    items: list[Any],
    page: int,
    page_size: int,
    total: int,
    message: str = "Records retrieved successfully.",
) -> dict[str, Any]:
    """Build a standard paginated response."""
    if page < 1:
        raise ValueError("Page must be greater than zero.")

    if page_size < 1:
        raise ValueError("Page size must be greater than zero.")

    if total < 0:
        raise ValueError("Total cannot be negative.")

    total_pages = (
        (total + page_size - 1) // page_size
        if total
        else 0
    )

    return {
        "success": True,
        "status_code": 200,
        "message": message,
        "data": items,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_previous": page > 1 and total_pages > 0,
        },
    }


def normalize_error_message(error: Exception) -> str:
    """Convert an exception into a safe API-facing message."""
    message = str(error).strip()

    if not message:
        return "An unexpected error occurred."

    return message


def exception_response(
    error: Exception,
    status_code: int = 500,
) -> dict[str, Any]:
    """Build a standard response from an exception."""
    return error_response(
        message=normalize_error_message(error),
        status_code=status_code,
    )
