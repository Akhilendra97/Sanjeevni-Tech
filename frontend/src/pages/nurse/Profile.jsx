import React, { useCallback, useEffect, useState } from "react";
import { UserRound, AlertCircle, RefreshCw } from "lucide-react";
import api from "../../services/api";

export default function NurseProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/nurses/me");
      setProfile(response.data);
    } catch (e) {
      setProfile(null);
      const detail = e?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Profile load nahi ho paayi. Login aur nurse profile linkage check karein.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const fields = [
    ["Full name", profile?.full_name || profile?.user?.full_name || profile?.user?.name],
    ["Username", profile?.username || profile?.user?.username],
    ["Email", profile?.email || profile?.user?.email],
    ["Phone", profile?.phone || profile?.user?.phone],
    ["Employee ID", profile?.employee_id],
    ["Registration number", profile?.nursing_registration_number],
    ["Qualification", profile?.qualification],
    ["Department", profile?.department_name || profile?.department?.name || profile?.department_id],
    ["Joining date", profile?.joining_date],
    ["Availability", profile ? (profile.is_available ? "Available" : "Unavailable") : ""],
  ];

  return <div className="nurse-lab-theme space-y-6 p-4 md:p-6">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-teal-600">Nursing Workspace</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Profile & Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your nurse account information.</p>
      </div>
      <button type="button" onClick={loadProfile} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-cyan-300 bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-md transition hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 disabled:cursor-not-allowed disabled:opacity-60">
        <RefreshCw size={16} className={loading ? "animate-spin" : ""}/> Refresh
      </button>
    </header>
    {error && <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"><AlertCircle size={18}/><span>{error}</span></div>}
    <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      {loading ? <p className="text-sm text-slate-500 dark:text-slate-400">Loading profile…</p> : profile ? <>
        <div className="mb-6 flex items-center gap-4">
          <span className="rounded-2xl bg-teal-50 p-4 text-teal-700 dark:bg-teal-950 dark:text-teal-300"><UserRound size={28}/></span>
          <div><h2 className="text-lg font-bold text-slate-900 dark:text-white">{profile.full_name || profile.user?.full_name || profile.user?.name || "Nurse profile"}</h2><p className="text-sm text-slate-500 dark:text-slate-400">Employee ID: {profile.employee_id || "—"}</p></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">{fields.map(([label, value]) => <div key={label} className="rounded-xl border border-slate-100 p-4 dark:border-slate-800"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p><p className="mt-1 break-words text-sm font-medium text-slate-900 dark:text-white">{value ?? "—"}</p></div>)}</div>
      </> : <p className="text-sm text-slate-500 dark:text-slate-400">Profile details unavailable.</p>}
    </section>
    <p className="text-xs text-slate-500 dark:text-slate-400">Profile is read-only. Account or employment changes must be handled by an authorized administrator.</p>
  </div>;
}
