import React from "react";
import {
  Activity, AlertCircle, CheckCircle2, LoaderCircle,
  Plus, RefreshCw, Search, Trash2, Pencil, X
} from "lucide-react";
import {
  getLaboratories, getLabTests, createLabTest, updateLabTest,
  deleteLabTest, getLabSamples, createLabSample, updateLabSample,
  deleteLabSample, getLabReports, createLabReport, updateLabReport,
  deleteLabReport, getLaboratoryErrorMessage
} from "../../services/laboratoryApi";

const configs = {
  samples: {
    title: "Sample Management",
    subtitle: "Track sample collection, receipt and processing status.",
    load: getLabSamples, create: createLabSample, update: updateLabSample,
    remove: deleteLabSample,
    fields: [
      ["sample_number", "Sample Number", "text", true],
      ["patient_id", "Patient ID", "number", true],
      ["lab_test_id", "Lab Test ID", "number", true],
      ["status", "Status", "select", true, ["collected", "received", "processing", "completed", "rejected"]],
      ["collected_at", "Collected At", "datetime-local"],
      ["received_at", "Received At", "datetime-local"],
      ["notes", "Notes", "textarea"]
    ],
    columns: ["sample_number", "patient_name", "patient_number", "test_name", "sample_type", "status", "collected_at"]
  },
  tests: {
    title: "Test Requests & Catalogue",
    subtitle: "Manage the laboratory test catalogue and test requirements.",
    load: getLabTests, create: createLabTest, update: updateLabTest,
    remove: deleteLabTest,
    fields: [
      ["lab_id", "Laboratory ID", "number", true],
      ["test_code", "Test Code", "text", true],
      ["name", "Test Name", "text", true],
      ["category", "Category", "text", true],
      ["sample_type", "Sample Type", "text", true],
      ["price", "Price", "number", true],
      ["normal_range", "Normal Range", "text"],
      ["unit", "Unit", "text"],
      ["turnaround_time_hours", "Turnaround Time (hours)", "number", true],
      ["description", "Description", "textarea"],
      ["is_active", "Active", "select", true, ["true", "false"]]
    ],
    columns: ["test_code", "name", "category", "sample_type", "price", "is_active"]
  },
  results: {
    title: "Test Results",
    subtitle: "Enter findings and update laboratory report status.",
    load: getLabReports, create: createLabReport, update: updateLabReport,
    remove: deleteLabReport,
    fields: [
      ["sample_id", "Sample ID", "number", true],
      ["report_number", "Report Number", "text", true],
      ["result", "Result / Findings", "textarea", true],
      ["interpretation", "Interpretation", "textarea"],
      ["status", "Status", "select", true, ["pending", "processing", "completed", "verified", "cancelled"]],
      ["reported_at", "Reported At", "datetime-local"],
      ["remarks", "Remarks", "textarea"]
    ],
    columns: ["report_number", "patient_name", "patient_number", "test_name", "sample_number", "result", "status", "reported_at"]
  },
  reports: {
    title: "Laboratory Reports",
    subtitle: "Search and review reports stored in the hospital system.",
    load: getLabReports,
    columns: ["report_number", "sample_id", "result", "interpretation", "status", "reported_at"],
    readOnly: true
  }
};

const pretty = (key) => key.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase());
const listFrom = (data) => Array.isArray(data) ? data : data?.items || data?.results || [];

function Field({ field, value, onChange }) {
  const [name, label, type, required, options] = field;
  const common = {
    name, value: value ?? "",
    required: !!required,
    onChange: e => onChange(name, type === "number"
      ? (e.target.value === "" ? "" : Number(e.target.value))
      : type === "select" && name === "is_active"
        ? e.target.value === "true"
        : e.target.value),
    className: "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
  };
  return <label className="block text-sm font-semibold text-slate-700">
    {label}{required ? " *" : ""}
    {type === "textarea"
      ? <textarea {...common} rows={3} />
      : type === "select"
        ? <select {...common}>{(options || []).map(opt =>
            <option key={opt} value={opt}>{name === "is_active" ? (opt === "true" ? "Active" : "Inactive") : pretty(opt)}</option>
          )}</select>
        : <input {...common} type={type === "datetime-local" ? type : type} min={type === "number" ? 0 : undefined} step={name === "price" ? "0.01" : undefined} />}
  </label>;
}

export default function LaboratoryWorkspace({ kind }) {
  const cfg = configs[kind];
  const [rows, setRows] = React.useState([]);
  const [query, setQuery] = React.useState("");
  const [busy, setBusy] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [editing, setEditing] = React.useState(null);
  const [form, setForm] = React.useState({});
  const [patientRequests, setPatientRequests] = React.useState([]);
  const [requestsBusy, setRequestsBusy] = React.useState(false);
  const [requestsError, setRequestsError] = React.useState("");

  React.useEffect(() => {
    if (kind !== "tests") return;
    let mounted = true;
    setRequestsBusy(true);
    getLabSamples()
      .then(data => { if (mounted) setPatientRequests(listFrom(data)); })
      .catch(err => { if (mounted) setRequestsError(getLaboratoryErrorMessage(err)); })
      .finally(() => { if (mounted) setRequestsBusy(false); });
    return () => { mounted = false; };
  }, [kind]);

  const load = React.useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const data = await cfg.load();
      setRows(listFrom(data));
    } catch (err) {
      setError(getLaboratoryErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }, [cfg]);

  React.useEffect(() => { load(); }, [load]);

  const visible = rows.filter(row =>
    cfg.columns.some(key => String(row?.[key] ?? "").toLowerCase().includes(query.toLowerCase()))
  );

  const startNew = () => {
    setEditing("new");
    setForm({});
    setError("");
    setNotice("");
  };

  const startEdit = row => {
    const copy = { ...row };
    for (const [key, , type] of cfg.fields || []) {
      if (type === "datetime-local" && copy[key]) {
        copy[key] = String(copy[key]).slice(0, 16);
      }
    }
    setEditing(row.id);
    setForm(copy);
    setError("");
    setNotice("");
  };

  const save = async e => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const payload = { ...form };
      for (const [key, , type] of cfg.fields || []) {
        if (payload[key] === "") delete payload[key];
        if (type === "datetime-local" && payload[key]) {
          payload[key] = new Date(payload[key]).toISOString();
        }
      }
      if (editing === "new") await cfg.create(payload);
      else await cfg.update(editing, payload);
      setEditing(null);
      setForm({});
      setNotice("Changes saved successfully.");
      await load();
    } catch (err) {
      setError(getLaboratoryErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async row => {
    if (!window.confirm(`Delete record ${row.id}? This action cannot be undone.`)) return;
    setError("");
    setNotice("");
    try {
      await cfg.remove(row.id);
      setNotice("Record deleted.");
      await load();
    } catch (err) {
      setError(getLaboratoryErrorMessage(err));
    }
  };

  return <div className="space-y-6">
    <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-cyan-900 p-6 text-white shadow-lg sm:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Sanjeevni Tech · Laboratory</p>
          <h2 className="mt-2 text-2xl font-black sm:text-3xl">{cfg.title}</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">{cfg.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} type="button" className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-bold hover:bg-white/10">
            <RefreshCw size={16}/> Refresh
          </button>
          {!cfg.readOnly && <button onClick={startNew} type="button" className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-black text-slate-950 hover:bg-cyan-300">
            <Plus size={16}/> Add New
          </button>}
        </div>
      </div>
    </section>

    <section className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Records Loaded</p>
        <p className="mt-2 text-3xl font-black text-slate-900">{rows.length}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Matching Records</p>
        <p className="mt-2 text-3xl font-black text-blue-700">{visible.length}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Connection</p>
        <p className="mt-2 flex items-center gap-2 text-lg font-bold text-emerald-700"><Activity size={18}/> Live API</p>
      </div>
    </section>

    {kind === "tests" && <section className="overflow-hidden rounded-2xl border border-cyan-100 bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-100 bg-cyan-50/60 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900">Patient Test Requests</h3>
          <p className="mt-1 text-sm text-slate-600">Requests linked to registered patients and laboratory tests.</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-cyan-800 ring-1 ring-cyan-100">{patientRequests.length} requests</span>
      </div>
      {requestsError && <div role="alert" className="m-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{requestsError}</div>}
      {requestsBusy ? <div className="p-8 text-center text-sm text-slate-500">Loading patient requests…</div>
      : patientRequests.length === 0 ? <div className="p-8 text-center"><p className="font-bold text-slate-700">No patient test requests found</p><p className="mt-1 text-sm text-slate-500">Create a sample record to link a request to a patient.</p></div>
      : <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>
            {["Sample number", "Patient", "Patient number", "Requested test", "Sample type", "Status", "Collected"].map(label => <th key={label} className="px-4 py-3 font-bold">{label}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {patientRequests.map(row => <tr key={row.id} className="hover:bg-slate-50/80">
              <td className="px-4 py-3 font-semibold text-slate-900">{row.sample_number || "—"}</td>
              <td className="px-4 py-3"><div className="font-semibold text-slate-800">{row.patient_name || "Patient name unavailable"}</div><div className="mt-1 text-xs text-slate-500">Patient ID: {row.patient_id ?? "—"}</div></td>
              <td className="px-4 py-3 text-slate-700">{row.patient_number || "—"}</td>
              <td className="px-4 py-3"><div className="font-medium text-slate-800">{row.test_name || "—"}</div><div className="mt-1 text-xs text-slate-500">{row.test_code || ""}</div></td>
              <td className="px-4 py-3 text-slate-700">{row.sample_type || "—"}</td>
              <td className="px-4 py-3"><span className="rounded-full bg-sky-50 px-2.5 py-1.5 text-xs font-bold capitalize text-sky-700">{row.status || "—"}</span></td>
              <td className="px-4 py-3 text-slate-600">{row.collected_at ? new Date(row.collected_at).toLocaleString("en-IN") : "—"}</td>
            </tr>)}
          </tbody>
        </table>
      </div>}
    </section>}

    {error && <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle size={18} className="mt-0.5 shrink-0"/><span>{error}</span></div>}
    {notice && <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 size={18}/>{notice}</div>}

    {editing !== null && <form onSubmit={save} className="rounded-2xl border border-cyan-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="text-lg font-black text-slate-900">{editing === "new" ? "Create Record" : `Edit Record #${editing}`}</h3>
        <button type="button" onClick={() => setEditing(null)} aria-label="Close form" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18}/></button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(cfg.fields || []).map(field => <Field key={field[0]} field={field} value={form[field[0]]} onChange={(key, value) => setForm(prev => ({ ...prev, [key]: value }))}/>)}
      </div>
      <p className="mt-4 text-xs text-slate-500">Fields marked * are required by the form. The server will validate submitted values.</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button disabled={saving} className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">{saving ? "Saving…" : "Save Record"}</button>
        <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700">Cancel</button>
      </div>
    </form>}

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-black text-slate-900">Records</h3>
          <p className="mt-1 text-xs text-slate-500">Data loaded from the hospital API.</p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search records…" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-cyan-500"/>
        </div>
      </div>
      {busy ? <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={18}/> Loading records…</div>
      : visible.length === 0 ? <div className="p-12 text-center"><p className="font-bold text-slate-700">No matching records</p><p className="mt-1 text-sm text-slate-500">Try another search or add a record if your role has access.</p></div>
      : <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>
            {cfg.columns.map(key => <th key={key} className="px-4 py-3 font-bold">{pretty(key)}</th>)}
            <th className="px-4 py-3 text-right">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map(row => <tr key={row.id} className="hover:bg-slate-50/80">
              {cfg.columns.map(key => <td key={key} className="max-w-[260px] px-4 py-3 text-slate-700">
                {key === "result" || key === "interpretation" || key === "notes"
                  ? <span className="block truncate" title={String(row[key] ?? "")}>{String(row[key] ?? "—")}</span>
                  : key === "is_active"
                    ? (row[key] ? "Active" : "Inactive")
                    : key.endsWith("_at") && row[key]
                      ? new Date(row[key]).toLocaleString()
                      : String(row[key] ?? "—")}
              </td>)}
              <td className="px-4 py-3"><div className="flex justify-end gap-2">
                {!cfg.readOnly && <button type="button" title="Edit record" onClick={() => startEdit(row)} className="rounded-lg border border-slate-200 p-2 text-blue-700 hover:bg-blue-50"><Pencil size={15}/></button>}
                {!cfg.readOnly && <button type="button" title="Delete record" onClick={() => remove(row)} className="rounded-lg border border-slate-200 p-2 text-red-600 hover:bg-red-50"><Trash2 size={15}/></button>}
              </div></td>
            </tr>)}
          </tbody>
        </table>
      </div>}
      <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">Showing {visible.length} of {rows.length} records</div>
    </section>
  </div>;
}
