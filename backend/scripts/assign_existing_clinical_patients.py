"""Interactive, transaction-safe assignment of existing clinical patients to one nurse.

Run from backend with the project's .venv active. It creates no patients, vitals,
prescriptions, notes, or care plans. It only creates/reactivates nurse-patient links
for active patients who already have at least one vital or prescription record.
"""
from __future__ import annotations

import sys
from pathlib import Path
from datetime import datetime

from sqlalchemy import inspect, text
from app.core.database import engine


def choose(rows, label):
    if not rows:
        raise RuntimeError(f"No eligible {label} found.")
    for i, row in enumerate(rows, 1):
        print(f"{i}. {row['display']} [ID: {row['id']}]")
    while True:
        raw = input(f"Select {label} number (1-{len(rows)}): ").strip()
        try:
            idx = int(raw)
            if 1 <= idx <= len(rows):
                return rows[idx - 1]
        except ValueError:
            pass
        print("Invalid selection. Enter one of the displayed numbers.")


def main():
    insp = inspect(engine)
    tables = set(insp.get_table_names())
    required = {"users", "nurses", "patients", "vitals", "prescriptions", "nurse_patient_assignments"}
    missing = sorted(required - tables)
    if missing:
        raise RuntimeError("Required database tables missing: " + ", ".join(missing))

    user_cols = {c["name"] for c in insp.get_columns("users")}
    nurse_cols = {c["name"] for c in insp.get_columns("nurses")}
    patient_cols = {c["name"] for c in insp.get_columns("patients")}
    assign_cols = {c["name"] for c in insp.get_columns("nurse_patient_assignments")}
    if not {"id", "user_id"}.issubset(nurse_cols) or not {"id", "user_id", "is_active", "patient_number"}.issubset(patient_cols):
        raise RuntimeError("Unexpected nurse/patient schema; no changes made.")
    if not {"nurse_id", "patient_id", "status", "assigned_by_user_id", "assigned_at", "ended_at"}.issubset(assign_cols):
        raise RuntimeError("Unexpected assignment schema; no changes made.")

    name_expr = ""
    if "full_name" in user_cols:
        name_expr = "u.full_name"
    elif {"first_name", "last_name"}.issubset(user_cols):
        name_expr = "TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, ''))"
    elif "username" in user_cols:
        name_expr = "u.username"
    else:
        name_expr = "CAST(u.id AS VARCHAR)"
    role_expr = "u.role" if "role" in user_cols else "NULL"

    with engine.connect() as conn:
        nurses = conn.execute(text(f"""
            SELECT n.id, COALESCE(NULLIF({name_expr}, ''), 'Nurse') AS display,
                   n.employee_id, n.is_available
            FROM nurses n JOIN users u ON u.id = n.user_id
            ORDER BY display, n.id
        """)).mappings().all()
        nurse_rows = [dict(id=r["id"], display=f"{r['display']} | Employee: {r['employee_id']} | Available: {r['is_available']}") for r in nurses]
        print("\nAVAILABLE NURSE PROFILES")
        selected_nurse = choose(nurse_rows, "nurse")

        if "role" in user_cols:
            admin_rows = conn.execute(text(f"""
                SELECT u.id, COALESCE(NULLIF({name_expr}, ''), 'User') AS display, u.role
                FROM users u
                WHERE LOWER(CAST(u.role AS VARCHAR)) LIKE '%admin%'
                ORDER BY display, u.id
            """)).mappings().all()
        else:
            admin_rows = []
        if not admin_rows:
            raise RuntimeError("No user with an admin role was found. No changes made; do not enter an arbitrary user ID.")
        admin_choices = [dict(id=r["id"], display=f"{r['display']} | Role: {r['role']}") for r in admin_rows]
        print("\nADMIN ACCOUNT TO RECORD AS ASSIGNER")
        selected_admin = choose(admin_choices, "admin user")

        # Only active patients with pre-existing vitals or prescriptions are included.
        patients = conn.execute(text("""
            SELECT p.id, p.patient_number,
                   TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')) AS display,
                   EXISTS (SELECT 1 FROM vitals v WHERE v.patient_id = p.id) AS has_vitals,
                   EXISTS (SELECT 1 FROM prescriptions rx WHERE rx.patient_id = p.id) AS has_prescriptions
            FROM patients p
            WHERE p.is_active IS TRUE
              AND (EXISTS (SELECT 1 FROM vitals v WHERE v.patient_id = p.id)
                   OR EXISTS (SELECT 1 FROM prescriptions rx WHERE rx.patient_id = p.id))
            ORDER BY p.patient_number, p.id
        """)).mappings().all()
        if not patients:
            raise RuntimeError("No active patients with existing vitals/prescriptions found. No changes made.")

        existing = conn.execute(text("""
            SELECT patient_id, status FROM nurse_patient_assignments WHERE nurse_id = :nurse_id
        """), {"nurse_id": selected_nurse["id"]}).mappings().all()
        active_ids = {r["patient_id"] for r in existing if str(r["status"]).lower() == "active"}
        new_count = sum(1 for p in patients if p["id"] not in {r["patient_id"] for r in existing})
        reactivate_count = sum(1 for p in patients if p["id"] in {r["patient_id"] for r in existing} and p["id"] not in active_ids)
        print("\nPROPOSED CHANGE")
        print(f"Selected nurse ID: {selected_nurse['id']}")
        print(f"Selected admin assigner user ID: {selected_admin['id']}")
        print(f"Active patients with existing vitals or prescriptions: {len(patients)}")
        print(f"New assignment links: {new_count}")
        print(f"Inactive links to reactivate: {reactivate_count}")
        print("No clinical values, notes, care plans, or prescriptions will be created or edited.")
        confirmation = input("Type ASSIGN EXISTING CLINICAL PATIENTS to proceed: ").strip()
        if confirmation != "ASSIGN EXISTING CLINICAL PATIENTS":
            print("Cancelled. No changes made.")
            return

        # Transaction: each patient with existing clinical data gets an explicit assignment.
        # End the read transaction before starting the write transaction.
        conn.commit()
        tx = conn.begin()
        try:
            for p in patients:
                conn.execute(text("""
                    INSERT INTO nurse_patient_assignments
                        (nurse_id, patient_id, status, assigned_by_user_id, assigned_at, ended_at)
                    VALUES (:nurse_id, :patient_id, 'active', :admin_id, CURRENT_TIMESTAMP, NULL)
                    ON CONFLICT (nurse_id, patient_id)
                    DO UPDATE SET status = 'active', ended_at = NULL,
                                  assigned_by_user_id = EXCLUDED.assigned_by_user_id,
                                  assigned_at = CURRENT_TIMESTAMP
                """), {"nurse_id": selected_nurse["id"], "patient_id": p["id"], "admin_id": selected_admin["id"]})
            tx.commit()
        except Exception:
            tx.rollback()
            raise

        final_count = conn.execute(text("""
            SELECT COUNT(*) FROM nurse_patient_assignments
            WHERE nurse_id = :nurse_id AND status = 'active'
        """), {"nurse_id": selected_nurse["id"]}).scalar_one()
        print("\nSUCCESS")
        print(f"Active assignments for selected nurse: {final_count}")
        print("Existing clinical records were preserved. No notes/care plans were fabricated.")

if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"\nFAILED SAFELY: {exc}", file=sys.stderr)
        print("No partial assignment changes should remain; transaction is rolled back on write errors.", file=sys.stderr)
        sys.exit(1)
    finally:
        engine.dispose()
