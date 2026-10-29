import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  Beaker,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  Edit3,
  FileBarChart,
  FlaskConical,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  TestTube2,
  X,
} from "lucide-react";

import {
  createLaboratory,
  createLabReport,
  createLabSample,
  createLabTest,
  deleteLaboratory,
  deleteLabReport,
  deleteLabSample,
  deleteLabTest,
  getLaboratories,
  getLabReports,
  getLabSamples,
  getLabTests,
  getLaboratoryErrorMessage,
  updateLaboratory,
  updateLabReport,
  updateLabSample,
  updateLabTest,
} from "../../services/laboratoryApi";

const emptyLab = {
  name: "",
  code: "",
  description: "",
  location: "",
  contact_number: "",
  is_active: true,
};

const emptyTest = {
  lab_id: "",
  test_code: "",
  name: "",
  category: "",
  description: "",
  sample_type: "",
  price: "0",
  normal_range: "",
  unit: "",
  turnaround_time_hours: "24",
  is_active: true,
};

const emptySample = {
  sample_number: "",
  patient_id: "",
  lab_test_id: "",
  collected_at: "",
  received_at: "",
  status: "collected",
  notes: "",
};

const emptyReport = {
  sample_id: "",
  report_number: "",
  result: "",
  interpretation: "",
  status: "completed",
  reported_at: "",
  remarks: "",
};

const tabs = [
  { key: "overview", label: "Overview", icon: Activity },
  { key: "labs", label: "Laboratories", icon: FlaskConical },
  { key: "tests", label: "Lab Tests", icon: TestTube2 },
  { key: "samples", label: "Samples", icon: Beaker },
  { key: "reports", label: "Reports", icon: FileBarChart },
];

const statusClass = (active) =>
  active
    ? "inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
    : "inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600";

const sampleStatusClass = (status) => {
  const value = String(status || "").toLowerCase();

  if (value === "completed" || value === "reported") {
    return "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700";
  }

  if (value === "received" || value === "processing") {
    return "inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700";
  }

  if (value === "rejected" || value === "cancelled") {
    return "inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700";
  }

  return "inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700";
};

function StatCard({ icon: Icon, label, value, hint, tone = "cyan" }) {
  const tones = {
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
  };

  return (
    <div className="rounded-2xl border border-[#d8e6ef] bg-white p-5 shadow-[0_8px_30px_rgba(21,54,83,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#55718a]">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#153653]">
            {value}
          </p>
          <p className="mt-1 text-xs text-[#8298aa]">{hint}</p>
        </div>
        <div className={`rounded-xl border p-3 ${tones[tone]}`}>
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

function Modal({ title, subtitle, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-[#153653]/35 p-4 backdrop-blur-sm sm:p-6">
      <div
        className={`my-auto flex max-h-[calc(100vh-2rem)] w-full ${
          wide ? "max-w-5xl" : "max-w-2xl"
        } flex-col overflow-hidden rounded-2xl border border-[#d8e6ef] bg-white shadow-[0_25px_80px_rgba(21,54,83,0.22)]`}
      >
        <div className="flex shrink-0 items-start justify-between border-b border-[#e4edf3] px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-[#153653]">{title}</h2>
            {subtitle && (
              <p className="mt-1 text-sm text-[#55718a]">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[#55718a] transition hover:bg-[#eef5fa] hover:text-[#153653]"
          >
            <X size={20} />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#153653]">
        {label} {required && <span className="text-[#08b9d8]">*</span>}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-[#d2e2ec] bg-white px-4 py-3 text-sm text-[#153653] outline-none transition placeholder:text-[#a4b7c3] focus:border-[#08b9d8] focus:ring-4 focus:ring-cyan-100";

function ActionButton({ children, variant = "primary", ...props }) {
  const variants = {
    primary:
      "bg-gradient-to-r from-[#08b9d8] to-[#3478ed] text-white shadow-[0_8px_20px_rgba(52,120,237,0.18)] hover:brightness-[1.03]",
    secondary:
      "border border-[#d2e2ec] bg-white text-[#153653] hover:bg-[#f5f9fc]",
    danger:
      "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  };

  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]}`}
    >
      {children}
    </button>
  );
}

export default function Laboratory() {
  const [activeTab, setActiveTab] = useState("overview");

  const [laboratories, setLaboratories] = useState([]);
  const [tests, setTests] = useState([]);
  const [samples, setSamples] = useState([]);
  const [reports, setReports] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [labForm, setLabForm] = useState(emptyLab);
  const [testForm, setTestForm] = useState(emptyTest);
  const [sampleForm, setSampleForm] = useState(emptySample);
  const [reportForm, setReportForm] = useState(emptyReport);

  const loadData = async (showRefresh = false) => {
    try {
      setError("");
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const [labData, testData, sampleData, reportData] = await Promise.all([
        getLaboratories(),
        getLabTests(),
        getLabSamples(),
        getLabReports(),
      ]);

      setLaboratories(Array.isArray(labData) ? labData : []);
      setTests(Array.isArray(testData) ? testData : []);
      setSamples(Array.isArray(sampleData) ? sampleData : []);
      setReports(Array.isArray(reportData) ? reportData : []);
    } catch (err) {
      setError(getLaboratoryErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(""), 3500);
    return () => clearTimeout(timer);
  }, [success]);

  const filteredLabs = useMemo(() => {
    const q = search.trim().toLowerCase();

    return laboratories.filter((lab) => {
      const matchesSearch =
        !q ||
        [lab.name, lab.code, lab.location, lab.contact_number]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? lab.is_active : !lab.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [laboratories, search, statusFilter]);

  const filteredTests = useMemo(() => {
    const q = search.trim().toLowerCase();

    return tests.filter((test) => {
      const lab = laboratories.find((item) => item.id === test.lab_id);
      const labName = lab?.name || "";

      const matchesSearch =
        !q ||
        [test.test_code, test.name, test.category, test.sample_type, labName]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? test.is_active : !test.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [tests, laboratories, search, statusFilter]);

  const filteredSamples = useMemo(() => {
    const q = search.trim().toLowerCase();

    return samples.filter((sample) => {
      const matchesSearch =
        !q ||
        [sample.sample_number, sample.status, sample.notes]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "all" ||
        String(sample.status || "").toLowerCase() ===
          statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [samples, search, statusFilter]);

  const filteredReports = useMemo(() => {
    const q = search.trim().toLowerCase();

    return reports.filter((report) => {
      const matchesSearch =
        !q ||
        [
          report.report_number,
          report.status,
          report.result,
          report.interpretation,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "all" ||
        String(report.status || "").toLowerCase() ===
          statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [reports, search, statusFilter]);

  const openCreate = (type) => {
    setError("");

    if (type === "lab") setLabForm(emptyLab);
    if (type === "test") setTestForm(emptyTest);
    if (type === "sample") setSampleForm(emptySample);
    if (type === "report") setReportForm(emptyReport);

    setModal({ type, mode: "create" });
  };

  const openEdit = (type, item) => {
    setError("");

    if (type === "lab") {
      setLabForm({
        name: item.name || "",
        code: item.code || "",
        description: item.description || "",
        location: item.location || "",
        contact_number: item.contact_number || "",
        is_active: Boolean(item.is_active),
      });
    }

    if (type === "test") {
      setTestForm({
        lab_id: item.lab_id ?? "",
        test_code: item.test_code || "",
        name: item.name || "",
        category: item.category || "",
        description: item.description || "",
        sample_type: item.sample_type || "",
        price: String(item.price ?? 0),
        normal_range: item.normal_range || "",
        unit: item.unit || "",
        turnaround_time_hours: String(item.turnaround_time_hours ?? 24),
        is_active: Boolean(item.is_active),
      });
    }

    if (type === "sample") {
      setSampleForm({
        sample_number: item.sample_number || "",
        patient_id: String(item.patient_id ?? ""),
        lab_test_id: String(item.lab_test_id ?? ""),
        collected_at: item.collected_at
          ? String(item.collected_at).slice(0, 16)
          : "",
        received_at: item.received_at
          ? String(item.received_at).slice(0, 16)
          : "",
        status: item.status || "collected",
        notes: item.notes || "",
      });
    }

    if (type === "report") {
      setReportForm({
        sample_id: String(item.sample_id ?? ""),
        report_number: item.report_number || "",
        result: item.result || "",
        interpretation: item.interpretation || "",
        status: item.status || "completed",
        reported_at: item.reported_at
          ? String(item.reported_at).slice(0, 16)
          : "",
        remarks: item.remarks || "",
      });
    }

    setModal({ type, mode: "edit", item });
  };

  const openView = (type, item) => {
    setModal({ type, mode: "view", item });
  };

  const closeModal = () => {
    if (!saving) setModal(null);
  };

  const saveLab = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: labForm.name.trim(),
        code: labForm.code.trim(),
        description: labForm.description.trim() || null,
        location: labForm.location.trim() || null,
        contact_number: labForm.contact_number.trim() || null,
        is_active: Boolean(labForm.is_active),
      };

      if (modal.mode === "edit") {
        await updateLaboratory(modal.item.id, payload);
        setSuccess("Laboratory updated successfully.");
      } else {
        await createLaboratory(payload);
        setSuccess("Laboratory created successfully.");
      }

      setModal(null);
      await loadData();
    } catch (err) {
      setError(getLaboratoryErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const saveTest = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        lab_id: Number(testForm.lab_id),
        test_code: testForm.test_code.trim(),
        name: testForm.name.trim(),
        category: testForm.category.trim(),
        description: testForm.description.trim() || null,
        sample_type: testForm.sample_type.trim(),
        price: Number(testForm.price),
        normal_range: testForm.normal_range.trim() || null,
        unit: testForm.unit.trim() || null,
        turnaround_time_hours: Number(testForm.turnaround_time_hours),
        is_active: Boolean(testForm.is_active),
      };

      if (modal.mode === "edit") {
        await updateLabTest(modal.item.id, payload);
        setSuccess("Laboratory test updated successfully.");
      } else {
        await createLabTest(payload);
        setSuccess("Laboratory test created successfully.");
      }

      setModal(null);
      await loadData();
    } catch (err) {
      setError(getLaboratoryErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const saveSample = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        sample_number: sampleForm.sample_number.trim(),
        patient_id: Number(sampleForm.patient_id),
        lab_test_id: Number(sampleForm.lab_test_id),
        collected_at: sampleForm.collected_at
          ? new Date(sampleForm.collected_at).toISOString()
          : null,
        received_at: sampleForm.received_at
          ? new Date(sampleForm.received_at).toISOString()
          : null,
        status: sampleForm.status.trim(),
        notes: sampleForm.notes.trim() || null,
      };

      if (modal.mode === "edit") {
        await updateLabSample(modal.item.id, payload);
        setSuccess("Laboratory sample updated successfully.");
      } else {
        await createLabSample(payload);
        setSuccess("Laboratory sample created successfully.");
      }

      setModal(null);
      await loadData();
    } catch (err) {
      setError(getLaboratoryErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const saveReport = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        sample_id: Number(reportForm.sample_id),
        report_number: reportForm.report_number.trim(),
        result: reportForm.result.trim(),
        interpretation: reportForm.interpretation.trim() || null,
        status: reportForm.status.trim(),
        reported_at: reportForm.reported_at
          ? new Date(reportForm.reported_at).toISOString()
          : null,
        remarks: reportForm.remarks.trim() || null,
      };

      if (modal.mode === "edit") {
        await updateLabReport(modal.item.id, payload);
        setSuccess("Laboratory report updated successfully.");
      } else {
        await createLabReport(payload);
        setSuccess("Laboratory report created successfully.");
      }

      setModal(null);
      await loadData();
    } catch (err) {
      setError(getLaboratoryErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setSaving(true);
      setError("");

      if (deleteTarget.type === "lab") {
        await deleteLaboratory(deleteTarget.item.id);
      } else if (deleteTarget.type === "test") {
        await deleteLabTest(deleteTarget.item.id);
      } else if (deleteTarget.type === "sample") {
        await deleteLabSample(deleteTarget.item.id);
      } else {
        await deleteLabReport(deleteTarget.item.id);
      }

      setDeleteTarget(null);
      setSuccess("Record deleted successfully.");
      await loadData();
    } catch (err) {
      setError(getLaboratoryErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const labName = (id) =>
    laboratories.find((item) => item.id === id)?.name || `Lab #${id}`;

  const testName = (id) =>
    tests.find((item) => item.id === id)?.name || `Test #${id}`;

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={FlaskConical}
          label="Laboratories"
          value={laboratories.length}
          hint={`${laboratories.filter((x) => x.is_active).length} active facilities`}
          tone="cyan"
        />
        <StatCard
          icon={TestTube2}
          label="Configured Tests"
          value={tests.length}
          hint={`${tests.filter((x) => x.is_active).length} active tests`}
          tone="blue"
        />
        <StatCard
          icon={Beaker}
          label="Samples"
          value={samples.length}
          hint="Registered laboratory samples"
          tone="indigo"
        />
        <StatCard
          icon={FileBarChart}
          label="Reports"
          value={reports.length}
          hint={`${reports.filter((x) => String(x.status).toLowerCase() === "completed").length} completed`}
          tone="green"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-[#d8e6ef] bg-white p-6 shadow-[0_8px_30px_rgba(21,54,83,0.06)] xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#153653]">
                Laboratory Operations
              </h3>
              <p className="mt-1 text-sm text-[#55718a]">
                Live summary of laboratory configuration and workflow records.
              </p>
            </div>
            <div className="rounded-xl bg-cyan-50 p-3 text-cyan-700">
              <Activity size={21} />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              ["Active Laboratories", laboratories.filter((x) => x.is_active).length],
              ["Active Tests", tests.filter((x) => x.is_active).length],
              ["Collected Samples", samples.filter((x) => x.status === "collected").length],
              ["Completed Reports", reports.filter((x) => x.status === "completed").length],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-xl border border-[#e0ebf2] bg-[#f8fbfd] px-4 py-4"
              >
                <span className="text-sm font-medium text-[#55718a]">
                  {label}
                </span>
                <span className="text-lg font-bold text-[#153653]">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0 overflow-hidden rounded-2xl border border-[#d8e6ef] bg-white p-6 shadow-[0_8px_30px_rgba(21,54,83,0.06)]">
          <h3 className="text-lg font-bold text-[#153653]">Quick Actions</h3>
          <p className="mt-1 text-sm text-[#55718a]">
            Start a laboratory workflow.
          </p>

          <div className="lab-quick-actions mt-5">
            {[
              ["lab", "Add Laboratory", FlaskConical],
              ["test", "Create Lab Test", TestTube2],
              ["sample", "Register Sample", Beaker],
              ["report", "Create Report", FileBarChart],
            ].map(([type, label, Icon]) => (
              <button
                key={type}
                type="button"
                onClick={() => openCreate(type)}
                className="lab-quick-action-button"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="rounded-lg bg-white p-2 text-[#08b9d8] shadow-sm">
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0 truncate text-sm font-semibold text-[#153653]">
                    {label}
                  </span>
                </span>
                <ChevronRight size={17} className="text-[#8298aa]" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderToolbar = (createType, createLabel, showStatus = true) => (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div className="relative min-w-0 flex-1 xl:max-w-xl">
        <Search
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8298aa]"
        />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className={`${inputClass} pl-11`}
          placeholder="Search laboratory records..."
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {showStatus && (
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={`${inputClass} w-auto min-w-[145px] py-2.5`}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        )}

        <ActionButton
          variant="secondary"
          onClick={() => loadData(true)}
          disabled={refreshing}
        >
          <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </ActionButton>

        <ActionButton onClick={() => openCreate(createType)}>
          <Plus size={17} />
          {createLabel}
        </ActionButton>
      </div>
    </div>
  );

  const renderLabs = () => (
    <div className="space-y-5">
      {renderToolbar("lab", "Add Laboratory")}

      <div className="overflow-hidden rounded-2xl border border-[#d8e6ef] bg-white shadow-[0_8px_30px_rgba(21,54,83,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="border-b border-[#e0ebf2] bg-[#f7fafc]">
              <tr>
                {["Laboratory", "Code", "Location", "Contact", "Status", "Actions"].map(
                  (head) => (
                    <th
                      key={head}
                      className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-[#55718a]"
                    >
                      {head}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf3f7]">
              {filteredLabs.map((lab) => (
                <tr key={lab.id} className="transition hover:bg-[#f8fbfd]">
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => openView("lab", lab)}
                      className="text-left"
                    >
                      <p className="font-semibold text-[#153653]">{lab.name}</p>
                      <p className="mt-1 text-xs text-[#8298aa]">
                        ID #{lab.id}
                      </p>
                    </button>
                  </td>
                  <td className="px-5 py-4 font-mono text-sm text-[#55718a]">
                    {lab.code}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#55718a]">
                    {lab.location || "—"}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#55718a]">
                    {lab.contact_number || "—"}
                  </td>
                  <td className="px-5 py-4">{<span className={statusClass(lab.is_active)}>{lab.is_active ? "Active" : "Inactive"}</span>}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openView("lab", lab)}
                        className="rounded-lg p-2 text-[#55718a] hover:bg-[#eef5fa]"
                        title="View"
                      >
                        <ChevronRight size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit("lab", lab)}
                        className="rounded-lg p-2 text-[#3478ed] hover:bg-blue-50"
                        title="Edit"
                      >
                        <Edit3 size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ type: "lab", item: lab })}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!filteredLabs.length && (
            <div className="px-6 py-16 text-center">
              <FlaskConical className="mx-auto text-[#a4b7c3]" size={34} />
              <p className="mt-3 font-semibold text-[#153653]">
                No laboratories found
              </p>
              <p className="mt-1 text-sm text-[#8298aa]">
                Adjust your search or create a laboratory.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderTests = () => (
    <div className="space-y-5">
      {renderToolbar("test", "Add Lab Test")}

      <div className="overflow-hidden rounded-2xl border border-[#d8e6ef] bg-white shadow-[0_8px_30px_rgba(21,54,83,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left">
            <thead className="border-b border-[#e0ebf2] bg-[#f7fafc]">
              <tr>
                {["Test", "Laboratory", "Category", "Sample", "Price", "TAT", "Status", "Actions"].map(
                  (head) => (
                    <th
                      key={head}
                      className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-[#55718a]"
                    >
                      {head}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf3f7]">
              {filteredTests.map((test) => (
                <tr key={test.id} className="transition hover:bg-[#f8fbfd]">
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => openView("test", test)}
                      className="text-left"
                    >
                      <p className="font-semibold text-[#153653]">{test.name}</p>
                      <p className="mt-1 font-mono text-xs text-[#8298aa]">
                        {test.test_code}
                      </p>
                    </button>
                  </td>
                  <td className="px-5 py-4 text-sm text-[#55718a]">
                    {labName(test.lab_id)}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#55718a]">
                    {test.category}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#55718a]">
                    {test.sample_type}
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-[#153653]">
                    ₹{Number(test.price || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#55718a]">
                    {test.turnaround_time_hours}h
                  </td>
                  <td className="px-5 py-4">
                    <span className={statusClass(test.is_active)}>
                      {test.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openView("test", test)}
                        className="rounded-lg p-2 text-[#55718a] hover:bg-[#eef5fa]"
                      >
                        <ChevronRight size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit("test", test)}
                        className="rounded-lg p-2 text-[#3478ed] hover:bg-blue-50"
                      >
                        <Edit3 size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ type: "test", item: test })}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!filteredTests.length && (
            <div className="px-6 py-16 text-center">
              <TestTube2 className="mx-auto text-[#a4b7c3]" size={34} />
              <p className="mt-3 font-semibold text-[#153653]">
                No laboratory tests found
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderSamples = () => (
    <div className="space-y-5">
      {renderToolbar("sample", "Register Sample", false)}

      <div className="overflow-hidden rounded-2xl border border-[#d8e6ef] bg-white shadow-[0_8px_30px_rgba(21,54,83,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left">
            <thead className="border-b border-[#e0ebf2] bg-[#f7fafc]">
              <tr>
                {["Sample", "Patient ID", "Test", "Collected", "Received", "Status", "Actions"].map(
                  (head) => (
                    <th
                      key={head}
                      className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-[#55718a]"
                    >
                      {head}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf3f7]">
              {filteredSamples.map((sample) => (
                <tr key={sample.id} className="transition hover:bg-[#f8fbfd]">
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => openView("sample", sample)}
                      className="text-left"
                    >
                      <p className="font-semibold text-[#153653]">
                        {sample.sample_number}
                      </p>
                      <p className="mt-1 text-xs text-[#8298aa]">
                        Sample #{sample.id}
                      </p>
                    </button>
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-[#153653]">
                    #{sample.patient_id}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#55718a]">
                    {testName(sample.lab_test_id)}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#55718a]">
                    {sample.collected_at
                      ? new Date(sample.collected_at).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#55718a]">
                    {sample.received_at
                      ? new Date(sample.received_at).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-5 py-4">
                    <span className={sampleStatusClass(sample.status)}>
                      {sample.status || "Unknown"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openView("sample", sample)}
                        className="rounded-lg p-2 text-[#55718a] hover:bg-[#eef5fa]"
                      >
                        <ChevronRight size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit("sample", sample)}
                        className="rounded-lg p-2 text-[#3478ed] hover:bg-blue-50"
                      >
                        <Edit3 size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({ type: "sample", item: sample })
                        }
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!filteredSamples.length && (
            <div className="px-6 py-16 text-center">
              <Beaker className="mx-auto text-[#a4b7c3]" size={34} />
              <p className="mt-3 font-semibold text-[#153653]">
                No samples found
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-5">
      {renderToolbar("report", "Create Report", false)}

      <div className="overflow-hidden rounded-2xl border border-[#d8e6ef] bg-white shadow-[0_8px_30px_rgba(21,54,83,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left">
            <thead className="border-b border-[#e0ebf2] bg-[#f7fafc]">
              <tr>
                {["Report", "Sample", "Result", "Status", "Reported", "Remarks", "Actions"].map(
                  (head) => (
                    <th
                      key={head}
                      className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-[#55718a]"
                    >
                      {head}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf3f7]">
              {filteredReports.map((report) => (
                <tr key={report.id} className="transition hover:bg-[#f8fbfd]">
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => openView("report", report)}
                      className="text-left"
                    >
                      <p className="font-semibold text-[#153653]">
                        {report.report_number}
                      </p>
                      <p className="mt-1 text-xs text-[#8298aa]">
                        Report #{report.id}
                      </p>
                    </button>
                  </td>
                  <td className="px-5 py-4 text-sm text-[#55718a]">
                    #{report.sample_id}
                  </td>
                  <td className="max-w-[280px] px-5 py-4">
                    <p className="truncate text-sm font-medium text-[#153653]">
                      {report.result}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={sampleStatusClass(report.status)}>
                      {report.status || "Unknown"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-[#55718a]">
                    {report.reported_at
                      ? new Date(report.reported_at).toLocaleString()
                      : "—"}
                  </td>
                  <td className="max-w-[220px] px-5 py-4">
                    <p className="truncate text-sm text-[#55718a]">
                      {report.remarks || "—"}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openView("report", report)}
                        className="rounded-lg p-2 text-[#55718a] hover:bg-[#eef5fa]"
                      >
                        <ChevronRight size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit("report", report)}
                        className="rounded-lg p-2 text-[#3478ed] hover:bg-blue-50"
                      >
                        <Edit3 size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({ type: "report", item: report })
                        }
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!filteredReports.length && (
            <div className="px-6 py-16 text-center">
              <FileBarChart className="mx-auto text-[#a4b7c3]" size={34} />
              <p className="mt-3 font-semibold text-[#153653]">
                No laboratory reports found
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderLabForm = () => (
    <form onSubmit={saveLab} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Laboratory Name" required>
          <input
            required
            maxLength={150}
            value={labForm.name}
            onChange={(e) => setLabForm({ ...labForm, name: e.target.value })}
            className={inputClass}
            placeholder="Central Diagnostic Laboratory"
          />
        </Field>

        <Field label="Laboratory Code" required>
          <input
            required
            maxLength={50}
            value={labForm.code}
            onChange={(e) =>
              setLabForm({ ...labForm, code: e.target.value.toUpperCase() })
            }
            className={inputClass}
            placeholder="CDL"
          />
        </Field>

        <Field label="Location">
          <input
            maxLength={255}
            value={labForm.location}
            onChange={(e) =>
              setLabForm({ ...labForm, location: e.target.value })
            }
            className={inputClass}
            placeholder="Ground Floor, Block A"
          />
        </Field>

        <Field label="Contact Number">
          <input
            maxLength={20}
            value={labForm.contact_number}
            onChange={(e) =>
              setLabForm({ ...labForm, contact_number: e.target.value })
            }
            className={inputClass}
            placeholder="+91 98765 43210"
          />
        </Field>
      </div>

      <Field label="Description">
        <textarea
          rows={4}
          value={labForm.description}
          onChange={(e) =>
            setLabForm({ ...labForm, description: e.target.value })
          }
          className={`${inputClass} resize-none`}
          placeholder="Describe laboratory services..."
        />
      </Field>

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#d8e6ef] bg-[#f8fbfd] p-4">
        <input
          type="checkbox"
          checked={labForm.is_active}
          onChange={(e) =>
            setLabForm({ ...labForm, is_active: e.target.checked })
          }
          className="h-4 w-4 accent-[#08b9d8]"
        />
        <span>
          <span className="block text-sm font-semibold text-[#153653]">
            Active laboratory
          </span>
          <span className="text-xs text-[#8298aa]">
            Laboratory remains available for hospital operations.
          </span>
        </span>
      </label>

      <div className="flex justify-end gap-3 border-t border-[#e4edf3] pt-5">
        <ActionButton variant="secondary" onClick={closeModal}>
          Cancel
        </ActionButton>
        <ActionButton disabled={saving}>
          {saving && <Loader2 size={17} className="animate-spin" />}
          {modal.mode === "edit" ? "Save Changes" : "Create Laboratory"}
        </ActionButton>
      </div>
    </form>
  );

  const renderTestForm = () => (
    <form onSubmit={saveTest} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Laboratory" required>
          <select
            required
            value={testForm.lab_id}
            onChange={(e) =>
              setTestForm({ ...testForm, lab_id: e.target.value })
            }
            className={inputClass}
          >
            <option value="">Select laboratory</option>
            {laboratories.map((lab) => (
              <option key={lab.id} value={lab.id}>
                {lab.name} ({lab.code})
              </option>
            ))}
          </select>
        </Field>

        <Field label="Test Code" required>
          <input
            required
            maxLength={50}
            value={testForm.test_code}
            onChange={(e) =>
              setTestForm({
                ...testForm,
                test_code: e.target.value.toUpperCase(),
              })
            }
            className={inputClass}
            placeholder="CBC"
          />
        </Field>

        <Field label="Test Name" required>
          <input
            required
            maxLength={150}
            value={testForm.name}
            onChange={(e) =>
              setTestForm({ ...testForm, name: e.target.value })
            }
            className={inputClass}
            placeholder="Complete Blood Count"
          />
        </Field>

        <Field label="Category" required>
          <input
            required
            maxLength={100}
            value={testForm.category}
            onChange={(e) =>
              setTestForm({ ...testForm, category: e.target.value })
            }
            className={inputClass}
            placeholder="Hematology"
          />
        </Field>

        <Field label="Sample Type" required>
          <input
            required
            maxLength={100}
            value={testForm.sample_type}
            onChange={(e) =>
              setTestForm({ ...testForm, sample_type: e.target.value })
            }
            className={inputClass}
            placeholder="Blood"
          />
        </Field>

        <Field label="Price">
          <input
            type="number"
            min="0"
            step="0.01"
            value={testForm.price}
            onChange={(e) =>
              setTestForm({ ...testForm, price: e.target.value })
            }
            className={inputClass}
          />
        </Field>

        <Field label="Normal Range">
          <input
            maxLength={255}
            value={testForm.normal_range}
            onChange={(e) =>
              setTestForm({ ...testForm, normal_range: e.target.value })
            }
            className={inputClass}
            placeholder="12–16 g/dL"
          />
        </Field>

        <Field label="Unit">
          <input
            maxLength={50}
            value={testForm.unit}
            onChange={(e) =>
              setTestForm({ ...testForm, unit: e.target.value })
            }
            className={inputClass}
            placeholder="g/dL"
          />
        </Field>

        <Field label="Turnaround Time (hours)" required>
          <input
            type="number"
            min="1"
            value={testForm.turnaround_time_hours}
            onChange={(e) =>
              setTestForm({
                ...testForm,
                turnaround_time_hours: e.target.value,
              })
            }
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Description">
        <textarea
          rows={3}
          value={testForm.description}
          onChange={(e) =>
            setTestForm({ ...testForm, description: e.target.value })
          }
          className={`${inputClass} resize-none`}
          placeholder="Test description..."
        />
      </Field>

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#d8e6ef] bg-[#f8fbfd] p-4">
        <input
          type="checkbox"
          checked={testForm.is_active}
          onChange={(e) =>
            setTestForm({ ...testForm, is_active: e.target.checked })
          }
          className="h-4 w-4 accent-[#08b9d8]"
        />
        <span className="min-w-0 truncate text-sm font-semibold text-[#153653]">
          Active laboratory test
        </span>
      </label>

      <div className="flex justify-end gap-3 border-t border-[#e4edf3] pt-5">
        <ActionButton variant="secondary" onClick={closeModal}>
          Cancel
        </ActionButton>
        <ActionButton disabled={saving}>
          {saving && <Loader2 size={17} className="animate-spin" />}
          {modal.mode === "edit" ? "Save Changes" : "Create Test"}
        </ActionButton>
      </div>
    </form>
  );

  const renderSampleForm = () => (
    <form onSubmit={saveSample} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Sample Number" required>
          <input
            required
            maxLength={50}
            value={sampleForm.sample_number}
            onChange={(e) =>
              setSampleForm({ ...sampleForm, sample_number: e.target.value })
            }
            className={inputClass}
            placeholder="SMP-2026-0001"
          />
        </Field>

        <Field label="Patient ID" required>
          <input
            required
            type="number"
            min="1"
            value={sampleForm.patient_id}
            onChange={(e) =>
              setSampleForm({ ...sampleForm, patient_id: e.target.value })
            }
            className={inputClass}
            placeholder="Patient database ID"
          />
        </Field>

        <Field label="Laboratory Test" required>
          <select
            required
            value={sampleForm.lab_test_id}
            onChange={(e) =>
              setSampleForm({ ...sampleForm, lab_test_id: e.target.value })
            }
            className={inputClass}
          >
            <option value="">Select test</option>
            {tests.map((test) => (
              <option key={test.id} value={test.id}>
                {test.name} ({test.test_code})
              </option>
            ))}
          </select>
        </Field>

        <Field label="Status" required>
          <select
            required
            value={sampleForm.status}
            onChange={(e) =>
              setSampleForm({ ...sampleForm, status: e.target.value })
            }
            className={inputClass}
          >
            <option value="collected">Collected</option>
            <option value="received">Received</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </Field>

        <Field label="Collected At">
          <input
            type="datetime-local"
            value={sampleForm.collected_at}
            onChange={(e) =>
              setSampleForm({ ...sampleForm, collected_at: e.target.value })
            }
            className={inputClass}
          />
        </Field>

        <Field label="Received At">
          <input
            type="datetime-local"
            value={sampleForm.received_at}
            onChange={(e) =>
              setSampleForm({ ...sampleForm, received_at: e.target.value })
            }
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Notes">
        <textarea
          rows={4}
          value={sampleForm.notes}
          onChange={(e) =>
            setSampleForm({ ...sampleForm, notes: e.target.value })
          }
          className={`${inputClass} resize-none`}
          placeholder="Collection or handling notes..."
        />
      </Field>

      <div className="flex justify-end gap-3 border-t border-[#e4edf3] pt-5">
        <ActionButton variant="secondary" onClick={closeModal}>
          Cancel
        </ActionButton>
        <ActionButton disabled={saving}>
          {saving && <Loader2 size={17} className="animate-spin" />}
          {modal.mode === "edit" ? "Save Changes" : "Register Sample"}
        </ActionButton>
      </div>
    </form>
  );

  const renderReportForm = () => (
    <form onSubmit={saveReport} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Sample" required>
          <select
            required
            value={reportForm.sample_id}
            onChange={(e) =>
              setReportForm({ ...reportForm, sample_id: e.target.value })
            }
            className={inputClass}
          >
            <option value="">Select sample</option>
            {samples.map((sample) => (
              <option key={sample.id} value={sample.id}>
                {sample.sample_number} — Patient #{sample.patient_id}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Report Number" required>
          <input
            required
            maxLength={50}
            value={reportForm.report_number}
            onChange={(e) =>
              setReportForm({ ...reportForm, report_number: e.target.value })
            }
            className={inputClass}
            placeholder="RPT-2026-0001"
          />
        </Field>

        <Field label="Status" required>
          <select
            required
            value={reportForm.status}
            onChange={(e) =>
              setReportForm({ ...reportForm, status: e.target.value })
            }
            className={inputClass}
          >
            <option value="completed">Completed</option>
            <option value="draft">Draft</option>
            <option value="review">Review</option>
            <option value="released">Released</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </Field>

        <Field label="Reported At">
          <input
            type="datetime-local"
            value={reportForm.reported_at}
            onChange={(e) =>
              setReportForm({ ...reportForm, reported_at: e.target.value })
            }
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Result" required>
        <textarea
          required
          rows={5}
          value={reportForm.result}
          onChange={(e) =>
            setReportForm({ ...reportForm, result: e.target.value })
          }
          className={`${inputClass} resize-none`}
          placeholder="Enter laboratory result..."
        />
      </Field>

      <Field label="Interpretation">
        <textarea
          rows={4}
          value={reportForm.interpretation}
          onChange={(e) =>
            setReportForm({
              ...reportForm,
              interpretation: e.target.value,
            })
          }
          className={`${inputClass} resize-none`}
          placeholder="Clinical interpretation..."
        />
      </Field>

      <Field label="Remarks">
        <textarea
          rows={3}
          value={reportForm.remarks}
          onChange={(e) =>
            setReportForm({ ...reportForm, remarks: e.target.value })
          }
          className={`${inputClass} resize-none`}
          placeholder="Additional remarks..."
        />
      </Field>

      <div className="flex justify-end gap-3 border-t border-[#e4edf3] pt-5">
        <ActionButton variant="secondary" onClick={closeModal}>
          Cancel
        </ActionButton>
        <ActionButton disabled={saving}>
          {saving && <Loader2 size={17} className="animate-spin" />}
          {modal.mode === "edit" ? "Save Changes" : "Create Report"}
        </ActionButton>
      </div>
    </form>
  );

  const renderView = () => {
    const item = modal.item;

    const fields =
      modal.type === "lab"
        ? [
            ["Laboratory Name", item.name],
            ["Code", item.code],
            ["Location", item.location],
            ["Contact", item.contact_number],
            ["Description", item.description],
            ["Status", item.is_active ? "Active" : "Inactive"],
          ]
        : modal.type === "test"
          ? [
              ["Test Name", item.name],
              ["Test Code", item.test_code],
              ["Laboratory", labName(item.lab_id)],
              ["Category", item.category],
              ["Sample Type", item.sample_type],
              ["Price", `₹${Number(item.price || 0).toLocaleString("en-IN")}`],
              ["Normal Range", item.normal_range],
              ["Unit", item.unit],
              ["Turnaround", `${item.turnaround_time_hours} hours`],
              ["Status", item.is_active ? "Active" : "Inactive"],
            ]
          : modal.type === "sample"
            ? [
                ["Sample Number", item.sample_number],
                ["Patient ID", `#${item.patient_id}`],
                ["Laboratory Test", testName(item.lab_test_id)],
                ["Status", item.status],
                ["Collected At", item.collected_at ? new Date(item.collected_at).toLocaleString() : "—"],
                ["Received At", item.received_at ? new Date(item.received_at).toLocaleString() : "—"],
                ["Notes", item.notes],
              ]
            : [
                ["Report Number", item.report_number],
                ["Sample ID", `#${item.sample_id}`],
                ["Status", item.status],
                ["Reported At", item.reported_at ? new Date(item.reported_at).toLocaleString() : "—"],
                ["Result", item.result],
                ["Interpretation", item.interpretation],
                ["Remarks", item.remarks],
              ];

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {fields.map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-[#e0ebf2] bg-[#f8fbfd] p-4"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-[#8298aa]">
                {label}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm font-semibold text-[#153653]">
                {value || "—"}
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-end border-t border-[#e4edf3] pt-5">
          <ActionButton variant="secondary" onClick={closeModal}>
            Close
          </ActionButton>
        </div>
      </div>
    );
  };

  const renderModal = () => {
    if (!modal) return null;

    if (modal.mode === "view") {
      return (
        <Modal
          title="Laboratory Record"
          subtitle="Detailed record information"
          onClose={closeModal}
          wide
        >
          {renderView()}
        </Modal>
      );
    }

    if (modal.type === "lab") {
      return (
        <Modal
          title={modal.mode === "edit" ? "Edit Laboratory" : "Add Laboratory"}
          subtitle="Maintain laboratory facility information"
          onClose={closeModal}
        >
          {renderLabForm()}
        </Modal>
      );
    }

    if (modal.type === "test") {
      return (
        <Modal
          title={modal.mode === "edit" ? "Edit Lab Test" : "Add Lab Test"}
          subtitle="Configure diagnostic test details"
          onClose={closeModal}
          wide
        >
          {renderTestForm()}
        </Modal>
      );
    }

    if (modal.type === "sample") {
      return (
        <Modal
          title={modal.mode === "edit" ? "Edit Sample" : "Register Laboratory Sample"}
          subtitle="Track specimen collection and processing"
          onClose={closeModal}
        >
          {renderSampleForm()}
        </Modal>
      );
    }

    return (
      <Modal
        title={modal.mode === "edit" ? "Edit Report" : "Create Laboratory Report"}
        subtitle="Record diagnostic findings and interpretation"
        onClose={closeModal}
        wide
      >
        {renderReportForm()}
      </Modal>
    );
  };

  return (
    <div className="min-h-[calc(100vh-76px)] bg-[#eef5fa] p-4 sm:p-6 lg:p-7">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#08a9c5]">
              <ShieldCheck size={15} />
              Clinical Diagnostics
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#153653] sm:text-4xl">
              Laboratory
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#55718a] sm:text-base">
              Manage laboratory facilities, diagnostic tests, specimens and
              laboratory reports from one centralized workspace.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-[#d8e6ef] bg-white px-4 py-3 shadow-sm">
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <CheckCircle2 size={19} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8298aa]">
                System Status
              </p>
              <p className="text-sm font-bold text-[#153653]">
                Laboratory services active
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 shrink-0" size={18} />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="ml-auto rounded-lg p-1 hover:bg-red-100"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            <CheckCircle2 size={18} />
            {success}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-2xl border border-[#d8e6ef] bg-white"
              />
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <div className="flex min-w-max gap-2 rounded-2xl border border-[#d8e6ef] bg-white p-2 shadow-sm">
                {tabs.map(({ key, label, icon: Icon }) => {
                  const active = activeTab === key;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setActiveTab(key);
                        setSearch("");
                        setStatusFilter("all");
                      }}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                        active
                          ? "bg-gradient-to-r from-[#08b9d8] to-[#3478ed] text-white shadow-[0_6px_18px_rgba(52,120,237,0.18)]"
                          : "text-[#55718a] hover:bg-[#eef5fa] hover:text-[#153653]"
                      }`}
                    >
                      <Icon size={17} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {activeTab === "overview" && renderOverview()}
            {activeTab === "labs" && renderLabs()}
            {activeTab === "tests" && renderTests()}
            {activeTab === "samples" && renderSamples()}
            {activeTab === "reports" && renderReports()}
          </>
        )}
      </div>

      {renderModal()}

      {deleteTarget && (
        <Modal
          title="Delete Record?"
          subtitle="This action cannot be undone."
          onClose={() => !saving && setDeleteTarget(null)}
        >
          <div className="space-y-5">
            <div className="rounded-xl border border-red-100 bg-red-50 p-4">
              <div className="flex gap-3">
                <AlertCircle className="shrink-0 text-red-600" size={20} />
                <div>
                  <p className="font-semibold text-red-800">
                    Confirm permanent deletion
                  </p>
                  <p className="mt-1 text-sm text-red-700">
                    You are deleting{" "}
                    <strong>
                      {deleteTarget.type === "lab"
                        ? deleteTarget.item.name
                        : deleteTarget.type === "test"
                          ? deleteTarget.item.name
                          : deleteTarget.type === "sample"
                            ? deleteTarget.item.sample_number
                            : deleteTarget.item.report_number}
                    </strong>
                    .
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <ActionButton
                variant="secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={saving}
              >
                Cancel
              </ActionButton>
              <ActionButton
                variant="danger"
                onClick={confirmDelete}
                disabled={saving}
              >
                {saving && <Loader2 size={17} className="animate-spin" />}
                Delete
              </ActionButton>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}


