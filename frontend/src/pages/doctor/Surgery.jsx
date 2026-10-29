import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Activity, AlertCircle, CalendarDays, ClipboardList, Clock3,
    FilePlus2, RefreshCw, Search, ShieldCheck, X, Eye, Pencil,
    Trash2, LoaderCircle, Scissors, Play, CheckCircle2, Ban
} from "lucide-react";
import {
    listSurgeries, createSurgery, updateSurgery, startSurgery,
    completeSurgery, cancelSurgery, deleteSurgery
} from "../../services/doctorSurgeryApi";

const localDateTime = (date = new Date()) => {
    const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return adjusted.toISOString().slice(0, 16);
};

const EMPTY = {
    surgery_number: "",
    patient_id: "",
    operation_theatre_id: "",
    department_id: "",
    surgeon_id: "",
    anaesthetist_id: "",
    procedure_name: "",
    surgery_type: "",
    scheduled_start: "",
    scheduled_end: "",
    actual_start: "",
    actual_end: "",
    preoperative_diagnosis: "",
    postoperative_diagnosis: "",
    procedure_details: "",
    anaesthesia_type: "",
    findings: "",
    complications: "",
    postoperative_instructions: "",
    status: "scheduled",
    cancellation_reason: "",
    notes: ""
};

function apiError(error) {
    const detail = error?.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map(item => item.msg || "Invalid field").join(", ");
    if (!error?.response) return "Cannot connect to the hospital API.";
    if (error.response.status === 401) return "Your session has expired. Sign in again.";
    if (error.response.status === 403) return "Your account does not have permission for this action.";
    return "Request failed. Check the values and try again.";
}

function displayDate(value) {
    if (!value) return "—";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
        ? String(value).replace("T", " ").slice(0, 16)
        : parsed.toLocaleString("en-IN", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit"
        });
}

function InputField({ label, name, value, onChange, type = "text", required = false, disabled = false, min }) {
    return <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">
            {label}{required && <span className="text-rose-600"> *</span>}
        </span>
        <input name={name} type={type} value={value ?? ""} onChange={onChange}
            required={required} disabled={disabled} min={min}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50 disabled:bg-slate-100" />
    </label>;
}

function TextArea({ label, name, value, onChange }) {
    return <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
        <textarea name={name} value={value ?? ""} onChange={onChange} rows={3}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50" />
    </label>;
}

function SelectField({ label, name, value, onChange, options }) {
    return <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
        <select name={name} value={value ?? ""} onChange={onChange}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-teal-500">
            {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
    </label>;
}

export default function DoctorSurgery() {
    const [items, setItems] = useState([]);
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
            setItems(await listSurgeries());
        } catch (err) {
            setError(apiError(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return items;
        return items.filter(item =>
            [
                item.surgery_number, item.patient_id, item.operation_theatre_id,
                item.department_id, item.surgeon_id, item.procedure_name,
                item.surgery_type, item.status, item.preoperative_diagnosis
            ].some(value => String(value ?? "").toLowerCase().includes(query))
        );
    }, [items, search]);

    function openCreate() {
        setForm({ ...EMPTY });
        setError("");
        setNotice("");
        setModal({ mode: "create" });
    }

    function openEdit(item) {
        const next = { ...EMPTY, ...item };
        for (const key of ["scheduled_start", "scheduled_end", "actual_start", "actual_end"]) {
            next[key] = item[key] ? String(item[key]).slice(0, 16) : "";
        }
        for (const key of ["patient_id", "operation_theatre_id", "department_id", "surgeon_id", "anaesthetist_id"]) {
            next[key] = item[key] == null ? "" : String(item[key]);
        }
        setForm(next);
        setError("");
        setNotice("");
        setModal({ mode: "edit", item });
    }

    function change(event) {
        const { name, value } = event.target;
        setForm(previous => ({ ...previous, [name]: value }));
    }

    async function submit(event) {
        event.preventDefault();
        setBusy(true);
        setError("");
        setNotice("");

        const payload = {
            surgery_number: form.surgery_number.trim(),
            patient_id: Number(form.patient_id),
            operation_theatre_id: Number(form.operation_theatre_id),
            department_id: Number(form.department_id),
            surgeon_id: Number(form.surgeon_id),
            anaesthetist_id: form.anaesthetist_id ? Number(form.anaesthetist_id) : null,
            procedure_name: form.procedure_name.trim(),
            surgery_type: form.surgery_type.trim(),
            scheduled_start: form.scheduled_start ? new Date(form.scheduled_start).toISOString() : null,
            scheduled_end: form.scheduled_end ? new Date(form.scheduled_end).toISOString() : null,
            actual_start: form.actual_start ? new Date(form.actual_start).toISOString() : null,
            actual_end: form.actual_end ? new Date(form.actual_end).toISOString() : null,
            preoperative_diagnosis: form.preoperative_diagnosis.trim() || null,
            postoperative_diagnosis: form.postoperative_diagnosis.trim() || null,
            procedure_details: form.procedure_details.trim() || null,
            anaesthesia_type: form.anaesthesia_type.trim() || null,
            findings: form.findings.trim() || null,
            complications: form.complications.trim() || null,
            postoperative_instructions: form.postoperative_instructions.trim() || null,
            status: form.status,
            cancellation_reason: form.cancellation_reason.trim() || null,
            notes: form.notes.trim() || null
        };

        try {
            if (modal.mode === "create") {
                if (!payload.surgery_number || !payload.patient_id ||
                    !payload.operation_theatre_id || !payload.department_id ||
                    !payload.surgeon_id || !payload.procedure_name ||
                    !payload.surgery_type || !payload.scheduled_start ||
                    !payload.scheduled_end) {
                    setError("Complete required fields and enter valid existing record IDs.");
                    return;
                }
                if (new Date(payload.scheduled_end) <= new Date(payload.scheduled_start)) {
                    setError("Scheduled end must be after scheduled start.");
                    return;
                }
                await createSurgery(payload);
                setNotice("Surgery record created.");
            } else {
                delete payload.surgery_number;
                delete payload.patient_id;
                delete payload.operation_theatre_id;
                delete payload.department_id;
                delete payload.surgeon_id;
                delete payload.anaesthetist_id;
                await updateSurgery(modal.item.id, payload);
                setNotice("Surgery record updated.");
            }
            setModal(null);
            await load();
        } catch (err) {
            setError(apiError(err));
        } finally {
            setBusy(false);
        }
    }

    async function runAction(label, action, item, extra) {
        setBusy(true);
        setError("");
        setNotice("");
        try {
            await action(item.id, ...(extra ?? []));
            setNotice(`${label} successful.`);
            if (modal?.item?.id === item.id) setModal(null);
            await load();
        } catch (err) {
            setError(apiError(err));
        } finally {
            setBusy(false);
        }
    }

    async function remove(item) {
        if (!window.confirm(`Delete surgery record ${item.surgery_number}?`)) return;
        await runAction("Delete", deleteSurgery, item);
    }

    async function cancel(item) {
        const reason = window.prompt("Enter cancellation reason:");
        if (reason === null) return;
        if (!reason.trim()) {
            setError("Cancellation reason is required.");
            return;
        }
        await runAction("Cancellation", cancelSurgery, item, [reason.trim()]);
    }

    const stats = [
        { label: "Total surgeries", value: items.length, icon: ClipboardList },
        { label: "Scheduled", value: items.filter(x => String(x.status).toLowerCase() === "scheduled").length, icon: CalendarDays },
        { label: "Completed", value: items.filter(x => String(x.status).toLowerCase() === "completed").length, icon: CheckCircle2 }
    ];

    return <div className="min-h-full bg-slate-50/70 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
            <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-teal-700"><ShieldCheck size={16} /> Doctor workspace</div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Surgery Management</h1>
                    <p className="mt-1 text-sm text-slate-500">Review theatre schedules, operative progress and postoperative documentation.</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-800"><FilePlus2 size={18} /> Schedule surgery</button>
            </header>

            {error && <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertCircle size={18} className="mt-0.5 shrink-0" /><span className="flex-1">{error}</span><button onClick={() => setError("")} aria-label="Dismiss error"><X size={17} /></button></div>}
            {notice && <div role="status" className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss message"><X size={17} /></button></div>}

            <section className="grid gap-4 sm:grid-cols-3">
                {stats.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">{label}</span><span className="rounded-xl bg-teal-50 p-2.5 text-teal-700"><Icon size={19} /></span></div><div className="mt-3 text-3xl font-bold text-slate-900">{value}</div></div>)}
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div><h2 className="font-semibold text-slate-900">Surgery register</h2><p className="mt-1 text-sm text-slate-500">{filtered.length} record{filtered.length === 1 ? "" : "s"} shown</p></div>
                    <div className="flex gap-2"><div className="relative min-w-0 flex-1 sm:w-72"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search surgery..." aria-label="Search surgery records" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50" /></div><button onClick={load} disabled={loading} title="Refresh records" className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={17} className={loading ? "animate-spin" : ""} /></button></div>
                </div>

                {loading ? <div className="flex min-h-56 items-center justify-center gap-3 text-sm text-slate-500"><LoaderCircle size={20} className="animate-spin" /> Loading surgery records...</div>
                    : filtered.length === 0 ? <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center"><div className="rounded-2xl bg-slate-100 p-4 text-slate-500"><Scissors size={28} /></div><h3 className="mt-4 font-semibold text-slate-900">{search ? "No matching surgeries" : "No surgery records yet"}</h3><p className="mt-1 max-w-md text-sm text-slate-500">{search ? "Try another search term." : "Existing surgery schedules will appear here. No sample records have been added."}</p>{!search && <button onClick={openCreate} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-teal-200 px-4 py-2.5 text-sm font-semibold text-teal-800 hover:bg-teal-50"><FilePlus2 size={16} /> Schedule surgery</button>}</div>
                    : <div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3.5">Surgery No.</th><th className="px-5 py-3.5">Patient / Surgeon</th><th className="px-5 py-3.5">Procedure</th><th className="px-5 py-3.5">Scheduled start</th><th className="px-5 py-3.5">Status</th><th className="px-5 py-3.5 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map(item => <tr key={item.id} className="transition hover:bg-slate-50/70"><td className="px-5 py-4"><div className="font-semibold text-slate-900">{item.surgery_number}</div><div className="mt-1 text-xs text-slate-500">ID #{item.id}</div></td><td className="px-5 py-4 text-slate-600"><div>Patient #{item.patient_id}</div><div className="mt-1">Surgeon #{item.surgeon_id}</div><div className="mt-1 text-xs text-slate-400">Theatre #{item.operation_theatre_id}</div></td><td className="max-w-64 px-5 py-4"><div className="font-medium text-slate-800">{item.procedure_name}</div><div className="mt-1 text-xs capitalize text-slate-500">{item.surgery_type}</div></td><td className="whitespace-nowrap px-5 py-4 text-slate-500">{displayDate(item.scheduled_start)}</td><td className="px-5 py-4"><span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">{String(item.status ?? "unknown").replaceAll("_", " ")}</span><div className="mt-1 text-xs text-slate-400">End: {displayDate(item.scheduled_end)}</div></td><td className="px-5 py-4"><div className="flex justify-end gap-1"><button onClick={() => setModal({ mode: "view", item })} title="View" aria-label="View surgery" className="rounded-lg p-2 text-slate-500 hover:bg-teal-50 hover:text-teal-700"><Eye size={17} /></button><button onClick={() => openEdit(item)} title="Edit" aria-label="Edit surgery" className="rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-700"><Pencil size={17} /></button>{String(item.status).toLowerCase() === "scheduled" && <button onClick={() => runAction("Start surgery", startSurgery, item)} disabled={busy} title="Start surgery" aria-label="Start surgery" className="rounded-lg p-2 text-teal-700 hover:bg-teal-50 disabled:opacity-50"><Play size={17} /></button>}{["scheduled", "in_progress"].includes(String(item.status).toLowerCase()) && <button onClick={() => runAction("Complete surgery", completeSurgery, item)} disabled={busy} title="Complete surgery" aria-label="Complete surgery" className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"><CheckCircle2 size={17} /></button>}{!["completed", "cancelled"].includes(String(item.status).toLowerCase()) && <button onClick={() => cancel(item)} disabled={busy} title="Cancel surgery" aria-label="Cancel surgery" className="rounded-lg p-2 text-amber-700 hover:bg-amber-50 disabled:opacity-50"><Ban size={17} /></button>}<button onClick={() => remove(item)} disabled={busy} title="Delete" aria-label="Delete surgery" className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"><Trash2 size={17} /></button></div></td></tr>)}</tbody></table></div>}
            </section>

            {modal && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-3 backdrop-blur-[2px] sm:p-6" onMouseDown={e => { if (e.target === e.currentTarget && !busy) setModal(null); }}><section role="dialog" aria-modal="true" aria-labelledby="surgery-modal-title" className="my-auto w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6"><div><h2 id="surgery-modal-title" className="text-lg font-bold text-slate-900">{modal.mode === "create" ? "Schedule surgery" : modal.mode === "edit" ? "Edit surgery record" : "Surgery details"}</h2><p className="mt-1 text-sm text-slate-500">{modal.mode === "create" ? "Use IDs from existing hospital records." : modal.item.surgery_number}</p></div><button onClick={() => !busy && setModal(null)} disabled={busy} aria-label="Close dialog" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={19} /></button></div>

                {modal.mode === "view" ? <div className="max-h-[75vh] space-y-5 overflow-y-auto p-5 sm:p-6">
                    <div className="grid gap-3 sm:grid-cols-3">{[["Patient ID", modal.item.patient_id], ["Theatre ID", modal.item.operation_theatre_id], ["Department ID", modal.item.department_id], ["Surgeon ID", modal.item.surgeon_id], ["Anaesthetist ID", modal.item.anaesthetist_id], ["Procedure", modal.item.procedure_name], ["Type", modal.item.surgery_type], ["Status", modal.item.status], ["Anaesthesia", modal.item.anaesthesia_type], ["Scheduled start", displayDate(modal.item.scheduled_start)], ["Scheduled end", displayDate(modal.item.scheduled_end)], ["Actual start", displayDate(modal.item.actual_start)], ["Actual end", displayDate(modal.item.actual_end)]].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-500">{label}</div><div className="mt-1 break-words font-semibold capitalize text-slate-800">{String(value ?? "—")}</div></div>)}</div>
                    {[["preoperative_diagnosis", "Preoperative diagnosis"], ["postoperative_diagnosis", "Postoperative diagnosis"], ["procedure_details", "Procedure details"], ["findings", "Findings"], ["complications", "Complications"], ["postoperative_instructions", "Postoperative instructions"], ["cancellation_reason", "Cancellation reason"], ["notes", "Notes"]].map(([key, label]) => <div key={key}><h3 className="text-sm font-semibold text-slate-800">{label}</h3><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">{modal.item[key] || "Not documented"}</p></div>)}
                    <div className="flex flex-wrap justify-end gap-2"><button onClick={() => openEdit(modal.item)} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"><Pencil size={16} /> Edit record</button></div>
                </div> : <form onSubmit={submit} className="max-h-[75vh] space-y-5 overflow-y-auto p-5 sm:p-6">
                    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}
                    {modal.mode === "create" && <div className="grid gap-4 sm:grid-cols-3"><InputField label="Surgery number" name="surgery_number" value={form.surgery_number} onChange={change} required /><InputField label="Patient ID" name="patient_id" type="number" value={form.patient_id} onChange={change} min="1" required /><InputField label="Operation theatre ID" name="operation_theatre_id" type="number" value={form.operation_theatre_id} onChange={change} min="1" required /><InputField label="Department ID" name="department_id" type="number" value={form.department_id} onChange={change} min="1" required /><InputField label="Surgeon ID" name="surgeon_id" type="number" value={form.surgeon_id} onChange={change} min="1" required /><InputField label="Anaesthetist ID (optional)" name="anaesthetist_id" type="number" value={form.anaesthetist_id} onChange={change} min="1" /></div>}
                    {modal.mode === "edit" && <InputField label="Surgery number" name="surgery_number" value={form.surgery_number} onChange={change} disabled />}
                    <div className="grid gap-4 sm:grid-cols-2"><InputField label="Procedure name" name="procedure_name" value={form.procedure_name} onChange={change} required /><InputField label="Surgery type" name="surgery_type" value={form.surgery_type} onChange={change} required /><InputField label="Anaesthesia type" name="anaesthesia_type" value={form.anaesthesia_type} onChange={change} /><SelectField label="Status" name="status" value={form.status} onChange={change} options={[{value:"scheduled",label:"Scheduled"},{value:"in_progress",label:"In progress"},{value:"completed",label:"Completed"},{value:"cancelled",label:"Cancelled"}]} /></div>
                    <div className="grid gap-4 sm:grid-cols-2"><InputField label="Scheduled start" name="scheduled_start" type="datetime-local" value={form.scheduled_start} onChange={change} required={modal.mode === "create"} /><InputField label="Scheduled end" name="scheduled_end" type="datetime-local" value={form.scheduled_end} onChange={change} required={modal.mode === "create"} /><InputField label="Actual start" name="actual_start" type="datetime-local" value={form.actual_start} onChange={change} /><InputField label="Actual end" name="actual_end" type="datetime-local" value={form.actual_end} onChange={change} /></div>
                    <TextArea label="Preoperative diagnosis" name="preoperative_diagnosis" value={form.preoperative_diagnosis} onChange={change} />
                    <TextArea label="Postoperative diagnosis" name="postoperative_diagnosis" value={form.postoperative_diagnosis} onChange={change} />
                    <TextArea label="Procedure details" name="procedure_details" value={form.procedure_details} onChange={change} />
                    <TextArea label="Findings" name="findings" value={form.findings} onChange={change} />
                    <TextArea label="Complications" name="complications" value={form.complications} onChange={change} />
                    <TextArea label="Postoperative instructions" name="postoperative_instructions" value={form.postoperative_instructions} onChange={change} />
                    <TextArea label="Cancellation reason" name="cancellation_reason" value={form.cancellation_reason} onChange={change} />
                    <TextArea label="Notes" name="notes" value={form.notes} onChange={change} />
                    <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end"><button type="button" onClick={() => setModal(null)} disabled={busy} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button><button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60">{busy && <LoaderCircle size={16} className="animate-spin" />}{modal.mode === "create" ? "Schedule surgery" : "Save changes"}</button></div>
                </form>}
            </section></div>}
        </div>
    </div>;
}
