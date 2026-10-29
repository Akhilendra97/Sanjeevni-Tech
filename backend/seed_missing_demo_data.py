"""
Sanjeevni Tech — schema-informed demo seeder (PostgreSQL + SQLAlchemy).

Safety:
- DRY RUN by default; use --apply to commit.
- Inserts only into listed tables that are empty at the time of execution.
- Never deletes or updates existing records.
- All inserted clinical records are clearly marked DEMO TEST DATA.
- Uses existing parent IDs and inserts dependencies in the correct order.
- Entire apply operation is one transaction; any error rolls back all inserts.
Use only on a local/demo database, never production.
"""
from __future__ import annotations
import argparse
import importlib
import sys
from datetime import datetime, date, time, timedelta
from decimal import Decimal

from sqlalchemy import inspect, text

TABLES = [
    "emergencies", "triages",
    "invoices", "payments", "billings",
    "prescriptions",
    "radiology", "imaging_studies", "imaging_reports",
    "operation_theatres", "surgeries",
]

def get_engine():
    importlib.import_module("app.main")
    for module_name in ("app.core.database", "app.db", "app.database"):
        try:
            mod = importlib.import_module(module_name)
        except Exception:
            continue
        for name in ("engine", "sync_engine"):
            obj = getattr(mod, name, None)
            if obj is not None and hasattr(obj, "connect") and hasattr(obj, "begin"):
                return obj
    raise RuntimeError("Could not locate synchronous SQLAlchemy engine in app.core.database/app.db/app.database")

def one_id(conn, table, where=""):
    sql = f'SELECT id FROM "{table}" {where} ORDER BY id LIMIT 1'
    row = conn.execute(text(sql)).first()
    return row[0] if row else None

def count(conn, table):
    return int(conn.execute(text(f'SELECT COUNT(*) FROM "{table}"')).scalar_one())

def exists_table(inspector, table):
    return table in set(inspector.get_table_names())

def insert(conn, table, values):
    # Only pass columns actually present in the live DB schema.
    cols = {c["name"] for c in inspect(conn).get_columns(table)}
    values = {k: v for k, v in values.items() if k in cols}
    missing = []
    for c in inspect(conn).get_columns(table):
        if c["name"] == "id" or c.get("default") is not None or c.get("autoincrement") or c["nullable"]:
            continue
        if c["name"] not in values:
            missing.append(c["name"])
    if missing:
        raise RuntimeError(f"{table}: missing required columns: {missing}")
    keys = list(values)
    cols_sql = ", ".join(f'"{k}"' for k in keys)
    bind_sql = ", ".join(f":{k}" for k in keys)
    row = conn.execute(
        text(f'INSERT INTO "{table}" ({cols_sql}) VALUES ({bind_sql}) RETURNING id'),
        values
    ).first()
    return row[0]

def run(conn, args, inspector):
    tables = set(inspector.get_table_names())
    missing_tables = [t for t in TABLES if t not in tables]
    if missing_tables:
        print("NOTICE: tables absent in this DB and will be skipped:", ", ".join(missing_tables))

    def ready(table):
        if table not in tables:
            return False
        n = count(conn, table)
        print(f"{table}: current rows={n}")
        if n:
            print(f"  PRESERVE: not empty; skipping all inserts for {table}")
            return False
        return True

    active = {t: ready(t) for t in TABLES if t in tables}
    if not any(active.values()):
        print("No empty target tables available; no inserts planned.")
        return

    # Required existing parent IDs, selected from real existing rows.
    patient_ids = [r[0] for r in conn.execute(text('SELECT id FROM patients ORDER BY id LIMIT :lim'), {"lim": args.rows}).all()] if "patients" in tables else []
    doctor_ids = [r[0] for r in conn.execute(text('SELECT id FROM doctors ORDER BY id LIMIT :lim'), {"lim": args.rows}).all()] if "doctors" in tables else []
    dept_ids = [r[0] for r in conn.execute(text('SELECT id FROM departments ORDER BY id LIMIT :lim'), {"lim": args.rows}).all()] if "departments" in tables else []
    user_ids = [r[0] for r in conn.execute(text('SELECT id FROM users ORDER BY id LIMIT :lim'), {"lim": args.rows}).all()] if "users" in tables else []
    if not patient_ids:
        raise RuntimeError("No existing patients found; refusing to invent patient records.")
    if not doctor_ids and any(active.get(t, False) for t in ("prescriptions", "radiology", "operation_theatres", "surgeries")):
        raise RuntimeError("No existing doctors found; refusing to invent doctor records.")

    now = datetime.now().replace(microsecond=0)
    today = date.today()
    made = {t: [] for t in TABLES}
    row_count = args.rows

    # Emergency -> triage
    if active.get("emergencies"):
        for i in range(row_count):
            pid = patient_ids[i % len(patient_ids)]
            did = doctor_ids[i % len(doctor_ids)] if doctor_ids else None
            values = {
                "emergency_number": f"DEMO-ER-{now:%Y%m%d}-{i+1:03d}",
                "patient_id": pid, "doctor_id": did,
                "registered_by": user_ids[i % len(user_ids)] if user_ids else None,
                "arrival_time": now - timedelta(minutes=15*i),
                "triage_level": "yellow",
                "chief_complaint": "DEMO TEST DATA — not a real clinical event",
                "symptoms": "Demo-only symptoms for dashboard testing",
                "initial_assessment": "Demo-only assessment; not for clinical use",
                "treatment": "Demo-only; no treatment was actually provided",
                "status": "waiting",
                "notes": "DEMO TEST DATA",
                "created_at": now, "updated_at": now,
            }
            made["emergencies"].append(insert(conn, "emergencies", values))
        print(f"  planned/inserted emergency rows: {len(made['emergencies'])}")

    if active.get("triages"):
        emergency_ids = made["emergencies"] or (
            [r[0] for r in conn.execute(text('SELECT id FROM emergencies ORDER BY id LIMIT :lim'), {"lim": row_count}).all()]
            if "emergencies" in tables else []
        )
        if not emergency_ids:
            print("  SKIP triages: no emergency parent rows exist or were created")
        else:
            for i, eid in enumerate(emergency_ids[:row_count]):
                # Match patient by emergency record's patient_id
                pid = conn.execute(text('SELECT patient_id FROM emergencies WHERE id=:id'), {"id": eid}).scalar_one()
                values = {
                    "triage_number": f"DEMO-TRIAGE-{now:%Y%m%d}-{i+1:03d}",
                    "emergency_id": eid, "patient_id": pid,
                    "assessed_by": user_ids[i % len(user_ids)] if user_ids else None,
                    "triage_level": "yellow", "priority_score": 3,
                    "chief_complaint": "DEMO TEST DATA",
                    "symptoms": "Demo-only symptoms; not for clinical use",
                    "pain_score": 1, "consciousness_level": "alert",
                    "temperature": "36.8 C", "heart_rate": 78,
                    "respiratory_rate": 16, "oxygen_saturation": 98,
                    "systolic_bp": 120, "diastolic_bp": 80,
                    "assessment": "DEMO TEST DATA — not a clinical assessment",
                    "immediate_intervention": "None; demo record only",
                    "recommended_department": "General",
                    "status": "pending", "assessed_at": now,
                    "notes": "DEMO TEST DATA",
                    "created_at": now, "updated_at": now,
                }
                made["triages"].append(insert(conn, "triages", values))
            print(f"  planned/inserted triage rows: {len(made['triages'])}")

    # Invoices -> payments, with values internally consistent.
    if active.get("invoices"):
        admission_ids = [r[0] for r in conn.execute(text('SELECT id FROM admissions ORDER BY id LIMIT :lim'), {"lim": row_count}).all()] if "admissions" in tables else []
        for i in range(row_count):
            pid = patient_ids[i % len(patient_ids)]
            aid = admission_ids[i] if i < len(admission_ids) else None
            values = {
                "invoice_number": f"DEMO-INV-{now:%Y%m%d}-{i+1:03d}",
                "patient_id": pid, "admission_id": aid,
                "invoice_date": today, "due_date": today + timedelta(days=30),
                "subtotal": Decimal("500.00"), "tax_amount": Decimal("0.00"),
                "discount_amount": Decimal("0.00"), "total_amount": Decimal("500.00"),
                "paid_amount": Decimal("100.00"), "balance_amount": Decimal("400.00"),
                "status": "partial",
                "notes": "DEMO TEST DATA — not a real bill",
                "created_at": now, "updated_at": now,
            }
            made["invoices"].append(insert(conn, "invoices", values))
        print(f"  planned/inserted invoice rows: {len(made['invoices'])}")

    if active.get("payments"):
        invoice_ids = made["invoices"] or (
            [r[0] for r in conn.execute(text('SELECT id FROM invoices ORDER BY id LIMIT :lim'), {"lim": row_count}).all()]
            if "invoices" in tables else []
        )
        for i, iid in enumerate(invoice_ids[:row_count]):
            pid = conn.execute(text('SELECT patient_id FROM invoices WHERE id=:id'), {"id": iid}).scalar_one()
            values = {
                "payment_number": f"DEMO-PAY-{now:%Y%m%d}-{i+1:03d}",
                "invoice_id": iid, "patient_id": pid,
                "payment_date": today, "amount": Decimal("100.00"),
                "payment_method": "demo",
                "transaction_reference": f"DEMO-REF-{now:%Y%m%d}-{i+1:03d}",
                "status": "completed",
                "received_by": user_ids[i % len(user_ids)] if user_ids else None,
                "remarks": "DEMO TEST DATA — no real money received",
                "created_at": now, "updated_at": now,
            }
            made["payments"].append(insert(conn, "payments", values))
        if not invoice_ids:
            print("  SKIP payments: no invoice rows exist or were created")
        else:
            print(f"  planned/inserted payment rows: {len(made['payments'])}")

    if active.get("billings"):
        for i in range(row_count):
            pid = patient_ids[i % len(patient_ids)]
            values = {
                "bill_number": f"DEMO-BILL-{now:%Y%m%d}-{i+1:03d}",
                "patient_id": pid, "bill_date": today, "bill_type": "general",
                "description": "DEMO TEST DATA — not a real bill",
                "subtotal": Decimal("500.00"), "discount": Decimal("0.00"),
                "tax": Decimal("0.00"), "total_amount": Decimal("500.00"),
                "paid_amount": Decimal("100.00"), "payment_status": "partial",
                "payment_method": "demo", "notes": "DEMO TEST DATA",
                "created_at": now, "updated_at": now,
            }
            made["billings"].append(insert(conn, "billings", values))
        print(f"  planned/inserted billing rows: {len(made['billings'])}")

    # Prescriptions use existing patients and doctors only.
    if active.get("prescriptions"):
        for i in range(row_count):
            values = {
                "prescription_number": f"DEMO-RX-{now:%Y%m%d}-{i+1:03d}",
                "patient_id": patient_ids[i % len(patient_ids)],
                "doctor_id": doctor_ids[i % len(doctor_ids)],
                "prescription_date": today,
                "diagnosis": "DEMO TEST DATA — not a real diagnosis",
                "medicines": "DEMO ONLY — no medication prescribed; test record",
                "instructions": "Demo record only; do not use for treatment",
                "duration": "Demo only", "follow_up_date": today + timedelta(days=14),
                "notes": "DEMO TEST DATA",
                "created_at": now, "updated_at": now,
            }
            made["prescriptions"].append(insert(conn, "prescriptions", values))
        print(f"  planned/inserted prescription rows: {len(made['prescriptions'])}")

    # Radiology -> imaging studies -> reports
    if active.get("radiology"):
        for i in range(row_count):
            values = {
                "radiology_number": f"DEMO-RAD-{now:%Y%m%d}-{i+1:03d}",
                "patient_id": patient_ids[i % len(patient_ids)],
                "doctor_id": doctor_ids[i % len(doctor_ids)],
                "examination_type": "X-ray (demo)",
                "body_part": "Chest (demo)",
                "clinical_indication": "DEMO TEST DATA — not a real imaging request",
                "priority": "routine", "status": "ordered",
                "requested_at": now, "notes": "DEMO TEST DATA",
                "created_at": now, "updated_at": now,
            }
            made["radiology"].append(insert(conn, "radiology", values))
        print(f"  planned/inserted radiology rows: {len(made['radiology'])}")

    if active.get("imaging_studies"):
        radiology_ids = made["radiology"] or (
            [r[0] for r in conn.execute(text('SELECT id FROM radiology ORDER BY id LIMIT :lim'), {"lim": row_count}).all()]
            if "radiology" in tables else []
        )
        for i, rid in enumerate(radiology_ids[:row_count]):
            values = {
                "study_number": f"DEMO-STUDY-{now:%Y%m%d}-{i+1:03d}",
                "radiology_id": rid, "modality": "X-ray (demo)",
                "study_description": "DEMO TEST DATA — no real imaging performed",
                "body_part": "Chest (demo)", "study_date": now,
                "image_count": 0, "is_completed": False,
                "notes": "DEMO TEST DATA — no image files attached",
                "created_at": now, "updated_at": now,
            }
            made["imaging_studies"].append(insert(conn, "imaging_studies", values))
        if not radiology_ids:
            print("  SKIP imaging_studies: no radiology parent rows")
        else:
            print(f"  planned/inserted imaging study rows: {len(made['imaging_studies'])}")

    if active.get("imaging_reports"):
        study_ids = made["imaging_studies"] or (
            [r[0] for r in conn.execute(text('SELECT id FROM imaging_studies ORDER BY id LIMIT :lim'), {"lim": row_count}).all()]
            if "imaging_studies" in tables else []
        )
        for i, sid in enumerate(study_ids[:row_count]):
            values = {
                "report_number": f"DEMO-REPORT-{now:%Y%m%d}-{i+1:03d}",
                "study_id": sid, "report_status": "draft",
                "findings": "DEMO TEST DATA — no actual radiology findings",
                "impression": "Demo-only report; not for clinical use",
                "recommendations": "None — demo record only",
                "radiologist_name": "Demo Radiologist",
                "is_final": False, "notes": "DEMO TEST DATA",
                "created_at": now, "updated_at": now,
            }
            made["imaging_reports"].append(insert(conn, "imaging_reports", values))
        if not study_ids:
            print("  SKIP imaging_reports: no imaging study parent rows")
        else:
            print(f"  planned/inserted imaging report rows: {len(made['imaging_reports'])}")

    # Operation theatre -> surgery
    if active.get("operation_theatres"):
        if not dept_ids:
            raise RuntimeError("No departments found; cannot create operation theatres.")
        for i in range(row_count):
            values = {
                "ot_number": f"DEMO-OT-{now:%Y%m%d}-{i+1:03d}",
                "ot_name": f"Demo Operating Theatre {i+1}",
                "ot_type": "general",
                "department_id": dept_ids[i % len(dept_ids)],
                "patient_id": patient_ids[i % len(patient_ids)],
                "surgeon_id": doctor_ids[i % len(doctor_ids)],
                "surgery_type": "general",
                "scheduled_start": now + timedelta(days=i+1),
                "scheduled_end": now + timedelta(days=i+1, hours=2),
                "status": "scheduled",
                "preoperative_notes": "DEMO TEST DATA — not a real operation",
                "notes": "DEMO TEST DATA",
                "created_at": now, "updated_at": now,
            }
            made["operation_theatres"].append(insert(conn, "operation_theatres", values))
        print(f"  planned/inserted operation theatre rows: {len(made['operation_theatres'])}")

    if active.get("surgeries"):
        ot_ids = made["operation_theatres"] or (
            [r[0] for r in conn.execute(text('SELECT id FROM operation_theatres ORDER BY id LIMIT :lim'), {"lim": row_count}).all()]
            if "operation_theatres" in tables else []
        )
        for i, otid in enumerate(ot_ids[:row_count]):
            row = conn.execute(text('SELECT patient_id, department_id, surgeon_id FROM operation_theatres WHERE id=:id'), {"id": otid}).first()
            values = {
                "surgery_number": f"DEMO-SURG-{now:%Y%m%d}-{i+1:03d}",
                "patient_id": row[0], "operation_theatre_id": otid,
                "department_id": row[1], "surgeon_id": row[2],
                "procedure_name": "Demo procedure — not performed",
                "surgery_type": "general",
                "scheduled_start": now + timedelta(days=i+1),
                "scheduled_end": now + timedelta(days=i+1, hours=2),
                "preoperative_diagnosis": "DEMO TEST DATA — not a real diagnosis",
                "procedure_details": "Demo-only; no procedure was performed",
                "status": "scheduled",
                "notes": "DEMO TEST DATA",
                "created_at": now, "updated_at": now,
            }
            made["surgeries"].append(insert(conn, "surgeries", values))
        if not ot_ids:
            print("  SKIP surgeries: no operation theatre parent rows")
        else:
            print(f"  planned/inserted surgery rows: {len(made['surgeries'])}")

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--apply", action="store_true", help="Commit inserts; default is dry run.")
    p.add_argument("--rows", type=int, default=3, help="Rows per empty target table (1–10).")
    args = p.parse_args()
    if not 1 <= args.rows <= 10:
        raise SystemExit("--rows must be from 1 to 10.")
    engine = get_engine()
    print("Sanjeevni schema-informed demo seeder")
    print(f"Database dialect: {engine.dialect.name}")
    print(f"Mode: {'APPLY' if args.apply else 'DRY RUN (no writes)'}")
    if engine.dialect.name != "postgresql":
        raise RuntimeError("Expected PostgreSQL; refusing to continue.")
    with engine.begin() as conn:
        inspector = inspect(conn)
        if not args.apply:
            # Dry-run on a rollback-only transaction: generate/validate inserts, then roll back.
            trans = conn.begin_nested()
            try:
                run(conn, args, inspector)
            finally:
                trans.rollback()
            print("\nDRY RUN COMPLETE — all attempted inserts were rolled back; no DB changes.")
        else:
            run(conn, args, inspector)
            print("\nAPPLY transaction completed. Counts after inserts:")
            for table in TABLES:
                if table in set(inspect(conn).get_table_names()):
                    print(f"  {table}: {count(conn, table)}")

if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"\nSTOPPED: {type(exc).__name__}: {exc}", file=sys.stderr)
        print("Transaction rolled back on error. Do not claim success unless counts confirm it.", file=sys.stderr)
        raise
