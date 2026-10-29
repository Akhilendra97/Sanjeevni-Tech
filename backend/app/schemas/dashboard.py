from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class HospitalOverview(BaseModel):
    patients: int = 0
    doctors: int = 0
    nurses: int = 0
    staff: int = 0
    departments: int = 0
    wards: int = 0


class CapacityOverview(BaseModel):
    total_beds: int = 0
    occupied_beds: int = 0
    available_beds: int = 0
    reserved_beds: int = 0
    maintenance_beds: int = 0
    occupancy_percentage: float = 0.0


class PatientFlowOverview(BaseModel):
    total_admissions: int = 0
    active_admissions: int = 0
    discharged_admissions: int = 0
    patient_to_admission_percentage: float = 0.0


class AppointmentOverview(BaseModel):
    total: int = 0
    today: int = 0
    scheduled: int = 0
    confirmed: int = 0
    completed: int = 0
    cancelled: int = 0
    completion_percentage: float = 0.0


class EmergencyOverview(BaseModel):
    total_cases: int = 0
    active_cases: int = 0
    today_cases: int = 0
    triage_records: int = 0
    critical_triage: int = 0
    emergency_triage: int = 0
    urgent_triage: int = 0


class SurgicalServicesOverview(BaseModel):
    total_surgeries: int = 0
    scheduled: int = 0
    completed: int = 0
    cancelled: int = 0
    operation_theatres: int = 0
    active_theatres: int = 0


class ClinicalServicesOverview(BaseModel):
    prescriptions: int = 0
    today_prescriptions: int = 0
    laboratory_tests: int = 0
    radiology_records: int = 0


class PharmacyInventoryOverview(BaseModel):
    pharmacies: int = 0
    inventory_items: int = 0
    low_stock_items: int = 0


class BloodBankOverview(BaseModel):
    total_units: int = 0
    available_units: int = 0
    reserved_units: int = 0


class FinanceOverview(BaseModel):
    invoices: int = 0
    paid_invoices: int = 0
    unpaid_invoices: int = 0
    invoice_total: float = 0.0
    amount_paid: float = 0.0
    outstanding_balance: float = 0.0
    payments: int = 0
    completed_payments: int = 0
    payment_collection: float = 0.0
    billing_records: int = 0
    billing_total: float = 0.0


class OperationalHealth(BaseModel):
    bed_occupancy_percentage: float = 0.0
    appointment_completion_percentage: float = 0.0
    active_emergency_cases: int = 0
    critical_triage_cases: int = 0
    outstanding_balance: float = 0.0
    alert_count: int = 0
    status: str = "stable"


class DashboardAlert(BaseModel):
    type: str
    severity: str
    title: str
    message: str


class DashboardResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    generated_at: datetime
    hospital: HospitalOverview
    capacity: CapacityOverview
    patient_flow: PatientFlowOverview
    appointments: AppointmentOverview
    emergency: EmergencyOverview
    surgical_services: SurgicalServicesOverview
    clinical_services: ClinicalServicesOverview
    pharmacy_inventory: PharmacyInventoryOverview
    blood_bank: BloodBankOverview
    finance: FinanceOverview
    operational_health: OperationalHealth
    alerts: list[DashboardAlert] = Field(default_factory=list)


class DashboardHealthResponse(BaseModel):
    status: str
    generated_at: datetime
    message: str
    metrics: dict[str, Any] = Field(default_factory=dict)
