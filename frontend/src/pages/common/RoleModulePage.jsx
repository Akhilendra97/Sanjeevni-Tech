import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, RefreshCw, Search, CalendarPlus, BedDouble, ListOrdered, CalendarDays, FileCheck2, UserRound, AlertCircle, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { getPatients } from "../../services/patientApi";

const moduleConfig = {
  Appointments: { endpoint: "/appointments", icon: CalendarDays, description: "Schedule and manage front-desk appointments." },
  Admissions: { endpoint: "/admissions", icon: BedDouble, description: "Register admissions and manage inpatient workflow." },
  Discharges: { endpoint: "/discharges", icon: FileCheck2, description: "Review and record patient discharges." },
  Queue: { endpoint: "/queues?limit=100", icon: ListOrdered, description: "Monitor patient queues and update queue status." },
  "Profile & Settings": { endpoint: "/auth/me", icon: UserRound, description: "View the signed-in receptionist session." },
};
const readable = (key) => key.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
const errorText = (e) => {
  const d = e?.response?.data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((x) => x.msg).join(", ");
  return e?.message || "The request could not be completed.";
};
const asArray = (data) => Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : Array.isArray(data?.data) ? data.data : [];
const dateToday = () => new Date().toISOString().slice(0, 10);
const makeNumber = (prefix) => `${prefix}-${Date.now().toString().slice(-10)}`;

export default function RoleModulePage({ role, title, description, dashboardPath }) {
  const navigate = useNavigate();
  const config = moduleConfig[title] || {};
  const Icon = config.icon || CalendarDays;
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [wards, setWards] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({});

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await api.get(config.endpoint);
      const data = response.data;
      setRecords(title === "Profile & Settings" ? [data || {}] : asArray(data));
    } catch (e) {
      setRecords([]); setError(errorText(e));
    } finally { setLoading(false); }
  }, [config.endpoint, title]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!["Appointments", "Admissions", "Discharges"].includes(title)) return;
    getPatients({ limit: 500 }).then((d) => setPatients(asArray(d))).catch(() => setPatients([]));
    api.get("/doctors").then((r) => setDoctors(asArray(r.data))).catch(() => setDoctors([]));
    if (title === "Admissions") api.get("/wards").then((r) => setWards(asArray(r.data))).catch(() => setWards([]));
  }, [title]);

  const filtered = useMemo(() => records.filter((r) => JSON.stringify(r).toLowerCase().includes(search.toLowerCase())), [records, search]);
  const setField = (key, value) => setDraft((d) => ({ ...d, [key]: value }));
  const openForm = () => {
    setError(""); setNotice("");
    if (title === "Appointments") setDraft({ patient_id: "", doctor_id: "", appointment_date: dateToday(), appointment_time: "09:00", status: "scheduled", priority: "normal", reason: "", notes: "" });
    else if (title === "Admissions") setDraft({ patient_id: "", doctor_id: "", ward_id: "", bed_id: "", admission_date: dateToday(), status: "admitted", reason: "", diagnosis: "", notes: "" });
    else if (title === "Discharges") setDraft({ admission_id: "", patient_id: "", doctor_id: "", discharge_date: dateToday(), discharge_type: "normal", final_diagnosis: "", treatment_summary: "", medications: "", follow_up_instructions: "", condition_at_discharge: "stable", notes: "" });
    setShowForm(true);
  };
  const save = async (e) => {
    e.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      let payload = { ...draft };
      ["patient_id", "doctor_id", "ward_id", "bed_id", "admission_id"].forEach((k) => { if (payload[k] === "" || payload[k] == null) payload[k] = null; else payload[k] = Number(payload[k]); });
      if (title === "Appointments") {
        if (!payload.patient_id || !payload.doctor_id || !payload.appointment_date || !payload.appointment_time) throw new Error("Select a patient, doctor, date and time.");
        payload.appointment_number = makeNumber("APT");
      } else if (title === "Admissions") {
        if (!payload.patient_id || !payload.doctor_id || !payload.admission_date) throw new Error("Select a patient, doctor and admission date.");
        payload.admission_number = makeNumber("ADM");
      } else if (title === "Discharges") {
        if (!payload.admission_id || !payload.patient_id || !payload.doctor_id) throw new Error("Select the admission, patient and responsible doctor.");
        payload.discharge_number = makeNumber("DIS");
      }
      if (payload.ward_id == null) delete payload.ward_id;
      if (payload.bed_id == null) delete payload.bed_id;
      if (title === "Discharges" && !payload.medications) payload.medications = null;
      await api.post(config.endpoint, payload);
      setShowForm(false); setNotice(`${title.slice(0, -1) || title} saved successfully.`); await load();
    } catch (e2) { setError(errorText(e2)); }
    finally { setSaving(false); }
  };
  const queueAction = async (id, action) => {
    setError(""); setNotice("");
    try { await api.patch(`/queues/${id}/${action}`); setNotice("Queue status updated successfully."); await load(); }
    catch (e) { setError(errorText(e)); }
  };
  const patientLabel = (p) => `${p.patient_number || p.patient_id || `Patient ${p.id}`} — ${[p.first_name, p.middle_name, p.last_name].filter(Boolean).join(" ")}`;
  const doctorLabel = (d) => `${d.full_name || d.user?.full_name || d.name || `Doctor ${d.id}`} — ${d.specialization || "General"}`;
  const isCreate = ["Appointments", "Admissions", "Discharges"].includes(title);

  return <div className="space-y-6">
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700"><Icon size={26}/></div><div><p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">{role} workspace</p><h2 className="mt-1 text-2xl font-black text-slate-900">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{config.description || description}</p></div></div>
        <div className="flex flex-wrap gap-2">{isCreate && <button onClick={openForm} className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-cyan-800"><CalendarPlus size={17}/> {title === "Appointments" ? "Schedule Appointment" : title === "Admissions" ? "Register Admission" : "Record Discharge"}</button>}<button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-60"><RefreshCw size={17} className={loading ? "animate-spin" : ""}/> Refresh</button><button onClick={() => navigate(dashboardPath)} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"><ArrowLeft size={17}/> Dashboard</button></div>
      </div>
    </section>
    {notice && <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 size={18}/>{notice}<button className="ml-auto" onClick={() => setNotice("")}>Dismiss</button></div>}
    {error && <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertCircle size={18} className="mt-0.5 shrink-0"/><div><strong>{loading ? "Loading failed" : "Request failed"}</strong><p className="mt-1">{error}</p></div></div>}
    {showForm && <form onSubmit={save} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h3 className="text-lg font-bold text-slate-900">{title === "Appointments" ? "Schedule appointment" : title === "Admissions" ? "Register admission" : "Record discharge"}</h3><button type="button" onClick={() => setShowForm(false)} className="text-sm text-slate-500">Close</button></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {title !== "Discharges" && <label className="text-sm font-medium text-slate-700">Patient *<select required value={draft.patient_id || ""} onChange={e => setField("patient_id", e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3"><option value="">Select patient</option>{patients.map(p=><option key={p.id} value={p.id}>{patientLabel(p)}</option>)}</select></label>}
      {title === "Discharges" && <><label className="text-sm font-medium text-slate-700">Admission ID *<input required type="number" min="1" value={draft.admission_id||""} onChange={e=>setField("admission_id",e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3"/></label><label className="text-sm font-medium text-slate-700">Patient *<select required value={draft.patient_id||""} onChange={e=>setField("patient_id",e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3"><option value="">Select patient</option>{patients.map(p=><option key={p.id} value={p.id}>{patientLabel(p)}</option>)}</select></label></>}
      <label className="text-sm font-medium text-slate-700">Responsible doctor *<select required value={draft.doctor_id||""} onChange={e=>setField("doctor_id",e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3"><option value="">Select doctor</option>{doctors.map(d=><option key={d.id} value={d.id}>{doctorLabel(d)}</option>)}</select>{doctors.length===0&&<span className="mt-1 block text-xs text-amber-700">Doctor list unavailable or no doctors found. Check API permissions/data.</span>}</label>
      {title === "Appointments" && <><label className="text-sm font-medium text-slate-700">Date *<input required type="date" min={dateToday()} value={draft.appointment_date||""} onChange={e=>setField("appointment_date",e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3"/></label><label className="text-sm font-medium text-slate-700">Time *<input required type="time" value={draft.appointment_time||""} onChange={e=>setField("appointment_time",e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3"/></label><label className="text-sm font-medium text-slate-700">Priority<select value={draft.priority||"normal"} onChange={e=>setField("priority",e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3"><option value="normal">Normal</option><option value="high">High</option><option value="critical">Critical</option></select></label></>}
      {title === "Admissions" && <><label className="text-sm font-medium text-slate-700">Admission date *<input required type="date" max={dateToday()} value={draft.admission_date||""} onChange={e=>setField("admission_date",e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3"/></label><label className="text-sm font-medium text-slate-700">Ward<select value={draft.ward_id||""} onChange={e=>setField("ward_id",e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3"><option value="">Not assigned</option>{wards.map(w=><option key={w.id} value={w.id}>{w.name || w.ward_name || `Ward ${w.id}`}</option>)}</select></label><label className="text-sm font-medium text-slate-700">Bed ID (optional)<input type="number" min="1" value={draft.bed_id||""} onChange={e=>setField("bed_id",e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3"/></label></>}
      {title === "Discharges" && <><label className="text-sm font-medium text-slate-700">Discharge date *<input required type="date" max={dateToday()} value={draft.discharge_date||dateToday()} onChange={e=>setField("discharge_date",e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3"/></label><label className="text-sm font-medium text-slate-700">Discharge type<select value={draft.discharge_type||"routine"} onChange={e=>setField("discharge_type",e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3"><option value="normal">Normal</option><option value="against_medical_advice">Against medical advice</option><option value="transfer">Transfer</option><option value="absconded">Absconded</option></select></label></>}
      <label className="text-sm font-medium text-slate-700">{title === "Appointments" ? "Reason for visit" : title === "Admissions" ? "Admission reason" : "Final diagnosis"}<textarea value={draft.reason ?? draft.final_diagnosis ?? ""} onChange={e=>setField(title === "Appointments" ? "reason" : title === "Admissions" ? "reason" : "final_diagnosis",e.target.value)} rows="2" className="mt-1 w-full rounded-xl border border-slate-300 p-3"/></label>
      {title === "Admissions" && <label className="text-sm font-medium text-slate-700">Diagnosis<textarea value={draft.diagnosis||""} onChange={e=>setField("diagnosis",e.target.value)} rows="2" className="mt-1 w-full rounded-xl border border-slate-300 p-3"/></label>}
      {title === "Discharges" && <><label className="text-sm font-medium text-slate-700">Treatment summary<textarea value={draft.treatment_summary||""} onChange={e=>setField("treatment_summary",e.target.value)} rows="2" className="mt-1 w-full rounded-xl border border-slate-300 p-3"/></label><label className="text-sm font-medium text-slate-700">Medications<textarea value={draft.medications||""} onChange={e=>setField("medications",e.target.value)} rows="2" placeholder="List discharge medications" className="mt-1 w-full rounded-xl border border-slate-300 p-3"/></label><label className="text-sm font-medium text-slate-700">Follow-up instructions<textarea value={draft.follow_up_instructions||""} onChange={e=>setField("follow_up_instructions",e.target.value)} rows="2" className="mt-1 w-full rounded-xl border border-slate-300 p-3"/></label></>}
      <label className="text-sm font-medium text-slate-700">Notes<textarea value={draft.notes||""} onChange={e=>setField("notes",e.target.value)} rows="2" className="mt-1 w-full rounded-xl border border-slate-300 p-3"/></label>
      </div><div className="flex justify-end gap-2"><button type="button" onClick={()=>setShowForm(false)} className="rounded-xl border px-4 py-2.5 text-sm font-semibold">Cancel</button><button disabled={saving} className="rounded-xl bg-cyan-700 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">{saving ? "Saving…" : "Save record"}</button></div>
    </form>}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-bold text-slate-900">{title} records</h3><p className="mt-1 text-sm text-slate-500">{loading ? "Loading…" : `${filtered.length} record(s) shown`}</p></div><div className="relative w-full sm:max-w-sm"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search records…" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-cyan-600"/></div></div>
    {loading ? <div className="p-10 text-center text-sm text-slate-500">Loading records…</div> : filtered.length === 0 ? <div className="p-12 text-center"><Icon size={28} className="mx-auto text-slate-300"/><p className="mt-3 font-bold text-slate-700">{error ? "Records unavailable" : "No records found"}</p><p className="mt-1 text-sm text-slate-500">{error ? "Resolve the API or permission error, then refresh." : "Records will appear here when available in the database."}</p></div> : <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-100 text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{Object.keys(filtered[0] || {}).slice(0,8).map(k=><th key={k} className="px-4 py-3 font-semibold">{readable(k)}</th>)}{title === "Queue"&&<th className="px-4 py-3">Actions</th>}</tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((r,i)=><tr key={r.id || i} className="hover:bg-slate-50">{Object.keys(filtered[0] || {}).slice(0,8).map(k=><td key={k} className="max-w-xs px-4 py-3 text-slate-700">{r[k] == null ? "—" : typeof r[k] === "object" ? JSON.stringify(r[k]) : String(r[k])}</td>)}{title === "Queue"&&<td className="px-4 py-3"><div className="flex flex-wrap gap-1">{[["call","Call"],["start-service","Start"],["complete","Complete"],["no-show","No-show"],["cancel","Cancel"]].map(([a,l])=><button key={a} onClick={()=>queueAction(r.id,a)} className="rounded-lg border px-2 py-1 text-xs font-semibold hover:bg-cyan-50">{l}</button>)}</div></td>}</tr>)}</tbody></table></div>}</section>
  </div>;
}
