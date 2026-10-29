import React, { useCallback, useEffect, useState } from "react";
import { Activity, RefreshCw, Save, AlertCircle } from "lucide-react";
import api from "../../services/api";
import { getAssignedPatients } from "../../services/nurseWorkspaceApi";

const initialForm = {
  patient_id: "",
  temperature: "",
  heart_rate: "",
  respiratory_rate: "",
  systolic_bp: "",
  diastolic_bp: "",
  oxygen_saturation: "",
  blood_glucose: "",
  weight: "",
  height: "",
  notes: "",
};

const fields = [
  { name: "temperature", label: "Temperature (°C)", placeholder: "e.g. 36.8", step: "0.1" },
  { name: "heart_rate", label: "Heart rate (bpm)", placeholder: "e.g. 78", step: "1" },
  { name: "respiratory_rate", label: "Respiratory rate (/min)", placeholder: "e.g. 16", step: "1" },
  { name: "systolic_bp", label: "Systolic BP (mmHg)", placeholder: "e.g. 120", step: "1" },
  { name: "diastolic_bp", label: "Diastolic BP (mmHg)", placeholder: "e.g. 80", step: "1" },
  { name: "oxygen_saturation", label: "Oxygen saturation (%)", placeholder: "e.g. 98", step: "0.1" },
  { name: "blood_glucose", label: "Blood glucose", placeholder: "Enter measured value", step: "0.1" },
  { name: "weight", label: "Weight (kg)", placeholder: "e.g. 65", step: "0.1" },
  { name: "height", label: "Height (cm)", placeholder: "e.g. 170", step: "0.1" },
];

export default function Vitals() {
  const [patients, setPatients] = useState([]);
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadPatients = useCallback(async () => {
    try {
      const data = await getAssignedPatients();
      setPatients(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.detail || "Patient list load nahi hui.");
    }
  }, []);

  const loadVitals = useCallback(async (patientId) => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/vitals", {
        params: patientId ? { patient_id: patientId } : {},
      });
      const data = response.data;
      setRecords(Array.isArray(data) ? data : data?.items || []);
    } catch (err) {
      setRecords([]);
      setError(
        err?.response?.data?.detail ||
        "Vitals load nahi hue. Vitals API permission ya backend route check karein."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPatients();
    loadVitals("");
  }, [loadPatients, loadVitals]);

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submitVitals = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!form.patient_id) {
      setError("Vitals record karne se pehle patient select karein.");
      return;
    }

    const payload = { patient_id: Number(form.patient_id) };

    for (const field of fields) {
      if (form[field.name] !== "") {
        payload[field.name] = Number(form[field.name]);
      }
    }

    if (form.notes.trim()) payload.notes = form.notes.trim();

    setSaving(true);
    try {
      await api.post("/vitals", payload);
      setNotice("Vitals successfully save ho gaye.");
      setForm(initialForm);
      await loadVitals("");
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
            ? detail.map((item) => item.msg || "Invalid input").join(", ")
            : "Vitals save nahi hue. Form values aur account permissions check karein."
      );
    } finally {
      setSaving(false);
    }
  };

  const patientName = (id) => {
    const patient = patients.find((item) => Number(item.id) === Number(id));
    return patient
      ? patient.full_name ||
        [patient.first_name, patient.last_name].filter(Boolean).join(" ") ||
        patient.name ||
        `Patient #${id}`
      : `Patient #${id ?? "—"}`;
  };

  return (
    <div className="nurse-lab-theme space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-teal-600">Nursing Workspace</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Patient Vitals</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Record measured observations and review saved vital records.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadVitals("")}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-cyan-300 bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-md transition hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {error && (
        <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          <AlertCircle size={18} className="shrink-0" /> {error}
        </div>
      )}
      {notice && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800 dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-300">
          {notice}
        </div>
      )}

      <form onSubmit={submitVitals} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-teal-50 p-3 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
            <Activity size={22} />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">Record new vitals</h2>
            <p className="text-xs text-slate-500">Enter only measurements actually taken.</p>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Patient *</label>
          <select
            name="patient_id"
            value={form.patient_id}
            onChange={updateField}
            required
            className="w-full rounded-xl border border-slate-200 bg-transparent p-3 text-sm dark:border-slate-700 dark:text-white"
          >
            <option value="">Select patient</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.full_name || [patient.first_name, patient.last_name].filter(Boolean).join(" ") || patient.name || `Patient #${patient.id}`}
                {patient.patient_number ? ` — ${patient.patient_number}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map((field) => (
            <div key={field.name}>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{field.label}</label>
              <input
                type="number"
                name={field.name}
                value={form[field.name]}
                onChange={updateField}
                min="0"
                step={field.step}
                placeholder={field.placeholder}
                className="w-full rounded-xl border border-slate-200 bg-transparent p-3 text-sm text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:text-white"
              />
            </div>
          ))}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Clinical notes</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={updateField}
            rows={3}
            placeholder="Enter relevant observations..."
            className="w-full rounded-xl border border-slate-200 bg-transparent p-3 text-sm text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:text-white"
          />
        </div>

        <button
          type="submit"
          disabled={saving || patients.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={17} /> {saving ? "Saving..." : "Save vitals"}
        </button>
      </form>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-white">Saved vital records</h2>
        </div>
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Loading records...</p>
        ) : records.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No vital records returned by the API.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/60">
                <tr>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Temp.</th>
                  <th className="px-4 py-3">Heart rate</th>
                  <th className="px-4 py-3">BP</th>
                  <th className="px-4 py-3">SpO₂</th>
                  <th className="px-4 py-3">Recorded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {records.map((record, index) => (
                  <tr key={record.id ?? index}>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{patientName(record.patient_id)}</td>
                    <td className="px-4 py-3">{record.temperature ?? "—"}</td>
                    <td className="px-4 py-3">{record.heart_rate ?? "—"}</td>
                    <td className="px-4 py-3">
                      {record.systolic_bp != null || record.diastolic_bp != null
                        ? `${record.systolic_bp ?? "—"}/${record.diastolic_bp ?? "—"}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">{record.oxygen_saturation ?? "—"}</td>
                    <td className="px-4 py-3">{record.recorded_at ? new Date(record.recorded_at).toLocaleString() : record.created_at ? new Date(record.created_at).toLocaleString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}



