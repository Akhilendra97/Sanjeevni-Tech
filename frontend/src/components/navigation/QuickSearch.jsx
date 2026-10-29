import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, X, LoaderCircle, ArrowUpRight } from "lucide-react";
import api from "../../services/api";

const CONTEXTS = [
  { test: /^\/(?:admin|receptionist)\/patients(?:\/|$)/, title: "Patients", endpoints: [{ path: "/patients", kind: "patient" }] },
  { test: /^\/doctor\/patients(?:\/|$)/, title: "Assigned patients", endpoints: [{ path: "/patients", kind: "patient" }] },
  { test: /^\/admin\/doctors(?:\/|$)/, title: "Doctors", endpoints: [{ path: "/doctors", kind: "doctor" }] },
  { test: /^\/admin\/nurses(?:\/|$)/, title: "Nurses", endpoints: [{ path: "/nurses", kind: "nurse" }] },
  { test: /^\/admin\/staff(?:\/|$)/, title: "Staff", endpoints: [{ path: "/staff", kind: "staff" }] },
  { test: /^\/(?:admin\/appointments|doctor\/appointments|patient\/appointments|receptionist\/appointments)(?:\/|$)/, title: "Appointments", endpoints: [{ path: "/appointments", kind: "appointment" }] },
  { test: /^\/admin\/wards(?:\/|$)/, title: "Wards", endpoints: [{ path: "/wards", kind: "ward" }] },
  { test: /^\/admin\/beds(?:\/|$)/, title: "Beds", endpoints: [{ path: "/beds", kind: "bed" }] },
  { test: /^\/admin\/analytics(?:\/|$)/, title: "Analytics navigation", endpoints: [], navigation: [
    { name: "Hospital Overview", subtitle: "Operational dashboard", href: "/admin" },
    { name: "Patients", subtitle: "Patient registration and profiles", href: "/admin/patients" },
    { name: "Doctors", subtitle: "Clinical workforce", href: "/admin/doctors" },
    { name: "Appointments", subtitle: "Scheduling and visits", href: "/admin/appointments" },
    { name: "Wards & Beds", subtitle: "Capacity and occupancy", href: "/admin/wards" },
    { name: "Laboratory", subtitle: "Tests, samples and reports", href: "/admin/laboratory" },
    { name: "Audit Logs", subtitle: "Security and activity history", href: "/admin/audit-logs" },
  ] },
  { test: /^\/admin\/laboratory(?:\/|$)/, title: "Laboratory", endpoints: [
    { path: "/laboratories", kind: "laboratory" },
    { path: "/lab-tests", kind: "lab-test" },
    { path: "/lab-samples", kind: "lab-sample" },
    { path: "/lab-reports", kind: "lab-report" },
  ] },
  { test: /^\/laboratory\/(?:samples|test-requests|test-results|reports)(?:\/|$)/, title: "Laboratory", endpoints: [
    { path: "/lab-tests", kind: "lab-test" },
    { path: "/lab-samples", kind: "lab-sample" },
    { path: "/lab-reports", kind: "lab-report" },
  ] },
];

const arrayFrom = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};
const first = (...values) => values.find((value) => value !== null && value !== undefined && String(value).trim() !== "");
function describe(record, kind) {
  const id = first(record.id, record.patient_id, record.doctor_id, record.nurse_id, record.staff_id, record.appointment_id, record.ward_id, record.bed_id, record.lab_id, record.test_id, record.sample_id, record.report_id);
  const name = first(
    record.full_name,
    [record.first_name, record.last_name].filter(Boolean).join(" "),
    record.name,
    record.title,
    record.patient_name,
    record.doctor_name,
    record.staff_name,
    record.test_name,
    record.sample_number,
    record.report_number,
    record.ward_name,
    record.bed_number,
    record.appointment_number,
    record.patient_number,
    record.code,
    id !== undefined ? `${kind} #${id}` : "Record"
  );
  const subtitle = first(
    record.patient_number, record.employee_number, record.doctor_number,
    record.email, record.phone, record.status, record.department_name,
    record.test_name, record.sample_status, record.report_status,
    record.ward_name, record.bed_number, record.appointment_date,
    record.specialization, record.category
  );
  return { id, name: String(name), subtitle: subtitle ? String(subtitle) : kind.replaceAll("-", " "), kind };
}

export default function QuickSearch({ compact = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const context = useMemo(() => CONTEXTS.find((item) => item.test.test(location.pathname)) || null, [location.pathname]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "/" && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const target = event.target;
        const typing = target instanceof HTMLElement && (target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(target.tagName));
        if (!typing) { event.preventDefault(); inputRef.current?.focus(); }
      }
      if (event.key === "Escape") { setQuery(""); inputRef.current?.blur(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);


  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); setError(""); setLoading(false); return undefined; }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true); setError("");
      if (!context) {
        const needle = query.trim().toLocaleLowerCase();
        const root = document.querySelector("main") || document.querySelector("#root");
        const candidates = root ? Array.from(root.querySelectorAll("h1,h2,h3,p,span,button,a,[role='button'],td,th,label")) : [];
        const matches = candidates
          .filter((el) => el.children.length === 0 && el.innerText?.trim() && el.innerText.toLocaleLowerCase().includes(needle))
          .slice(0, 8)
          .map((el, index) => {
            const link = el.closest("a[href]");
            return { id: `page-${index}`, name: el.innerText.trim().replace(/\\s+/g, " ").slice(0, 100), subtitle: link ? "Current page content Â· open matching link" : "Matching text on this page", kind: "page-content", href: link?.getAttribute("href"), element: el };
          });
        setResults(matches); setError(""); setActiveIndex(0); setLoading(false); return;
      }
      const tasks = context.endpoints.map(async (endpoint) => {
        const response = await api.get(endpoint.path, { params: endpoint.kind === "patient" ? { search: query.trim(), limit: 100 } : undefined });
        return arrayFrom(response.data).map((record) => ({ ...describe(record, endpoint.kind), record, endpoint }));
      });
      const settled = await Promise.allSettled(tasks);
      if (cancelled) return;
      const successful = settled.filter((item) => item.status === "fulfilled").flatMap((item) => item.value);
      const failed = settled.some((item) => item.status === "rejected");
      const needle = query.trim().toLocaleLowerCase();
      const filtered = successful.filter((item) => {
        const searchable = Object.values(item.record || {}).filter((value) => ["string", "number"].includes(typeof value)).join(" ").toLocaleLowerCase();
        return searchable.includes(needle) || item.name.toLocaleLowerCase().includes(needle) || item.subtitle.toLocaleLowerCase().includes(needle);
      });
      const seen = new Set();
      const unique = filtered.filter((item) => { const key = `${item.kind}:${item.id ?? item.name}`; if (seen.has(key)) return false; seen.add(key); return true; }).slice(0, 8);
      setResults(unique);
      setError(failed && successful.length === 0 ? "Search is unavailable for this account or page right now." : "");
      setActiveIndex(0); setLoading(false);
    }, 250);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [query, context, location.pathname]);

  const choose = (item) => {
    if (item.href) { navigate(item.href); setQuery(""); return; }
    if (item.kind === "page-content") { item.element?.scrollIntoView?.({ behavior: "smooth", block: "center" }); item.element?.focus?.(); return; }
    const path = location.pathname;
    const base = item.kind === "patient" ? (path.startsWith("/receptionist") ? "/receptionist/patients" : path.startsWith("/doctor") ? "/doctor/patients" : "/admin/patients")
      : item.kind === "doctor" ? "/admin/doctors"
      : item.kind === "nurse" ? "/admin/nurses"
      : item.kind === "staff" ? "/admin/staff"
      : item.kind === "appointment" ? (path.startsWith("/doctor") ? "/doctor/appointments" : path.startsWith("/patient") ? "/patient/appointments" : path.startsWith("/receptionist") ? "/receptionist/appointments" : "/admin/appointments")
      : item.kind === "ward" ? "/admin/wards"
      : item.kind === "bed" ? "/admin/beds"
      : path.startsWith("/laboratory/") ? path : "/admin/laboratory";
    const params = new URLSearchParams();
    if (item.id !== undefined) params.set("recordId", String(item.id));
    params.set("search", query.trim());
    setOpen(false); setQuery("");
    navigate(`${base}?${params.toString()}`);
  };

  return <div className="relative w-full min-w-[180px] max-w-[300px]">
    <div className={compact ? "flex h-10 w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-100" : "flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:border-cyan-500"}>
      <Search size={16} className="shrink-0 text-slate-400" />
      <input
        ref={inputRef}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((value) => Math.min(value + 1, Math.max(results.length - 1, 0))); }
          if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((value) => Math.max(value - 1, 0)); }
          if (event.key === "Enter" && results[activeIndex]) { event.preventDefault(); choose(results[activeIndex]); }
        }}
        placeholder="Quick search"
        className="h-9 min-w-0 w-full flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-500"
        aria-label="Search current page"
        aria-expanded={query.trim().length >= 2}
        autoComplete="off"
      />
      {loading && <LoaderCircle size={15} className="shrink-0 animate-spin text-slate-400" />}
      {query && <button type="button" onClick={() => { setQuery(""); inputRef.current?.focus(); }} aria-label="Clear search" className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100"><X size={14} /></button>}
      <kbd className="shrink-0 rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-400">/</kbd>
    </div>
    {query.trim().length >= 2 && <section role="status" aria-label="Search results" className="absolute right-0 top-full z-[100] mt-2 max-h-[55vh] w-[min(420px,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
      {loading && <p className="px-3 py-4 text-sm text-slate-500">Searching this pageâ€¦</p>}
      {!loading && error && <p role="alert" className="px-3 py-4 text-sm text-rose-600">{error}</p>}
      {!loading && !error && results.length === 0 && <p className="px-3 py-4 text-sm text-slate-500">Not found on this page.</p>}
      {!loading && results.map((item, index) => <button type="button" key={`${item.kind}:${item.id ?? item.name}`} onClick={() => choose(item)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left ${activeIndex === index ? "bg-cyan-50" : "hover:bg-slate-50"}`}>
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-slate-800">{item.name}</span><span className="mt-0.5 block truncate text-xs text-slate-500">{item.subtitle}</span></span>
        <ArrowUpRight size={14} className="shrink-0 text-slate-400" />
      </button>)}
    </section>}
  </div>;
}
