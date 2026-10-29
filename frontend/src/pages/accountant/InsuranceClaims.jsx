import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  DollarSign,
  FileCheck2,
  FilePlus2,
  Pencil,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  XCircle,
  X,
} from "lucide-react";

import DocumentPdfActions from "../../components/pdf/DocumentPdfActions";
import api from "../../services/api";
import { getPatients } from "../../services/patientApi";

import {
  createInsuranceClaim,
  deleteInsuranceClaim,
  listInsuranceClaims,
  updateInsuranceClaim,
} from "../../services/insuranceClaimsApi";

const today = new Date().toISOString().slice(0, 10);

const initialForm = {
  claim_number: "",
  insurance_id: "",
  patient_id: "",
  claim_date: today,
  admission_id: "",
  claim_amount: "",
  approved_amount: "0",
  rejected_amount: "0",
  status: "submitted",
  settlement_date: "",
  rejection_reason: "",
  remarks: "",
};

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const dateValue = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const normalizeError = (error) => {
  const detail = error?.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail.map((item) => item?.msg || "Validation error").join(", ");
  }

  return (
    detail ||
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong."
  );
};

const statusLabel = (status) =>
  String(status || "submitted")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const statusClass = (status) => {
  const value = String(status || "").toLowerCase();

  if (value === "approved" || value === "settled") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (value === "rejected") {
    return "bg-red-50 text-red-700 border-red-200";
  }

  if (value === "submitted" || value === "pending" || value === "processing") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  return "bg-slate-50 text-slate-700 border-slate-200";
};

function StatCard({ icon: Icon, title, value, subtitle }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
          )}
        </div>

        <div className="rounded-xl bg-cyan-50 p-3 text-cyan-700">
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

export default function InsuranceClaims() {
  const [claims, setClaims] = useState([]);
  const [patients, setPatients] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [lookupError, setLookupError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);

  const loadClaims = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await listInsuranceClaims(
        statusFilter === "all" ? {} : { status: statusFilter }
      );

      setClaims(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(normalizeError(err));
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadClaims();
  }, [loadClaims]);

  useEffect(() => {
    let active = true;
    async function loadLookups() {
      setLookupError("");
      try {
        const [patientResult, policyResult] = await Promise.all([
          getPatients({ skip: 0, limit: 500, is_active: true }),
          api.get("/insurance", { params: { status_value: "active" } }),
        ]);
        if (!active) return;
        const patientRows = Array.isArray(patientResult)
          ? patientResult
          : (patientResult?.items || patientResult?.data || patientResult?.patients || []);
        const policyRows = Array.isArray(policyResult.data)
          ? policyResult.data
          : (policyResult.data?.items || policyResult.data?.data || []);
        setPatients(patientRows);
        setPolicies(policyRows);
      } catch (err) {
        if (active) setLookupError(normalizeError(err));
      }
    }
    loadLookups();
    return () => { active = false; };
  }, []);

  const patientNameById = useMemo(() => new Map(patients.map((p) => [
    Number(p.id), [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(" ").trim() || p.full_name || `Patient #${p.id}`
  ])), [patients]);
  const policyById = useMemo(() => new Map(policies.map((p) => [Number(p.id), p])), [policies]);
  const patientLabel = (id) => `${patientNameById.get(Number(id)) || `Patient #${id}`} (ID #${id})`;
  const policyLabel = (policy) => `${policy.insurance_provider || "Insurance provider"} — ${policy.policy_number || `Policy #${policy.id}`} (Patient #${policy.patient_id})`;

  const filteredClaims = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return claims;

    return claims.filter((claim) => {
      const text = [
        claim.claim_number,
        claim.status,
        claim.patient_name,
        patientNameById.get(Number(claim.patient_id)),
        claim.patient_id,
        claim.insurance_provider,
        claim.insurance_id,
        claim.admission_id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(query);
    });
  }, [claims, search, patientNameById]);

  const stats = useMemo(() => {
    const total = claims.length;

    const submitted = claims.filter((c) =>
      ["submitted", "pending", "processing"].includes(
        String(c.status || "").toLowerCase()
      )
    ).length;

    const approved = claims.filter((c) =>
      ["approved", "settled"].includes(
        String(c.status || "").toLowerCase()
      )
    ).length;

    const rejected = claims.filter(
      (c) => String(c.status || "").toLowerCase() === "rejected"
    ).length;

    const claimed = claims.reduce(
      (sum, c) => sum + Number(c.claim_amount || 0),
      0
    );

    const approvedAmount = claims.reduce(
      (sum, c) => sum + Number(c.approved_amount || 0),
      0
    );

    const rejectedAmount = claims.reduce(
      (sum, c) => sum + Number(c.rejected_amount || 0),
      0
    );

    return {
      total,
      submitted,
      approved,
      rejected,
      claimed,
      approvedAmount,
      rejectedAmount,
    };
  }, [claims]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...initialForm,
      claim_date: new Date().toISOString().slice(0, 10),
    });
    setError("");
    setNotice("");
    setShowModal(true);
  };

  const openEdit = (claim) => {
    setEditingId(claim.id);

    setForm({
      claim_number: claim.claim_number || "",
      insurance_id: claim.insurance_id ?? "",
      patient_id: claim.patient_id ?? "",
      claim_date: claim.claim_date
        ? String(claim.claim_date).slice(0, 10)
        : today,
      admission_id: claim.admission_id ?? "",
      claim_amount: claim.claim_amount ?? "",
      approved_amount: claim.approved_amount ?? "0",
      rejected_amount: claim.rejected_amount ?? "0",
      status: claim.status || "submitted",
      settlement_date: claim.settlement_date
        ? String(claim.settlement_date).slice(0, 10)
        : "",
      rejection_reason: claim.rejection_reason || "",
      remarks: claim.remarks || "",
    });

    setError("");
    setNotice("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingId(null);
    setForm(initialForm);
  };

  const updateField = (name, value) => {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();

    setError("");
    setNotice("");
    if (!form.patient_id || !form.insurance_id) {
      setError("Select a patient and that patient's insurance policy before saving the claim.");
      return;
    }
    setSaving(true);

    const payload = {
      claim_number: form.claim_number.trim(),
      insurance_id: Number(form.insurance_id),
      patient_id: Number(form.patient_id),
      claim_date: form.claim_date,
      admission_id: form.admission_id
        ? Number(form.admission_id)
        : null,
      claim_amount: Number(form.claim_amount || 0),
      approved_amount: Number(form.approved_amount || 0),
      rejected_amount: Number(form.rejected_amount || 0),
      status: form.status.trim() || "submitted",
      settlement_date: form.settlement_date || null,
      rejection_reason: form.rejection_reason.trim() || null,
      remarks: form.remarks.trim() || null,
    };

    try {
      if (editingId) {
        await updateInsuranceClaim(editingId, payload);
        setNotice("Insurance claim updated successfully.");
      } else {
        await createInsuranceClaim(payload);
        setNotice("Insurance claim created successfully.");
      }

      setShowModal(false);
      setEditingId(null);
      setForm(initialForm);

      await loadClaims();
    } catch (err) {
      setError(normalizeError(err));
    } finally {
      setSaving(false);
    }
  };

  const removeClaim = async (claim) => {
    const confirmed = window.confirm(
      `Delete insurance claim ${claim.claim_number}?`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      await deleteInsuranceClaim(claim.id);
      setNotice("Insurance claim deleted successfully.");
      await loadClaims();
    } catch (err) {
      setError(normalizeError(err));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
              <ShieldCheck size={14} />
              Insurance Finance
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Insurance Claims
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage hospital insurance claims, approvals and settlements.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadClaims}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-cyan-700 hover:to-blue-700"
            >
              <FilePlus2 size={17} />
              New Claim
            </button>
          </div>
        </div>

        {notice && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            <CheckCircle2 size={18} />
            {notice}
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={FileCheck2}
            title="Total Claims"
            value={stats.total}
            subtitle="Current claim records"
          />

          <StatCard
            icon={Clock3}
            title="Pending / Submitted"
            value={stats.submitted}
            subtitle="Awaiting processing"
          />

          <StatCard
            icon={CheckCircle2}
            title="Approved / Settled"
            value={stats.approved}
            subtitle={money(stats.approvedAmount)}
          />

          <StatCard
            icon={DollarSign}
            title="Total Claimed"
            value={money(stats.claimed)}
            subtitle={`${stats.rejected} rejected claims`}
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search claim number, patient or insurance ID..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="approved">Approved</option>
              <option value="settled">Settled</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="font-semibold text-slate-900">
                Claim Register
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Showing {filteredClaims.length} of {claims.length} claims
              </p>
            </div>

            <div className="hidden items-center gap-2 text-xs text-slate-500 md:flex">
              <DollarSign size={15} />
              Rejected amount: {money(stats.rejectedAmount)}
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                <RefreshCw size={18} className="animate-spin" />
                Loading insurance claims...
              </div>
            </div>
          ) : filteredClaims.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
              <div className="rounded-2xl bg-slate-100 p-4 text-slate-500">
                <FileCheck2 size={28} />
              </div>

              <h3 className="mt-4 font-semibold text-slate-800">
                No insurance claims found
              </h3>

              <p className="mt-1 max-w-md text-sm text-slate-500">
                No records match the current search or status filter.
              </p>

              <button
                type="button"
                onClick={openCreate}
                className="mt-4 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
              >
                Create First Claim
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3">Claim</th>
                    <th className="px-5 py-3">Patient</th>
                    <th className="px-5 py-3">Insurance</th>
                    <th className="px-5 py-3">Claim Date</th>
                    <th className="px-5 py-3 text-right">Claimed</th>
                    <th className="px-5 py-3 text-right">Approved</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredClaims.map((claim) => (
                    <tr
                      key={claim.id}
                      className="transition hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">
                          {claim.claim_number}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          ID #{claim.id}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {claim.patient_name || patientNameById.get(Number(claim.patient_id)) || `Patient #${claim.patient_id}`}
                        <div className="mt-1 text-xs text-slate-400">Patient ID #{claim.patient_id}</div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {claim.insurance_provider || policyById.get(Number(claim.insurance_id))?.insurance_provider || "Insurance policy"}
                        <div className="mt-1 text-xs text-slate-400">Policy #{policyById.get(Number(claim.insurance_id))?.policy_number || claim.insurance_id}</div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {dateValue(claim.claim_date)}
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-semibold text-slate-800">
                        {money(claim.claim_amount)}
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-semibold text-emerald-700">
                        {money(claim.approved_amount)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(
                            claim.status
                          )}`}
                        >
                          {statusLabel(claim.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap justify-end gap-2">
                          <DocumentPdfActions
                            title="Insurance Claim"
                            record={claim}
                            fields={[
                              ["Claim Number", claim.claim_number],
                              ["Patient", claim.patient_name || patientNameById.get(Number(claim.patient_id)) || `Patient #${claim.patient_id}`],
                              ["Patient ID", claim.patient_id],
                              ["Insurance Provider", claim.insurance_provider || policyById.get(Number(claim.insurance_id))?.insurance_provider || "Insurance policy"],
                              ["Policy Number", policyById.get(Number(claim.insurance_id))?.policy_number || claim.insurance_id],
                              ["Claim Date", dateValue(claim.claim_date)],
                              ["Claim Amount", money(claim.claim_amount)],
                              ["Approved Amount", money(claim.approved_amount)],
                              ["Rejected Amount", money(claim.rejected_amount)],
                              ["Status", statusLabel(claim.status)],
                              ["Settlement Date", dateValue(claim.settlement_date)],
                              ["Rejection Reason", claim.rejection_reason || "—"],
                              ["Remarks", claim.remarks || "—"],
                            ]}
                          />
                          <button
                            type="button"
                            onClick={() => openEdit(claim)}
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
                            title="Edit claim"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => removeClaim(claim)}
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                            title="Delete claim"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingId ? "Edit Insurance Claim" : "Create Insurance Claim"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Enter the claim details exactly as required by the hospital
                  insurance workflow.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-6 p-6">
              {(error || lookupError) && (
                <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <XCircle size={18} className="shrink-0" />
                  {error || lookupError}
                </div>
              )}
              {patients.length === 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  No active patients were loaded. Check patient API access before creating a claim.
                </div>
              )}
              {form.patient_id && !policies.some((p) => Number(p.patient_id) === Number(form.patient_id)) && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  This patient has no insurance policy available. Create/activate the patient's insurance policy before submitting a claim.
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Field
                  label="Claim Number"
                  required
                  value={form.claim_number}
                  onChange={(v) => updateField("claim_number", v)}
                  placeholder="CLM-2026-001"
                />

                <SelectField
                  label="Patient"
                  required
                  value={form.patient_id}
                  onChange={(v) => {
                    updateField("patient_id", v);
                    const matchingPolicy = policies.find((p) => Number(p.patient_id) === Number(v));
                    updateField("insurance_id", matchingPolicy ? String(matchingPolicy.id) : "");
                  }}
                  options={patients.map((p) => ({
                    value: String(p.id),
                    label: `${[p.first_name, p.middle_name, p.last_name].filter(Boolean).join(" ").trim() || p.full_name || `Patient #${p.id}`} (ID #${p.id})`,
                  }))}
                  placeholder="Select patient"
                />

                <SelectField
                  label="Insurance Policy"
                  required
                  value={form.insurance_id}
                  onChange={(v) => updateField("insurance_id", v)}
                  options={policies.filter((p) => !form.patient_id || Number(p.patient_id) === Number(form.patient_id)).map((p) => ({ value: String(p.id), label: policyLabel(p) }))}
                  placeholder={form.patient_id ? "Select policy for patient" : "Select patient first"}
                />

                <Field
                  label="Claim Date"
                  type="date"
                  required
                  value={form.claim_date}
                  onChange={(v) => updateField("claim_date", v)}
                />

                <NumberField
                  label="Admission ID"
                  value={form.admission_id}
                  onChange={(v) => updateField("admission_id", v)}
                />

                <NumberField
                  label="Claim Amount"
                  required
                  step="0.01"
                  value={form.claim_amount}
                  onChange={(v) => updateField("claim_amount", v)}
                />

                <NumberField
                  label="Approved Amount"
                  step="0.01"
                  value={form.approved_amount}
                  onChange={(v) => updateField("approved_amount", v)}
                />

                <NumberField
                  label="Rejected Amount"
                  step="0.01"
                  value={form.rejected_amount}
                  onChange={(v) => updateField("rejected_amount", v)}
                />

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Status
                  </label>

                  <select
                    value={form.status}
                    onChange={(e) =>
                      updateField("status", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                  >
                    <option value="submitted">Submitted</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="approved">Approved</option>
                    <option value="settled">Settled</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <Field
                  label="Settlement Date"
                  type="date"
                  value={form.settlement_date}
                  onChange={(v) => updateField("settlement_date", v)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <TextAreaField
                  label="Rejection Reason"
                  value={form.rejection_reason}
                  onChange={(v) =>
                    updateField("rejection_reason", v)
                  }
                  placeholder="Required when applicable..."
                />

                <TextAreaField
                  label="Remarks"
                  value={form.remarks}
                  onChange={(v) => updateField("remarks", v)}
                  placeholder="Additional claim remarks..."
                />
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-cyan-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <RefreshCw size={16} className="animate-spin" />
                  )}
                  {editingId ? "Update Claim" : "Create Claim"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder, required = false }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}{required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <select value={value ?? ""} required={required} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100">
        <option value="">{placeholder || "Select an option"}</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  required = false,
  step = "1",
}) {
  return (
    <Field
      label={label}
      value={value}
      onChange={onChange}
      type="number"
      required={required}
      placeholder={required ? "Enter value" : "Optional"}
      step={step}
    />
  );
}

function TextAreaField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
      />
    </div>
  );
}
