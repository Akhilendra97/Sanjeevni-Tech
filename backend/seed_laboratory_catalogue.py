"""
Idempotently seed the Laboratory catalogue for Sanjeevni Tech.
Creates real catalogue/configuration records only; does NOT fabricate patient results.
Run from backend with the project virtual environment activated:
    python seed_laboratory_catalogue.py
"""
from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.lab import Lab
from app.models.lab_test import LabTest

LABS = [
    ("Hematology Laboratory", "LAB-HEMA", "CBC, hemoglobin, blood counts and coagulation"),
    ("Clinical Biochemistry", "LAB-BIO", "Glucose, kidney, liver, lipid and metabolic tests"),
    ("Clinical Microbiology", "LAB-MICRO", "Culture, microscopy and antimicrobial testing"),
    ("Histopathology Laboratory", "LAB-HISTO", "Tissue pathology and histopathology"),
    ("Clinical Pathology", "LAB-PATH", "Routine clinical pathology investigations"),
    ("Immunology Laboratory", "LAB-IMMUNO", "Immunology and autoimmune investigations"),
    ("Serology Laboratory", "LAB-SERO", "Serology and infectious disease screening"),
    ("Molecular Diagnostics", "LAB-MOLEC", "PCR and molecular diagnostic testing"),
    ("Clinical Toxicology", "LAB-TOX", "Toxicology investigations"),
    ("Urinalysis Laboratory", "LAB-URINE", "Urine routine and microscopy"),
    ("Blood Bank & Transfusion", "LAB-BB", "Blood grouping, compatibility and transfusion testing"),
]

TESTS = [
    ("CBC", "Complete Blood Count", "Hematology", "EDTA whole blood", 450, "See parameter-wise laboratory reference intervals", "multiple", 6, "LAB-HEMA"),
    ("HB", "Hemoglobin", "Hematology", "EDTA whole blood", 150, "Age/sex-specific reference interval", "g/dL", 4, "LAB-HEMA"),
    ("ESR", "Erythrocyte Sedimentation Rate", "Hematology", "EDTA blood", 180, "Method-specific reference interval", "mm/hr", 6, "LAB-HEMA"),
    ("PTINR", "Prothrombin Time / INR", "Hematology", "Citrated plasma", 500, "Use laboratory and clinical reference interval", "seconds / INR", 6, "LAB-HEMA"),
    ("GLU-FAST", "Fasting Blood Glucose", "Biochemistry", "Fluoride plasma", 120, "Typical fasting reference: 70–99", "mg/dL", 4, "LAB-BIO"),
    ("HBA1C", "HbA1c", "Biochemistry", "EDTA whole blood", 450, "Interpret using current clinical guidelines", "%", 24, "LAB-BIO"),
    ("LFT", "Liver Function Panel", "Biochemistry", "Serum", 700, "Parameter-wise, method-specific ranges", "multiple", 24, "LAB-BIO"),
    ("KFT", "Kidney Function Panel", "Biochemistry", "Serum", 650, "Parameter-wise, method-specific ranges", "multiple", 24, "LAB-BIO"),
    ("LIPID", "Lipid Profile", "Biochemistry", "Serum", 600, "Interpret with cardiovascular risk context", "multiple", 24, "LAB-BIO"),
    ("TFT", "Thyroid Profile (TSH, T3, T4)", "Biochemistry", "Serum", 550, "Age/pregnancy/method-specific ranges", "multiple", 24, "LAB-BIO"),
    ("ELECTRO", "Serum Electrolytes", "Biochemistry", "Serum", 350, "Parameter-wise, method-specific ranges", "multiple", 8, "LAB-BIO"),
    ("CRP", "C-Reactive Protein", "Immunology", "Serum", 400, "Method-specific reference interval", "mg/L", 8, "LAB-IMMUNO"),
    ("ANA", "Antinuclear Antibody Screen", "Immunology", "Serum", 900, "Interpret with method and clinical context", "qualitative", 48, "LAB-IMMUNO"),
    ("URINE-RM", "Urine Routine & Microscopy", "Urinalysis", "Midstream urine", 180, "Parameter-wise reference findings", "multiple", 8, "LAB-URINE"),
    ("URINE-CULT", "Urine Culture & Sensitivity", "Microbiology", "Sterile urine container", 650, "Growth and susceptibility per lab protocol", "culture", 72, "LAB-MICRO"),
    ("BLOOD-CULT", "Blood Culture", "Microbiology", "Blood culture bottle", 900, "Growth and susceptibility per lab protocol", "culture", 120, "LAB-MICRO"),
    ("STOOL-RM", "Stool Routine Examination", "Clinical Pathology", "Stool container", 250, "Parameter-wise reference findings", "multiple", 12, "LAB-PATH"),
    ("PCR-RESP", "Respiratory Pathogen PCR", "Molecular Diagnostics", "Validated respiratory swab", 1800, "Assay-specific qualitative result", "qualitative", 24, "LAB-MOLEC"),
    ("BLOOD-GROUP", "ABO & Rh Blood Group", "Blood Bank", "EDTA whole blood", 250, "A/B/AB/O and Rh(D)", "group", 4, "LAB-BB"),
    ("CROSSMATCH", "Blood Compatibility Crossmatch", "Blood Bank", "Patient sample + donor unit", 600, "Compatible/incompatible per protocol", "qualitative", 4, "LAB-BB"),
    ("HISTO", "Histopathology Biopsy", "Histopathology", "Tissue in validated fixative", 1500, "Pathologist-authored diagnosis", "report", 120, "LAB-HISTO"),
    ("TOX-SCREEN", "Urine Toxicology Screen", "Clinical Toxicology", "Urine", 1200, "Screening result; confirmatory testing as indicated", "qualitative", 24, "LAB-TOX"),
    ("VDRL", "Syphilis Serology (VDRL/RPR)", "Serology", "Serum", 300, "Interpret with confirmatory testing and clinical context", "qualitative/titre", 24, "LAB-SERO"),
]

def main():
    db = SessionLocal()
    try:
        labs_by_code = {}
        for name, code, description in LABS:
            lab = db.scalar(select(Lab).where(Lab.code == code))
            if lab is None:
                lab = Lab(name=name, code=code, description=description,
                          location="Clinical Diagnostics", is_active=True)
                db.add(lab)
                db.flush()
            else:
                lab.name = name
                lab.description = description
                lab.is_active = True
            labs_by_code[code] = lab
        db.flush()

        created = 0
        updated = 0
        for code, name, category, specimen, price, normal_range, unit, hours, lab_code in TESTS:
            test = db.scalar(select(LabTest).where(LabTest.test_code == code))
            values = dict(
                lab_id=labs_by_code[lab_code].id, name=name, category=category,
                description=f"Catalogue configuration for {name}. Reference intervals and interpretation must be validated by the hospital laboratory before clinical use.",
                sample_type=specimen, price=price, normal_range=normal_range,
                unit=unit, turnaround_time_hours=hours, is_active=True,
            )
            if test is None:
                db.add(LabTest(test_code=code, **values))
                created += 1
            else:
                for key, value in values.items():
                    setattr(test, key, value)
                updated += 1
        db.commit()
        print(f"Laboratory catalogue ready: {len(LABS)} labs, {created} tests created, {updated} tests updated.")
        print("No patient samples or clinical results were fabricated.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
