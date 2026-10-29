from __future__ import annotations

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import traceback

print("=== Sanjeevni Staff API diagnostic ===")
print("Step 1: importing application models")
try:
    import app.models  # noqa: F401 - registers model mappings
    from sqlalchemy.orm import configure_mappers
    configure_mappers()
    print("PASS: SQLAlchemy mappers configured")
except Exception as exc:
    print("FAIL: model import / mapper configuration")
    traceback.print_exc()
    raise SystemExit(2)

print("\nStep 2: checking database connection")
try:
    from sqlalchemy import text
    from app.core.database import SessionLocal, engine
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    print("PASS: database connection")
except Exception:
    print("FAIL: database connection")
    traceback.print_exc()
    raise SystemExit(3)

print("\nStep 3: executing the same staff list query used by GET /staff")
try:
    from app.services.staff_service import list_staff
    with SessionLocal() as db:
        records = list_staff(db)
        print(f"PASS: staff query returned {len(records)} records")
        if records:
            from app.schemas.staff import StaffResponse
            payload = [StaffResponse.model_validate(row).model_dump(mode="json") for row in records]
            print(f"PASS: response serialization for {len(payload)} records")
        else:
            print("PASS: empty staff list serializes as an empty array")
except Exception:
    print("FAIL: staff query or response serialization")
    traceback.print_exc()
    raise SystemExit(4)

print("\nDIAGNOSTIC PASS: model mapping, database connection, staff query and serialization succeeded.")


