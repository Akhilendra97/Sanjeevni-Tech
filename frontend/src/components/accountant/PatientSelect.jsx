import { useEffect, useState } from "react";
import { getPatients } from "../../services/patientApi";

function unwrapPatients(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.patients)) return data.patients;
  return [];
}

function displayName(patient) {
  const name = [
    patient?.first_name,
    patient?.middle_name,
    patient?.last_name,
  ].filter(Boolean).join(" ").trim();

  return name || patient?.full_name || patient?.name || `Patient #${patient?.id}`;
}

export default function PatientSelect({
  value,
  onChange,
  required = false,
  label = "Patient",
  className = "",
}) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    getPatients({ limit: 500, is_active: true })
      .then((data) => {
        if (!active) return;
        const list = unwrapPatients(data);
        setPatients(list);
        setLoadError("");
      })
      .catch(() => {
        if (active) setLoadError("Unable to load patients. Refresh and try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  const selectedExists = patients.some((patient) => String(patient.id) === String(value));

  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      <select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        disabled={loading}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 disabled:cursor-wait disabled:bg-slate-50"
      >
        <option value="">{loading ? "Loading patients..." : "Select patient by name"}</option>
        {!selectedExists && value !== "" && value != null && (
          <option value={String(value)}>Patient #{value} (current record)</option>
        )}
        {patients.map((patient) => (
          <option key={patient.id} value={String(patient.id)}>
            {displayName(patient)} · ID #{patient.id}{patient.patient_number ? ` · ${patient.patient_number}` : ""}
          </option>
        ))}
      </select>
      {loadError && <span className="mt-1 block text-xs text-rose-600">{loadError}</span>}
    </label>
  );
}
