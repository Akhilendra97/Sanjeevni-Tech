import DocumentPdfActions from "../../components/pdf/DocumentPdfActions";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    AlertCircle, ClipboardList, FilePlus2, FileText, RefreshCw,
    Search, ShieldCheck, X, Eye, Pencil, Trash2, LoaderCircle,
    CalendarDays, Activity
} from "lucide-react";
import {
    getDoctorLabReports, createDoctorLabReport,
    updateDoctorLabReport, deleteDoctorLabReport
} from "../../services/doctorLabReportsApi";

const EMPTY = {
    sample_id: "",
    report_number: "",
    result: "",
    interpretation: "",
    status: "completed",
    reported_at: "",
    remarks: ""
};

function messageFrom(error) {
    const detail = error?.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map(x => x.msg || "Invalid input").join(", ");
    if (!error?.response) return "Cannot connect to the hospital API.";
    if (error.response.status === 401) return "Session expired. Please sign in again.";
    if (error.response.status === 403) return "You do not have permission for this action.";
    return "The request failed. Please check the entered details and try again.";
}

function dateLabel(value) {
    if (!value) return "—";
    const d = new Date(value);
    return Number.isNaN(d.getTime())
        ? String(value).slice(0, 10)
        : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function Field({ label, name, value, onChange, type = "text", required = false, disabled = false }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
                {label}{required && <span className="text-rose-600"> *</span>}
            </span>
            <input
                name={name}
                type={type}
                value={value ?? ""}
                onChange={onChange}
                required={required}
                disabled={disabled}
                min={type === "number" ? 1 : undefined}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50 disabled:bg-slate-100"
            />
        </label>
    );
}

function Area({ label, name, value, onChange, required = false }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
                {label}{required && <span className="text-rose-600"> *</span>}
            </span>
            <textarea
                name={name}
                value={value ?? ""}
                onChange={onChange}
                rows={3}
                required={required}
                className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50"
            />
        </label>
    );
}

export default function DoctorLabReports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState({ ...EMPTY });

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            setReports(await getDoctorLabReports());
        } catch (err) {
            setError(messageFrom(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const visibleReports = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return reports;
        return reports.filter(report =>
            [
                report.report_number, report.sample_id, report.result,
                report.interpretation, report.status, report.remarks
            ].some(value => String(value ?? "").toLowerCase().includes(q))
        );
    }, [reports, search]);

    function openCreate() {
        setForm({ ...EMPTY });
        setError("");
        setNotice("");
        setModal({ mode: "create" });
    }

    function openEdit(report) {
        setForm({
            ...EMPTY,
            ...report,
            sample_id: String(report.sample_id ?? ""),
            reported_at: report.reported_at
                ? String(report.reported_at).slice(0, 16)
                : ""
        });
        setError("");
        setNotice("");
        setModal({ mode: "edit", report });
    }

    function change(event) {
        const { name, value } = event.target;
        setForm(previous => ({ ...previous, [name]: value }));
    }

    async function submit(event) {
        event.preventDefault();
        setBusy(true);
        setError("");
        setNotice("");

        const payload = {
            report_number: form.report_number.trim(),
            result: form.result.trim(),
            interpretation: form.interpretation.trim() || null,
            status: form.status.trim() || "completed",
            reported_at: form.reported_at
                ? new Date(form.reported_at).toISOString()
                : null,
            remarks: form.remarks.trim() || null
        };

        try {
            if (modal.mode === "create") {
                payload.sample_id = Number(form.sample_id);
                if (!payload.sample_id || !payload.report_number || !payload.result) {
                    setError("A valid existing Sample ID, Report Number and Result are required.");
                    return;
                }
                await createDoctorLabReport(payload);
                setNotice("Laboratory report created.");
            } else {
                await updateDoctorLabReport(modal.report.id, payload);
                setNotice("Laboratory report updated.");
            }

            setModal(null);
            await load();
        } catch (err) {
            setError(messageFrom(err));
        } finally {
            setBusy(false);
        }
    }

    async function remove(report) {
        if (!window.confirm(`Delete laboratory report ${report.report_number}?`)) return;
        setBusy(true);
        setError("");
        setNotice("");
        try {
            await deleteDoctorLabReport(report.id);
            setNotice("Laboratory report deleted.");
            if (modal?.report?.id === report.id) setModal(null);
            await load();
        } catch (err) {
            setError(messageFrom(err));
        } finally {
            setBusy(false);
        }
    }

    const stats = [
        { label: "Total reports", value: reports.length, icon: FileText },
        { label: "Completed", value: reports.filter(r => String(r.status ?? "").toLowerCase() === "completed").length, icon: ShieldCheck },
        { label: "With interpretation", value: reports.filter(r => Boolean(r.interpretation?.trim())).length, icon: Activity }
    ];

    return (
        <div className="min-h-full bg-slate-50/70 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-teal-700">
                            <ShieldCheck size={16} /> Doctor workspace
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Laboratory Reports</h1>
                        <p className="mt-1 text-sm text-slate-500">Review and manage laboratory results and interpretations.</p>
                    </div>
                    <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-800">
                        <FilePlus2 size={18} /> New lab report
                    </button>
                </header>

                {error && <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertCircle size={18} className="mt-0.5 shrink-0" /><span className="flex-1">{error}</span><button onClick={() => setError("")} aria-label="Dismiss"><X size={17} /></button></div>}
                {notice && <div role="status" className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss"><X size={17} /></button></div>}

                <section className="grid gap-4 sm:grid-cols-3">
                    {stats.map(({ label, value, icon: Icon }) => (
                        <div key={label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">{label}</span><span className="rounded-xl bg-teal-50 p-2.5 text-teal-700"><Icon size={19} /></span></div>
                            <div className="mt-3 text-3xl font-bold text-slate-900">{value}</div>
                        </div>
                    ))}
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                        <div><h2 className="font-semibold text-slate-900">Report register</h2><p className="mt-1 text-sm text-slate-500">{visibleReports.length} report{visibleReports.length === 1 ? "" : "s"} shown</p></div>
                        <div className="flex gap-2">
                            <div className="relative min-w-0 flex-1 sm:w-72"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reports..." aria-label="Search lab reports" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50" /></div>
                            <button onClick={load} disabled={loading} title="Refresh reports" className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={17} className={loading ? "animate-spin" : ""} /></button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex min-h-56 items-center justify-center gap-3 text-sm text-slate-500"><LoaderCircle size={20} className="animate-spin" /> Loading reports...</div>
                    ) : visibleReports.length === 0 ? (
                        <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
                            <div className="rounded-2xl bg-slate-100 p-4 text-slate-500"><ClipboardList size={28} /></div>
                            <h3 className="mt-4 font-semibold text-slate-900">{search ? "No matching reports" : "No laboratory reports yet"}</h3>
                            <p className="mt-1 max-w-md text-sm text-slate-500">{search ? "Try another search term." : "Reports from the existing hospital API will appear here. No sample data has been added."}</p>
                            {!search && <button onClick={openCreate} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-teal-200 px-4 py-2.5 text-sm font-semibold text-teal-800 hover:bg-teal-50"><FilePlus2 size={16} /> Create report</button>}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3.5">Report</th><th className="px-5 py-3.5">Sample ID</th><th className="px-5 py-3.5">Result / Interpretation</th><th className="px-5 py-3.5">Reported</th><th className="px-5 py-3.5">Status</th><th className="px-5 py-3.5 text-right">Actions</th></tr></thead>
                                <tbody className="divide-y divide-slate-100">
                                    {visibleReports.map(report => (
                                        <tr key={report.id} className="transition hover:bg-slate-50/70">
                                            <td className="px-5 py-4"><div className="font-semibold text-slate-900">{report.report_number}</div><div className="mt-1 text-xs text-slate-500">ID #{report.id}</div></td>
                                            <td className="px-5 py-4 text-slate-600">Sample #{report.sample_id}</td>
                                            <td className="max-w-72 px-5 py-4"><div className="truncate font-medium text-slate-800">{report.result}</div><div className="mt-1 truncate text-xs text-slate-500">{report.interpretation || "No interpretation"}</div></td>
                                            <td className="whitespace-nowrap px-5 py-4 text-slate-500">{dateLabel(report.reported_at)}</td>
                                            <td className="px-5 py-4"><span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold capitalize text-teal-800">{report.status || "—"}</span></td>
                                            <td className="px-5 py-4"><div className="flex flex-wrap justify-end gap-1">
                                                <DocumentPdfActions title={`Laboratory Report ${report.report_number || report.id}`} record={{ report_number: report.report_number, sample_id: report.sample_id, result: report.result, interpretation: report.interpretation, reported_at: report.reported_at, status: report.status, remarks: report.remarks }} />
                                                <button onClick={() => setModal({ mode: "view", report })} title="View report" aria-label="View report" className="rounded-lg p-2 text-slate-500 hover:bg-teal-50 hover:text-teal-700"><Eye size={17} /></button>
                                                <button onClick={() => openEdit(report)} title="Edit report" aria-label="Edit report" className="rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-700"><Pencil size={17} /></button>
                                                <button onClick={() => remove(report)} title="Delete report" aria-label="Delete report" className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700"><Trash2 size={17} /></button>
                                            </div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {modal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-3 backdrop-blur-[2px] sm:p-6" onMouseDown={e => { if (e.target === e.currentTarget && !busy) setModal(null); }}>
                        <section role="dialog" aria-modal="true" aria-labelledby="lab-modal-title" className="my-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                                <div><h2 id="lab-modal-title" className="text-lg font-bold text-slate-900">{modal.mode === "create" ? "Create laboratory report" : modal.mode === "edit" ? "Edit laboratory report" : "Laboratory report details"}</h2><p className="mt-1 text-sm text-slate-500">{modal.mode === "create" ? "Enter results for an existing laboratory sample." : modal.report.report_number}</p></div>
                                <button onClick={() => !busy && setModal(null)} disabled={busy} aria-label="Close dialog" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={19} /></button>
                            </div>

                            {modal.mode === "view" ? (
                                <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5 sm:p-6">
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-500">Sample ID</div><div className="mt-1 font-semibold">{modal.report.sample_id}</div></div>
                                        <div className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-500">Reported date</div><div className="mt-1 font-semibold">{dateLabel(modal.report.reported_at)}</div></div>
                                        <div className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-500">Status</div><div className="mt-1 font-semibold capitalize">{modal.report.status || "—"}</div></div>
                                    </div>
                                    {[["result", "Result"], ["interpretation", "Interpretation"], ["remarks", "Remarks"]].map(([key, label]) => <div key={key}><h3 className="text-sm font-semibold text-slate-800">{label}</h3><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">{modal.report[key] || "Not documented"}</p></div>)}
                                    <div className="flex justify-end"><button onClick={() => openEdit(modal.report)} className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"><Pencil size={16} /> Edit report</button></div>
                                </div>
                            ) : (
                                <form onSubmit={submit} className="max-h-[75vh] space-y-5 overflow-y-auto p-5 sm:p-6">
                                    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}
                                    {modal.mode === "create" && <div className="grid gap-4 sm:grid-cols-2"><Field label="Existing Sample ID" name="sample_id" type="number" value={form.sample_id} onChange={change} required /><Field label="Report number" name="report_number" value={form.report_number} onChange={change} required /></div>}
                                    {modal.mode === "edit" && <Field label="Report number" name="report_number" value={form.report_number} onChange={change} required />}
                                    <Area label="Result" name="result" value={form.result} onChange={change} required />
                                    <Area label="Interpretation" name="interpretation" value={form.interpretation} onChange={change} />
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Status</span><select name="status" value={form.status} onChange={change} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-teal-500"><option value="pending">Pending</option><option value="completed">Completed</option><option value="abnormal">Abnormal</option><option value="cancelled">Cancelled</option></select></label>
                                        <Field label="Reported at" name="reported_at" type="datetime-local" value={form.reported_at} onChange={change} />
                                    </div>
                                    <Area label="Remarks" name="remarks" value={form.remarks} onChange={change} />
                                    <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                                        <button type="button" onClick={() => setModal(null)} disabled={busy} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
                                        <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60">{busy && <LoaderCircle size={16} className="animate-spin" />}{modal.mode === "create" ? "Create report" : "Save changes"}</button>
                                    </div>
                                </form>
                            )}
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}
