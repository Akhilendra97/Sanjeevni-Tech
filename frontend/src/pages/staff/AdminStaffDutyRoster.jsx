import { useCallback, useEffect, useState } from "react";
import {
  CalendarClock, RefreshCw, WandSparkles, AlertCircle, CheckCircle2,
  Pencil, Save, X,
} from "lucide-react";
import api from "../../services/api";

const localDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const today = () => localDate();
const fmtDate = (d) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
const fmtTime = (t) => t ? String(t).slice(0, 5) : "—";
const shiftTimes = {
  morning: { start_time: "06:00", end_time: "14:00" },
  evening: { start_time: "14:00", end_time: "22:00" },
  night: { start_time: "22:00", end_time: "06:00" },
};
const errorMessage = (error) => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((item) => item?.msg || "Invalid request").join("; ");
  return error?.response?.data?.message || error?.message || "Request failed.";
};
const formFromRecord = (record) => ({
  duty_date: record.duty_date,
  shift: record.shift,
  start_time: fmtTime(record.start_time),
  end_time: fmtTime(record.end_time),
  status: record.status || "scheduled",
  notes: record.notes || "",
});

export default function AdminStaffDutyRoster() {
  const [startDate, setStartDate] = useState(today());
  const [days, setDays] = useState(7);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const end = new Date(`${startDate}T00:00:00`);
      end.setDate(end.getDate() + Number(days) - 1);
      const response = await api.get("/staff-duties", { params: { start_date: startDate, end_date: localDate(end) } });
      setRecords(Array.isArray(response.data) ? response.data : []);
    } catch (e) { setError(errorMessage(e)); setRecords([]); }
    finally { setLoading(false); }
  }, [startDate, days]);

  useEffect(() => { load(); }, [load]);

  const assign = async () => {
    if (!window.confirm(`Assign a rotating 3-shift roster to every staff member for ${days} day(s), starting ${startDate}? Existing assignments in this date range will be updated.`)) return;
    setAssigning(true); setError(""); setNotice("");
    try {
      const response = await api.post("/staff-duties/assign-week", { start_date: startDate, days: Number(days) });
      setRecords(Array.isArray(response.data) ? response.data : []);
      setNotice(`Roster saved: ${response.data?.length || 0} duty assignments for the selected date range.`);
    } catch (e) { setError(errorMessage(e)); }
    finally { setAssigning(false); }
  };

  const beginEdit = (record) => {
    setEditing(record);
    setForm(formFromRecord(record));
    setError(""); setNotice("");
  };

  const updateField = (field, value) => {
    setForm((current) => {
      if (!current) return current;
      if (field === "shift") return { ...current, shift: value, ...shiftTimes[value] };
      return { ...current, [field]: value };
    });
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    if (!editing || !form) return;
    setSavingId(editing.id); setError(""); setNotice("");
    try {
      const payload = {
        duty_date: form.duty_date,
        shift: form.shift,
        start_time: form.start_time,
        end_time: form.end_time,
        status: form.status,
        notes: form.notes.trim() || null,
      };
      const response = await api.patch(`/staff-duties/${editing.id}`, payload);
      setRecords((current) => current.map((row) => row.id === editing.id ? response.data : row));
      setNotice(`Duty updated for ${response.data.full_name} on ${response.data.duty_date}.`);
      setEditing(null); setForm(null);
      await load();
    } catch (e) { setError(errorMessage(e)); }
    finally { setSavingId(null); }
  };

  return <div className="space-y-6">
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700"><CalendarClock size={27}/></div><div><p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Administration</p><h2 className="text-2xl font-black text-slate-900">Staff Duty Roster</h2><p className="mt-1 text-sm text-slate-500">Assign and edit each staff member’s date, shift and working hours.</p></div></div>
        <button onClick={load} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-700"><RefreshCw size={17} className={loading ? "animate-spin" : ""}/> Refresh</button>
      </div>
    </section>
    {notice && <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800"><CheckCircle2 size={18}/>{notice}</div>}
    {error && <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800"><AlertCircle size={20}/><div><strong>Request failed</strong><p className="mt-1 text-sm">{error}</p></div></div>}
    <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-[1fr_180px_auto]">
      <label className="text-sm font-semibold text-slate-700">Start date<input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3"/></label>
      <label className="text-sm font-semibold text-slate-700">Days<select value={days} onChange={e=>setDays(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3">{[7,14,21,28,31].map(n=><option key={n} value={n}>{n} days</option>)}</select></label>
      <div className="flex items-end"><button onClick={assign} disabled={assigning} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-bold text-white disabled:opacity-60"><WandSparkles size={18}/>{assigning ? "Assigning…" : "Assign all staff"}</button></div>
      <p className="text-xs leading-5 text-slate-500 md:col-span-3">Shift pattern: Morning 06:00–14:00 · Evening 14:00–22:00 · Night 22:00–06:00 (ends next day). Use Edit on any row to change its date, shift, timing or status.</p>
    </section>

    {editing && form && <section className="rounded-2xl border border-cyan-200 bg-cyan-50/50 p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3"><div><h3 className="text-lg font-black text-slate-900">Edit duty assignment</h3><p className="text-sm text-slate-600">{editing.full_name} · {editing.employee_id}</p></div><button type="button" onClick={()=>{setEditing(null);setForm(null);}} className="rounded-lg p-2 text-slate-600 hover:bg-white" aria-label="Close edit form"><X size={20}/></button></div>
      <form onSubmit={saveEdit} className="grid gap-4 md:grid-cols-3">
        <label className="text-sm font-semibold text-slate-700">Duty date<input required type="date" value={form.duty_date} onChange={e=>updateField("duty_date",e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3"/></label>
        <label className="text-sm font-semibold text-slate-700">Shift<select required value={form.shift} onChange={e=>updateField("shift",e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3"><option value="morning">Morning</option><option value="evening">Evening</option><option value="night">Night</option></select></label>
        <label className="text-sm font-semibold text-slate-700">Status<select required value={form.status} onChange={e=>updateField("status",e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3"><option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="on_leave">On leave</option></select></label>
        <label className="text-sm font-semibold text-slate-700">Start time<input required type="time" value={form.start_time} onChange={e=>updateField("start_time",e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3"/></label>
        <label className="text-sm font-semibold text-slate-700">End time<input required type="time" value={form.end_time} onChange={e=>updateField("end_time",e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3"/><span className="mt-1 block text-xs text-slate-500">Night shift ends on the following date.</span></label>
        <label className="text-sm font-semibold text-slate-700">Notes<input maxLength={500} value={form.notes} onChange={e=>updateField("notes",e.target.value)} placeholder="Optional notes" className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3"/></label>
        <div className="flex flex-wrap gap-3 md:col-span-3"><button type="submit" disabled={savingId === editing.id} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-bold text-white disabled:opacity-60"><Save size={17}/>{savingId === editing.id ? "Saving…" : "Save changes"}</button><button type="button" onClick={()=>{setEditing(null);setForm(null);setError("");}} className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700">Cancel</button></div>
      </form>
    </section>}

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-100 p-5"><h3 className="font-black text-slate-900">Scheduled duties</h3><p className="mt-1 text-sm text-slate-500">{records.length} assignment(s) in selected range</p></div>
      {records.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Staff</th><th className="px-4 py-3">Employee ID</th><th className="px-4 py-3">Department</th><th className="px-4 py-3">Shift</th><th className="px-4 py-3">Timing</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{records.map(r=><tr key={r.id} className="hover:bg-slate-50"><td className="whitespace-nowrap px-4 py-3">{fmtDate(r.duty_date)}</td><td className="px-4 py-3 font-semibold">{r.full_name}</td><td className="whitespace-nowrap px-4 py-3">{r.employee_id}</td><td className="px-4 py-3">{r.department_name || "—"}</td><td className="px-4 py-3 capitalize">{r.shift}</td><td className="whitespace-nowrap px-4 py-3">{fmtTime(r.start_time)}–{fmtTime(r.end_time)}{r.shift === "night" ? " (+1 day)" : ""}</td><td className="px-4 py-3 capitalize">{String(r.status).replaceAll("_", " ")}</td><td className="px-4 py-3"><button onClick={()=>beginEdit(r)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-700 hover:border-cyan-300 hover:bg-cyan-50"><Pencil size={15}/> Edit</button></td></tr>)}</tbody></table></div> : <div className="p-10 text-center text-sm text-slate-500">{loading ? "Loading roster…" : "No duties found for this date range. Use Assign all staff to create the roster."}</div>}
    </section>
  </div>;
}
