import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CalendarClock, RefreshCw, UserRound } from "lucide-react";
import api from "../../services/api";

const showDate = (value) => value ? new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" }) : "—";
const showTime = (value) => value ? value.slice(0, 5) : "—";
const errorMessage = (error) => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((item) => item?.msg || "Invalid request").join("; ");
  return error?.response?.data?.message || error?.message || "Unable to load this information.";
};

export default function StaffWorkspace({ mode = "availability" }) {
  const profileMode = mode === "profile";
  const [profile, setProfile] = useState(null);
  const [duties, setDuties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [profileResponse, dutyResponse] = await Promise.all([
        api.get("/staff/me"),
        api.get("/staff-duties/me"),
      ]);
      setProfile(profileResponse.data);
      setDuties(Array.isArray(dutyResponse.data) ? dutyResponse.data : []);
    } catch (e) {
      setError(errorMessage(e));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return <div className="space-y-6">
    <section className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">{profileMode ? <UserRound size={26}/> : <CalendarClock size={26}/>}</div>
        <div><p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Staff workspace</p><h2 className="text-2xl font-black text-slate-900">{profileMode ? "My Profile" : "Duty & Availability"}</h2><p className="mt-1 text-sm text-slate-500">{profileMode ? "Your linked hospital staff account." : "Your assigned shifts and duty times."}</p></div>
      </div>
      <button onClick={load} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-700 disabled:opacity-50"><RefreshCw size={17} className={loading ? "animate-spin" : ""}/> Refresh</button>
    </section>

    {error && <div role="alert" className="flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800"><AlertCircle className="shrink-0" size={20}/><div><strong>Request failed</strong><p className="mt-1 text-sm">{error}</p></div></div>}
    {loading && <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading your staff information…</div>}

    {!loading && profileMode && profile && <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:grid-cols-2 lg:grid-cols-3">
      {[["Full name", profile.full_name], ["Employee ID", profile.employee_id], ["Designation", profile.designation], ["Department", profile.department_name], ["Username", profile.username], ["Email", profile.email], ["Phone", profile.phone], ["Joining date", profile.joining_date], ["Availability", profile.is_available ? "Available" : "Unavailable"]].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 break-words font-semibold text-slate-900">{value || "Not provided"}</p></div>)}
    </section>}

    {!loading && !profileMode && <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5"><h3 className="text-lg font-black text-slate-900">My assigned shifts</h3><p className="mt-1 text-sm text-slate-500">{duties.length} shift(s) scheduled</p></div>
      {duties.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Date</th><th className="px-5 py-3">Shift</th><th className="px-5 py-3">Timing</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Notes</th></tr></thead><tbody className="divide-y divide-slate-100">{duties.map((duty) => <tr key={duty.id}><td className="whitespace-nowrap px-5 py-4 font-semibold">{showDate(duty.duty_date)}</td><td className="px-5 py-4"><span className="rounded-full bg-cyan-50 px-3 py-1 font-bold capitalize text-cyan-800">{duty.shift}</span></td><td className="whitespace-nowrap px-5 py-4">{showTime(duty.start_time)} – {showTime(duty.end_time)}{duty.shift === "night" ? " (+1 day)" : ""}</td><td className="px-5 py-4 capitalize">{duty.status}</td><td className="min-w-48 px-5 py-4 text-slate-500">{duty.notes || "—"}</td></tr>)}</tbody></table></div> : <div className="p-10 text-center"><CalendarClock className="mx-auto text-slate-300" size={32}/><h3 className="mt-3 font-bold text-slate-800">No duties assigned yet</h3><p className="mt-1 text-sm text-slate-500">Ask the administrator to generate the staff duty roster.</p></div>}
    </section>}
  </div>;
}
