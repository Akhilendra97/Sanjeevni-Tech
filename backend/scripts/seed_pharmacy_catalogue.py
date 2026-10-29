"""
Idempotent demo pharmacy catalogue seed.
Run from backend directory using the project's venv:
  .\.venv\Scripts\python.exe scripts\seed_pharmacy_catalogue.py
Creates at least 100 distinct demo medicines and matching inventory rows.
No existing medicine or inventory rows are deleted or reset.
"""
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from sqlalchemy import select
from app.core.database import SessionLocal
from app.models.medicine import Medicine
from app.models.inventory import Inventory

CATALOGUE = [
("Paracetamol 500 mg","Paracetamol","Analgesic","Tablet","500 mg",2.00,4.00,120),
("Paracetamol Oral Suspension","Paracetamol","Analgesic","Suspension","250 mg/5 ml",28,42,35),
("Ibuprofen 200 mg","Ibuprofen","NSAID","Tablet","200 mg",2.5,5,65),
("Ibuprofen 400 mg","Ibuprofen","NSAID","Tablet","400 mg",4,8,55),
("Amoxicillin 250 mg","Amoxicillin","Antibiotic","Capsule","250 mg",5,10,80),
("Amoxicillin 500 mg","Amoxicillin","Antibiotic","Capsule","500 mg",8,15,75),
("Cetirizine 10 mg","Cetirizine","Antihistamine","Tablet","10 mg",3,6,80),
("Loratadine 10 mg","Loratadine","Antihistamine","Tablet","10 mg",4,8,50),
("ORS Sachet","Oral rehydration salts","Rehydration","Sachet","21.8 g",7,12,75),
("Antacid Suspension","Aluminium hydroxide + magnesium hydroxide","Antacid","Suspension","170 ml",45,65,35),
("Omeprazole 20 mg","Omeprazole","Gastrointestinal","Capsule","20 mg",4,9,60),
("Pantoprazole 40 mg","Pantoprazole","Gastrointestinal","Tablet","40 mg",5,10,55),
("Metformin 500 mg","Metformin","Antidiabetic","Tablet","500 mg",2,5,100),
("Amlodipine 5 mg","Amlodipine","Antihypertensive","Tablet","5 mg",2,5,90),
("Atorvastatin 10 mg","Atorvastatin","Lipid lowering","Tablet","10 mg",4,8,70),
("Azithromycin 250 mg","Azithromycin","Antibiotic","Tablet","250 mg",9,18,45),
("Azithromycin 500 mg","Azithromycin","Antibiotic","Tablet","500 mg",14,28,40),
("Cefixime 200 mg","Cefixime","Antibiotic","Tablet","200 mg",12,24,40),
("Doxycycline 100 mg","Doxycycline","Antibiotic","Capsule","100 mg",3,7,45),
("Vitamin C 500 mg","Ascorbic acid","Vitamin","Tablet","500 mg",2,5,100),
]
forms = ["Tablet","Capsule","Syrup","Suspension","Injection","Cream","Ointment","Drops","Sachet","Inhaler"]
cats = ["Analgesic","Antibiotic","Antihistamine","Gastrointestinal","Vitamin","Antiseptic","Dermatology","Respiratory","Supplement","Electrolyte"]
generics = [
("Calcium carbonate","Calcium supplement", "Tablet","500 mg",3,7),
("Ferrous sulphate","Iron supplement","Tablet","200 mg",2,5),
("Folic acid","Vitamin","Tablet","5 mg",1,3),
("Zinc sulphate","Mineral supplement","Tablet","20 mg",2,5),
("Multivitamin","Vitamin","Tablet","Daily",4,9),
("Saline","Electrolyte","Injection","0.9% 500 ml",35,55),
("Povidone iodine","Antiseptic","Solution","10%",22,35),
("Clotrimazole","Antifungal","Cream","1%",18,30),
("Hydrocortisone","Dermatology","Cream","1%",15,28),
("Salbutamol","Bronchodilator","Inhaler","100 mcg",45,75),
("Loperamide","Antidiarrheal","Capsule","2 mg",3,7),
("Lactulose","Laxative","Syrup","10 g/15 ml",40,65),
("Domperidone","Antiemetic","Tablet","10 mg",2,5),
("Ondansetron","Antiemetic","Tablet","4 mg",3,7),
("Diclofenac","NSAID","Gel","1%",22,38),
("Mupirocin","Antibiotic","Ointment","2%",30,48),
("Artificial tears","Ophthalmic","Drops","10 ml",25,40),
("Chlorhexidine","Antiseptic","Mouthwash","0.2%",35,55),
("Dextromethorphan","Cough suppressant","Syrup","10 mg/5 ml",28,45),
("Guaifenesin","Expectorant","Syrup","100 mg/5 ml",25,42),
]
# Fill 100+ distinct catalogue items using varied generics, strengths and dosage forms.
items = list(CATALOGUE)
for i in range(80):
    generic, category, form, strength, purchase, selling = generics[i % len(generics)]
    form = forms[(i // len(generics)) % len(forms)] if i >= len(generics) else form
    name = f"{generic} {strength}" if form in ("Tablet","Capsule") else f"{generic} {form} {strength}"
    # Ensure distinct name/code for legitimate catalogue entries.
    if any(x[0] == name for x in items):
        name = f"{generic} {strength} ({form} pack {i+1})"
    items.append((name, generic, category, form, strength, purchase, selling, 30 + (i*7)%100))

def col(model, name):
    return getattr(model, name, None)

def main():
    db = SessionLocal()
    created_meds = created_stock = 0
    try:
        existing_codes = set(db.scalars(select(Medicine.medicine_code)).all())
        for idx, (name, generic, category, form, strength, purchase, selling, qty) in enumerate(items, 1):
            code = f"DEMO-PHARM-{idx:03d}"
            med = db.scalar(select(Medicine).where(Medicine.medicine_code == code))
            if med is None:
                med = Medicine(
                    medicine_code=code, name=name[:150], generic_name=generic[:150],
                    category=category[:100], manufacturer="Sanjeevni Demo Pharma",
                    dosage_form=form[:100], strength=strength[:100], unit="unit",
                    purchase_price=Decimal(str(purchase)), selling_price=Decimal(str(selling)),
                    reorder_level=15, is_active=True,
                )
                db.add(med); db.flush(); created_meds += 1
            inv = db.scalar(select(Inventory).where(Inventory.medicine_id == med.id))
            if inv is None:
                inv = Inventory(
                    medicine_id=med.id, quantity=qty, reserved_quantity=0,
                    minimum_stock=15, maximum_stock=500, unit_cost=Decimal(str(purchase)),
                    location="Demo Pharmacy Store", batch_number=f"DEMO-BATCH-{idx:03d}",
                    expiry_date=datetime.now(timezone.utc) + timedelta(days=730),
                    status="available", notes="Synthetic demo inventory; not for clinical use",
                )
                db.add(inv); created_stock += 1
        db.commit()
        total = db.scalar(select(Medicine).where(Medicine.medicine_code.like("DEMO-PHARM-%")).count()) if False else None
        print(f"Seed complete. New medicines: {created_meds}; new inventory rows: {created_stock}.")
        print("Only synthetic DEMO-PHARM catalogue entries were created; existing rows were not deleted.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
