from __future__ import annotations
import sys
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import select
from app.core.database import SessionLocal
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.medicine import Medicine
from app.models.inventory import Inventory
from app.models.inventory_batch import InventoryBatch
from app.models.supplier import Supplier
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem
from app.models.prescription import Prescription
from app.models.pharmacy_dispensing import PharmacyDispensing, PharmacyDispensingItem

PREFIX = "DEMO-PHARM-"
def run():
    db = SessionLocal()
    try:
        patients = db.scalars(select(Patient).where(Patient.is_active.is_(True)).order_by(Patient.id).limit(10)).all()
        doctors = db.scalars(select(Doctor).where(Doctor.is_available.is_(True)).order_by(Doctor.id).limit(5)).all()
        if not patients:
            raise RuntimeError("No active patients found; refusing to create orphan demo records.")
        if not doctors:
            raise RuntimeError("No available doctors found; refusing to create orphan demo records.")

        med_specs = [
            ("DEMO-MED-001","Paracetamol 500 mg","Paracetamol","Analgesic","Tablet","500 mg",4,8,120),
            ("DEMO-MED-002","Cetirizine 10 mg","Cetirizine","Antihistamine","Tablet","10 mg",3,6,80),
            ("DEMO-MED-003","ORS Sachet","Oral Rehydration Salts","Electrolyte","Sachet","21.8 g",8,12,75),
            ("DEMO-MED-004","Antacid Suspension","Aluminium hydroxide + Magnesium hydroxide","Antacid","Suspension","170 ml",45,65,35),
            ("DEMO-MED-005","Vitamin C 500 mg","Ascorbic acid","Supplement","Tablet","500 mg",2,4,100),
            ("DEMO-MED-006","Saline 0.9% 500 ml","Sodium chloride","IV Fluid","Bottle","0.9%",35,50,40),
        ]
        medicines = []
        for code,name,generic,category,form,strength,cost,price,qty in med_specs:
            obj = db.scalar(select(Medicine).where(Medicine.medicine_code == code))
            if obj is None:
                obj = Medicine(medicine_code=code,name=name,generic_name=generic,category=category,
                    manufacturer="Demo Pharma Supplies",dosage_form=form,strength=strength,unit="unit",
                    purchase_price=Decimal(str(cost)),selling_price=Decimal(str(price)),stock_quantity=0,
                    reorder_level=15,is_active=True,description="SIMULATED DEMO CATALOGUE — not for clinical use.")
                db.add(obj); db.flush()
            medicines.append((obj,qty,cost,price))

        supplier_specs = [
            ("DEMO-SUP-001","Demo Medical Distributors","Demo Contact 1","9000000001","demo-supplier1@example.invalid"),
            ("DEMO-SUP-002","Demo Pharma Wholesale","Demo Contact 2","9000000002","demo-supplier2@example.invalid"),
            ("DEMO-SUP-003","Demo Hospital Supplies","Demo Contact 3","9000000003","demo-supplier3@example.invalid"),
        ]
        suppliers=[]
        for code,name,contact,phone,email in supplier_specs:
            obj=db.scalar(select(Supplier).where(Supplier.supplier_code==code))
            if obj is None:
                obj=Supplier(supplier_code=code,name=name,contact_person=contact,phone=phone,email=email,
                    address="Demo address — simulated record",city="Kanpur",state="Uttar Pradesh",
                    payment_terms="Demo only",notes="SIMULATED DEMO SUPPLIER",is_active=True)
                db.add(obj); db.flush()
            suppliers.append(obj)

        # Seed stock in both inventory summary and batches; use one stable batch per medicine.
        batches=[]
        for med,qty,cost,price in medicines:
            batch_no=f"DEMO-BATCH-{med.medicine_code[-3:]}"
            batch=db.scalar(select(InventoryBatch).where(InventoryBatch.batch_number==batch_no))
            if batch is None:
                batch=InventoryBatch(medicine_id=med.id,batch_number=batch_no,quantity=qty,
                    reserved_quantity=0,unit_cost=Decimal(str(cost)),
                    expiry_date=datetime.now(timezone.utc)+timedelta(days=365),
                    location="Demo Pharmacy Store",status="available",
                    notes="SIMULATED DEMO STOCK — not for clinical use.")
                db.add(batch); db.flush()
            inv=db.scalar(select(Inventory).where(Inventory.medicine_id==med.id))
            if inv is None:
                inv=Inventory(medicine_id=med.id,quantity=qty,reserved_quantity=0,minimum_stock=15,
                    maximum_stock=500,unit_cost=Decimal(str(cost)),location="Demo Pharmacy Store",
                    batch_number=batch_no,expiry_date=batch.expiry_date,status="available",
                    notes="SIMULATED DEMO STOCK")
                db.add(inv)
            else:
                inv.quantity=max(int(inv.quantity or 0),qty)
                inv.minimum_stock=15
            med.stock_quantity=sum(int(b.quantity or 0) for b in db.scalars(select(InventoryBatch).where(InventoryBatch.medicine_id==med.id)).all())
            batches.append(batch)

        # One illustrative purchase order, with linked order items.
        po_no="DEMO-PO-20261025-001"
        po=db.scalar(select(PurchaseOrder).where(PurchaseOrder.purchase_order_number==po_no))
        if po is None:
            po=PurchaseOrder(purchase_order_number=po_no,supplier_id=suppliers[0].id,
                order_date=date.today(),expected_delivery_date=date.today()+timedelta(days=7),
                status="draft",subtotal=Decimal("0"),tax_amount=Decimal("0"),
                discount_amount=Decimal("0"),total_amount=Decimal("0"),
                notes="SIMULATED DEMO PURCHASE ORDER — not a real order.")
            db.add(po); db.flush()
            subtotal=Decimal("0")
            for med,qty,cost,price in medicines[:3]:
                line=Decimal(str(cost))*Decimal("20")
                db.add(PurchaseOrderItem(purchase_order_id=po.id,medicine_id=med.id,
                    quantity=20,unit_price=Decimal(str(cost)),tax_percent=Decimal("0"),
                    discount_amount=Decimal("0"),total_amount=line))
                subtotal += line
            po.subtotal=subtotal; po.total_amount=subtotal

        # Create demo prescriptions only for active patients and valid doctors.
        prescriptions=[]
        for i, patient in enumerate(patients[:5]):
            no=f"DEMO-RX-{i+1:03d}"
            rx=db.scalar(select(Prescription).where(Prescription.prescription_number==no))
            if rx is None:
                rx=Prescription(prescription_number=no,patient_id=patient.id,doctor_id=doctors[i % len(doctors)].id,
                    prescription_date=date.today(),diagnosis="DEMO ONLY — simulated sample diagnosis",
                    medicines=f"{medicines[i % len(medicines)][0].name}; demo data only",
                    instructions="SIMULATED RECORD. Not a real prescription; do not dispense for treatment.",
                    duration="Demo only",follow_up_date=date.today()+timedelta(days=7),
                    notes="SIMULATED DEMO PRESCRIPTION — NOT FOR CLINICAL USE.")
                db.add(rx); db.flush()
            prescriptions.append((rx,patient))

        # Add demo dispensing rows linked to valid prescription, patient, medicine and batch.
        for i,(rx,patient) in enumerate(prescriptions[:3]):
            no=f"DEMO-DISP-{i+1:03d}"
            disp=db.scalar(select(PharmacyDispensing).where(PharmacyDispensing.dispensing_number==no))
            if disp is None:
                med,qty,cost,price=medicines[i]
                batch=batches[i]
                disp=PharmacyDispensing(dispensing_number=no,prescription_id=rx.id,patient_id=patient.id,
                    pharmacist_id=None,status="pending",total_amount=Decimal("0"),
                    notes="SIMULATED DEMO DISPENSING — not a real medication transaction.")
                db.add(disp); db.flush()
                db.add(PharmacyDispensingItem(dispensing_id=disp.id,medicine_id=med.id,
                    inventory_batch_id=batch.id,prescribed_quantity=1,dispensed_quantity=0,
                    unit_price=Decimal(str(price)),total_amount=Decimal("0"),
                    notes="DEMO ONLY — no medication actually dispensed."))
        db.commit()

        # Report actual counts; zeros are reported, never fabricated.
        tables = {
            "medicines": Medicine, "inventory": Inventory, "inventory_batches": InventoryBatch,
            "suppliers": Supplier, "purchase_orders": PurchaseOrder, "prescriptions": Prescription,
            "pharmacy_dispensing": PharmacyDispensing, "patients_active": Patient,
        }
        print("\nSANJEEVNI PHARMACY DEMO SEED — COMMITTED")
        for label, model in tables.items():
            q=select(model)
            if label=="patients_active": q=q.where(Patient.is_active.is_(True))
            elif label=="medicines": q=q.where(Medicine.medicine_code.like("DEMO-MED-%"))
            elif label=="suppliers": q=q.where(Supplier.supplier_code.like("DEMO-SUP-%"))
            elif label=="purchase_orders": q=q.where(PurchaseOrder.purchase_order_number.like("DEMO-PO-%"))
            elif label=="prescriptions": q=q.where(Prescription.prescription_number.like("DEMO-RX-%"))
            elif label=="pharmacy_dispensing": q=q.where(PharmacyDispensing.dispensing_number.like("DEMO-DISP-%"))
            elif label=="inventory_batches": q=q.where(InventoryBatch.batch_number.like("DEMO-BATCH-%"))
            elif label=="inventory": q=q.join(Medicine).where(Medicine.medicine_code.like("DEMO-MED-%"))
            print(f"{label}: {len(db.scalars(q).all())}")
        print("All generated entries are explicitly marked as simulated demo data.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

if __name__=="__main__":
    run()
