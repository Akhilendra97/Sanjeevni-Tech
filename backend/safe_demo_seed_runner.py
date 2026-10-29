from app.core.database import engine
from sqlalchemy import text
import subprocess
import sys
import os
from pathlib import Path
from datetime import datetime

pg_dump = sys.argv[1]
seeder = Path(sys.argv[2])

with engine.connect() as conn:
    conn.execute(text("SELECT 1"))

url = engine.url.render_as_string(hide_password=False)
backup_dir = Path.home() / "Downloads" / "Sanjeevni_DB_Backups"
backup_dir.mkdir(parents=True, exist_ok=True)
backup_file = backup_dir / f"sanjeevni_before_demo_seed_{datetime.now():%Y%m%d_%H%M%S}.dump"

print("Database:", engine.url.database)
print("Creating backup:", backup_file)

result = subprocess.run([
    pg_dump, f"--dbname={url}", "--format=custom",
    "--no-owner", f"--file={backup_file}"
])

if result.returncode != 0 or not backup_file.exists() or backup_file.stat().st_size == 0:
    raise SystemExit("BACKUP FAILED. Seeder was NOT applied.")

print("BACKUP SUCCESS:", backup_file)
print()
print("Review the backup above. Type APPLY in PowerShell to continue.")
