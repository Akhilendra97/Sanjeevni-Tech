import { useCallback, useEffect, useMemo, useState } from "react";
import {
    CalendarClock, Clock3, Search, RefreshCw, Plus, Pencil,
    Trash2, X, AlertCircle, LoaderCircle, CalendarDays,
    CheckCircle2, ClipboardList, ShieldCheck
} from "lucide-react";
import {
    listDutySchedules, createDutySchedule,
    updateDutySchedule, deleteDutySchedule
} from "../../services/doctorDutyScheduleApi";
import api from "../../services/api";

const DAYS = [
    "Monday", "Tuesday", "Wednesday", "Thursday",
    "Friday", "Saturday", "Sunday"
];

const EMPTY = {
    doctor_id: "",
    day_of_week: "Monday",
    start_time: "09:00",
    end_time: "17:00",
    slot_duration_minutes: "30"
};

function getError(error) {
    const detail = error?.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map(item => item.msg || "Invalid field").join(", ");
    if (!error?.response) return "Unable to connect to the hospital API.";
    if (error.response.status === 401) return "Session expired. Sign in again.";
    if (error.response.status === 403) return "Your account does not have permission for this action.";
    return "The request failed. Check the entered values and try again.";
}

function Field({ label, name, value, onChange, type = "text", required = false, min }) {
    return <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">
            {label}{required && <span className="text-rose-600"> *</span>}
        </span>
        <input name={name} type={type} value={value ?? ""} onChange={onChange}
            required={required} min={min}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50" />
    </label>;
}

function formatTime(value) {
    if (!value) return "—";
    return String(value).slice(0, 5);
}

export default function DoctorDutySchedule() {
    const [items, setItems] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const doctorName = (id) => { const doctor = doctors.find((d) => Number(d.id) === Number(id)); return doctor?.full_name || doctor?.user?.full_name || doctor?.name || "Doctor name unavailable"; };
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
            setItems(await listDutySchedules());
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
        if (!q) return items;
        return items.filter(item => [
            item.doctor_id, item.day_of_week, item.start_time,
            item.end_time, item.slot_duration_minutes, item.id
        ].some(value => String(value ?? "").toLowerCase().includes(q)));
    }, [items, search]);

    const activeDays = new Set(items.map(item => String(item.day_of_week ?? "").toLowerCase())).size;
    const totalSlots = items.reduce((sum, item) => {
        const start = String(item.start_time ?? "").slice(0, 5).split(":").map(Number);
        const end = String(item.end_time ?? "").slice(0, 5).split(":").map(Number);
        const duration = Number(item.slot_duration_minutes);
        if (start.length !== 2 || end.length !== 2 || !duration || duration < 1) return sum;
        const minutes = (end[0] * 60 + end[1]) - (start[0] * 60 + start[1]);
        return sum + (minutes > 0 ? Math.floor(minutes / duration) : 0);
    }, 0);

    function openCreate() {
        setForm({ ...EMPTY });
        setError("");
        setModal({ mode: "create" });
    }

    function openEdit(item) {
        setForm({
            doctor_id: String(item.doctor_id ?? ""),
            day_of_week: String(item.day_of_week ?? "Monday"),
            start_time: formatTime(item.start_time),
            end_time: formatTime(item.end_time),
            slot_duration_minutes: String(item.slot_duration_minutes ?? 30)
        });
        setError("");
        setModal({ mode: "edit", item });
    }

    function change(event) {
        const { name, value } = event.target;
        setForm(previous => ({ ...previous, [name]: value }));
    }

    async function submit(event) {
        event.preventDefault();
        setError("");
        setNotice("");

        const startMinutes = form.start_time.split(":").map(Number);
        const endMinutes = form.end_time.split(":").map(Number);
        const start = startMinutes[0] * 60 + startMinutes[1];
        const end = endMinutes[0] * 60 + endMinutes[1];
        const duration = Number(form.slot_duration_minutes);
        const doctorId = Number(form.doctor_id);

        if (!Number.isInteger(doctorId) || doctorId <= 0) {
            setError("Enter a valid existing doctor ID.");
            return;
        }
        if (end <= start) {
            setError("End time must be later than start time.");
            return;
        }
        if (!Number.isInteger(duration) || duration < 1) {
            setError("Slot duration must be a positive whole number.");
            return;
        }

        const payload = {
            doctor_id: doctorId,
            day_of_week: form.day_of_week,
            start_time: form.start_time.length === 5 ? `${form.start_time}:00` : form.start_time,
            end_time: form.end_time.length === 5 ? `${form.end_time}:00` : form.end_time,
            slot_duration_minutes: duration
        };

        setBusy(true);
        try {
            if (modal.mode === "create") {
                await createDutySchedule(payload);
                setNotice("Duty schedule created successfully.");
            } else {
                delete payload.doctor_id;
                await updateDutySchedule(modal.item.id, payload);
                setNotice("Duty schedule updated successfully.");
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
        if (!window.confirm(`Delete schedule #${item.id} for ${doctorName(item.doctor_id)}?`)) return;
        setBusy(true);
        setError("");
        setNotice("");
        try {
            await deleteDutySchedule(item.id);
            setNotice("Duty schedule deleted.");
            await load();
        } catch (err) {
            setError(getError(err));
        } finally {
            setBusy(false);
        }
    }

    return <div className="min-h-full bg-slate-50/70 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
            <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-teal-700"><ShieldCheck size={16} /> Doctor workspace</div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Duty Schedule</h1>
                    <p className="mt-1 text-sm text-slate-500">Review working days, duty hours and appointment slot durations.</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-800"><Plus size={18} /> Add duty schedule</button>
            </header>

            {error && <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertCircle size={18} className="mt-0.5 shrink-0" /><span className="flex-1">{error}</span><button onClick={() => setError("")} aria-label="Dismiss error"><X size={17} /></button></div>}
            {notice && <div role="status" className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss message"><X size={17} /></button></div>}

            <section className="grid gap-4 sm:grid-cols-3">
                {[{ label: "Duty schedules", value: items.length, Icon: ClipboardList }, { label: "Days represented", value: activeDays, Icon: CalendarDays }, { label: "Estimated daily slots", value: totalSlots, Icon: Clock3 }].map(({ label, value, Icon }) =>
                    <div key={label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">{label}</span><span className="rounded-xl bg-teal-50 p-2.5 text-teal-700"><Icon size={19} /></span></div>
                        <div className="mt-3 text-3xl font-bold text-slate-900">{value}</div>
                    </div>
                )}
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div><h2 className="font-semibold text-slate-900">Weekly duty register</h2><p className="mt-1 text-sm text-slate-500">{filtered.length} schedule{filtered.length === 1 ? "" : "s"} shown</p></div>
                    <div className="flex gap-2">
                        <div className="relative min-w-0 flex-1 sm:w-72"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search doctor or weekday..." aria-label="Search schedules" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50" /></div>
                        <button onClick={load} disabled={loading} title="Refresh schedules" className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={17} className={loading ? "animate-spin" : ""} /></button>
                    </div>
                </div>

                {loading ? <div className="flex min-h-56 items-center justify-center gap-3 text-sm text-slate-500"><LoaderCircle size={20} className="animate-spin" /> Loading duty schedules...</div>
                    : filtered.length === 0 ? <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center"><div className="rounded-2xl bg-slate-100 p-4 text-slate-500"><CalendarClock size={28} /></div><h3 className="mt-4 font-semibold text-slate-900">{search ? "No matching schedules" : "No duty schedules found"}</h3><p className="mt-1 max-w-md text-sm text-slate-500">{search ? "Try another search term." : "Existing duty schedules will appear here. No sample schedules have been added."}</p>{!search && <button onClick={openCreate} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-teal-200 px-4 py-2.5 text-sm font-semibold text-teal-800 hover:bg-teal-50"><Plus size={16} /> Add duty schedule</button>}</div>
                    : <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3.5">Doctor</th><th className="px-5 py-3.5">Weekday</th><th className="px-5 py-3.5">Duty hours</th><th className="px-5 py-3.5">Slot duration</th><th className="px-5 py-3.5">Estimated slots</th><th className="px-5 py-3.5 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map(item => {
                        const start = formatTime(item.start_time).split(":").map(Number);
                        const end = formatTime(item.end_time).split(":").map(Number);
                        const duration = Number(item.slot_duration_minutes);
                        const minutes = (end[0] * 60 + end[1]) - (start[0] * 60 + start[1]);
                        const slots = duration > 0 && minutes > 0 ? Math.floor(minutes / duration) : "—";
                        return <tr key={item.id} className="transition hover:bg-slate-50/70">
                            <td className="px-5 py-4"><div className="font-semibold text-slate-900">{doctorName(item.doctor_id)}</div><div className="mt-1 text-xs text-slate-500">Schedule #{item.id}</div></td>
                            <td className="px-5 py-4"><span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 font-medium text-teal-800"><CalendarDays size={14} />{item.day_of_week}</span></td>
                            <td className="whitespace-nowrap px-5 py-4 text-slate-600"><div className="flex items-center gap-2"><Clock3 size={15} className="text-slate-400" />{formatTime(item.start_time)} – {formatTime(item.end_time)}</div></td>
                            <td className="px-5 py-4 text-slate-600">{item.slot_duration_minutes} minutes</td>
                            <td className="px-5 py-4"><span className="font-semibold text-slate-800">{slots}</span><span className="ml-1 text-xs text-slate-500">slots/day</span></td>
                            <td className="px-5 py-4"><div className="flex justify-end gap-1"><button onClick={() => openEdit(item)} aria-label="Edit schedule" title="Edit" className="rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-700"><Pencil size={17} /></button><button onClick={() => remove(item)} disabled={busy} aria-label="Delete schedule" title="Delete" className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"><Trash2 size={17} /></button></div></td>
                        </tr>;
                    })}</tbody></table></div>}
            </section>

            <p className="text-xs leading-5 text-slate-500">Slot counts are estimates calculated from duty duration and slot length. They do not represent confirmed appointments or real-time availability.</p>

            {modal && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-[2px]" onMouseDown={e => { if (e.target === e.currentTarget && !busy) setModal(null); }}>
                <section role="dialog" aria-modal="true" aria-labelledby="schedule-dialog-title" className="my-auto w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                    <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4"><div><h2 id="schedule-dialog-title" className="text-lg font-bold text-slate-900">{modal.mode === "create" ? "Add duty schedule" : "Edit duty schedule"}</h2><p className="mt-1 text-sm text-slate-500">Use the ID of an existing doctor.</p></div><button onClick={() => !busy && setModal(null)} disabled={busy} aria-label="Close dialog" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={19} /></button></div>
                    <form onSubmit={submit} className="space-y-4 p-5">
                        {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}
                        <Field label="Doctor ID" name="doctor_id" type="number" min="1" value={form.doctor_id} onChange={change} required />
                        <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Day of week <span className="text-rose-600">*</span></span><select name="day_of_week" value={form.day_of_week} onChange={change} required className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-teal-500">{DAYS.map(day => <option key={day} value={day}>{day}</option>)}</select></label>
                        <div className="grid gap-4 sm:grid-cols-2"><Field label="Start time" name="start_time" type="time" value={form.start_time} onChange={change} required /><Field label="End time" name="end_time" type="time" value={form.end_time} onChange={change} required /></div>
                        <Field label="Appointment slot duration (minutes)" name="slot_duration_minutes" type="number" min="1" value={form.slot_duration_minutes} onChange={change} required />
                        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end"><button type="button" onClick={() => setModal(null)} disabled={busy} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button><button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60">{busy && <LoaderCircle size={16} className="animate-spin" />}{modal.mode === "create" ? "Create schedule" : "Save changes"}</button></div>
                    </form>
                </section>
            </div>}
        </div>
    </div>;
}
