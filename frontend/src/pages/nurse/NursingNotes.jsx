import React, { useCallback, useEffect, useState } from "react";
import { FileText, Plus, RefreshCw, Pencil, Trash2, X, Save } from "lucide-react";
import { getAssignedPatients, getNursingNotes, createNursingNote, updateNursingNote, deleteNursingNote } from "../../services/nurseWorkspaceApi";

const emptyForm = {
  patient_id: "",
  note_type: "general",
  subject: "",
  note: "",
};

const noteTypes = [
  "general",
  "assessment",
  "observation",
  "medication",
  "procedure",
  "handover",
  "follow_up",
];

export default function NursingNotes() {
  const [notes, setNotes] = useState([]);
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const records = await getNursingNotes();
      setNotes(records);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
        "Nursing notes load nahi hue. Account permissions check karein."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFormData = useCallback(async () => {
    try {
      const patientData = await getAssignedPatients();
      setPatients(patientData);
    } catch {
      setError("Patient list load nahi hui.");
    }

  }, []);

  useEffect(() => {
    loadNotes();
    loadFormData();
  }, [loadNotes, loadFormData]);

  const patientLabel = (patientId) => {
    const patient = patients.find((item) => Number(item.id) === Number(patientId));
    if (!patient) return `Patient #${patientId ?? "—"}`;
    const name =
      patient.full_name ||
      [patient.first_name, patient.last_name].filter(Boolean).join(" ") ||
      patient.name ||
      `Patient #${patient.id}`;
    return patient.patient_number ? `${name} (${patient.patient_number})` : name;
  };

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setError("");
    setShowForm(true);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      patient_id: String(item.patient_id),
      note_type: item.note_type || "general",
      subject: item.subject || "",
      note: item.note || "",
    });
    setMessage("");
    setError("");
    setShowForm(true);
  };

  const saveNote = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    setSaving(true);
    try {
      if (editingId) {
        await updateNursingNote(editingId, {
          note_type: form.note_type,
          subject: form.subject.trim() || null,
          note: form.note.trim(),
        });
        setMessage("Nursing note update ho gaya.");
      } else {
        await createNursingNote({
          patient_id: Number(form.patient_id),
          note_type: form.note_type,
          subject: form.subject.trim() || null,
          note: form.note.trim(),
        });
        setMessage("Nursing note save ho gaya.");
      }

      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      await loadNotes();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
            ? detail.map((item) => item.msg || "Invalid input").join(", ")
            : "Save/update failed. Backend permissions aur nurse profile endpoint check karein."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (item) => {
    if (!window.confirm(`Delete nursing note #${item.id}?`)) return;
    setError("");
    setMessage("");
    try {
      await deleteNursingNote(item.id);
      setMessage("Nursing note delete ho gaya.");
      await loadNotes();
    } catch (err) {
      setError(err?.response?.data?.detail || "Note delete nahi hua. Permission check karein.");
    }
  };

  return (
    <div className="nurse-lab-theme space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-teal-600">Nursing Workspace</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Nursing Notes</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Create and review clinical notes for patient care.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadNotes} type="button" className="inline-flex items-center gap-2 rounded-xl border border-cyan-300 bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-md transition hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 disabled:cursor-not-allowed disabled:opacity-60">
            <RefreshCw size={16} /> Refresh
          </button>
          <button onClick={startCreate} type="button" className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800">
            <Plus size={16} /> New note
          </button>
        </div>
      </div>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</div>}
      {message && <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800 dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-300">{message}</div>}

      {showForm && (
        <form onSubmit={saveNote} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">{editingId ? "Edit note" : "Create nursing note"}</h2>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close form"><X size={18} /></button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Patient *</label>
              <select
                value={form.patient_id}
                onChange={(event) => setForm({ ...form, patient_id: event.target.value })}
                required
                disabled={Boolean(editingId)}
                className="w-full rounded-xl border border-slate-200 bg-transparent p-3 text-sm dark:border-slate-700 dark:text-white"
              >
                <option value="">Select patient</option>
                {patients.map((patient) => <option key={patient.id} value={patient.id}>{patientLabel(patient.id)}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Note type *</label>
              <select
                value={form.note_type}
                onChange={(event) => setForm({ ...form, note_type: event.target.value })}
                required
                className="w-full rounded-xl border border-slate-200 bg-transparent p-3 text-sm dark:border-slate-700 dark:text-white"
              >
                {noteTypes.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Subject</label>
            <input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} maxLength={255} placeholder="Short note heading" className="w-full rounded-xl border border-slate-200 bg-transparent p-3 text-sm dark:border-slate-700 dark:text-white" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Clinical note *</label>
            <textarea value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} required minLength={1} rows={5} placeholder="Document observed facts, care delivered and relevant follow-up..." className="w-full rounded-xl border border-slate-200 bg-transparent p-3 text-sm dark:border-slate-700 dark:text-white" />
          </div>


          <button type="submit" disabled={saving || !form.patient_id || !form.note.trim()} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
            <Save size={16} /> {saving ? "Saving..." : editingId ? "Update note" : "Save note"}
          </button>
        </form>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <FileText className="text-teal-600" size={20} />
          <h2 className="font-semibold text-slate-900 dark:text-white">Saved notes</h2>
          <span className="ml-auto rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{notes.length}</span>
        </div>
        {loading ? <p className="p-6 text-sm text-slate-500">Loading notes...</p> :
          notes.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">No nursing notes returned by the API.</p> :
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {notes.map((item) => (
              <article key={item.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{item.subject || "Nursing note"}</h3>
                    <p className="mt-1 text-xs text-slate-500">{patientLabel(item.patient_id)} · {item.nurse_name || `Nurse #${item.nurse_id}`}{item.nurse_employee_id ? ` (${item.nurse_employee_id})` : ""}{item.nurse_department_name ? ` · ${item.nurse_department_name}` : ""} · {(item.note_type || "general").replaceAll("_", " ")}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => startEdit(item)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300" aria-label="Edit note"><Pencil size={16} /></button>
                    <button type="button" onClick={() => deleteNote(item)} className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 dark:border-red-900" aria-label="Delete note"><Trash2 size={16} /></button>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">{item.note}</p>
                <p className="mt-3 text-xs text-slate-400">{item.created_at ? new Date(item.created_at).toLocaleString() : ""}</p>
              </article>
            ))}
          </div>
        }
      </section>
    </div>
  );
}



