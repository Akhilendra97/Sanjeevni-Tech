import DocumentPdfActions from "../../components/pdf/DocumentPdfActions";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    AlertCircle, Activity, CalendarDays, ClipboardList, FilePlus2,
    FileText, RefreshCw, Search, ShieldCheck, X, Eye, Pencil,
    Trash2, LoaderCircle, ScanLine
} from "lucide-react";
import {
    getDoctorRadiologyReports, createDoctorRadiologyReport,
    updateDoctorRadiologyReport, deleteDoctorRadiologyReport
} from "../../services/doctorRadiologyApi";
import api from "../../services/api";

const nowLocal = () => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString().slice(0, 16);
};

const EMPTY = {
    radiology_number: "",
    patient_id: "",
    doctor_id: "",
    examination_type: "",
    body_part: "",
    clinical_indication: "",
    priority: "routine",
    status: "requested",
    requested_at: nowLocal(),
    scheduled_at: "",
    performed_at: "",
    contrast_used: false,
    contrast_details: "",
    notes: ""
};

function getError(error) {
    const detail = error?.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map(x => x.msg || "Invalid input").join(", ");
    if (!error?.response) return "Unable to connect to the hospital API.";
    if (error.response.status === 401) return "Session expired. Please sign in again.";
    if (error.response.status === 403) return "Your account does not have permission for this action.";
    return "The request failed. Check the entered details and try again.";
}

function formatDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    return Number.isNaN(d.getTime())
        ? String(value).slice(0, 16)
        : d.toLocaleString("en-IN", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit"
        });
}

function Field({ label, name, value, onChange, type = "text", required = false, disabled = false, min }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
                {label}{required && <span className="text-rose-600"> *</span>}
            </span>
            <input name={name} type={type} value={value ?? ""} onChange={onChange}
                required={required} disabled={disabled} min={min}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50 disabled:bg-slate-100" />
        </label>
    );
}

function Area({ label, name, value, onChange }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
            <textarea name={name} value={value ?? ""} onChange={onChange} rows={3}
                className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50" />
        </label>
    );
}

function SelectField({ label, name, value, onChange, options }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
            <select name={name} value={value ?? ""} onChange={onChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-teal-500">
                {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
        </label>
    );
}

export default function DoctorRadiologyReports() {
    const [reports, setReports] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const doctorName = (item) => item?.doctor_name || item?.doctor?.full_name || item?.doctor?.name || doctors.find((d) => Number(d.id) === Number(item?.doctor_id))?.full_name || doctors.find((d) => Number(d.id) === Number(item?.doctor_id))?.user?.full_name || `Doctor #${item?.doctor_id ?? "—"}`;
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState({ ...EMPTY });

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            setReports(await getDoctorRadiologyReports());
        } catch (err) {
            setError(getError(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { api.get("/doctors").then((r) => setDoctors(Array.isArray(r.data) ? r.data : r.data?.items || [])).catch(() => setDoctors([])); }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return reports;
        return reports.filter(item =>
            [
                item.radiology_number, item.patient_id, item.doctor_id,
                item.examination_type, item.body_part, item.clinical_indication,
                item.priority, item.status, item.notes
            ].some(value => String(value ?? "").toLowerCase().includes(q))
        );
    }, [reports, search]);

    function openCreate() {
        setForm({ ...EMPTY, requested_at: nowLocal() });
        setError("");
        setNotice("");
        setModal({ mode: "create" });
    }

    function openEdit(item) {
        const prepared = { ...EMPTY, ...item };
        for (const key of ["requested_at", "scheduled_at", "performed_at"]) {
            prepared[key] = item[key] ? String(item[key]).slice(0, 16) : "";
        }
        prepared.patient_id = String(item.patient_id ?? "");
        prepared.doctor_id = String(item.doctor_id ?? "");
        setForm(prepared);
        setError("");
        setNotice("");
        setModal({ mode: "edit", item });
    }

    function change(event) {
        const { name, value, type, checked } = event.target;
        setForm(previous => ({ ...previous, [name]: type === "checkbox" ? checked : value }));
    }

    async function submit(event) {
        event.preventDefault();
        setBusy(true);
        setError("");
        setNotice("");

        const payload = {
            radiology_number: form.radiology_number.trim(),
            patient_id: Number(form.patient_id),
            doctor_id: Number(form.doctor_id),
            examination_type: form.examination_type.trim(),
            body_part: form.body_part.trim(),
            clinical_indication: form.clinical_indication.trim() || null,
            priority: form.priority,
            status: form.status,
            requested_at: form.requested_at ? new Date(form.requested_at).toISOString() : null,
            scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
            performed_at: form.performed_at ? new Date(form.performed_at).toISOString() : null,
            contrast_used: Boolean(form.contrast_used),
            contrast_details: form.contrast_details.trim() || null,
            notes: form.notes.trim() || null
        };

        try {
            if (modal.mode === "create") {
                if (!payload.patient_id || !payload.doctor_id || !payload.radiology_number ||
                    !payload.examination_type || !payload.body_part || !payload.requested_at) {
                    setError("Complete all required fields and use valid existing Patient and Doctor IDs.");
                    return;
                }
                await createDoctorRadiologyReport(payload);
                setNotice("Radiology request created.");
            } else {
                delete payload.radiology_number;
                delete payload.patient_id;
                delete payload.doctor_id;
                delete payload.requested_at;
                await updateDoctorRadiologyReport(modal.item.id, payload);
                setNotice("Radiology report updated.");
            }
            setModal(null);
            await load();
        } catch (err) {
            setError(getError(err));
        } finally {
            setBusy(false);
        }
    }

    async function remove(item) {
        if (!window.confirm(`Delete radiology record ${item.radiology_number}?`)) return;
        setBusy(true);
        setError("");
        setNotice("");
        try {
            await deleteDoctorRadiologyReport(item.id);
            setNotice("Radiology record deleted.");
            if (modal?.item?.id === item.id) setModal(null);
            await load();
        } catch (err) {
            setError(getError(err));
        } finally {
            setBusy(false);
        }
    }

    const stats = [
        { label: "Total requests", value: reports.length, icon: FileText },
        { label: "Scheduled", value: reports.filter(r => Boolean(r.scheduled_at)).length, icon: CalendarDays },
        { label: "Contrast used", value: reports.filter(r => Boolean(r.contrast_used)).length, icon: Activity }
    ];

    return (
        <div className="min-h-full bg-slate-50/70 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-teal-700"><ShieldCheck size={16} /> Doctor workspace</div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Radiology Reports</h1>
                        <p className="mt-1 text-sm text-slate-500">Review imaging requests, schedules and examination status.</p>
                    </div>
                    <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-800"><FilePlus2 size={18} /> New radiology request</button>
                </header>

                {error && <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertCircle size={18} className="mt-0.5 shrink-0" /><span className="flex-1">{error}</span><button onClick={() => setError("")} aria-label="Dismiss error"><X size={17} /></button></div>}
                {notice && <div role="status" className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss message"><X size={17} /></button></div>}

                <section className="grid gap-4 sm:grid-cols-3">
                    {stats.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">{label}</span><span className="rounded-xl bg-teal-50 p-2.5 text-teal-700"><Icon size={19} /></span></div><div className="mt-3 text-3xl font-bold text-slate-900">{value}</div></div>)}
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                        <div><h2 className="font-semibold text-slate-900">Imaging register</h2><p className="mt-1 text-sm text-slate-500">{filtered.length} record{filtered.length === 1 ? "" : "s"} shown</p></div>
                        <div className="flex gap-2"><div className="relative min-w-0 flex-1 sm:w-72"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search radiology..." aria-label="Search radiology records" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50" /></div><button onClick={load} disabled={loading} title="Refresh records" className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={17} className={loading ? "animate-spin" : ""} /></button></div>
                    </div>

                    {loading ? <div className="flex min-h-56 items-center justify-center gap-3 text-sm text-slate-500"><LoaderCircle size={20} className="animate-spin" /> Loading radiology records...</div>
                        : filtered.length === 0 ? <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center"><div className="rounded-2xl bg-slate-100 p-4 text-slate-500"><ScanLine size={28} /></div><h3 className="mt-4 font-semibold text-slate-900">{search ? "No matching records" : "No radiology records yet"}</h3><p className="mt-1 max-w-md text-sm text-slate-500">{search ? "Try another search term." : "Existing imaging requests will appear here. No sample records have been added."}</p>{!search && <button onClick={openCreate} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-teal-200 px-4 py-2.5 text-sm font-semibold text-teal-800 hover:bg-teal-50"><FilePlus2 size={16} /> Create request</button>}</div>
                        : <div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3.5">Radiology No.</th><th className="px-5 py-3.5">Patient / Doctor</th><th className="px-5 py-3.5">Examination</th><th className="px-5 py-3.5">Scheduled</th><th className="px-5 py-3.5">Priority / Status</th><th className="px-5 py-3.5 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map(item => <tr key={item.id} className="transition hover:bg-slate-50/70"><td className="px-5 py-4"><div className="font-semibold text-slate-900">{item.radiology_number}</div><div className="mt-1 text-xs text-slate-500">ID #{item.id}</div></td><td className="px-5 py-4 text-slate-600"><div>Patient #{item.patient_id}</div><div className="mt-1">{doctorName(item)}</div></td><td className="max-w-60 px-5 py-4"><div className="font-medium text-slate-800">{item.examination_type}</div><div className="mt-1 text-xs text-slate-500">{item.body_part}</div></td><td className="whitespace-nowrap px-5 py-4 text-slate-500">{formatDate(item.scheduled_at)}</td><td className="px-5 py-4"><div className="capitalize text-slate-700">{item.priority || "—"}</div><div className="mt-1 text-xs capitalize text-slate-500">{item.status || "—"}</div></td><td className="px-5 py-4"><div className="flex flex-wrap justify-end gap-1"><DocumentPdfActions title={`Radiology Report ${item.radiology_number || item.id}`} record={{ radiology_number: item.radiology_number, patient_id: item.patient_id, doctor_name: doctorName(item), examination_type: item.examination_type, body_part: item.body_part, scheduled_at: item.scheduled_at, priority: item.priority, status: item.status, findings: item.findings, impression: item.impression, report_text: item.report_text, remarks: item.remarks }} /><button onClick={() => setModal({ mode: "view", item })} title="View request" aria-label="View request" className="rounded-lg p-2 text-slate-500 hover:bg-teal-50 hover:text-teal-700"><Eye size={17} /></button><button onClick={() => openEdit(item)} title="Edit request" aria-label="Edit request" className="rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-700"><Pencil size={17} /></button><button onClick={() => remove(item)} title="Delete request" aria-label="Delete request" className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700"><Trash2 size={17} /></button></div></td></tr>)}</tbody></table></div>}
                </section>

                {modal && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-3 backdrop-blur-[2px] sm:p-6" onMouseDown={e => { if (e.target === e.currentTarget && !busy) setModal(null); }}><section role="dialog" aria-modal="true" aria-labelledby="radiology-modal-title" className="my-auto w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                    <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6"><div><h2 id="radiology-modal-title" className="text-lg font-bold text-slate-900">{modal.mode === "create" ? "New radiology request" : modal.mode === "edit" ? "Edit radiology request" : "Radiology request details"}</h2><p className="mt-1 text-sm text-slate-500">{modal.mode === "create" ? "Use valid existing patient and doctor records." : modal.item.radiology_number}</p></div><button onClick={() => !busy && setModal(null)} disabled={busy} aria-label="Close dialog" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={19} /></button></div>
                    {modal.mode === "view" ? <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5 sm:p-6"><div className="grid gap-4 sm:grid-cols-3">{[["Patient ID", modal.item.patient_id], ["Doctor", doctorName(modal.item)], ["Examination", modal.item.examination_type], ["Body part", modal.item.body_part], ["Priority", modal.item.priority], ["Status", modal.item.status], ["Requested", formatDate(modal.item.requested_at)], ["Scheduled", formatDate(modal.item.scheduled_at)], ["Performed", formatDate(modal.item.performed_at)], ["Contrast used", modal.item.contrast_used ? "Yes" : "No"]].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-500">{label}</div><div className="mt-1 break-words font-semibold capitalize">{String(value ?? "—")}</div></div>)}</div>{[["clinical_indication", "Clinical indication"], ["contrast_details", "Contrast details"], ["notes", "Notes"]].map(([key, label]) => <div key={key}><h3 className="text-sm font-semibold text-slate-800">{label}</h3><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">{modal.item[key] || "Not documented"}</p></div>)}<div className="flex justify-end"><button onClick={() => openEdit(modal.item)} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"><Pencil size={16} /> Edit request</button></div></div>
                    : <form onSubmit={submit} className="max-h-[75vh] space-y-5 overflow-y-auto p-5 sm:p-6">
                        {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}
                        {modal.mode === "create" && <div className="grid gap-4 sm:grid-cols-3"><Field label="Radiology number" name="radiology_number" value={form.radiology_number} onChange={change} required /><Field label="Patient ID" name="patient_id" type="number" value={form.patient_id} onChange={change} required min="1" /><Field label="Doctor ID" name="doctor_id" type="number" value={form.doctor_id} onChange={change} required min="1" /></div>}
                        {modal.mode === "edit" && <Field label="Radiology number" name="radiology_number" value={form.radiology_number} onChange={change} disabled />}
                        <div className="grid gap-4 sm:grid-cols-2"><Field label="Examination type" name="examination_type" value={form.examination_type} onChange={change} required /><Field label="Body part" name="body_part" value={form.body_part} onChange={change} required /><SelectField label="Priority" name="priority" value={form.priority} onChange={change} options={[{value:"routine",label:"Routine"},{value:"urgent",label:"Urgent"},{value:"emergency",label:"Emergency"}]} /><SelectField label="Status" name="status" value={form.status} onChange={change} options={[{value:"requested",label:"Requested"},{value:"scheduled",label:"Scheduled"},{value:"in_progress",label:"In progress"},{value:"completed",label:"Completed"},{value:"cancelled",label:"Cancelled"}]} /></div>
                        <Area label="Clinical indication" name="clinical_indication" value={form.clinical_indication} onChange={change} />
                        <div className="grid gap-4 sm:grid-cols-3"><Field label="Requested at" name="requested_at" type="datetime-local" value={form.requested_at} onChange={change} required={modal.mode === "create"} /><Field label="Scheduled at" name="scheduled_at" type="datetime-local" value={form.scheduled_at} onChange={change} /><Field label="Performed at" name="performed_at" type="datetime-local" value={form.performed_at} onChange={change} /></div>
                        <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-medium text-slate-700"><input type="checkbox" name="contrast_used" checked={Boolean(form.contrast_used)} onChange={change} className="h-4 w-4 accent-teal-700" /> Contrast used</label>
                        {form.contrast_used && <Area label="Contrast details" name="contrast_details" value={form.contrast_details} onChange={change} />}
                        <Area label="Notes" name="notes" value={form.notes} onChange={change} />
                        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end"><button type="button" onClick={() => setModal(null)} disabled={busy} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button><button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60">{busy && <LoaderCircle size={16} className="animate-spin" />}{modal.mode === "create" ? "Create request" : "Save changes"}</button></div>
                    </form>}
                </section></div>}
            </div>
        </div>
    );
}
