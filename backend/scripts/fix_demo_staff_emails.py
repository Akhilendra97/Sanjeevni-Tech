import csv
from datetime import datetime
from pathlib import Path

from sqlalchemy import select
from app.core.database import SessionLocal
from app.models.user import User
import app.models  # Register all model mappings

old_suffix = "@demo.sanjeevni.local"
new_suffix = "@example.com"
backup_path = Path("staff_email_backup_" + datetime.now().strftime("%Y%m%d_%H%M%S") + ".csv")

with SessionLocal() as db:
    users = db.scalars(
        select(User).where(User.email.ilike("%" + old_suffix))
    ).all()

    if not users:
        print("No matching demo email addresses found. Nothing changed.")
        raise SystemExit(0)

    changes = []
    for user in users:
        old_email = user.email
        new_email = old_email[:-len(old_suffix)] + new_suffix
        changes.append((user, old_email, new_email))

    targets = [new_email.lower() for _, _, new_email in changes]
    if len(targets) != len(set(targets)):
        raise RuntimeError("Duplicate target emails detected. No changes made.")

    changing_ids = {user.id for user, _, _ in changes}
    existing = db.scalars(
        select(User).where(User.email.in_(targets))
    ).all()

    conflicts = [
        u.email for u in existing
        if u.id not in changing_ids
    ]
    if conflicts:
        raise RuntimeError(
            "Target email already exists; no changes made: "
            + ", ".join(conflicts)
        )

    with backup_path.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow(["user_id", "username", "old_email", "new_email"])
        for user, old_email, new_email in changes:
            writer.writerow([user.id, user.username, old_email, new_email])

    try:
        for user, _, new_email in changes:
            user.email = new_email
        db.commit()
    except Exception:
        db.rollback()
        raise

    print(f"Updated email records: {len(changes)}")
    print(f"Backup CSV: {backup_path.resolve()}")
    print("Passwords and other user fields were not changed.")
