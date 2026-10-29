import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft, UserPlus, UserRound, Phone, MapPin,
    HeartPulse, ShieldCheck, AlertCircle, LoaderCircle,
} from "lucide-react";
import { createPatient } from "../../services/patientApi";

const initialForm = {
    patient_number: "", first_name: "", middle_name: "", last_name: "",
    date_of_birth: "", gender: "", blood_group: "", phone: "",
    alternate_phone: "", email: "", address: "", city: "", state: "",
    postal_code: "", country: "India", emergency_contact_name: "",
    emergency_contact_phone: "", emergency_contact_relation: "",
    occupation: "", nationality: "Indian", allergies: "", chronic_conditions: "",
};

const optionalFields = [
    "middle_name", "blood_group", "alternate_phone", "email", "address",
    "city", "state", "postal_code", "emergency_contact_name",
    "emergency_contact_phone", "emergency_contact_relation", "occupation",
    "allergies", "chronic_conditions",
];

function errorText(error) {
    const detail = error?.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
        return detail.map((item) => `${item.loc?.slice(-1)[0] || "Field"}: ${item.msg}`).join(" | ");
    }
    return error?.message || "Patient register nahi ho paaya.";
}

function Section({ icon: Icon, title, description, children }) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start gap-3 border-b border-slate-100 p-5">
                <div className="rounded-xl bg-cyan-50 p-2.5 text-cyan-700"><Icon size={20} /></div>
                <div>
                    <h2 className="font-bold text-slate-900">{title}</h2>
                    <p className="mt-1 text-sm text-slate-500">{description}</p>
                </div>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
        </section>
    );
}

function Field({ label, name, value, onChange, required = false, type = "text", maxLength, placeholder }) {
    return (
        <div className="min-w-0">
            <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-slate-700">
                {label}{required && <span className="ml-1 text-red-500">*</span>}
            </label>
            <input
                id={name} name={name} type={type} value={value} onChange={onChange}
                required={required} maxLength={maxLength} placeholder={placeholder}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-cyan-600 focus:bg-white focus:ring-2 focus:ring-cyan-100"
            />
        </div>
    );
}

function SelectField({ label, name, value, onChange, options, required = false }) {
    return (
        <div className="min-w-0">
            <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-slate-700">
                {label}{required && <span className="ml-1 text-red-500">*</span>}
            </label>
            <select
                id={name} name={name} value={value} onChange={onChange} required={required}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-cyan-600 focus:bg-white focus:ring-2 focus:ring-cyan-100"
            >
                <option value="">Select {label.toLowerCase()}</option>
                {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
        </div>
    );
}

function TextArea({ label, name, value, onChange, placeholder }) {
    return (
        <div className="sm:col-span-2 lg:col-span-3">
            <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
            <textarea
                id={name} name={name} value={value} onChange={onChange} rows={3} placeholder={placeholder}
                className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-cyan-600 focus:bg-white focus:ring-2 focus:ring-cyan-100"
            />
        </div>
    );
}

export default function RegisterPatient() {
    const navigate = useNavigate();
    const [form, setForm] = useState(initialForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const change = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
    };

    const submit = async (event) => {
        event.preventDefault();
        setError("");

        if (!form.patient_number.trim() || !form.first_name.trim() ||
            !form.last_name.trim() || !form.phone.trim() ||
            !form.date_of_birth || !form.gender) {
            setError("Please saare required fields fill karein.");
            return;
        }

        if (form.date_of_birth > new Date().toISOString().slice(0, 10)) {
            setError("Date of birth future date nahi ho sakti.");
            return;
        }

        const payload = Object.fromEntries(
            Object.entries(form).map(([key, value]) => [
                key, typeof value === "string" ? value.trim() : value,
            ])
        );
        optionalFields.forEach((field) => {
            if (!payload[field]) payload[field] = null;
        });

        setSaving(true);
        try {
            const patient = await createPatient(payload);
            navigate("/receptionist/patients", {
                state: {
                    successMessage: `Patient ${patient.patient_number} registered successfully.`,
                },
            });
        } catch (err) {
            setError(errorText(err));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-full space-y-6 bg-slate-50 p-4 sm:p-6 lg:p-8">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <button type="button" onClick={() => navigate("/receptionist/patients")} className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-cyan-700">
                        <ArrowLeft size={16} /> Back to Patients
                    </button>
                    <p className="text-sm font-semibold uppercase tracking-wider text-cyan-700">Reception Desk</p>
                    <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Register New Patient</h1>
                    <p className="mt-2 text-sm text-slate-500">Enter patient information before submitting.</p>
                </div>
                <div className="flex items-center gap-2 self-start rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">
                    <ShieldCheck size={19} /> Reception registration
                </div>
            </header>

            {error && (
                <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <AlertCircle size={19} className="shrink-0" /><p>{error}</p>
                </div>
            )}

            <form onSubmit={submit} className="space-y-5">
                <Section icon={UserRound} title="Basic Information" description="Patient identification and personal details.">
                    <Field label="Patient Number" name="patient_number" value={form.patient_number} onChange={change} required maxLength={50} placeholder="e.g. PT-2026-0001" />
                    <Field label="First Name" name="first_name" value={form.first_name} onChange={change} required maxLength={100} />
                    <Field label="Middle Name" name="middle_name" value={form.middle_name} onChange={change} maxLength={100} />
                    <Field label="Last Name" name="last_name" value={form.last_name} onChange={change} required maxLength={100} />
                    <Field label="Date of Birth" name="date_of_birth" value={form.date_of_birth} onChange={change} required type="date" />
                    <SelectField label="Gender" name="gender" value={form.gender} onChange={change} required options={[
                        { value: "Male", label: "Male" }, { value: "Female", label: "Female" },
                        { value: "Other", label: "Other" }, { value: "Prefer not to say", label: "Prefer not to say" },
                    ]} />
                    <SelectField label="Blood Group" name="blood_group" value={form.blood_group} onChange={change} options={[
                        { value: "A+", label: "A+" }, { value: "A-", label: "A-" },
                        { value: "B+", label: "B+" }, { value: "B-", label: "B-" },
                        { value: "AB+", label: "AB+" }, { value: "AB-", label: "AB-" },
                        { value: "O+", label: "O+" }, { value: "O-", label: "O-" },
                    ]} />
                    <Field label="Nationality" name="nationality" value={form.nationality} onChange={change} maxLength={100} />
                    <Field label="Occupation" name="occupation" value={form.occupation} onChange={change} maxLength={100} />
                </Section>

                <Section icon={Phone} title="Contact Information" description="Phone, email and residential address.">
                    <Field label="Phone Number" name="phone" value={form.phone} onChange={change} required maxLength={20} />
                    <Field label="Alternate Phone" name="alternate_phone" value={form.alternate_phone} onChange={change} maxLength={20} />
                    <Field label="Email Address" name="email" value={form.email} onChange={change} type="email" placeholder="patient@example.com" />
                    <TextArea label="Residential Address" name="address" value={form.address} onChange={change} placeholder="House number, street, locality..." />
                    <Field label="City" name="city" value={form.city} onChange={change} maxLength={100} />
                    <Field label="State" name="state" value={form.state} onChange={change} maxLength={100} />
                    <Field label="Postal Code" name="postal_code" value={form.postal_code} onChange={change} maxLength={20} />
                    <Field label="Country" name="country" value={form.country} onChange={change} maxLength={100} />
                </Section>

                <Section icon={MapPin} title="Emergency Contact" description="Person to contact when necessary.">
                    <Field label="Contact Name" name="emergency_contact_name" value={form.emergency_contact_name} onChange={change} maxLength={150} />
                    <Field label="Contact Phone" name="emergency_contact_phone" value={form.emergency_contact_phone} onChange={change} maxLength={20} />
                    <Field label="Relationship" name="emergency_contact_relation" value={form.emergency_contact_relation} onChange={change} maxLength={50} placeholder="e.g. Parent, Spouse" />
                </Section>

                <Section icon={HeartPulse} title="Medical Information" description="Patient-reported allergies and existing conditions.">
                    <TextArea label="Known Allergies" name="allergies" value={form.allergies} onChange={change} placeholder="Enter known allergies, if reported." />
                    <TextArea label="Chronic Conditions" name="chronic_conditions" value={form.chronic_conditions} onChange={change} placeholder="Enter existing conditions, if reported." />
                </Section>

                <div className="flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:justify-end sm:p-5">
                    <button type="button" onClick={() => navigate("/receptionist/patients")} disabled={saving} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                        Cancel
                    </button>
                    <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-700 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-60">
                        {saving ? <><LoaderCircle size={18} className="animate-spin" /> Registering...</> : <><UserPlus size={18} /> Register Patient</>}
                    </button>
                </div>
            </form>
        </div>
    );
}
