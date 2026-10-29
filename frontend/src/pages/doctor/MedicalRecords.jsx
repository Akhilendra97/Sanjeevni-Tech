import DocumentPdfActions from "../../components/pdf/DocumentPdfActions";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Activity, AlertCircle, ClipboardList, FilePlus2, FileText,
    LoaderCircle, Pencil, RefreshCw, Search, ShieldCheck,
    Trash2, X, Eye, Stethoscope, UserRound, CalendarDays
} from "lucide-react";
import {
    createMedicalRecord, deleteMedicalRecord,
    getMedicalRecords, updateMedicalRecord
} from "../../services/medicalRecordApi";
import api from "../../services/api";

const EMPTY_FORM = {
    patient_id: "",
    doctor_id: "",
    record_number: "",
    record_type: "consultation",
    chief_complaint: "",
    symptoms: "",
    diagnosis: "",
    treatment_plan: "",
    clinical_notes: "",
    medical_history: "",
    allergies: ""
};

const FIELDS = [
    ["chief_complaint", "Chief complaint"],
    ["symptoms", "Symptoms"],
    ["diagnosis", "Diagnosis"],
    ["treatment_plan", "Treatment plan"],
    ["clinical_notes", "Clinical notes"],
    ["medical_history", "Medical history"],
    ["allergies", "Allergies"]
];

function errorMessage(error) {
    const detail = error?.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
        return detail.map(item => item.msg || "Invalid input").join(", ");
    }
    if (!error?.response) return "Unable to connect to the hospital API.";
    if (error.response.status === 401) return "Session expired. Please sign in again.";
    if (error.response.status === 403) return "Your account does not have permission for this action.";
    return "The request could not be completed. Please try again.";
}

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? "—"
        : date.toLocaleDateString("en-IN", {
            day: "2-digit", month: "short", year: "numeric"
        });
}

function Field({ label, name, value, onChange, type = "text", required = false, disabled = false }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
                {label}{required && <span className="text-rose-600"> *</span>}
            </span>
            <input
                name={name}
                type={type}
                value={value ?? ""}
                onChange={onChange}
                required={required}
                disabled={disabled}
                min={type === "number" ? 1 : undefined}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-50 disabled:bg-slate-100"
            />
        </label>
    );
}

function TextField({ label, name, value, onChange, disabled = false }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
            <textarea
                name={name}
                value={value ?? ""}
                onChange={onChange}
                rows={3}
                disabled={disabled}
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-50 disabled:bg-slate-100"
            />
        </label>
    );
}

export default function MedicalRecords() {
    const [records, setRecords] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const doctorName = (record) => record?.doctor_name || record?.doctor?.full_name || record?.doctor?.name || doctors.find((d) => Number(d.id) === Number(record?.doctor_id))?.full_name || doctors.find((d) => Number(d.id) === Number(record?.doctor_id))?.user?.full_name || `Doctor #${record?.doctor_id ?? "—"}`;
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);

    const loadRecords = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const data = await getMedicalRecords();
            setRecords(data);
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadRecords();
    }, [loadRecords]);

    useEffect(() => { api.get("/doctors").then((r) => setDoctors(Array.isArray(r.data) ? r.data : r.data?.items || [])).catch(() => setDoctors([])); }, []);

    const filteredRecords = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return records;

        return records.filter(record =>
            [
                record.record_number, record.record_type, record.diagnosis,
                record.chief_complaint, record.symptoms, record.treatment_plan,
                record.clinical_notes, record.patient_id, record.doctor_id
            ].some(value => String(value ?? "").toLowerCase().includes(query))
        );
    }, [records, search]);

    function openCreate() {
        setForm({ ...EMPTY_FORM });
        setNotice("");
        setModal({ mode: "create" });
    }

    function openEdit(record) {
        setForm({
            ...EMPTY_FORM,
            ...record,
            patient_id: String(record.patient_id ?? ""),
            doctor_id: String(record.doctor_id ?? "")
        });
        setNotice("");
        setModal({ mode: "edit", record });
    }

    function openView(record) {
        setModal({ mode: "view", record });
    }

    function closeModal() {
        if (!busy) setModal(null);
    }

    function handleChange(event) {
        const { name, value } = event.target;
        setForm(previous => ({ ...previous, [name]: value }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setBusy(true);
        setError("");
        setNotice("");

        const payload = {
            record_type: form.record_type.trim(),
            chief_complaint: form.chief_complaint.trim() || null,
            symptoms: form.symptoms.trim() || null,
            diagnosis: form.diagnosis.trim() || null,
            treatment_plan: form.treatment_plan.trim() || null,
            clinical_notes: form.clinical_notes.trim() || null,
            medical_history: form.medical_history.trim() || null,
            allergies: form.allergies.trim() || null
        };

        try {
            if (modal.mode === "create") {
                payload.patient_id = Number(form.patient_id);
                payload.doctor_id = Number(form.doctor_id);
                payload.record_number = form.record_number.trim();

                if (!payload.patient_id || !payload.doctor_id || !payload.record_number) {
                    setError("Patient ID, Doctor ID and Record Number are required.");
                    return;
                }

                await createMedicalRecord(payload);
                setNotice("Medical record created successfully.");
            } else {
                await updateMedicalRecord(modal.record.id, payload);
                setNotice("Medical record updated successfully.");
            }

            setModal(null);
            await loadRecords();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy(false);
        }
    }

    async function handleDelete(record) {
        const confirmed = window.confirm(
            `Delete medical record ${record.record_number}? This action cannot be undone.`
        );
        if (!confirmed) return;

        setBusy(true);
        setError("");
        setNotice("");
        try {
            await deleteMedicalRecord(record.id);
            setNotice("Medical record deleted.");
            await loadRecords();
            if (modal?.record?.id === record.id) setModal(null);
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy(false);
        }
    }

    const stats = [
        { label: "Total records", value: records.length, icon: FileText },
        { label: "Consultations", value: records.filter(r => (r.record_type || "").toLowerCase() === "consultation").length, icon: Stethoscope },
        { label: "With diagnosis", value: records.filter(r => Boolean(r.diagnosis?.trim())).length, icon: Activity }
    ];

    return (
        <div className="min-h-full bg-slate-50/70 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-teal-700">
                            <ShieldCheck size={16} />
                            Doctor workspace
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            Medical Records
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Review and manage clinical documentation.
                        </p>
                    </div>
                    <button
                        onClick={openCreate}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-100"
                    >
                        <FilePlus2 size={18} /> New medical record
                    </button>
                </header>

                {error && (
                    <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                        <AlertCircle className="mt-0.5 shrink-0" size={18} />
                        <div className="flex-1">{error}</div>
                        <button onClick={() => setError("")} aria-label="Dismiss error"><X size={17} /></button>
                    </div>
                )}

                {notice && (
                    <div role="status" className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                        {notice}
                        <button onClick={() => setNotice("")} aria-label="Dismiss message"><X size={17} /></button>
                    </div>
                )}

                <section className="grid gap-4 sm:grid-cols-3">
                    {stats.map(({ label, value, icon: Icon }) => (
                        <div key={label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-500">{label}</span>
                                <span className="rounded-xl bg-teal-50 p-2.5 text-teal-700"><Icon size={19} /></span>
                            </div>
                            <div className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</div>
                        </div>
                    ))}
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                        <div>
                            <h2 className="font-semibold text-slate-900">Clinical records</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                {filteredRecords.length} record{filteredRecords.length === 1 ? "" : "s"} shown
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <div className="relative min-w-0 flex-1 sm:w-72">
                                <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={search}
                                    onChange={event => setSearch(event.target.value)}
                                    placeholder="Search records, diagnosis..."
                                    aria-label="Search medical records"
                                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50"
                                />
                            </div>
                            <button
                                onClick={loadRecords}
                                disabled={loading}
                                title="Refresh records"
                                className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                            >
                                <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex min-h-56 items-center justify-center gap-3 text-sm text-slate-500">
                            <LoaderCircle className="animate-spin" size={20} /> Loading medical records...
                        </div>
                    ) : filteredRecords.length === 0 ? (
                        <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
                            <div className="rounded-2xl bg-slate-100 p-4 text-slate-500"><ClipboardList size={28} /></div>
                            <h3 className="mt-4 font-semibold text-slate-900">
                                {search ? "No matching records" : "No medical records yet"}
                            </h3>
                            <p className="mt-1 max-w-md text-sm text-slate-500">
                                {search
                                    ? "Try another search term."
                                    : "Records saved through this workspace will appear here. No sample records have been added."}
                            </p>
                            {!search && (
                                <button onClick={openCreate} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-teal-200 px-4 py-2.5 text-sm font-semibold text-teal-800 hover:bg-teal-50">
                                    <FilePlus2 size={16} /> Create first record
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[850px] text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-5 py-3.5 font-semibold">Record</th>
                                        <th className="px-5 py-3.5 font-semibold">Patient / Doctor</th>
                                        <th className="px-5 py-3.5 font-semibold">Diagnosis</th>
                                        <th className="px-5 py-3.5 font-semibold">Type</th>
                                        <th className="px-5 py-3.5 font-semibold">Created</th>
                                        <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredRecords.map(record => (
                                        <tr key={record.id} className="transition hover:bg-slate-50/70">
                                            <td className="px-5 py-4">
                                                <div className="font-semibold text-slate-900">{record.record_number}</div>
                                                <div className="mt-1 text-xs text-slate-500">ID #{record.id}</div>
                                            </td>
                                            <td className="px-5 py-4 text-slate-600">
                                                <div className="flex items-center gap-2"><UserRound size={15} className="text-slate-400" /> Patient #{record.patient_id}</div>
                                                <div className="mt-1.5 flex items-center gap-2"><Stethoscope size={15} className="text-slate-400" /> {doctorName(record)}</div>
                                            </td>
                                            <td className="max-w-64 px-5 py-4">
                                                <div className="truncate font-medium text-slate-800">{record.diagnosis || "Not specified"}</div>
                                                <div className="mt-1 truncate text-xs text-slate-500">{record.chief_complaint || "No chief complaint"}</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium capitalize text-teal-800">{record.record_type || "consultation"}</span>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                                                <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} />{formatDate(record.created_at)}</span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex flex-wrap justify-end gap-1">
                                                    <DocumentPdfActions title={`Medical Record ${record.record_number || record.id}`} record={{ record_number: record.record_number, patient_id: record.patient_id, doctor_name: doctorName(record), diagnosis: record.diagnosis, chief_complaint: record.chief_complaint, record_type: record.record_type, symptoms: record.symptoms, treatment_plan: record.treatment_plan, notes: record.notes, created_at: record.created_at, updated_at: record.updated_at }} />
                                                    <button onClick={() => openView(record)} title="View record" aria-label="View record" className="rounded-lg p-2 text-slate-500 hover:bg-teal-50 hover:text-teal-700"><Eye size={17} /></button>
                                                    <button onClick={() => openEdit(record)} title="Edit record" aria-label="Edit record" className="rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-700"><Pencil size={17} /></button>
                                                    <button onClick={() => handleDelete(record)} title="Delete record" aria-label="Delete record" className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700"><Trash2 size={17} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {modal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-3 backdrop-blur-[2px] sm:p-6" onMouseDown={event => {
                        if (event.target === event.currentTarget) closeModal();
                    }}>
                        <section role="dialog" aria-modal="true" aria-labelledby="medical-record-modal-title" className="my-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                                <div>
                                    <h2 id="medical-record-modal-title" className="text-lg font-bold text-slate-900">
                                        {modal.mode === "create" ? "Create medical record" : modal.mode === "edit" ? "Edit medical record" : "Medical record details"}
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {modal.mode === "create" ? "Enter the clinical record details." : `Record ${modal.record.record_number}`}
                                    </p>
                                </div>
                                <button onClick={closeModal} disabled={busy} aria-label="Close dialog" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={19} /></button>
                            </div>

                            {modal.mode === "view" ? (
                                <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5 sm:p-6">
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-500">Record number</div><div className="mt-1 font-semibold">{modal.record.record_number}</div></div>
                                        <div className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-500">Patient ID</div><div className="mt-1 font-semibold">{modal.record.patient_id}</div></div>
                                        <div className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-500">Doctor ID</div><div className="mt-1 font-semibold">{doctorName(modal.record)}</div></div>
                                    </div>
                                    {FIELDS.map(([key, label]) => (
                                        <div key={key}>
                                            <h3 className="text-sm font-semibold text-slate-800">{label}</h3>
                                            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">{modal.record[key] || "Not documented"}</p>
                                        </div>
                                    ))}
                                    <div className="text-xs text-slate-400">Created {formatDate(modal.record.created_at)} · Updated {formatDate(modal.record.updated_at)}</div>
                                    <div className="flex justify-end"><button onClick={() => openEdit(modal.record)} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"><Pencil size={16} /> Edit record</button></div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="max-h-[75vh] space-y-5 overflow-y-auto p-5 sm:p-6">
                                    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}
                                    {modal.mode === "create" && (
                                        <div className="grid gap-4 sm:grid-cols-3">
                                            <Field label="Patient ID" name="patient_id" type="number" value={form.patient_id} onChange={handleChange} required />
                                            <Field label="Doctor ID" name="doctor_id" type="number" value={form.doctor_id} onChange={handleChange} required />
                                            <Field label="Record number" name="record_number" value={form.record_number} onChange={handleChange} required />
                                        </div>
                                    )}
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Field label="Record type" name="record_type" value={form.record_type} onChange={handleChange} required />
                                        {modal.mode === "edit" && (
                                            <Field label="Record number" name="record_number" value={form.record_number} onChange={handleChange} disabled />
                                        )}
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {FIELDS.map(([key, label]) => (
                                            <TextField key={key} label={label} name={key} value={form[key]} onChange={handleChange} />
                                        ))}
                                    </div>
                                    <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                                        <button type="button" onClick={closeModal} disabled={busy} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
                                        <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60">
                                            {busy && <LoaderCircle size={16} className="animate-spin" />}
                                            {modal.mode === "create" ? "Create record" : "Save changes"}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}
