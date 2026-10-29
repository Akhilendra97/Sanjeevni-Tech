import DocumentPdfActions from "../../components/pdf/DocumentPdfActions";
import { useCallback, useEffect, useState } from "react";
import {
  Activity, CalendarDays, ClipboardList, FileText, FlaskConical,
  CreditCard, ShieldCheck, FolderOpen, UserRound, RefreshCw,
  AlertCircle, Search, ArrowLeft, Clock3
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../services/api";

const configs = {
  appointments: {
    title: "Appointments",
    description: "View your appointment records and their current status.",
    endpoint: "/patient-portal/appointments",
    icon: CalendarDays,
    fields: [
      ["Appointment ID", ["appointment_number", "id"]],
      ["Doctor", ["doctor_name", "doctor.full_name", "doctor.name"]],
      ["Department", ["department_name", "department.name"]],
      ["Date", ["appointment_date", "scheduled_at", "date"]],
      ["Status", ["status"]]
    ]
  },
  history: {
    title: "Medical History",
    description: "Review medical records available to your account.",
    endpoint: "/patient-portal/history",
    icon: Activity,
    fields: [
      ["Record", ["record_number", "id"]],
      ["Diagnosis", ["diagnosis", "chief_complaint", "title"]],
      ["Doctor", ["doctor_name", "doctor.full_name"]],
      ["Date", ["record_date", "visit_date", "created_at"]],
      ["Status", ["status"]]
    ]
  },
  prescriptions: {
    title: "Prescriptions",
    description: "View prescriptions recorded by your healthcare team.",
    endpoint: "/patient-portal/prescriptions",
    icon: ClipboardList,
    fields: [
      ["Prescription", ["prescription_number", "id"]],
      ["Medicine", ["medicine_name", "medication_name", "medicine.name"]],
      ["Dosage", ["dosage", "dose"]],
      ["Frequency", ["frequency"]],
      ["Date", ["prescribed_date", "created_at"]]
    ]
  },
  labs: {
    title: "Laboratory Reports",
    description: "View laboratory reports available for your patient account.",
    endpoint: "/patient-portal/labs",
    icon: FlaskConical,
    fields: [
      ["Report", ["report_number", "id"]],
      ["Test", ["test_name", "test_type", "name"]],
      ["Date", ["report_date", "test_date", "created_at"]],
      ["Status", ["status"]],
      ["Result", ["result_summary", "result"]]
    ]
  },
  radiology: {
    title: "Radiology Reports",
    description: "View radiology and imaging records available to you.",
    endpoint: "/patient-portal/radiology",
    icon: FileText,
    fields: [
      ["Report", ["report_number", "id"]],
      ["Study", ["study_name", "imaging_type", "modality", "title"]],
      ["Date", ["report_date", "study_date", "created_at"]],
      ["Status", ["status"]],
      ["Findings", ["findings", "report_text", "impression"]]
    ]
  },
  payments: {
    title: "Payments",
    description: "Review recorded payments and their current status.",
    endpoint: "/patient-portal/payments",
    icon: CreditCard,
    fields: [
      ["Payment", ["payment_number", "transaction_id", "id"]],
      ["Amount", ["amount", "paid_amount"]],
      ["Method", ["payment_method", "method"]],
      ["Date", ["payment_date", "created_at"]],
      ["Status", ["status"]]
    ]
  },
  bills: {
    title: "Bills",
    description: "View bills and invoices linked to your patient account.",
    endpoint: "/patient-portal/bills",
    icon: CreditCard,
    fields: [
      ["Bill / Invoice", ["bill_number", "invoice_number", "id"]],
      ["Date", ["bill_date", "invoice_date", "created_at"]],
      ["Description", ["description", "bill_type", "notes"]],
      ["Total", ["total_amount"]],
      ["Paid", ["paid_amount"]],
      ["Status", ["payment_status", "status"]]
    ]
  },
  documents: {
    title: "Documents",
    description: "View documents returned by the hospital document service.",
    endpoint: "/patient-portal/documents",
    icon: FolderOpen,
    fields: [
      ["Document", ["title", "document_name", "name"]],
      ["Type", ["document_type", "type"]],
      ["Date", ["created_at", "uploaded_at"]],
      ["Status", ["status"]]
    ]
  },
  insurance: {
    title: "Insurance",
    description: "Review insurance information available through the hospital system.",
    endpoint: "/patient-portal/insurance",
    icon: ShieldCheck,
    fields: [
      ["Policy", ["policy_number", "id"]],
      ["Provider", ["provider_name", "insurance_provider", "provider"]],
      ["Coverage", ["coverage_amount", "sum_insured"]],
      ["Valid until", ["valid_until", "expiry_date"]],
      ["Status", ["status"]]
    ]
  },
  profile: {
    title: "Profile & Settings",
    description: "View the account profile returned by the authenticated API.",
    endpoint: "/patient-portal/profile",
    icon: UserRound,
    fields: [
      ["Name", ["full_name", "name"]],
      ["Email", ["email"]],
      ["Role", ["role", "user_role"]],
      ["Phone", ["phone", "phone_number"]],
      ["Account status", ["status", "is_active"]]
    ]
  }
};

function readPath(object, path) {
  return path.split(".").reduce((value, key) => value?.[key], object);
}

function getValue(record, candidates) {
  for (const candidate of candidates) {
    const value = readPath(record, candidate);
    if (value !== undefined && value !== null && value !== "") {
      if (typeof value === "object") return JSON.stringify(value);
      if (typeof value === "boolean") return value ? "Active" : "Inactive";
      return String(value);
    }
  }
  return "—";
}

function unwrap(payload) {
  if (Array.isArray(payload)) return payload;
  for (const key of ["items", "results", "patients", "appointments",
    "records", "data", "payments", "prescriptions", "reports"]) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  if (payload && typeof payload === "object") return [payload];
  return [];
}

export default function PatientDataPage({ section }) {
  const config = configs[section];
  if (!config) return <div className="p-6 text-rose-700">This patient portal section is not configured.</div>;
  const Icon = config.icon;
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(config.endpoint);
      setRecords(unwrap(response.data));
    } catch (err) {
      setRecords([]);
      const status = err.response?.status;
      if (status === 401) {
        setError("Your session is not authenticated. Please sign in again.");
      } else if (status === 403) {
        setError("Your account does not have permission to view this information.");
      } else if (status === 404) {
        setError("This section's backend endpoint is not available yet. No sample records are being shown.");
      } else {
        setError(err.response?.data?.detail ||
          "Unable to load information right now. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [config.endpoint]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  const visible = records.filter((record) => {
    const text = JSON.stringify(record).toLowerCase();
    return text.includes(search.trim().toLowerCase());
  });

  return (
    <div className="min-h-full space-y-6 p-5 md:p-8">
      <section className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-cyan-50 p-4 text-cyan-700">
            <Icon size={30} />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-cyan-700">
              Patient Workspace
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-slate-900">{config.title}</h1>
            <p className="mt-2 text-slate-500">{config.description}</p>
          </div>
        </div>
        <Link to="/patient"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 font-semibold text-white shadow-sm hover:opacity-95">
          <ArrowLeft size={18} /> Back to Dashboard
        </Link>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
            <input value={search} onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${config.title.toLowerCase()}...`}
              className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" />
          </div>
          <button onClick={loadRecords} disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {error && (
          <div role="alert" className="m-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <AlertCircle className="mt-0.5 shrink-0" size={20} />
            <div>
              <p className="font-bold">Unable to load live data</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-4 p-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-14 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : !error && visible.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="rounded-2xl bg-slate-50 p-4 text-slate-400"><Icon size={30} /></div>
            <h2 className="mt-4 text-lg font-bold text-slate-800">
              {records.length ? "No matching records" : "No records available"}
            </h2>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              {records.length
                ? "Try a different search term."
                : "When records are available for your authenticated account, they will appear here."}
            </p>
          </div>
        ) : !error && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {config.fields.map(([label]) => (
                    <th key={label} className="px-5 py-4 font-bold">{label}</th>
                  ))}
                  {["appointments", "history", "prescriptions", "labs", "radiology", "payments", "bills", "documents", "insurance"].includes(section) && <th className="px-4 py-4 font-bold">Document</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((record, index) => (
                  <tr key={record.id ?? record.uuid ?? index} className="hover:bg-cyan-50/30">
                    {config.fields.map(([label, paths]) => (
                      <td key={label} className="max-w-xs px-5 py-4 text-slate-700">
                        <span className="block truncate" title={getValue(record, paths)}>
                          {getValue(record, paths)}
                        </span>
                      </td>
                    ))}
                    {["appointments", "history", "prescriptions", "labs", "radiology", "payments", "bills", "documents", "insurance"].includes(section) && (
                      <td className="px-4 py-3">
                        <DocumentPdfActions
                          title={`${config.title} ${getValue(record, ["bill_number", "invoice_number", "prescription_number", "report_number", "title", "id"])}`}
                          record={record}
                          fields={config.fields.map(([label, paths]) => [label, paths.reduce((value, path) => {
                            if (value !== undefined && value !== null) return value;
                            return path.split(".").reduce((node, part) => node?.[part], record);
                          }, undefined)])}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-slate-100 px-5 py-3 text-sm text-slate-500">
              {visible.length} record{visible.length === 1 ? "" : "s"}
            </div>
          </div>
        )}
      </section>
      <p className="flex items-center gap-2 text-xs text-slate-400">
        <Clock3 size={14} /> Information is retrieved from the authenticated hospital API.
      </p>
    </div>
  );
}
