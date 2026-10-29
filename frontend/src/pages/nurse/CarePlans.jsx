import React, { useCallback, useEffect, useState } from "react";
import { RefreshCw, ClipboardList, AlertCircle, Plus, X, Save } from "lucide-react";
import { getNurseCarePlans, getAssignedPatients, createNurseCarePlan } from "../../services/nurseWorkspaceApi";

const panel = "rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900";
const heading = "text-slate-900 dark:text-white";
const muted = "text-slate-500 dark:text-slate-400";
const fieldClass = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white";

const initialForm = {
  patient_id: "",
  care_plan_number: "",
  nursing_diagnosis: "",
  assessment: "",
  goals: "",
  interventions: "",
  expected_outcome: "",
  priority: "medium",
  start_date: new Date().toISOString().slice(0, 16),
  review_date: "",
  notes: "",
};

export default function CarePlans() {
  const [items, setItems] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [records, assignedPatients] = await Promise.all([
        getNurseCarePlans(),
        getAssignedPatients(),
      ]);
      setItems(Array.isArray(records) ? records : []);
      setPatients(Array.isArray(assignedPatients) ? assignedPatients : []);
    } catch (e) {
      setError(typeof e?.response?.data?.detail === "string"
        ? e.response.data.detail
        : "Care plans ya assigned patients load nahi ho paaye. API aur permissions check karein.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const savePlan = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!form.patient_id) {
      setError("Care plan banane se pehle assigned patient select karein.");
      return;
    }
    if (!form.care_plan_number.trim() || !form.nursing_diagnosis.trim()) {
      setError("Care plan number aur nursing diagnosis required hain.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        patient_id: Number(form.patient_id),
        care_plan_number: form.care_plan_number.trim(),
        nursing_diagnosis: form.nursing_diagnosis.trim(),
        assessment: form.assessment.trim() || null,
        goals: form.goals.trim() || null,
        interventions: form.interventions.trim() || null,
        expected_outcome: form.expected_outcome.trim() || null,
        priority: form.priority,
        status: "active",
        start_date: new Date(form.start_date).toISOString(),
        review_date: form.review_date ? new Date(form.review_date).toISOString() : null,
        notes: form.notes.trim() || null,
      };
      await createNurseCarePlan(payload);
      setMessage("Care plan successfully save ho gaya.");
      setForm(initialForm);
      setShowForm(false);
      await load();
    } catch (e) {
      const detail = e?.response?.data?.detail;
      setError(typeof detail === "string" ? detail :
        Array.isArray(detail) ? detail.map((x) => x.msg || "Invalid input").join(", ") :
        "Care plan save nahi hua. Check that your account has nursing.manage permission and the patient is assigned to you.");
    } finally {
      setSaving(false);
    }
  };

  const patientLabel = (id) => {
    const p = patients.find((x) => Number(x.id) === Number(id));
    if (!p) return `Patient #${id ?? "—"}`;
    const name = p.full_name || [p.first_name, p.last_name].filter(Boolean).join(" ") || p.name || `Patient #${p.id}`;
    return p.patient_number ? `${name} (${p.patient_number})` : name;
  };

  return <div className="nurse-lab-theme space-y-6 p-4 md:p-6">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-teal-600">Nursing Workspace</p>
        <h1 className={`mt-1 text-2xl font-bold ${heading}`}>Care Plans</h1>
        <p className={`mt-1 text-sm ${muted}`}>Create and review care plans for patients assigned to your nursing account.</p>
      </div>
      <div className="flex gap-2">
        <button onClick={load} disabled={loading || saving} className="inline-flex items-center gap-2 rounded-xl border border-cyan-300 bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-md transition hover:bg-cyan-300 disabled:opacity-60">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""}/> Refresh
        </button>
        <button onClick={() => { setError(""); setMessage(""); setForm(initialForm); setShowForm(true); }} disabled={!patients.length || saving} className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50">
          <Plus size={16}/> New care plan
        </button>
      </div>
    </header>

    {error && <div role="alert" className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"><AlertCircle size={18}/><span>{error}</span></div>}
    {message && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">{message}</div>}

    {showForm && <section className={`${panel} p-5`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div><h2 className={`text-lg font-semibold ${heading}`}>Create care plan</h2><p className={`text-sm ${muted}`}>Enter information from the patient's assessment and authorized care instructions.</p></div>
        <button type="button" onClick={() => setShowForm(false)} className={`rounded-lg p-2 ${muted}`} aria-label="Close form"><X size={18}/></button>
      </div>
      {patients.length === 0 ? <p className={muted}>No assigned patients available. Assign a patient before creating a care plan.</p> : <form onSubmit={savePlan} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className={`space-y-1 text-sm ${heading}`}>Assigned patient *
          <select name="patient_id" value={form.patient_id} onChange={updateField} required className={fieldClass}>
            <option value="">Select assigned patient</option>
            {patients.map((p) => <option key={p.id} value={p.id}>{patientLabel(p.id)}</option>)}
          </select>
        </label>
        <label className={`space-y-1 text-sm ${heading}`}>Care plan number *
          <input name="care_plan_number" value={form.care_plan_number} onChange={updateField} required maxLength={100} placeholder="e.g. CP-2026-001" className={fieldClass}/>
        </label>
        <label className={`space-y-1 text-sm ${heading} md:col-span-2`}>Nursing diagnosis *
          <textarea name="nursing_diagnosis" value={form.nursing_diagnosis} onChange={updateField} required rows={2} className={fieldClass} placeholder="Document the authorized nursing diagnosis"/>
        </label>
        <label className={`space-y-1 text-sm ${heading} md:col-span-2`}>Assessment
          <textarea name="assessment" value={form.assessment} onChange={updateField} rows={2} className={fieldClass} placeholder="Record actual assessment findings"/>
        </label>
        <label className={`space-y-1 text-sm ${heading}`}>Goals
          <textarea name="goals" value={form.goals} onChange={updateField} rows={2} className={fieldClass}/>
        </label>
        <label className={`space-y-1 text-sm ${heading}`}>Interventions
          <textarea name="interventions" value={form.interventions} onChange={updateField} rows={2} className={fieldClass}/>
        </label>
        <label className={`space-y-1 text-sm ${heading}`}>Expected outcome
          <textarea name="expected_outcome" value={form.expected_outcome} onChange={updateField} rows={2} className={fieldClass}/>
        </label>
        <label className={`space-y-1 text-sm ${heading}`}>Clinical notes
          <textarea name="notes" value={form.notes} onChange={updateField} rows={2} className={fieldClass}/>
        </label>
        <label className={`space-y-1 text-sm ${heading}`}>Priority
          <select name="priority" value={form.priority} onChange={updateField} className={fieldClass}>
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
          </select>
        </label>
        <label className={`space-y-1 text-sm ${heading}`}>Start date and time *
          <input type="datetime-local" name="start_date" value={form.start_date} onChange={updateField} required className={fieldClass}/>
        </label>
        <label className={`space-y-1 text-sm ${heading}`}>Review date
          <input type="datetime-local" name="review_date" value={form.review_date} onChange={updateField} className={fieldClass}/>
        </label>
        <div className="flex flex-wrap justify-end gap-2 md:col-span-2">
          <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold dark:border-slate-700">Cancel</button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"><Save size={16}/>{saving ? "Saving…" : "Save care plan"}</button>
        </div>
      </form>}
    </section>}

    <section className={`${panel} p-5`}>
      <div className="flex items-center gap-3">
        <span className="rounded-xl bg-teal-50 p-3 text-teal-700 dark:bg-teal-950 dark:text-teal-300"><ClipboardList size={22}/></span>
        <div><p className={`text-sm ${muted}`}>Care plans returned</p><p className={`text-2xl font-bold ${heading}`}>{loading ? "—" : items.length}</p></div>
      </div>
    </section>

    <section className={`${panel} overflow-hidden`}>
      <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800"><h2 className={`font-semibold ${heading}`}>Care plan records</h2></div>
      {loading ? <p className={`p-8 text-center text-sm ${muted}`}>Loading care plans…</p>
      : items.length === 0 ? <p className={`p-8 text-center text-sm ${muted}`}>No care plans saved yet. Use “New care plan” to record an authorized plan for an assigned patient.</p>
      : <div className="overflow-x-auto"><table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/70 dark:text-slate-300"><tr>
          <th className="px-4 py-3">Plan</th><th className="px-4 py-3">Patient</th><th className="px-4 py-3">Diagnosis</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Review date</th>
        </tr></thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{items.map((p) => <tr key={p.id}>
          <td className={`px-4 py-4 font-medium ${heading}`}>{p.care_plan_number || `Plan #${p.id}`}</td>
          <td className={`px-4 py-4 ${muted}`}>{p.patient_name || patientLabel(p.patient_id)}</td>
          <td className={`px-4 py-4 ${muted}`}>{p.nursing_diagnosis || "—"}</td>
          <td className={`px-4 py-4 ${muted}`}>{p.priority || "—"}</td>
          <td className={`px-4 py-4 ${heading}`}>{p.status || "—"}</td>
          <td className={`px-4 py-4 ${muted}`}>{p.review_date ? new Date(p.review_date).toLocaleString() : "Not scheduled"}</td>
        </tr>)}</tbody>
      </table></div>}
    </section>
    <p className={`text-xs ${muted}`}>Care plans are saved through the backend API and limited to patients assigned to the authenticated nurse. Enter only clinically verified information.</p>
  </div>;
}
