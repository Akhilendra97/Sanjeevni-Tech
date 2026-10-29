"""Create the staff duty table and idempotently assign a seven-day roster to every staff profile."""
from datetime import date, timedelta

from sqlalchemy import select

import app.models  # noqa: F401 - register existing ORM models
from app.core.database import Base, SessionLocal, engine
from app.models.staff import Staff
from app.models.staff_duty_assignment import StaffDutyAssignment

SHIFTS = (("morning", "06:00", "14:00"), ("evening", "14:00", "22:00"), ("night", "22:00", "06:00"))


def main():
    Base.metadata.create_all(bind=engine, tables=[StaffDutyAssignment.__table__])
    start = date.today()
    days = 7
    with SessionLocal() as db:
        staff_list = db.scalars(select(Staff).order_by(Staff.id)).all()
        if not staff_list:
            print("Staff duty table created. No staff profiles found; no assignments created.")
            return
        existing = db.scalars(select(StaffDutyAssignment).where(
            StaffDutyAssignment.duty_date >= start,
            StaffDutyAssignment.duty_date <= start + timedelta(days=days - 1),
        )).all()
        by_key = {(x.staff_id, x.duty_date): x for x in existing}
        created = 0
        updated = 0
        for day_index in range(days):
            duty_day = start + timedelta(days=day_index)
            for staff_index, staff in enumerate(staff_list):
                shift, start_text, end_text = SHIFTS[(staff_index + day_index) % len(SHIFTS)]
                from datetime import time
                item = by_key.get((staff.id, duty_day))
                if item is None:
                    item = StaffDutyAssignment(staff_id=staff.id, duty_date=duty_day)
                    db.add(item)
                    by_key[(staff.id, duty_day)] = item
                    created += 1
                else:
                    updated += 1
                item.shift = shift
                item.start_time = time.fromisoformat(start_text)
                item.end_time = time.fromisoformat(end_text)
                item.status = "scheduled"
                item.notes = "Auto-assigned initial roster; administrator should review staffing coverage."
        db.commit()
        print(f"Staff profiles: {len(staff_list)}")
        print(f"Roster dates: {start.isoformat()} through {(start + timedelta(days=days - 1)).isoformat()}")
        print(f"Assignments created: {created}; existing assignments refreshed: {updated}")
        print(f"Total assignments in this roster: {len(staff_list) * days}")
        print("Shifts: morning 06:00-14:00, evening 14:00-22:00, night 22:00-06:00 (overnight).")


if __name__ == "__main__":
    main()
