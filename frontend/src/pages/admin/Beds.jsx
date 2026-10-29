import { useCallback, useEffect, useMemo, useState } from "react";
import { BedDouble, RefreshCw, Search, CheckCircle2, Users, AlertTriangle } from "lucide-react";
import axios from "axios";

const API = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1";
const api = axios.create({ baseURL: API, headers: { "Content-Type": "application/json" } });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
const STATUSES = ["available", "occupied", "reserved", "cleaning", "maintenance", "out_of_service"];
const cls = "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800";
function message(error) {
  const d = error?.response?.data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map(x => x?.msg || String(x)).join(", ");
  return error?.response?.data?.message || error?.message || "Request failed.";
}
export default function Beds() {
  const [beds, setBeds] = useState([]);
  const [wards, setWards] = useState([]);
  const [search, setSearch] = useState("");
  const [wardFilter, setWardFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setBusy(true); setError("");
    try {
      const [b, w] = await Promise.all([api.get("/beds"), api.get("/wards")]);
      setBeds(Array.isArray(b.data) ? b.data : []);
      setWards(Array.isArray(w.data) ? w.data : []);
    } catch (e) { setError(message(e)); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => beds.filter(b => {
    const ward = wards.find(w => w.id === b.ward_id);
    const q = search.toLowerCase();
    return (wardFilter === "all" || String(b.ward_id) === wardFilter) &&
      (statusFilter === "all" || b.status === statusFilter) &&
      [b.bed_number, b.bed_type, ward?.name, ward?.code].some(v => String(v || "").toLowerCase().includes(q));
  }), [beds, wards, search, wardFilter, statusFilter]);

  const counts = useMemo(() => ({
    total: beds.filter(b => b.is_active).length,
    available: beds.filter(b => b.is_active && b.status === "available").length,
    occupied: beds.filter(b => b.is_active && b.status === "occupied").length,
    other: beds.filter(b => b.is_active && !["available", "occupied"].includes(b.status)).length,
  }), [beds]);

  async function save() {
    if (!editing) return;
    setSaving(true); setError(""); setNotice("");
    try {
      await api.patch(`/beds/${editing.id}`, {
        ward_id: Number(editing.ward_id), bed_number: editing.bed_number,
        bed_type: editing.bed_type, status: editing.status,
        is_active: editing.is_active, notes: editing.notes || null,
      });
      setEditing(null);
      setNotice("Bed updated successfully.");
      await load();
    } catch (e) { setError(message(e)); }
    finally { setSaving(false); }
  }

  const card = (label, value, icon) => <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between text-slate-500"><span className="text-sm">{label}</span>{icon}</div><div className="mt-2 text-2xl font-bold text-slate-900">{value}</div></div>;

  return <div className="min-h-screen bg-slate-50 p-4 md:p-7 text-slate-900">
    <div className="mx-auto max-w-[1500px] space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3"><div className="rounded-xl bg-cyan-50 p-3 text-cyan-700"><BedDouble size={24}/></div><div><p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-700">Hospital operations</p><h1 className="text-2xl font-black">Beds & Occupancy</h1><p className="text-sm text-slate-500">Review bed inventory, occupancy and operational status.</p></div></div>
        <button onClick={load} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 font-semibold hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={16}/>{busy ? "Refreshing…" : "Refresh"}</button>
      </header>
      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">{notice}</div>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {card("Active beds", counts.total, <BedDouble size={18}/>)}
        {card("Available", counts.available, <CheckCircle2 size={18} className="text-emerald-600"/> )}
        {card("Occupied", counts.occupied, <Users size={18} className="text-amber-600"/> )}
        {card("Other / unavailable", counts.other, <AlertTriangle size={18} className="text-rose-600"/> )}
      </div>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap gap-3 border-b border-slate-100 p-4">
          <label className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-3 text-slate-400" size={17}/><input className={`${cls} w-full pl-9`} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search bed, ward or type"/></label>
          <select className={cls} value={wardFilter} onChange={e=>setWardFilter(e.target.value)}><option value="all">All wards</option>{wards.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select>
          <select className={cls} value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="all">All statuses</option>{STATUSES.map(s=><option key={s} value={s}>{s.replaceAll("_"," ")}</option>)}</select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr>{["Bed","Ward","Type","Status","Active","Notes","Action"].map(x=><th key={x} className="px-4 py-3">{x}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">{filtered.map(b=><tr key={b.id} className="hover:bg-slate-50/70">
              <td className="px-4 py-3 font-bold">{b.bed_number}</td><td className="px-4 py-3">{wards.find(w=>w.id===b.ward_id)?.name || `Ward #${b.ward_id}`}</td><td className="px-4 py-3">{b.bed_type}</td>
              <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${b.status==="occupied"?"bg-amber-100 text-amber-800":b.status==="available"?"bg-emerald-100 text-emerald-800":"bg-slate-100 text-slate-700"}`}>{String(b.status).replaceAll("_"," ")}</span></td>
              <td className="px-4 py-3">{b.is_active ? "Yes" : "No"}</td><td className="max-w-[220px] truncate px-4 py-3 text-slate-500" title={b.notes || ""}>{b.notes || "—"}</td>
              <td className="px-4 py-3"><button onClick={()=>{setError("");setNotice("");setEditing({...b});}} className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold hover:bg-slate-100">Edit</button></td>
            </tr>)}
            {!filtered.length && <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">{busy ? "Loading beds…" : "No beds match the selected filters."}</td></tr>}</tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-4 py-3 text-sm text-slate-500">Showing {filtered.length} of {beds.length} beds</div>
      </section>
    </div>
    {editing && <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={e=>{if(e.target===e.currentTarget)setEditing(null);}}>
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between"><div><h2 className="text-xl font-black">Edit bed {editing.bed_number}</h2><p className="text-sm text-slate-500">Changes are saved to the backend.</p></div><button onClick={()=>setEditing(null)} className="rounded-lg px-3 py-1 hover:bg-slate-100">✕</button></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">Ward<select className={`${cls} mt-1 w-full`} value={editing.ward_id} onChange={e=>setEditing({...editing,ward_id:e.target.value})}>{wards.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></label>
          <label className="text-sm font-semibold">Bed number<input className={`${cls} mt-1 w-full`} value={editing.bed_number} onChange={e=>setEditing({...editing,bed_number:e.target.value})}/></label>
          <label className="text-sm font-semibold">Bed type<input className={`${cls} mt-1 w-full`} value={editing.bed_type} onChange={e=>setEditing({...editing,bed_type:e.target.value})}/></label>
          <label className="text-sm font-semibold">Status<select className={`${cls} mt-1 w-full`} value={editing.status} onChange={e=>setEditing({...editing,status:e.target.value})}>{STATUSES.map(s=><option key={s} value={s}>{s.replaceAll("_"," ")}</option>)}</select></label>
          <label className="text-sm font-semibold sm:col-span-2">Notes<textarea className={`${cls} mt-1 w-full`} rows={3} value={editing.notes || ""} onChange={e=>setEditing({...editing,notes:e.target.value})}/></label>
          <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2"><input type="checkbox" checked={Boolean(editing.is_active)} onChange={e=>setEditing({...editing,is_active:e.target.checked})}/> Active bed</label>
        </div>
        <div className="mt-6 flex justify-end gap-3"><button onClick={()=>setEditing(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 font-semibold">Cancel</button><button onClick={save} disabled={saving} className="rounded-xl bg-slate-900 px-5 py-2.5 font-semibold text-white disabled:opacity-50">{saving?"Saving…":"Save changes"}</button></div>
      </div>
    </div>}
  </div>;
}
