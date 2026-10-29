import React, { useCallback, useEffect, useState } from "react";
import { RefreshCw, Pill, AlertCircle } from "lucide-react";
import { getMedicationSchedule } from "../../services/nurseWorkspaceApi";

export default function MedicationSchedule() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const records = await getMedicationSchedule();
      setItems(records);
    } catch (e) {
      setError(typeof e?.response?.data?.detail === "string"
        ? e.response.data.detail
        : "Prescription schedule load nahi ho paaya. Backend endpoint aur account permissions verify karein.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return <div className="nurse-lab-theme space-y-6 p-4 md:p-6">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-sm font-semibold text-teal-600">Nursing Workspace</p><h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Medication Schedule</h1><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Review prescription records available to your account.</p></div>
      <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-cyan-300 bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-md transition hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"><RefreshCw size={16} className={loading ? "animate-spin" : ""}/> Refresh</button>
    </header>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center gap-3"><span className="rounded-xl bg-teal-50 p-3 text-teal-700 dark:bg-teal-950 dark:text-teal-300"><Pill size={22}/></span><div><p className="text-sm text-slate-500 dark:text-slate-400">Prescription records</p><p className="text-2xl font-bold text-slate-900 dark:text-white">{loading ? "—" : items.length}</p></div></div></section>
    {error && <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"><AlertCircle size={18}/>{error}</div>}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800"><h2 className="font-semibold text-slate-900 dark:text-white">Available prescriptions</h2></div>
      {loading ? <p className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading prescriptions…</p> : items.length === 0 ? <p className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">No prescription records returned.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/70 dark:text-slate-300"><tr><th className="px-4 py-3">Prescription</th><th className="px-4 py-3">Patient</th><th className="px-4 py-3">Prescribed medicines</th><th className="px-4 py-3">Instructions</th><th className="px-4 py-3">Duration</th><th className="px-4 py-3">Date</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{items.map((p,i)=><tr key={p.id ?? i}><td className="px-4 py-4 font-medium text-slate-900 dark:text-white">{p.prescription_number || p.medicine_name || p.title || (p.id ? `Prescription #${p.id}` : "Prescription")}</td><td className="px-4 py-4 text-slate-600 dark:text-slate-300">{p.patient_name || p.patient?.full_name || p.patient_id || "—"}</td><td className="px-4 py-4 text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{p.medicines || "—"}</td><td className="px-4 py-4 text-slate-600 dark:text-slate-300">{p.instructions || p.diagnosis || "—"}</td><td className="px-4 py-4 text-slate-600 dark:text-slate-300">{p.duration || "—"}</td><td className="px-4 py-4 text-slate-600 dark:text-slate-300">{p.prescription_date ? new Date(p.prescription_date).toLocaleDateString() : "—"}</td></tr>)}</tbody></table></div>}
    </section>
    <p className="text-xs text-slate-500 dark:text-slate-400">Read-only view. Medication administration or schedule changes are not performed from this page.</p>
  </div>;
}



