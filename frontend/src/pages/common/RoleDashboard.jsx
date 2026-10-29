import React from "react";
import {
    Activity,
    ArrowRight,
    CalendarDays,
    ClipboardList,
    HeartPulse,
    Package,
    ShieldCheck,
    Stethoscope,
    Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ROLE_CONFIG = {
    staff: {
        label: "Staff",
        description: "Hospital support workspace for your profile and assigned operational tasks.",
        icon: Users,
        links: [
            ["My Profile", "/staff/profile", Users],
            ["Duty & Availability", "/staff/availability", CalendarDays],
        ],
    },

    doctor: {
        label: "Doctor",
        description: "Clinical workspace for patient care and medical operations.",
        icon: Stethoscope,
        links: [
            ["Appointments", "/doctor/appointments", CalendarDays],
            ["Patients", "/doctor/patients", Users],
            ["Medical Records", "/doctor/medical-records", ClipboardList],
            ["Prescriptions", "/doctor/prescriptions", ClipboardList],
        ],
    },

    nurse: {
        label: "Nurse",
        description: "Patient-care workspace for assigned patients, vitals and nursing operations.",
        icon: HeartPulse,
        links: [
            ["Assigned Patients", "/nurse/assigned-patients", Users],
            ["Vitals", "/nurse/vitals", Activity],
            ["Medication Schedule", "/nurse/medication-schedule", ClipboardList],
            ["Nursing Notes", "/nurse/nursing-notes", ClipboardList],
        ],
    },

    patient: {
        label: "Patient",
        description: "Healthcare workspace for appointments, records, reports and payments.",
        icon: HeartPulse,
        links: [
            ["Appointments", "/patient/appointments", CalendarDays],
            ["Medical History", "/patient/medical-history", ClipboardList],
            ["Prescriptions", "/patient/prescriptions", ClipboardList],
            ["Lab Reports", "/patient/lab-reports", Activity],
            ["Radiology Reports", "/patient/radiology-reports", Activity],
            ["Bills", "/patient/bills", ClipboardList],
            ["Payments", "/patient/payments", Activity],
            ["Documents", "/patient/documents", ClipboardList],
            ["Insurance", "/patient/insurance", ShieldCheck],
            ["My Profile", "/patient/profile", Users],
        ],
    },

    receptionist: {
        label: "Receptionist",
        description: "Front-desk workspace for patient registration, appointments and admissions.",
        icon: Users,
        links: [
            ["Patients", "/receptionist/patients", Users],
            ["Register Patient", "/receptionist/register-patient", ClipboardList],
            ["Appointments", "/receptionist/appointments", CalendarDays],
            ["Queue", "/receptionist/queue", Activity],
        ],
    },

    laboratory: {
        label: "Laboratory",
        description: "Laboratory workspace for samples, test requests and results.",
        icon: Activity,
        links: [
            ["Samples", "/laboratory/samples", ClipboardList],
            ["Test Requests", "/laboratory/test-requests", ClipboardList],
            ["Test Results", "/laboratory/test-results", Activity],
            ["Reports", "/laboratory/reports", ClipboardList],
        ],
    },

    pharmacist: {
        label: "Pharmacist",
        description: "Pharmacy workspace for medicines, inventory, suppliers and dispensing.",
        icon: Package,
        links: [
            ["Medicines", "/pharmacist/medicines", Package],
            ["Inventory", "/pharmacist/inventory", Package],
            ["Suppliers", "/pharmacist/suppliers", Users],
            ["Purchase Orders", "/pharmacist/purchase-orders", ClipboardList],
        ],
    },

    accountant: {
        label: "Accountant",
        description: "Finance workspace for bills, invoices, payments and revenue.",
        icon: ClipboardList,
        links: [
            ["Bills", "/accountant/bills", ClipboardList],
            ["Invoices", "/accountant/invoices", ClipboardList],
            ["Payments", "/accountant/payments", Activity],
            ["Revenue", "/accountant/revenue", Activity],
        ],
    },
};

export default function RoleDashboard({ role }) {
    const navigate = useNavigate();
    const { user } = useAuth();

    const config = ROLE_CONFIG[role];

    if (!config) {
        return null;
    }

    const Icon = config.icon;

    return (
        <div className="space-y-6">

            {/* HERO */}
            <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-500 to-blue-600 p-6 text-white shadow-lg shadow-cyan-100 sm:p-8">

                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                    <div className="max-w-2xl">

                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                            <Icon size={25} />
                        </div>

                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">
                            Sanjeevni Tech
                        </p>

                        <h2 className="mt-2 text-3xl font-black tracking-tight">
                            Welcome{user?.full_name ? `, ${user.full_name}` : ""}
                        </h2>

                        <p className="mt-3 text-sm leading-6 text-blue-50">
                            {config.description}
                        </p>

                    </div>

                    <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">

                        <div className="flex items-center gap-3">
                            <ShieldCheck size={22} />

                            <div>
                                <p className="text-xs font-semibold text-blue-100">
                                    Account Role
                                </p>

                                <p className="mt-0.5 text-base font-black">
                                    {config.label}
                                </p>
                            </div>
                        </div>

                    </div>

                </div>

            </section>

            {/* WORKSPACE */}
            <section>

                <div className="mb-4">
                    <h3 className="text-lg font-black text-slate-900">
                        Your Workspace
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                        Access the modules available for your role.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                    {config.links.map(([label, path, LinkIcon]) => (
                        <button
                            type="button"
                            key={path}
                            onClick={() => navigate(path)}
                            className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md"
                        >

                            <div className="flex items-center justify-between">

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                                    <LinkIcon size={20} />
                                </div>

                                <ArrowRight
                                    size={18}
                                    className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-cyan-600"
                                />

                            </div>

                            <h4 className="mt-4 text-sm font-black text-slate-800">
                                {label}
                            </h4>

                            <p className="mt-1 text-xs text-slate-500">
                                Open {label.toLowerCase()} workspace
                            </p>

                        </button>
                    ))}

                </div>

            </section>

        </div>
    );
}
