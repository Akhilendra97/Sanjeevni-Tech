import DocumentPdfActions from "../../components/pdf/DocumentPdfActions";
import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    Search, Users, Eye, RefreshCw, X, Phone, Mail,
    CalendarDays, MapPin, Droplets, AlertCircle, CheckCircle2,
    ChevronLeft, ChevronRight,
    Pencil, Trash2,
} from "lucide-react";
import { getPatient, getPatients, updatePatient, deactivatePatient } from "../../services/patientApi";

const PAGE_SIZE = 10;

function errorText(error) {
    const detail = error?.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map((item) => item.msg).join(", ");
    return error?.message || "Patients not loaded.";
}

function dateText(value) {
    if (!value) return "Not provided";
    const date = new Date(`${value}`.slice(0, 10));
    return Number.isNaN(date.getTime())
        ? "Not provided"
        : date.toLocaleDateString("en-IN", {
            day: "2-digit", month: "short", year: "numeric",
        });
}

function Detail({ icon: Icon, label, value }) {
    return (
        <div className="flex gap-3 rounded-xl border border-slate-200 p-3">
            <Icon size={18} className="mt-0.5 shrink-0 text-cyan-700" />
            <div className="min-w-0">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="break-words text-sm font-medium text-slate-800">
                    {value || "Not provided"}
                </p>
            </div>
        </div>
    );
}

function makeEditDraft(patient) {
    const fields = [
        "first_name", "middle_name", "last_name", "date_of_birth", "gender",
        "blood_group", "phone", "alternate_phone", "email", "address", "city",
        "state", "postal_code", "country", "emergency_contact_name",
        "emergency_contact_phone", "emergency_contact_relation", "occupation",
        "nationality", "allergies", "chronic_conditions",
    ];

    return Object.fromEntries(
        fields.map((field) => [field, patient?.[field] ?? ""])
    );
}
export default function Patients() {
    const location = useLocation();
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [patientView, setPatientView] = useState("active");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState(location.state?.successMessage || "");
    const [selected, setSelected] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState("");
    const [editing, setEditing] = useState(false);
    const [editDraft, setEditDraft] = useState({});
    const [saving, setSaving] = useState(false);

    const loadPatients = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const data = await getPatients({
                search, skip: page * PAGE_SIZE, limit: PAGE_SIZE + 1, is_active: patientView === "active",
            });
            const records = Array.isArray(data)
                ? data
                : Array.isArray(data?.items)
                    ? data.items
                    : Array.isArray(data?.patients)
                        ? data.patients
                        : Array.isArray(data?.results)
                            ? data.results
                            : Array.isArray(data?.data)
                                ? data.data
                                : [];
            // Enforce the selected status locally as well as in the API request.
            const matchingRecords = records.filter((patient) => {
                const rawStatus = patient?.is_active;
                const isActive = rawStatus === true ||
                    rawStatus === 1 ||
                    rawStatus === "true" ||
                    rawStatus === "1";

                return patientView === "active" ? isActive : !isActive;
            });

            setPatients(matchingRecords.slice(0, PAGE_SIZE));
            setHasMore(matchingRecords.length > PAGE_SIZE);
        } catch (err) {
            setPatients([]);
            setHasMore(false);
            setError(errorText(err));
        } finally {
            setLoading(false);
        }
    }, [search, page, patientView]);

    useEffect(() => {
        loadPatients();
    }, [loadPatients, patientView]);

    const viewPatient = async (id) => {
        setSelected(null);
        setDetailError("");
        setDetailLoading(true);
        try {
            setSelected(await getPatient(id));
        } catch (err) {
            setDetailError(errorText(err));
        } finally {
            setDetailLoading(false);
        }
    };

    const closeDetails = () => {
        if (saving) return;
        setSelected(null);
        setDetailError("");
        setEditing(false);
        setEditDraft({});
    };

    const beginEdit = () => {
        if (!selected || !selected.is_active) return;
        setEditDraft(makeEditDraft(selected));
        setDetailError("");
        setEditing(true);
    };

    const editPatientFromList = async (id) => {
        setSelected(null);
        setDetailError("");
        setEditing(false);
        setEditDraft({});
        setDetailLoading(true);

        try {
            const patient = await getPatient(id);
            setSelected(patient);

            if (!patient?.is_active) {
                setDetailError("Inactive patients cannot be edited.");
                return;
            }

            setEditDraft(makeEditDraft(patient));
            setEditing(true);
        } catch (err) {
            setDetailError(errorText(err));
        } finally {
            setDetailLoading(false);
        }
    };

    const handleDeactivatePatient = async (patient) => {
        if (!patient?.id || !patient?.is_active) return;

        const patientName =
            patient.full_name ||
            [patient.first_name, patient.middle_name, patient.last_name]
                .filter(Boolean)
                .join(" ") ||
            "this patient";

        const confirmed = window.confirm(
            `Deactivate ${patientName} (${patient.patient_number || patient.id})? The patient record will be retained for hospital history.`
        );

        if (!confirmed) return;

        setError("");
        setNotice("");

        try {
            await deactivatePatient(patient.id);

            setNotice(
                `Patient ${patient.patient_number || patient.id} has been deactivated successfully.`
            );

            if (selected?.id === patient.id) {
                setSelected(null);
                setEditing(false);
                setEditDraft({});
                setDetailError("");
            }

            await loadPatients();
        } catch (err) {
            setError(errorText(err));
        }
    };
    const savePatient = async (event) => {
        event.preventDefault();
        if (!selected) return;
        setDetailError("");
        if (!String(editDraft.first_name || "").trim() ||
            !String(editDraft.last_name || "").trim() ||
            !String(editDraft.phone || "").trim() ||
            String(editDraft.phone || "").trim().length < 5 ||
            !editDraft.date_of_birth || !String(editDraft.gender || "").trim()) {
            setDetailError("First name, last name, date of birth, gender, and a valid phone number are required.");
            return;
        }
        if (editDraft.date_of_birth > new Date().toISOString().slice(0, 10)) {
            setDetailError("Date of birth cannot be in the future.");
            return;
        }
        setSaving(true);
        try {
            const payload = Object.fromEntries(
                Object.entries(editDraft).map(([key, value]) => [
                    key,
                    typeof value === "string" && value.trim() === "" ? null :
                        typeof value === "string" ? value.trim() : value,
                ])
            );
            const updated = await updatePatient(selected.id, payload);
            setSelected(updated);
            setEditing(false);
            setNotice(`Patient ${updated.patient_number} details updated successfully.`);
            await loadPatients();
        } catch (err) {
            setDetailError(errorText(err));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-full space-y-6 bg-slate-50 p-4 sm:p-6 lg:p-8">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-cyan-700">
                        Reception Desk
                    </p>
                    <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
                        Patient Directory
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Search registered patients and view their details.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => navigate("/receptionist/register-patient")}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800"
                    >
                        <Users size={16} /> Register Patient
                    </button>
                    <button
                        type="button"
                        onClick={loadPatients}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                </div>
            </header>

            {notice && (
                <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    <CheckCircle2 size={19} className="shrink-0" />
                    <p>{notice}</p>
                    <button type="button" className="ml-auto" onClick={() => setNotice("")}>
                        <X size={17} />
                    </button>
                </div>
            )}

            <div className="grid flex-1 content-start gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <Users size={24} className="text-cyan-700" />
                    <p className="mt-3 text-sm text-slate-500">Patients on this page</p>
                    <p className="mt-1 text-3xl font-bold text-slate-900">
                        {loading ? "â€”" : patients.length}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                        Current page count, not total hospital registrations.
                    </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">Current page</p>
                    <p className="mt-1 text-3xl font-bold text-slate-900">{page + 1}</p>
                    <p className="mt-2 text-xs text-slate-500">
                        Use the search box to find a patient.
                    </p>
                </div>
            </div>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-4 sm:p-5">
                    <label htmlFor="patient-search" className="mb-2 block text-sm font-semibold text-slate-700">
                        Search patients
                    </label>
                    <div className="relative max-w-xl">
                        <Search size={19} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            id="patient-search"
                            type="search"
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(0);
                                setNotice("");
                            }}
                            placeholder="Name, patient number, phone or email..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-cyan-600 focus:bg-white focus:ring-2 focus:ring-cyan-100"
                        />
                    </div>
                </div>

                {error && (
                    <div role="alert" className="m-4 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        <AlertCircle size={19} className="shrink-0" />
                        <div className="min-w-0">
                            <p className="font-semibold">Unable to load patients</p>
                            <p className="mt-1 break-words">{error}</p>
                            <button type="button" onClick={loadPatients} className="mt-2 font-semibold underline">
                                Try again
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3 sm:px-5">
                    <button type="button" onClick={() => { setPatientView("active"); setPage(0); }} className={`rounded-xl px-4 py-2 text-sm font-semibold ${patientView === "active" ? "bg-cyan-700 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                        Active Patients
                    </button>
                    <button type="button" onClick={() => { setPatientView("inactive"); setPage(0); }} className={`rounded-xl px-4 py-2 text-sm font-semibold ${patientView === "inactive" ? "bg-slate-700 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                        Inactive Patients
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                            <tr>
                                {["Patient", "Patient No.", "Contact", "Gender", "Status", "Action"].map((heading) => (
                                    <th key={heading} className="px-5 py-4 font-semibold">{heading}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">Loading patients...</td></tr>
                            ) : error ? (
                                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">Patient list could not be loaded.</td></tr>
                            ) : patients.length === 0 ? (
                                <tr><td colSpan={6} className="px-5 py-12 text-center">
                                    <Users size={30} className="mx-auto text-slate-300" />
                                    <p className="mt-3 font-semibold text-slate-700">No patients found</p>
                                    <p className="mt-1 text-sm text-slate-500">Try another search term.</p>
                                </td></tr>
                            ) : patients.map((patient) => (
                                <tr key={patient.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-4">
                                        <p className="font-semibold text-slate-800">
                                            {patient.full_name || [patient.first_name, patient.middle_name, patient.last_name].filter(Boolean).join(" ")}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">Registered {dateText(patient.registration_date)}</p>
                                    </td>
                                    <td className="px-5 py-4 text-sm font-medium text-slate-700">{patient.patient_number}</td>
                                    <td className="px-5 py-4">
                                        <p className="text-sm text-slate-700">{patient.phone || "No phone"}</p>
                                        <p className="mt-1 text-xs text-slate-500">{patient.email || "No email"}</p>
                                    </td>
                                    <td className="px-5 py-4 text-sm capitalize text-slate-600">{patient.gender || "â€”"}</td>
                                    <td className="px-5 py-4">
                                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${patient.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                                            {patient.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex flex-wrap items-center justify-center gap-2 whitespace-nowrap">
                                            <DocumentPdfActions title={`Patient Record ${patient.patient_number || patient.id}`} record={{ patient_id: patient.id, patient_number: patient.patient_number, full_name: patient.full_name || [patient.first_name, patient.middle_name, patient.last_name].filter(Boolean).join(" "), registration_date: patient.registration_date, date_of_birth: patient.date_of_birth, gender: patient.gender, phone: patient.phone, email: patient.email, address: patient.address, city: patient.city, state: patient.state, blood_group: patient.blood_group, is_active: patient.is_active }} />
                                            <button
                                                type="button"
                                                onClick={() => viewPatient(patient.id)}
                                                title="View patient" aria-label="View patient" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan-200 text-cyan-800 transition hover:bg-cyan-50"
                                            >
                                                <Eye size={17} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => editPatientFromList(patient.id)}
                                                disabled={!patient.is_active || detailLoading || saving}
                                                title="Edit patient" aria-label="Edit patient" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-200 text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                <Pencil size={17} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeactivatePatient(patient)}
                                                disabled={!patient.is_active || loading}
                                                title="Deactivate patient" aria-label="Deactivate patient" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                <Trash2 size={17} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-4 sm:px-5">
                    <p className="text-sm text-slate-500">Page {page + 1} Â· {patients.length} patient(s)</p>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={page === 0 || loading} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-40">
                            <ChevronLeft size={16} /> Previous
                        </button>
                        <button type="button" onClick={() => setPage((value) => value + 1)} disabled={!hasMore || loading} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-40">
                            Next <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </section>

            {(detailLoading || selected || detailError) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950/50 p-2 sm:p-4" onMouseDown={(event) => {
                    if (event.target === event.currentTarget) closeDetails();
                }}>
                    <div role="dialog" aria-modal="true" aria-label="Patient details" className="flex max-h-[calc(100dvh-1rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[90dvh]">
                        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 p-5">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Patient Details</h2>
                                <p className="mt-1 text-sm text-slate-500">Registration and contact information</p>
                            </div>
                            <button type="button" onClick={closeDetails} aria-label="Close details" className="rounded-lg p-2 hover:bg-slate-100">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
                            {detailLoading ? (
                                <p className="py-10 text-center text-sm text-slate-500">Loading patient details...</p>
                            ) : (
                                <>
                                    {detailError && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{detailError}</p>}
                                    {selected && (
                                        <>
                                            <div className="mb-5 rounded-xl bg-cyan-50 p-4">
                                                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-800">{selected.patient_number}</p>
                                                <h3 className="mt-1 text-xl font-bold text-slate-900">{selected.full_name || `${selected.first_name} ${selected.last_name}`}</h3>
                                                <span className="mt-2 inline-block rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">{selected.is_active ? "Active" : "Inactive"}</span>
                                            </div>
                                            {editing ? (
                                                <form onSubmit={savePatient} className="flex flex-col gap-4">
                                                    <div className="grid flex-1 content-start gap-4 sm:grid-cols-2">
                                                        {[
                                                            ["first_name", "First name"], ["middle_name", "Middle name"],
                                                            ["last_name", "Last name"], ["date_of_birth", "Date of birth", "date"],
                                                            ["gender", "Gender"], ["blood_group", "Blood group"],
                                                            ["phone", "Phone"], ["alternate_phone", "Alternate phone"],
                                                            ["email", "Email", "email"], ["address", "Address"],
                                                            ["city", "City"], ["state", "State"], ["postal_code", "Postal code"],
                                                            ["country", "Country"], ["emergency_contact_name", "Emergency contact name"],
                                                            ["emergency_contact_phone", "Emergency contact phone"],
                                                            ["emergency_contact_relation", "Emergency contact relation"],
                                                            ["occupation", "Occupation"], ["nationality", "Nationality"],
                                                            ["allergies", "Allergies"], ["chronic_conditions", "Chronic conditions"],
                                                        ].map(([name, label, type = "text"]) => (
                                                            <label key={name} className="block text-sm font-medium text-slate-700">
                                                                {label}
                                                                {name === "gender" ? (
    <select
        value={["Male", "Female", "Other"].find(
            (option) => option.toLowerCase() === String(editDraft[name] ?? "").toLowerCase()
        ) ?? ""}
        onChange={(event) => setEditDraft((current) => ({
            ...current,
            [name]: event.target.value
        }))}
        required
        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
    >
        <option value="">Select gender</option>
        {["Male", "Female", "Other"].map((option) => (
            <option key={option} value={option}>{option}</option>
        ))}
    </select>
) : name === "blood_group" ? (
    <select
        value={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].find(
            (option) => option.toLowerCase() === String(editDraft[name] ?? "").toLowerCase()
        ) ?? ""}
        onChange={(event) => setEditDraft((current) => ({
            ...current,
            [name]: event.target.value
        }))}
        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
    >
        <option value="">Select blood group</option>
        {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((option) => (
            <option key={option} value={option}>{option}</option>
        ))}
    </select>
) : (
    <input
        type={type}
        value={editDraft[name] ?? ""}
        onChange={(event) => setEditDraft((current) => ({
            ...current,
            [name]: event.target.value
        }))}
        maxLength={255}
        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
    />
)}
                                                            </label>
                                                        ))}
                                                    </div>
                                                    <div className="sticky bottom-0 z-10 mt-auto flex shrink-0 justify-end gap-2 border-t border-slate-200 bg-white px-1 py-4">
                                                        <button type="button" disabled={saving} onClick={() => { setEditing(false); setDetailError(""); }} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50">Cancel</button>
                                                        <button type="submit" disabled={saving} className="rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Save changes"}</button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <>
                                                    <div className="grid gap-3 sm:grid-cols-2">
                                                        <Detail icon={CalendarDays} label="Date of birth" value={dateText(selected.date_of_birth)} />
                                                        <Detail icon={Users} label="Gender" value={selected.gender} />
                                                        <Detail icon={Droplets} label="Blood group" value={selected.blood_group} />
                                                        <Detail icon={Phone} label="Phone" value={selected.phone} />
                                                        <Detail icon={Mail} label="Email" value={selected.email} />
                                                        <Detail icon={MapPin} label="Address" value={[selected.address, selected.city, selected.state, selected.postal_code, selected.country].filter(Boolean).join(", ")} />
                                                        <Detail icon={AlertCircle} label="Allergies" value={selected.allergies} />
                                                        <Detail icon={AlertCircle} label="Chronic conditions" value={selected.chronic_conditions} />
                                                        <Detail icon={Phone} label="Emergency contact" value={[selected.emergency_contact_name, selected.emergency_contact_phone, selected.emergency_contact_relation].filter(Boolean).join(" Â· ")} />
                                                        <Detail icon={CalendarDays} label="Registration date" value={dateText(selected.registration_date)} />
                                                    </div>
                                                    <div className="mt-5 flex justify-end">
                                                        <button type="button" onClick={beginEdit} className="rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800">Edit patient details</button>
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


