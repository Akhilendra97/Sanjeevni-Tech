from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AnalyticsDataPoint(BaseModel):
    date: str
    value: int | float = 0


class AnalyticsDistributionItem(BaseModel):
    label: str
    value: int | float = 0


class PatientAnalytics(BaseModel):
    total_patients: int = 0
    registration_trend: list[AnalyticsDataPoint] = Field(
        default_factory=list
    )
    gender_distribution: list[AnalyticsDistributionItem] = Field(
        default_factory=list
    )
    blood_group_distribution: list[AnalyticsDistributionItem] = Field(
        default_factory=list
    )


class AppointmentAnalytics(BaseModel):
    total_appointments: int = 0
    status_distribution: list[AnalyticsDistributionItem] = Field(
        default_factory=list
    )
    appointment_trend: list[AnalyticsDataPoint] = Field(
        default_factory=list
    )


class AdmissionAnalytics(BaseModel):
    total_admissions: int = 0
    status_distribution: list[AnalyticsDistributionItem] = Field(
        default_factory=list
    )
    admission_trend: list[AnalyticsDataPoint] = Field(
        default_factory=list
    )


class BedAnalytics(BaseModel):
    total_beds: int = 0
    occupied_beds: int = 0
    occupancy_percentage: float = 0.0
    status_distribution: list[AnalyticsDistributionItem] = Field(
        default_factory=list
    )


class EmergencyAnalytics(BaseModel):
    total_emergencies: int = 0
    status_distribution: list[AnalyticsDistributionItem] = Field(
        default_factory=list
    )
    triage_distribution: list[AnalyticsDistributionItem] = Field(
        default_factory=list
    )
    emergency_trend: list[AnalyticsDataPoint] = Field(
        default_factory=list
    )


class SurgeryAnalytics(BaseModel):
    total_surgeries: int = 0
    status_distribution: list[AnalyticsDistributionItem] = Field(
        default_factory=list
    )
    surgery_type_distribution: list[AnalyticsDistributionItem] = Field(
        default_factory=list
    )
    surgery_trend: list[AnalyticsDataPoint] = Field(
        default_factory=list
    )


class ClinicalAnalytics(BaseModel):
    prescriptions: int = 0
    diagnoses: int = 0
    laboratory_tests: int = 0
    radiology_records: int = 0
    prescription_trend: list[AnalyticsDataPoint] = Field(
        default_factory=list
    )
    radiology_trend: list[AnalyticsDataPoint] = Field(
        default_factory=list
    )


class FinancialAnalytics(BaseModel):
    invoice_total: float = 0.0
    paid_amount: float = 0.0
    outstanding_balance: float = 0.0
    payment_collection: float = 0.0
    billing_total: float = 0.0
    invoice_status_distribution: list[AnalyticsDistributionItem] = Field(
        default_factory=list
    )
    payment_status_distribution: list[AnalyticsDistributionItem] = Field(
        default_factory=list
    )
    payment_trend: list[AnalyticsDataPoint] = Field(
        default_factory=list
    )


class StaffAnalytics(BaseModel):
    doctors: int = 0
    nurses: int = 0
    staff: int = 0
    total_clinical_staff: int = 0


class DepartmentAnalytics(BaseModel):
    total_departments: int = 0


class WardAnalytics(BaseModel):
    total_wards: int = 0


class AnalyticsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    generated_at: datetime
    patients: PatientAnalytics
    appointments: AppointmentAnalytics
    admissions: AdmissionAnalytics
    beds: BedAnalytics
    emergency: EmergencyAnalytics
    surgeries: SurgeryAnalytics
    clinical: ClinicalAnalytics
    financial: FinancialAnalytics
    staff: StaffAnalytics
    departments: DepartmentAnalytics = Field(default_factory=DepartmentAnalytics)
    wards: WardAnalytics = Field(default_factory=WardAnalytics)
