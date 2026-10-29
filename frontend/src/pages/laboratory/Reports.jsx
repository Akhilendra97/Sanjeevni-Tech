import DocumentPdfActions from "../../components/pdf/DocumentPdfActions";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, AlertCircle, CheckCircle2, Clock3, Eye, FileText,
  FlaskConical, Loader2, Pencil, RefreshCw, Search, Trash2, X,
} from "lucide-react";
import {
  getLabReports,
  updateLabReport,
  deleteLabReport,
  getLaboratoryErrorMessage,
} from "../../services/laboratoryApi";

const STATUS_OPTIONS = ["completed", "pending", "processing", "cancelled"];

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}
function statusClass(status) {
  const value = String(status || "").toLowerCase();
  if (value === "completed") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (value === "pending") return "bg-amber-50 text-amber-700 ring-amber-200";
  if (value === "processing") return "bg-sky-50 text-sky-700 ring-sky-200";
  if (value === "cancelled") return "bg-rose-50 text-rose-700 ring-rose-200";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}
function field(record, ...keys) {
  for (const key of keys) if (record?.[key] !== undefined && record?.[key] !== null && record?.[key] !== "") return record[key];
  return "—";
}

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadReports = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const response = await getLabReports();
      const rows = Array.isArray(response) ? response : (response?.items || response?.results || response?.reports || []);
      setReports(rows);
    } catch (err) {
      setError(getLaboratoryErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadReports(); }, [loadReports]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return reports.filter((report) => {
      const matchesSearch = !query || [
        report.report_number, report.sample_id, report.sample_number,
        report.patient_name, report.patient_number, report.test_name, report.test_code,
        report.result, report.interpretation, report.status, report.remarks, report.id,
      ].some((value) => String(value ?? "").toLowerCase().includes(query));
      const matchesStatus = statusFilter === "all" || String(report.status || "").toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [reports, search, statusFilter]);

  const stats = useMemo(() => ({
    total: reports.length,
    completed: reports.filter((r) => String(r.status || "").toLowerCase() === "completed").length,
    pending: reports.filter((r) => ["pending", "processing"].includes(String(r.status || "").toLowerCase())).length,
  }), [reports]);

  async function saveEdit(event) {
    event.preventDefault();
    if (!editing) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const payload = {
        report_number: editing.report_number,
        result: editing.result,
        interpretation: editing.interpretation || null,
        status: editing.status,
        remarks: editing.remarks || null,
      };
      await updateLabReport(editing.id, payload);
      setEditing(null);
      setNotice("Report updated successfully.");
      await loadReports(true);
    } catch (err) {
      setError(getLaboratoryErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function removeReport(report) {
    const label = report.report_number || `Report #${report.id}`;
    if (!window.confirm(`Delete ${label}? This permanently removes this laboratory report.`)) return;
    setDeletingId(report.id); setError(""); setNotice("");
    try {
      await deleteLabReport(report.id);
      setReports((current) => current.filter((item) => item.id !== report.id));
      if (selected?.id === report.id) setSelected(null);
      setNotice(`${label} deleted.`);
    } catch (err) {
      setError(getLaboratoryErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-full space-y-6 bg-slate-50/70 p-4 sm:p-6 xl:p-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
              <FlaskConical size={27} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-700">Laboratory workspace</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Laboratory Reports</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Review test reports, inspect result details and manage report status.</p>
            </div>
          </div>
          <button onClick={() => loadReports(true)} disabled={refreshing} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60">
            {refreshing ? <Loader2 size={17} className="animate-spin" /> : <RefreshCw size={17} />}
            Refresh records
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Total reports", value: stats.total, icon: FileText, tint: "bg-cyan-50 text-cyan-700" },
          { label: "Completed", value: stats.completed, icon: CheckCircle2, tint: "bg-emerald-50 text-emerald-700" },
          { label: "Pending / processing", value: stats.pending, icon: Clock3, tint: "bg-amber-50 text-amber-700" },
        ].map(({ label, value, icon: Icon, tint }) => (
          <div key={label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p></div>
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tint}`}><Icon size={22} /></div>
          </div>
        ))}
      </section>

      {error && <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertCircle size={19} className="mt-0.5 shrink-0" /><span>{error}</span><button onClick={() => setError("")} className="ml-auto"><X size={17} /></button></div>}
      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{notice}</div>}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div><h2 className="text-lg font-bold text-slate-900">Report records</h2><p className="mt-1 text-sm text-slate-500">{filtered.length} of {reports.length} reports shown</p></div>
          <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-2xl">
            <label className="relative min-w-0 flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search report, sample, result..." className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10" />
            </label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10">
              <option value="all">All statuses</option>
              {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1450px] table-fixed text-left">
            <colgroup><col className="w-[15%]" /><col className="w-[13%]" /><col className="w-[12%]" /><col className="w-[15%]" /><col className="w-[17%]" /><col className="w-[10%]" /><col className="w-[8%]" /><col className="w-[10%]" /></colgroup>
            <thead className="bg-slate-50">
              <tr className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {["Report number", "Patient", "Patient number", "Test", "Result / interpretation", "Status", "Reported at", "Actions"].map((heading) => <th key={heading} className="px-4 py-4">{heading}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? <tr><td colSpan={8} className="px-6 py-16 text-center text-sm text-slate-500"><Loader2 size={22} className="mx-auto mb-3 animate-spin text-cyan-600" />Loading laboratory reports…</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={8} className="px-6 py-16 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><FileText size={23} /></div><p className="mt-4 font-semibold text-slate-800">No reports found</p><p className="mt-1 text-sm text-slate-500">{reports.length ? "Try a different search or status filter." : "Reports will appear here when available from the hospital API."}</p></td></tr>
              : filtered.map((report) => (
                <tr key={report.id} className="align-middle transition hover:bg-slate-50/80">
                  <td className="px-4 py-4"><div className="break-words font-semibold leading-5 text-slate-900">{field(report, "report_number")}</div><div className="mt-1 text-xs text-slate-400">ID #{report.id}</div></td>
                  <td className="px-4 py-4"><div className="break-words font-semibold text-slate-900">{field(report, "patient_name")}</div><div className="mt-1 text-xs text-slate-500">Sample {field(report, "sample_number", "sample_id")}</div></td>
                  <td className="px-4 py-4"><span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1.5 text-sm font-semibold text-slate-700">{field(report, "patient_number")}</span></td>
                  <td className="px-4 py-4"><div className="break-words font-medium text-slate-800">{field(report, "test_name")}</div><div className="mt-1 text-xs text-slate-500">{field(report, "test_code")}</div></td>
                  <td className="px-4 py-4"><p className="line-clamp-3 break-words text-sm leading-5 text-slate-700" title={`${report.result || ""} ${report.interpretation || ""}`}><span className="font-medium">{field(report, "result")}</span><span className="mt-1 block text-slate-500">{field(report, "interpretation")}</span></p></td>
                  <td className="px-4 py-4"><span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-bold capitalize ring-1 ring-inset ${statusClass(report.status)}`}>{field(report, "status")}</span></td>
                  <td className="px-4 py-4 text-sm leading-5 text-slate-600">{formatDate(report.reported_at)}</td>
                  <td className="px-4 py-4"><div className="flex flex-wrap items-center gap-1.5">
                    <DocumentPdfActions title={`Laboratory Report ${report.report_number || report.id}`} record={{ report_number: report.report_number, patient_name: report.patient_name, patient_number: report.patient_number, sample_number: report.sample_number, sample_id: report.sample_id, test_name: report.test_name, test_code: report.test_code, result: report.result, interpretation: report.interpretation, status: report.status, reported_at: report.reported_at, remarks: report.remarks }} />
                    <button title="View report" aria-label={`View ${report.report_number}`} onClick={() => setSelected(report)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"><Eye size={16} /></button>
                    <button title="Edit report" aria-label={`Edit ${report.report_number}`} onClick={() => setEditing({ id: report.id, report_number: report.report_number || "", result: report.result || "", interpretation: report.interpretation || "", status: report.status || "completed", remarks: report.remarks || "" })} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"><Pencil size={16} /></button>
                    <button title="Delete report" aria-label={`Delete ${report.report_number}`} disabled={deletingId === report.id} onClick={() => removeReport(report)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50">{deletingId === report.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span>Laboratory report management</span><span className="inline-flex items-center gap-1.5"><Activity size={14} /> Data loaded from the hospital API</span></div>
      </section>

      {selected && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
        <div role="dialog" aria-modal="true" aria-labelledby="report-detail-title" className="my-auto w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
          <div className="flex items-start justify-between border-b border-slate-100 p-5 sm:p-6"><div><p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Report details</p><h3 id="report-detail-title" className="mt-1 break-words text-xl font-bold text-slate-900">{selected.report_number}</h3></div><button onClick={() => setSelected(null)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button></div>
          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
            {[["Patient", selected.patient_name], ["Patient number", selected.patient_number], ["Test", selected.test_name], ["Sample number", selected.sample_number], ["Sample ID", selected.sample_id], ["Status", selected.status], ["Reported at", formatDate(selected.reported_at)], ["Record ID", selected.id], ["Result", selected.result], ["Interpretation", selected.interpretation], ["Remarks", selected.remarks]].map(([label, value]) => <div key={label} className="min-w-0 rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 break-words text-sm leading-6 text-slate-800">{value || "—"}</p></div>)}
          </div>
          <div className="flex justify-end border-t border-slate-100 p-5"><button onClick={() => setSelected(null)} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Close</button></div>
        </div>
      </div>}

      {editing && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) setEditing(null); }}>
        <form onSubmit={saveEdit} role="dialog" aria-modal="true" aria-labelledby="report-edit-title" className="my-auto w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
          <div className="flex items-start justify-between border-b border-slate-100 p-5 sm:p-6"><div><p className="text-xs font-bold uppercase tracking-widest text-amber-700">Manage report</p><h3 id="report-edit-title" className="mt-1 text-xl font-bold text-slate-900">Edit laboratory report</h3></div><button type="button" disabled={saving} onClick={() => setEditing(null)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button></div>
          <div className="space-y-4 p-5 sm:p-6">
            <label className="block text-sm font-semibold text-slate-700">Report number<input required maxLength={50} value={editing.report_number} onChange={(e) => setEditing({ ...editing, report_number: e.target.value })} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10" /></label>
            <label className="block text-sm font-semibold text-slate-700">Result<textarea required rows={3} value={editing.result} onChange={(e) => setEditing({ ...editing, result: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 font-normal outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10" /></label>
            <label className="block text-sm font-semibold text-slate-700">Interpretation<textarea rows={2} value={editing.interpretation} onChange={(e) => setEditing({ ...editing, interpretation: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 font-normal outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10" /></label>
            <label className="block text-sm font-semibold text-slate-700">Status<select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10">{STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}</select></label>
            <label className="block text-sm font-semibold text-slate-700">Remarks<textarea rows={2} value={editing.remarks} onChange={(e) => setEditing({ ...editing, remarks: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 font-normal outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10" /></label>
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 p-5 sm:flex-row sm:justify-end"><button type="button" disabled={saving} onClick={() => setEditing(null)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button><button disabled={saving} type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-60">{saving && <Loader2 size={16} className="animate-spin" />}Save changes</button></div>
        </form>
      </div>}
    </div>
  );
}
