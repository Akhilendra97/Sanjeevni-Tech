import React, { useCallback, useEffect, useState } from "react";
import { Search, Users, RefreshCw, AlertCircle } from "lucide-react";
import { getAssignedPatients } from "../../services/nurseWorkspaceApi";

export default function AssignedPatients() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPatients = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getAssignedPatients(search);
      setPatients(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
        "Patients load nahi ho paaye. Login/session aur backend API check karo."
      );
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(loadPatients, 300);
    return () => clearTimeout(timer);
  }, [loadPatients]);

  const getPatientName = (patient) =>
    patient.full_name ||
    [patient.first_name, patient.last_name].filter(Boolean).join(" ") ||
    patient.name ||
    "Name unavailable";

  return (
    <div className="nurse-lab-theme space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-teal-600">Nursing Workspace</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            Patients
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Search and review patient records available to your nursing account.
          </p>
        </div>

        <button
          type="button"
          onClick={loadPatients}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-cyan-300 bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-md transition hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-teal-50 p-3 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
              <Users size={22} />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Records returned
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {loading ? "—" : patients.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Search patients
        </label>
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or supported patient details..."
            className="w-full rounded-xl border border-slate-200 bg-transparent py-3 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:text-white"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            Patient records
          </h2>
        </div>

        {loading ? (
          <p className="p-8 text-center text-sm text-slate-500">Loading patient records...</p>
        ) : patients.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            {error ? "Patient records are unavailable." : "No patient records found."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/60">
                <tr>
                  <th className="px-5 py-3 font-semibold">Patient</th>
                  <th className="px-5 py-3 font-semibold">Patient number</th>
                  <th className="px-5 py-3 font-semibold">Gender</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {patients.map((patient, index) => (
                  <tr key={patient.id ?? patient.patient_number ?? index}>
                    <td className="px-5 py-4 font-medium text-slate-900 dark:text-white">
                      {getPatientName(patient)}
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      {patient.patient_number || "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      {patient.gender || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                        {patient.status || (patient.is_active === false ? "Inactive" : "Registered")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Only patients with an active assignment to your authenticated nurse profile are shown.
      </p>
    </div>
  );
}


