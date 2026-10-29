import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    AlertCircle,
    ArrowLeft,
    Bell,
    Building2,
    CheckCircle2,
    Clock3,
    Globe2,
    LockKeyhole,
    RefreshCw,
    Save,
    ShieldCheck,
    SlidersHorizontal,
} from "lucide-react";

const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000/api/v1";

const ENDPOINT = `${API_BASE}/hospital-settings`;

const DEFAULT_FORM = {
    hospital_name: "",
    hospital_code: "",
    registration_number: "",
    phone: "",
    email: "",
    website: "",
    logo_url: "",

    address: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
    timezone: "Asia/Kolkata",
    currency: "INR",

    appointment_duration: 30,
    date_format: "DD-MM-YYYY",
    working_hours_start: "09:00",
    working_hours_end: "18:00",
    patient_id_prefix: "PAT",
    invoice_prefix: "INV",
    prescription_prefix: "RX",
    emergency_available: true,

    email_notifications: true,
    appointment_reminders: true,
    admission_notifications: true,
    discharge_notifications: true,
    billing_notifications: true,

    session_timeout_minutes: 30,
    password_expiry_days: 90,
    login_attempt_limit: 5,
    two_factor_enabled: false,

    report_header: "",
    report_footer: "",
};

function getAuthToken() {
    const preferredKeys = [
        "token",
        "access_token",
        "accessToken",
        "jwt",
        "authToken",
    ];

    for (const key of preferredKeys) {
        const value = localStorage.getItem(key);

        if (value && value.split(".").length === 3) {
            return value.replace(/^Bearer\s+/i, "");
        }

        if (value) {
            try {
                const parsed = JSON.parse(value);

                const candidates = [
                    parsed?.access_token,
                    parsed?.accessToken,
                    parsed?.token,
                    parsed?.jwt,
                ];

                const token = candidates.find(
                    (item) =>
                        typeof item === "string" &&
                        item.split(".").length === 3
                );

                if (token) {
                    return token;
                }
            } catch {
                // Ignore non-JSON values.
            }
        }
    }

    for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        const value = key ? localStorage.getItem(key) : null;

        if (typeof value === "string") {
            const match = value.match(
                /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/
            );

            if (match?.[0]) {
                return match[0];
            }
        }
    }

    return null;
}

async function request(url, options = {}) {
    const token = getAuthToken();

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    const text = await response.text();

    let data = null;

    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }

    if (!response.ok) {
        const detail =
            data?.detail ||
            data?.message ||
            (typeof data === "string" ? data : "") ||
            `Request failed with status ${response.status}`;

        throw new Error(detail);
    }

    return data;
}

function Field({
    label,
    value,
    onChange,
    type = "text",
    placeholder = "",
    className = "",
}) {
    return (
        <label className={`block ${className}`}>
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#71889b]">
                {label}
            </span>

            <input
                type={type}
                value={value ?? ""}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
                className="w-full rounded-xl border border-[#d8e6ef] bg-white px-4 py-3 text-sm text-[#153653] outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-50"
            />
        </label>
    );
}

function SelectField({ label, value, onChange, children }) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#71889b]">
                {label}
            </span>

            <select
                value={value ?? ""}
                onChange={(event) => onChange(event.target.value)}
                className="w-full rounded-xl border border-[#d8e6ef] bg-white px-4 py-3 text-sm text-[#153653] outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-50"
            >
                {children}
            </select>
        </label>
    );
}

function Toggle({ label, description, checked, onChange }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className="flex w-full items-center justify-between gap-4 rounded-xl border border-[#d8e6ef] bg-white p-4 text-left transition hover:border-cyan-200 hover:bg-cyan-50/30"
        >
            <div>
                <p className="text-sm font-bold text-[#153653]">{label}</p>
                <p className="mt-1 text-xs leading-5 text-[#71889b]">
                    {description}
                </p>
            </div>

            <span
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                    checked ? "bg-cyan-500" : "bg-slate-300"
                }`}
            >
                <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
                        checked ? "left-6" : "left-1"
                    }`}
                />
            </span>
        </button>
    );
}

function Section({ icon: Icon, eyebrow, title, description, children }) {
    return (
        <section className="rounded-2xl border border-[#dceaf2] bg-white p-5 shadow-[0_8px_30px_rgba(32,92,122,0.06)]">
            <div className="mb-5 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                    <Icon size={19} />
                </div>

                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-600">
                        {eyebrow}
                    </p>

                    <h2 className="mt-1 text-lg font-bold text-[#153653]">
                        {title}
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-[#71889b]">
                        {description}
                    </p>
                </div>
            </div>

            {children}
        </section>
    );
}

export default function HospitalSettings() {
    const [form, setForm] = useState(DEFAULT_FORM);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const authAvailable = useMemo(
        () => Boolean(getAuthToken()),
        []
    );

    const setField = (key, value) => {
        setForm((current) => ({
            ...current,
            [key]: value,
        }));
    };

    const normalizeResponse = (payload) => {
        if (!payload) {
            return {};
        }

        if (payload.data && typeof payload.data === "object") {
            return payload.data;
        }

        return payload;
    };

    const loadSettings = async () => {
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const payload = await request(ENDPOINT);
            const data = normalizeResponse(payload);

            setForm((current) => ({
                ...current,
                ...data,
            }));
        } catch (requestError) {
            setError(
                requestError?.message ||
                    "Unable to load hospital settings."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const handleSave = async (event) => {
        event.preventDefault();

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const payload = {
                ...form,
                appointment_duration: Number(
                    form.appointment_duration || 30
                ),
                session_timeout_minutes: Number(
                    form.session_timeout_minutes || 30
                ),
                password_expiry_days: Number(
                    form.password_expiry_days || 90
                ),
                login_attempt_limit: Number(
                    form.login_attempt_limit || 5
                ),
            };

            const response = await request(ENDPOINT, {
                method: "PUT",
                body: JSON.stringify(payload),
            });

            const data = normalizeResponse(response);

            if (data && typeof data === "object") {
                setForm((current) => ({
                    ...current,
                    ...data,
                }));
            }

            setSuccess("Hospital settings saved successfully.");
        } catch (requestError) {
            setError(
                requestError?.message ||
                    "Unable to save hospital settings."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f5f9fc]">
            <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <Link
                        to="/admin"
                        className="inline-flex items-center gap-2 rounded-xl border border-[#d8e6ef] bg-white px-4 py-2.5 text-sm font-semibold text-[#55718a] shadow-sm transition hover:bg-cyan-50 hover:text-cyan-600"
                    >
                        <ArrowLeft size={16} />
                        Back to Command Center
                    </Link>

                    <button
                        type="button"
                        onClick={loadSettings}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-xl border border-[#d8e6ef] bg-white px-4 py-2.5 text-sm font-semibold text-[#55718a] shadow-sm transition hover:bg-cyan-50 hover:text-cyan-600 disabled:opacity-60"
                    >
                        <RefreshCw
                            size={16}
                            className={loading ? "animate-spin" : ""}
                        />
                        Reload
                    </button>
                </div>

                <div className="mb-7">
                    <div className="mb-2 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-cyan-500" />

                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#71889b]">
                            Administration
                        </span>
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight text-[#153653]">
                        Hospital Settings
                    </h1>

                    <p className="mt-2 max-w-3xl text-sm text-[#71889b]">
                        Configure hospital identity, operational preferences,
                        notifications, security and reporting defaults.
                    </p>
                </div>

                {!authAvailable && (
                    <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                        <AlertCircle
                            size={18}
                            className="mt-0.5 shrink-0"
                        />
                        <span>
                            No authentication token was found in the browser.
                            Please sign in again before saving settings.
                        </span>
                    </div>
                )}

                {error && (
                    <div className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                        <AlertCircle
                            size={18}
                            className="mt-0.5 shrink-0"
                        />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                        <CheckCircle2
                            size={18}
                            className="mt-0.5 shrink-0"
                        />
                        <span>{success}</span>
                    </div>
                )}

                <form onSubmit={handleSave} className="pb-4">
                    <div className="grid gap-6 xl:grid-cols-2">
                        <Section
                            icon={Building2}
                            eyebrow="Hospital Identity"
                            title="Hospital Information"
                            description="Core identity and contact information."
                        >
                            <div className="grid gap-5 md:grid-cols-2">
                                <Field
                                    label="Hospital Name"
                                    value={form.hospital_name}
                                    onChange={(v) =>
                                        setField("hospital_name", v)
                                    }
                                />

                                <Field
                                    label="Hospital Code"
                                    value={form.hospital_code}
                                    onChange={(v) =>
                                        setField("hospital_code", v)
                                    }
                                />

                                <Field
                                    label="Registration Number"
                                    value={form.registration_number}
                                    onChange={(v) =>
                                        setField(
                                            "registration_number",
                                            v
                                        )
                                    }
                                />

                                <Field
                                    label="Phone"
                                    value={form.phone}
                                    onChange={(v) =>
                                        setField("phone", v)
                                    }
                                />

                                <Field
                                    label="Email"
                                    type="email"
                                    value={form.email}
                                    onChange={(v) =>
                                        setField("email", v)
                                    }
                                />

                                <Field
                                    label="Website"
                                    value={form.website}
                                    onChange={(v) =>
                                        setField("website", v)
                                    }
                                />

                                <Field
                                    className="md:col-span-2"
                                    label="Logo URL"
                                    value={form.logo_url}
                                    onChange={(v) =>
                                        setField("logo_url", v)
                                    }
                                />
                            </div>
                        </Section>

                        <Section
                            icon={Globe2}
                            eyebrow="Location"
                            title="Hospital Address"
                            description="Address and regional configuration."
                        >
                            <div className="grid gap-5 md:grid-cols-2">
                                <Field
                                    className="md:col-span-2"
                                    label="Address"
                                    value={form.address}
                                    onChange={(v) =>
                                        setField("address", v)
                                    }
                                />

                                <Field
                                    label="City"
                                    value={form.city}
                                    onChange={(v) =>
                                        setField("city", v)
                                    }
                                />

                                <Field
                                    label="State"
                                    value={form.state}
                                    onChange={(v) =>
                                        setField("state", v)
                                    }
                                />

                                <Field
                                    label="PIN Code"
                                    value={form.postal_code}
                                    onChange={(v) =>
                                        setField("postal_code", v)
                                    }
                                />

                                <Field
                                    label="Country"
                                    value={form.country}
                                    onChange={(v) =>
                                        setField("country", v)
                                    }
                                />

                                <SelectField
                                    label="Time Zone"
                                    value={form.timezone}
                                    onChange={(v) =>
                                        setField("timezone", v)
                                    }
                                >
                                    <option value="Asia/Kolkata">
                                        Asia/Kolkata
                                    </option>
                                    <option value="UTC">UTC</option>
                                </SelectField>

                                <SelectField
                                    label="Currency"
                                    value={form.currency}
                                    onChange={(v) =>
                                        setField("currency", v)
                                    }
                                >
                                    <option value="INR">
                                        INR - Indian Rupee
                                    </option>
                                    <option value="USD">
                                        USD - US Dollar
                                    </option>
                                    <option value="EUR">
                                        EUR - Euro
                                    </option>
                                </SelectField>
                            </div>
                        </Section>

                        <Section
                            icon={Clock3}
                            eyebrow="Operations"
                            title="Operational Settings"
                            description="Configure appointments, working hours and identifiers."
                        >
                            <div className="grid gap-5 md:grid-cols-2">
                                <Field
                                    label="Appointment Duration (minutes)"
                                    type="number"
                                    value={form.appointment_duration}
                                    onChange={(v) =>
                                        setField(
                                            "appointment_duration",
                                            v
                                        )
                                    }
                                />

                                <SelectField
                                    label="Date Format"
                                    value={form.date_format}
                                    onChange={(v) =>
                                        setField("date_format", v)
                                    }
                                >
                                    <option value="DD-MM-YYYY">
                                        DD-MM-YYYY
                                    </option>
                                    <option value="MM-DD-YYYY">
                                        MM-DD-YYYY
                                    </option>
                                    <option value="YYYY-MM-DD">
                                        YYYY-MM-DD
                                    </option>
                                </SelectField>

                                <Field
                                    label="Working Hours Start"
                                    type="time"
                                    value={form.working_hours_start}
                                    onChange={(v) =>
                                        setField(
                                            "working_hours_start",
                                            v
                                        )
                                    }
                                />

                                <Field
                                    label="Working Hours End"
                                    type="time"
                                    value={form.working_hours_end}
                                    onChange={(v) =>
                                        setField(
                                            "working_hours_end",
                                            v
                                        )
                                    }
                                />

                                <Field
                                    label="Patient ID Prefix"
                                    value={form.patient_id_prefix}
                                    onChange={(v) =>
                                        setField(
                                            "patient_id_prefix",
                                            v
                                        )
                                    }
                                />

                                <Field
                                    label="Invoice Prefix"
                                    value={form.invoice_prefix}
                                    onChange={(v) =>
                                        setField(
                                            "invoice_prefix",
                                            v
                                        )
                                    }
                                />

                                <Field
                                    label="Prescription Prefix"
                                    value={form.prescription_prefix}
                                    onChange={(v) =>
                                        setField(
                                            "prescription_prefix",
                                            v
                                        )
                                    }
                                />

                                <div className="md:col-span-2">
                                    <Toggle
                                        label="Emergency Services Available"
                                        description="Mark the hospital as operational for emergency services."
                                        checked={
                                            form.emergency_available
                                        }
                                        onChange={(v) =>
                                            setField(
                                                "emergency_available",
                                                v
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        </Section>

                                                <Section
                            icon={Bell}
                            eyebrow="Notifications"
                            title="Notification Preferences"
                            description="Control important hospital communication events."
                        >
                            <div className="space-y-4">

                                <div className="flex w-full items-center justify-between gap-5 rounded-2xl border border-[#d8e6ef] bg-[#f8fbfd] px-5 py-4">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-[#153653]">
                                            Email Notifications
                                        </p>
                                        <p className="mt-1 text-xs leading-5 text-[#71889b]">
                                            Allow system-generated email notifications.
                                        </p>
                                    </div>

                                                                        <button
                                        type="button"
                                        role="switch"
                                        aria-checked={form.email_notifications}
                                        onClick={() =>
                                            setField(
                                                "email_notifications",
                                                !form.email_notifications
                                            )
                                        }
                                        style={{
                                            width: "52px",
                                            minWidth: "52px",
                                            height: "28px",
                                            padding: 0,
                                            borderRadius: "9999px",
                                            position: "relative",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            flexShrink: 0,
                                            backgroundColor: form.email_notifications
                                                ? "#06b6d4"
                                                : "#cbd5e1",
                                            border: "none",
                                            cursor: "pointer",
                                            transition: "background-color 180ms ease"
                                        }}
                                    >
                                        <span
                                            style={{
                                                position: "absolute",
                                                top: "4px",
                                                left: form.email_notifications
                                                    ? "28px"
                                                    : "4px",
                                                width: "20px",
                                                height: "20px",
                                                borderRadius: "50%",
                                                backgroundColor: "#ffffff",
                                                boxShadow: "0 1px 4px rgba(15, 23, 42, 0.22)",
                                                transition: "left 180ms ease"
                                            }}
                                        />
                                    </button>
                                </div>

                                <div className="flex w-full items-center justify-between gap-5 rounded-2xl border border-[#d8e6ef] bg-[#f8fbfd] px-5 py-4">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-[#153653]">
                                            Appointment Reminders
                                        </p>
                                        <p className="mt-1 text-xs leading-5 text-[#71889b]">
                                            Send reminders for scheduled appointments.
                                        </p>
                                    </div>

                                                                        <button
                                        type="button"
                                        role="switch"
                                        aria-checked={form.appointment_reminders}
                                        onClick={() =>
                                            setField(
                                                "appointment_reminders",
                                                !form.appointment_reminders
                                            )
                                        }
                                        style={{
                                            width: "52px",
                                            minWidth: "52px",
                                            height: "28px",
                                            padding: 0,
                                            borderRadius: "9999px",
                                            position: "relative",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            flexShrink: 0,
                                            backgroundColor: form.appointment_reminders
                                                ? "#06b6d4"
                                                : "#cbd5e1",
                                            border: "none",
                                            cursor: "pointer",
                                            transition: "background-color 180ms ease"
                                        }}
                                    >
                                        <span
                                            style={{
                                                position: "absolute",
                                                top: "4px",
                                                left: form.appointment_reminders
                                                    ? "28px"
                                                    : "4px",
                                                width: "20px",
                                                height: "20px",
                                                borderRadius: "50%",
                                                backgroundColor: "#ffffff",
                                                boxShadow: "0 1px 4px rgba(15, 23, 42, 0.22)",
                                                transition: "left 180ms ease"
                                            }}
                                        />
                                    </button>
                                </div>

                                <div className="flex w-full items-center justify-between gap-5 rounded-2xl border border-[#d8e6ef] bg-[#f8fbfd] px-5 py-4">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-[#153653]">
                                            Admission Notifications
                                        </p>
                                        <p className="mt-1 text-xs leading-5 text-[#71889b]">
                                            Notify relevant users when admissions are created.
                                        </p>
                                    </div>

                                                                        <button
                                        type="button"
                                        role="switch"
                                        aria-checked={form.admission_notifications}
                                        onClick={() =>
                                            setField(
                                                "admission_notifications",
                                                !form.admission_notifications
                                            )
                                        }
                                        style={{
                                            width: "52px",
                                            minWidth: "52px",
                                            height: "28px",
                                            padding: 0,
                                            borderRadius: "9999px",
                                            position: "relative",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            flexShrink: 0,
                                            backgroundColor: form.admission_notifications
                                                ? "#06b6d4"
                                                : "#cbd5e1",
                                            border: "none",
                                            cursor: "pointer",
                                            transition: "background-color 180ms ease"
                                        }}
                                    >
                                        <span
                                            style={{
                                                position: "absolute",
                                                top: "4px",
                                                left: form.admission_notifications
                                                    ? "28px"
                                                    : "4px",
                                                width: "20px",
                                                height: "20px",
                                                borderRadius: "50%",
                                                backgroundColor: "#ffffff",
                                                boxShadow: "0 1px 4px rgba(15, 23, 42, 0.22)",
                                                transition: "left 180ms ease"
                                            }}
                                        />
                                    </button>
                                </div>

                                <div className="flex w-full items-center justify-between gap-5 rounded-2xl border border-[#d8e6ef] bg-[#f8fbfd] px-5 py-4">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-[#153653]">
                                            Discharge Notifications
                                        </p>
                                        <p className="mt-1 text-xs leading-5 text-[#71889b]">
                                            Notify relevant users when patients are discharged.
                                        </p>
                                    </div>

                                                                        <button
                                        type="button"
                                        role="switch"
                                        aria-checked={form.discharge_notifications}
                                        onClick={() =>
                                            setField(
                                                "discharge_notifications",
                                                !form.discharge_notifications
                                            )
                                        }
                                        style={{
                                            width: "52px",
                                            minWidth: "52px",
                                            height: "28px",
                                            padding: 0,
                                            borderRadius: "9999px",
                                            position: "relative",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            flexShrink: 0,
                                            backgroundColor: form.discharge_notifications
                                                ? "#06b6d4"
                                                : "#cbd5e1",
                                            border: "none",
                                            cursor: "pointer",
                                            transition: "background-color 180ms ease"
                                        }}
                                    >
                                        <span
                                            style={{
                                                position: "absolute",
                                                top: "4px",
                                                left: form.discharge_notifications
                                                    ? "28px"
                                                    : "4px",
                                                width: "20px",
                                                height: "20px",
                                                borderRadius: "50%",
                                                backgroundColor: "#ffffff",
                                                boxShadow: "0 1px 4px rgba(15, 23, 42, 0.22)",
                                                transition: "left 180ms ease"
                                            }}
                                        />
                                    </button>
                                </div>

                                <div className="flex w-full items-center justify-between gap-5 rounded-2xl border border-[#d8e6ef] bg-[#f8fbfd] px-5 py-4">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-[#153653]">
                                            Billing Notifications
                                        </p>
                                        <p className="mt-1 text-xs leading-5 text-[#71889b]">
                                            Enable important billing-related notifications.
                                        </p>
                                    </div>

                                                                        <button
                                        type="button"
                                        role="switch"
                                        aria-checked={form.billing_notifications}
                                        onClick={() =>
                                            setField(
                                                "billing_notifications",
                                                !form.billing_notifications
                                            )
                                        }
                                        style={{
                                            width: "52px",
                                            minWidth: "52px",
                                            height: "28px",
                                            padding: 0,
                                            borderRadius: "9999px",
                                            position: "relative",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            flexShrink: 0,
                                            backgroundColor: form.billing_notifications
                                                ? "#06b6d4"
                                                : "#cbd5e1",
                                            border: "none",
                                            cursor: "pointer",
                                            transition: "background-color 180ms ease"
                                        }}
                                    >
                                        <span
                                            style={{
                                                position: "absolute",
                                                top: "4px",
                                                left: form.billing_notifications
                                                    ? "28px"
                                                    : "4px",
                                                width: "20px",
                                                height: "20px",
                                                borderRadius: "50%",
                                                backgroundColor: "#ffffff",
                                                boxShadow: "0 1px 4px rgba(15, 23, 42, 0.22)",
                                                transition: "left 180ms ease"
                                            }}
                                        />
                                    </button>
                                </div>

                            </div>
                        </Section>

                        <Section
                            icon={LockKeyhole}
                            eyebrow="Security"
                            title="Security & Access"
                            description="Configure basic account security preferences."
                        >
                            <div className="grid gap-5 md:grid-cols-3">
                                <Field
                                    label="Session Timeout (minutes)"
                                    type="number"
                                    value={
                                        form.session_timeout_minutes
                                    }
                                    onChange={(v) =>
                                        setField(
                                            "session_timeout_minutes",
                                            v
                                        )
                                    }
                                />

                                <Field
                                    label="Password Expiry (days)"
                                    type="number"
                                    value={form.password_expiry_days}
                                    onChange={(v) =>
                                        setField(
                                            "password_expiry_days",
                                            v
                                        )
                                    }
                                />

                                <Field
                                    label="Login Attempt Limit"
                                    type="number"
                                    value={form.login_attempt_limit}
                                    onChange={(v) =>
                                        setField(
                                            "login_attempt_limit",
                                            v
                                        )
                                    }
                                />

                                <div className="md:col-span-3">
                                    <Toggle
                                        label="Two-Factor Authentication"
                                        description="Enable the hospital-wide 2FA preference."
                                        checked={
                                            form.two_factor_enabled
                                        }
                                        onChange={(v) =>
                                            setField(
                                                "two_factor_enabled",
                                                v
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        </Section>

                        <Section
                            icon={SlidersHorizontal}
                            eyebrow="Reporting"
                            title="Reports & Branding"
                            description="Default information used by generated hospital reports."
                        >
                            <div className="space-y-5">
                                <Field
                                    label="Report Header"
                                    value={form.report_header}
                                    onChange={(v) =>
                                        setField(
                                            "report_header",
                                            v
                                        )
                                    }
                                />

                                <label className="block">
                                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#71889b]">
                                        Report Footer
                                    </span>

                                    <textarea
                                        rows={4}
                                        value={form.report_footer ?? ""}
                                        onChange={(event) =>
                                            setField(
                                                "report_footer",
                                                event.target.value
                                            )
                                        }
                                        className="w-full rounded-xl border border-[#d8e6ef] bg-white px-4 py-3 text-sm text-[#153653] outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-50"
                                    />
                                </label>

                                <div className="rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3">
                                    <div className="flex items-start gap-3">
                                        <ShieldCheck
                                            size={19}
                                            className="mt-0.5 shrink-0 text-cyan-600"
                                        />

                                        <div>
                                            <p className="text-sm font-bold text-[#153653]">
                                                Administrator Protected
                                            </p>

                                            <p className="mt-1 text-xs leading-5 text-[#55718a]">
                                                Only users with administrator
                                                privileges can modify these
                                                settings.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Section>
                    </div>

                                        <div className="mt-8 w-full border-t border-[#d8e6ef] pt-6 pb-8">
                        <div className="flex w-full justify-end">
<button
                            type="submit"
                            disabled={saving || loading}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Save size={17} />

                            {saving
                                ? "Saving Settings..."
                                : "Save Hospital Settings"}
                        </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}





