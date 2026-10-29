import DocumentPdfActions from "../../components/pdf/DocumentPdfActions";
import React, { useCallback, useEffect, useState } from "react";
import { RefreshCw, Search, FileCheck2, ListOrdered, AlertCircle } from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1";
function token() { return localStorage.getItem("access_token") || localStorage.getItem("token") || ""; }
async function api(path) {
  const r = await fetch(`${API}${path}`, { headers: { Accept: "application/json", Authorization: `Bearer ${token()}` } });
  if (!r.ok) throw new Error(`API request failed (${r.status})`);
  const d = await r.json(); return d?.data || d?.items || d?.results || d;
}
function Page({ kind }) {
  const discharge = kind === "discharges";
  const [rows,setRows]=useState([]), [patients,setPatients]=useState({}), [doctors,setDoctors]=useState({}), [admissions,setAdmissions]=useState({});
  const [loading,setLoading]=useState(true), [error,setError]=useState(""), [query,setQuery]=useState("");
  const load=useCallback(async()=>{
    setLoading(true); setError("");
    try {
      const [records, pats, docs, ads] = await Promise.all([
        api(discharge?"/discharges":"/queues"),
        api("/patients?is_active=true&skip=0&limit=500").catch(()=>[]),
        api("/doctors?skip=0&limit=500").catch(()=>[]),
        discharge?api("/admissions?skip=0&limit=500").catch(()=>[]):Promise.resolve([])
      ]);
      const list=x=>Array.isArray(x)?x:(x?.items||x?.patients||x?.results||x?.data||[]);
      const pmap={}; list(pats).forEach(p=>pmap[p.id]=p);
      const dmap={}; list(docs).forEach(d=>dmap[d.id]=d);
      const amap={}; list(ads).forEach(a=>amap[a.id]=a);
      setRows(list(records)); setPatients(pmap); setDoctors(dmap); setAdmissions(amap);
    } catch(e) { setError(e.message || "Records load nahi ho sake."); }
    finally { setLoading(false); }
  },[discharge]);
  useEffect(()=>{load()},[load]);
  const filtered=rows.filter(r=>JSON.stringify(r).toLowerCase().includes(query.toLowerCase()) ||
    (patients[r.patient_id]?.first_name||"").toLowerCase().includes(query.toLowerCase()) ||
    (patients[r.patient_id]?.last_name||"").toLowerCase().includes(query.toLowerCase()));
  const name=id=>{const p=patients[id];return p?[p.first_name,p.middle_name,p.last_name].filter(Boolean).join(" "):`Patient #${id}`};
  return <div className="min-h-full bg-slate-50 px-5 py-6 md:px-8"><div className="mx-auto max-w-7xl space-y-6">
    <section className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:flex-row md:items-center">
      <div className="flex items-center gap-4"><div className="rounded-2xl bg-cyan-50 p-4 text-cyan-700">{discharge?<FileCheck2 size={28}/>:<ListOrdered size={28}/>}</div><div><p className="text-xs font-bold uppercase tracking-[.22em] text-cyan-700">Receptionist Workspace</p><h1 className="mt-1 text-3xl font-bold text-slate-900">{discharge?"Discharges":"Queue"}</h1><p className="mt-1 text-sm text-slate-500">{discharge?"Review patient discharge records and admission links.":"Monitor patient queue and service status."}</p></div></div>
      <button onClick={load} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 hover:border-cyan-300 disabled:opacity-60"><RefreshCw size={17} className={loading?"animate-spin":""}/> Refresh</button>
    </section>
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between"><div><h2 className="font-bold text-slate-900">{discharge?"Discharge records":"Queue records"}</h2><p className="mt-1 text-sm text-slate-500">{loading?"Loading…":`${filtered.length} record(s) shown`}</p></div><div className="relative w-full md:max-w-sm"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search records, patient, status…" className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"/></div></div>
      {error&&<div className="m-5 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><AlertCircle size={18}/>{error} — confirm backend is running and API route is registered.</div>}
      {loading?<div className="p-16 text-center text-slate-500">Loading records…</div>:filtered.length===0?<div className="p-16 text-center"><div className="mx-auto mb-4 w-fit rounded-2xl bg-slate-100 p-4 text-slate-400">{discharge?<FileCheck2 size={28}/>:<ListOrdered size={28}/>}</div><h3 className="font-bold text-slate-800">{error?"Unable to load records":"No records found"}</h3><p className="mt-2 text-sm text-slate-500">{error?"Resolve the API error and refresh.":"Records will appear here when valid records exist in the database."}</p></div>:
      <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{(discharge?["Discharge","Patient","Admission","Doctor","Date","Type","Condition"]:["Queue","Patient","Token","Department","Doctor","Type","Checked in","Status"]).map(x=><th key={x} className="px-5 py-4">{x}</th>)}{discharge && <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Document</th>}</tr></thead><tbody className="divide-y divide-slate-100">{filtered.map(r=><tr key={r.id} className="hover:bg-slate-50/70">{discharge?<><td className="px-5 py-4 font-semibold text-slate-900">{r.discharge_number}</td><td className="px-5 py-4">{name(r.patient_id)}</td><td className="px-5 py-4">{admissions[r.admission_id]?.admission_number||`#${r.admission_id}`}</td><td className="px-5 py-4">{doctors[r.doctor_id]?.full_name||`Doctor #${r.doctor_id}`}</td><td className="px-5 py-4">{r.discharge_date||"—"}</td><td className="px-5 py-4 capitalize">{r.discharge_type||"—"}</td><td className="px-5 py-4">{r.condition_at_discharge||"—"}</td><td className="px-5 py-4"><DocumentPdfActions title={`Discharge Summary ${r.discharge_number || r.id}`} record={{ discharge_number: r.discharge_number, patient: name(r.patient_id), patient_id: r.patient_id, admission_number: admissions[r.admission_id]?.admission_number, doctor: doctors[r.doctor_id]?.full_name, discharge_date: r.discharge_date, discharge_type: r.discharge_type, condition_at_discharge: r.condition_at_discharge, status: r.status, instructions: r.instructions, notes: r.notes }} /></td></>:<><td className="px-5 py-4 font-semibold">{r.queue_number}</td><td className="px-5 py-4">{name(r.patient_id)}</td><td className="px-5 py-4">#{r.token_number}</td><td className="px-5 py-4">{r.department?.name||`Department #${r.department_id}`}</td><td className="px-5 py-4">{doctors[r.doctor_id]?.full_name|| (r.doctor_id?`Doctor #${r.doctor_id}`:"Unassigned")}</td><td className="px-5 py-4 capitalize">{r.queue_type}</td><td className="px-5 py-4">{r.check_in_time?new Date(r.check_in_time).toLocaleString():"—"}</td><td className="px-5 py-4"><span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold capitalize text-cyan-800">{(r.status||"unknown").replace("_"," ")}</span></td></>}</tr>)}</tbody></table></div>}
    </section>
  </div></div>;
}
export default function Discharges(){ return <Page kind="discharges" />; }
