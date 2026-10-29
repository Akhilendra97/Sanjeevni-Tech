from collections.abc import Iterable

from fastapi import HTTPException, status

from app.core.constants import UserRole


ROLE_PERMISSIONS: dict[UserRole, set[str]] = {
    UserRole.ADMIN: {
        "system.manage",
        "users.manage",
        "roles.manage",

        "patients.view",
        "patients.manage",
        "prescriptions.view",
        "prescriptions.manage",

        "doctors.view",
        "doctors.manage",
        "schedules.view",
        "schedules.manage",

        "nurses.view",
        "nurses.manage",

        "staff.view",
        "staff.manage",

        "appointments.view",
        "appointments.manage",

        "admissions.view",
        "admissions.manage",

        "beds.view",
        "beds.manage",

        "emr.view",
        "emr.manage",

        "pharmacy.view",
        "pharmacy.manage",

        "laboratory.view",
        "laboratory.manage",

        "radiology.view",
        "radiology.manage",

        "blood_bank.view",
        "blood_bank.manage",

        "emergency.view",
        "emergency.manage",

        "ambulance.view",
        "ambulance.manage",

        "surgery.view",
        "surgery.manage",

        "nursing.view",
        "nursing.manage",

        "billing.view",
        "billing.manage",

        "insurance.view",
        "insurance.manage",

        "procurement.view",
        "procurement.manage",

        "inventory.view",
        "inventory.manage",

        "equipment.view",
        "equipment.manage",

        "reports.view",
        "analytics.view",
        "audit.view",
    },

    UserRole.DOCTOR: {
        "patients.view",
        "prescriptions.view",
        "prescriptions.manage",
        "appointments.view",
        "appointments.manage",
        "admissions.view",
        "beds.view",
        "emr.view",
        "emr.manage",
        "pharmacy.view",
        "laboratory.view",
        "laboratory.order",
        "radiology.view",
        "radiology.order",
        "emergency.view",
        "emergency.manage",
        "surgery.view",
        "surgery.manage",
        "nursing.view",
        "reports.view",
        "schedules.view",
        "schedules.manage",
    },

    UserRole.NURSE: {
        "patients.view",
        "appointments.view",
        "admissions.view",
        "beds.view",
        "emr.view",
        "vitals.view",
        "vitals.manage",
        "nursing.view",
        "nursing.manage",
        "pharmacy.view",
        "laboratory.view",
        "radiology.view",
        "emergency.view",
        "emergency.manage",
    },

    UserRole.STAFF: {
        "patients.view",
        "appointments.view",
        "admissions.view",
        "beds.view",
        "queue.view",
        "queue.manage",
        "documents.view_own",
    },

    UserRole.RECEPTIONIST: {
        "patients.view",
        "patients.manage",
        "prescriptions.view",
        "prescriptions.manage",
        "appointments.view",
        "appointments.manage",
        "queue.view",
        "queue.manage",
        "admissions.view",
        "admissions.manage",
        "discharges.view",
        "discharges.manage",
        "beds.view",
        "billing.view",
    },

    UserRole.PHARMACIST: {
        "patients.view",
        "prescriptions.view",
        "pharmacy.view",
        "pharmacy.manage",
        "inventory.view",
        "inventory.manage",
        "procurement.view",
        "procurement.manage",
        "suppliers.view",
        "suppliers.manage",
    },

    UserRole.LABORATORY: {
        "patients.view",
        "laboratory.view",
        "laboratory.manage",
        "reports.view",
    },

    UserRole.ACCOUNTANT: {
        "patients.view",
        "billing.view",
        "billing.manage",
        "payments.view",
        "payments.manage",
        "insurance.view",
        "insurance.manage",
        "reports.view",
        "analytics.view",
    },

    UserRole.PATIENT: {
        "profile.view",
        "profile.manage",
        "appointments.view",
        "appointments.manage",
        "emr.view_own",
        "prescriptions.view_own",
        "laboratory.view_own",
        "radiology.view_own",
        "billing.view_own",
        "payments.view_own",
        "insurance.view_own",
        "documents.view_own",
    },
}


def get_role_permissions(role: UserRole) -> set[str]:
    """
    Return permissions assigned to a role.
    """
    return ROLE_PERMISSIONS.get(role, set())


def has_permission(
    role: UserRole,
    permission: str,
) -> bool:
    """
    Check whether a role has a specific permission.
    """
    return permission in get_role_permissions(role)


def require_permissions(
    role: UserRole,
    permissions: Iterable[str],
) -> None:
    """
    Raise HTTP 403 if the role lacks any required permission.
    """
    required_permissions = set(permissions)
    role_permissions = get_role_permissions(role)

    if not required_permissions.issubset(role_permissions):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action.",
        )


