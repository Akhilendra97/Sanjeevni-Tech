"""
Sanjeevni Tech synthetic patient reset/seed utility.
Run from backend directory:
  python reset_and_seed_patients.py        # dry run
  python reset_and_seed_patients.py --apply
All generated data is fictional test data, not real patient data.
"""
import argparse, csv, secrets, string
from datetime import date, datetime, timedelta
from pathlib import Path
from sqlalchemy import select, func, inspect, text
from app.core.database import SessionLocal, engine
from app.core.security import hash_password
from app.models import Patient, User, Role, Diagnosis, MedicalRecord, Vital

N = 50
PREFIX = "seedpatient_"
DOMAIN = "example.test"
OUT = Path("backups/seed_patient_credentials.csv")
PEOPLE = [
("Aarav","Sharma","Male"),("Vivaan","Verma","Male"),("Aditya","Singh","Male"),("Arjun","Gupta","Male"),("Reyansh","Yadav","Male"),
("Krishna","Mishra","Male"),("Ishaan","Pandey","Male"),("Rohan","Srivastava","Male"),("Kabir","Tiwari","Male"),("Dhruv","Shukla","Male"),
("Ananya","Sharma","Female"),("Diya","Verma","Female"),("Aadhya","Singh","Female"),("Saanvi","Gupta","Female"),("Myra","Yadav","Female"),
("Ira","Mishra","Female"),("Kavya","Pandey","Female"),("Aanya","Srivastava","Female"),("Meera","Tiwari","Female"),("Kiara","Shukla","Female"),
("Rahul","Jaiswal","Male"),("Kunal","Tripathi","Male"),("Mohit","Awasthi","Male"),("Nikhil","Saxena","Male"),("Siddharth","Chauhan","Male"),
("Pooja","Jaiswal","Female"),("Neha","Tripathi","Female"),("Priya","Awasthi","Female"),("Riya","Saxena","Female"),("Sneha","Chauhan","Female"),
("Manav","Agrawal","Male"),("Yash","Dubey","Male"),("Amit","Kumar","Male"),("Samar","Patel","Male"),("Dev","Bajpai","Male"),
("Shreya","Agrawal","Female"),("Ishita","Dubey","Female"),("Nandini","Kumar","Female"),("Tanvi","Patel","Female"),("Avni","Bajpai","Female"),
("Aniket","Mandal","Male"),("Harsh","Soni","Male"),("Pranav","Rastogi","Male"),("Varun","Sahu","Male"),("Ritvik","Garg","Male"),
("Simran","Mandal","Female"),("Palak","Soni","Female"),("Tanya","Rastogi","Female"),("Muskan","Sahu","Female"),("Radhika","Garg","Female")]
CASES = [
("Essential hypertension","High blood pressure; routine follow-up scenario","Moderate"),
("Type 2 diabetes mellitus","Elevated blood glucose scenario","Moderate"),
("Acute upper respiratory infection","Cough, sore throat and nasal congestion","Mild"),
("Iron deficiency anaemia","Fatigue scenario; synthetic record only","Moderate"),
("Migraine","Recurrent headache with light sensitivity","Moderate"),
("Gastro-oesophageal reflux","Heartburn after meals","Mild"),
("Seasonal allergic rhinitis","Sneezing and nasal itching","Mild"),
("Vitamin D deficiency","Generalised body aches scenario","Mild"),
("Acute gastroenteritis","Loose stools and mild dehydration symptoms","Moderate"),
("Mechanical low back pain","Lower back discomfort scenario","Mild")]
CITIES=[("Kanpur","Uttar Pradesh","208001"),("Lucknow","Uttar Pradesh","226001"),("Unnao","Uttar Pradesh","209801"),("Prayagraj","Uttar Pradesh","211001"),("Varanasi","Uttar Pradesh","221001")]
GROUPS=["A+","B+","O+","AB+","A-","B-","O-","AB-"]
OCC=["Student","Teacher","Shopkeeper","Software trainee","Homemaker","Accountant","Driver","Retired","Office assistant","Tailor"]
ALLERGIES=[None,None,"Dust","Pollen","Penicillin (reported)",None]
CHRONIC=[None,None,"Hypertension","Type 2 diabetes","Asthma","Hypothyroidism"]
CHECK_TABLES=["appointments","prescriptions","admissions","medical_records","nursing_notes","vitals","billings","lab_samples","diagnoses","discharges","blood_requests","pharmacy_dispensing","diets","documents","emergencies","icu","radiology","insurance_claims","invoices","payments","operation_theatres","surgeries","triages","queues","parkings","visitors","nursing_care_plans"]

def password():
    chars=string.ascii_letters+string.digits+"!@#$%_-"
    while True:
        s="".join(secrets.choice(chars) for _ in range(16))
        if any(c.islower() for c in s) and any(c.isupper() for c in s) and any(c.isdigit() for c in s) and any(c in "!@#$%_-" for c in s): return s

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--apply",action="store_true",help="make database changes; default is dry-run")
    args=ap.parse_args()
    db=SessionLocal()
    try:
        role=db.scalar(select(Role).where(func.lower(Role.name)=="patient"))
        if role is None: raise RuntimeError("Patient role missing; no changes made.")
        targets=[]
        for i in range(1,N+1):
            uname=f"{PREFIX}{i:03d}"
            u=db.scalar(select(User).where(User.username==uname))
            if u is None: raise RuntimeError(f"Expected {uname} but it was not found; no changes made.")
            if u.role_id!=role.id or u.is_superuser or u.email!=f"{uname}@{DOMAIN}":
                raise RuntimeError(f"Safety check failed for {uname}; no changes made.")
            pat=db.scalar(select(Patient).where(Patient.user_id==u.id))
            if pat is None: raise RuntimeError(f"No linked profile for {uname}; no changes made.")
            targets.append((u,pat))
        ids=[p.id for _,p in targets]
        inspector=inspect(engine); tables=set(inspector.get_table_names())
        counts={}
        for table in CHECK_TABLES:
            if table not in tables: continue
            cols={c["name"] for c in inspector.get_columns(table)}
            if "patient_id" not in cols: continue
            count=engine.connect().execute(text(f'SELECT COUNT(*) FROM "{table}" WHERE patient_id = ANY(:ids)'),{"ids":ids}).scalar_one()
            if count: counts[table]=count
        if counts: raise RuntimeError(f"Safety stop: linked records found {counts}; no changes made.")
        print(f"Verified exactly {len(targets)} seedpatient_001–050 patient accounts.")
        print("No linked clinical/operational rows found in checked tables.")
        print("Only these 50 accounts will be replaced; other accounts and roles are untouched.")
        if not args.apply:
            print("DRY RUN: database unchanged. Back up PostgreSQL, then rerun with --apply.")
            return
        OUT.parent.mkdir(parents=True,exist_ok=True)
        tmp=OUT.with_suffix(".csv.tmp")
        credentials=[]
        try:
            for u,p in targets: db.delete(p); db.delete(u)
            db.flush()
            from app.models import Doctor
            doctor=db.get(Doctor,2)
            doctor_id=doctor.id if doctor else None
            today=date.today(); now=datetime.now()
            for i,(first,last,gender) in enumerate(PEOPLE,1):
                uname=f"{PREFIX}{i:03d}"; email=f"{uname}@{DOMAIN}"; phone=f"9000008{i:04d}"
                pwd=password(); city,state,postal=CITIES[(i-1)%len(CITIES)]
                age=18+(i*7%58); dob=date(today.year-age,1+i%12,1+i%27)
                full=f"{first} {last}"; condition,symptoms,severity=CASES[(i-1)%len(CASES)]
                u=User(username=uname,email=email,password_hash=hash_password(pwd),full_name=full,phone=phone,role_id=role.id,status="active",is_verified=False,is_superuser=False)
                db.add(u); db.flush()
                p=Patient(user_id=u.id,patient_number=f"PAT-SEED-{i:04d}",first_name=first,last_name=last,date_of_birth=dob,gender=gender,blood_group=GROUPS[(i-1)%len(GROUPS)],phone=phone,email=email,address=f"{10+i} Sample Nagar, Demo Road",city=city,state=state,postal_code=postal,country="India",emergency_contact_name=f"{last} Family Contact",emergency_contact_phone=f"9000009{i:04d}",emergency_contact_relation="Family",occupation=OCC[(i-1)%len(OCC)],nationality="Indian",allergies=ALLERGIES[(i-1)%len(ALLERGIES)],chronic_conditions=CHRONIC[(i-1)%len(CHRONIC)],is_active=True,registration_date=today)
                db.add(p); db.flush()
                credentials.append({"patient_number":p.patient_number,"full_name":full,"gender":gender,"username":uname,"email":email,"password":pwd,"synthetic_condition":condition,"data_notice":"FICTIONAL TEST DATA — NOT A REAL PATIENT"})
                db.add(Diagnosis(patient_id=p.id,doctor_id=doctor_id,diagnosis_code=f"DEMO-{i:04d}",diagnosis_name=condition,diagnosis_type="Primary",description=symptoms,symptoms=symptoms,severity=severity,diagnosis_date=today,notes="Synthetic demo scenario only; not clinical advice."))
                db.add(MedicalRecord(patient_id=p.id,doctor_id=doctor_id,record_number=f"MR-SEED-{i:04d}",chief_complaint=symptoms,symptoms=symptoms,diagnosis=condition,treatment_plan="Demo only: clinician assessment and follow-up; not for real care.",clinical_notes="Fictional test record created for application demonstration.",medical_history="Synthetic scenario only.",allergies=p.allergies,record_type="Outpatient"))
                db.add(Vital(patient_id=p.id,temperature=36.5+(i%8)*0.1,heart_rate=68+(i%25),respiratory_rate=14+(i%5),systolic_bp=110+(i%25),diastolic_bp=70+(i%15),oxygen_saturation=96+(i%4),blood_glucose=90+(i%35),weight=48+(i%45),height=150+(i%35),notes="Synthetic UI/workflow test values; not for clinical use.",recorded_at=now-timedelta(days=i%14)))
            with tmp.open("w",newline="",encoding="utf-8") as f:
                w=csv.DictWriter(f,fieldnames=list(credentials[0])); w.writeheader(); w.writerows(credentials)
            db.commit(); tmp.replace(OUT)
            print(f"SUCCESS: created {N} fictional patient accounts, profiles, diagnoses, medical records and sample vitals.")
            print(f"Credentials saved to: {OUT.resolve()}")
            print("Do not commit the credentials CSV to Git. No appointments/admissions/labs were generated.")
        except Exception:
            db.rollback()
            if tmp.exists(): tmp.unlink()
            raise
    finally: db.close()

if __name__=="__main__": main()
