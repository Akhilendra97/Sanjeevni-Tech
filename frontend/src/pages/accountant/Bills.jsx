import DocumentPdfActions from "../../components/pdf/DocumentPdfActions";
import React, { useEffect, useMemo, useState } from "react";
import PatientSelect from "../../components/accountant/PatientSelect";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Edit3,
  FileText,
  IndianRupee,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
  Wallet,
} from "lucide-react";

import {
  createBilling,
  deleteBilling,
  listBillings,
  updateBilling,
} from "../../services/billingApi";

const today = new Date().toISOString().slice(0, 10);

const EMPTY_FORM = {
  patient_id: "",
  bill_number: "",
  bill_date: today,
  bill_type: "Hospital",
  description: "",
  subtotal: "",
  discount: "",
  tax: "",
  total_amount: "",
  paid_amount: "",
  payment_status: "pending",
  payment_method: "",
  notes: "",
};

function formatCurrency(value) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getArray(data) {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.items)) return data.items;

  if (Array.isArray(data?.data)) return data.data;

  return [];
}

function normalizePaymentStatus(status) {
  return String(status || "pending")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function statusLabel(status) {
  const normalized = normalizePaymentStatus(status);

  const labels = {
    pending: "Pending",
    paid: "Paid",
    partial: "Partially Paid",
    partially_paid: "Partially Paid",
    cancelled: "Cancelled",
    overdue: "Overdue",
  };

  return labels[normalized] || String(status || "Pending");
}

function statusClasses(status) {
  const normalized = normalizePaymentStatus(status);

  if (normalized === "paid") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (
    normalized === "partial" ||
    normalized === "partially_paid"
  ) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  if (
    normalized === "cancelled"
  ) {
    return "bg-red-50 text-red-700 border-red-200";
  }

  if (normalized === "overdue") {
    return "bg-orange-50 text-orange-700 border-orange-200";
  }

  return "bg-slate-50 text-slate-700 border-slate-200";
}

function calculateTotal(form) {
  const subtotal = Number(form.subtotal || 0);
  const discount = Number(form.discount || 0);
  const tax = Number(form.tax || 0);

  return Math.max(0, subtotal - discount + tax);
}

function buildPayload(form, isCreate) {
  const calculatedTotal = calculateTotal(form);

  const payload = {
    patient_id: Number(form.patient_id),
    bill_date: form.bill_date,
    bill_type: form.bill_type.trim(),
    description: form.description.trim() || null,
    subtotal: Number(form.subtotal || 0),
    discount: Number(form.discount || 0),
    tax: Number(form.tax || 0),
    total_amount:
      form.total_amount === ""
        ? calculatedTotal
        : Number(form.total_amount),
    paid_amount: Number(form.paid_amount || 0),
    payment_status: form.payment_status,
    payment_method: form.payment_method.trim() || null,
    notes: form.notes.trim() || null,
  };

  if (isCreate) {
    payload.bill_number = form.bill_number.trim();
  }

  return payload;
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  description,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

function Modal({
  title,
  subtitle,
  onClose,
  children,
  saving,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {title}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  required = false,
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </span>

      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50";

export default function Bills() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  async function loadBills() {
    setLoading(true);
    setError("");

    try {
      const response = await listBillings();
      setBills(getArray(response));
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load billing records."
      );
      setBills([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBills();
  }, []);

  const filteredBills = useMemo(() => {
    const query = search.trim().toLowerCase();

    return bills.filter((bill) => {
      const matchesStatus =
        statusFilter === "all" ||
        normalizePaymentStatus(bill.payment_status) ===
          statusFilter;

      if (!matchesStatus) return false;

      if (!query) return true;

      return [
        bill.bill_number,
        bill.bill_type,
        bill.description,
        bill.payment_method,
        String(bill.patient_id),
        bill.notes,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query)
        );
    });
  }, [bills, search, statusFilter]);

  const summary = useMemo(() => {
    let total = 0;
    let paid = 0;
    let outstanding = 0;

    for (const bill of bills) {
      const billTotal = Number(
        bill.total_amount || 0
      );

      const billPaid = Number(
        bill.paid_amount || 0
      );

      total += billTotal;
      paid += billPaid;
      outstanding += Math.max(
        0,
        billTotal - billPaid
      );
    }

    return {
      total,
      paid,
      outstanding,
      count: bills.length,
    };
  }, [bills]);

  function openCreate() {
    setEditingBill(null);

    setForm({
      ...EMPTY_FORM,
      bill_number: `BILL-${Date.now()}`,
    });

    setError("");
    setShowModal(true);
  }

  function openEdit(bill) {
    setEditingBill(bill);

    setForm({
      patient_id: bill.patient_id ?? "",
      bill_number: bill.bill_number ?? "",
      bill_date:
        bill.bill_date ||
        today,
      bill_type:
        bill.bill_type ||
        "Hospital",
      description:
        bill.description ||
        "",
      subtotal:
        bill.subtotal ?? "",
      discount:
        bill.discount ?? "",
      tax:
        bill.tax ?? "",
      total_amount:
        bill.total_amount ?? "",
      paid_amount:
        bill.paid_amount ?? "",
      payment_status:
        bill.payment_status ||
        "pending",
      payment_method:
        bill.payment_method ||
        "",
      notes:
        bill.notes ||
        "",
    });

    setError("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingBill(null);
    setForm(EMPTY_FORM);
  }

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    const patientId = Number(form.patient_id);

    if (!Number.isInteger(patientId) || patientId <= 0) {
      setError("Please enter a valid Patient ID.");
      return;
    }

    if (!form.bill_date) {
      setError("Bill date is required.");
      return;
    }

    if (
      !form.bill_type ||
      form.bill_type.trim().length < 2
    ) {
      setError("Bill type must contain at least 2 characters.");
      return;
    }

    if (
      !editingBill &&
      (!form.bill_number ||
        form.bill_number.trim().length < 2)
    ) {
      setError("Bill number is required.");
      return;
    }

    const subtotal = Number(form.subtotal || 0);
    const discount = Number(form.discount || 0);
    const tax = Number(form.tax || 0);
    const paid = Number(form.paid_amount || 0);

    if (
      [subtotal, discount, tax, paid].some(
        (value) =>
          !Number.isFinite(value) ||
          value < 0
      )
    ) {
      setError("Financial amounts cannot be negative.");
      return;
    }

    const total =
      form.total_amount === ""
        ? calculateTotal(form)
        : Number(form.total_amount);

    if (!Number.isFinite(total) || total < 0) {
      setError("Total amount is invalid.");
      return;
    }

    if (paid > total) {
      setError(
        "Paid amount cannot be greater than total amount."
      );
      return;
    }

    setSaving(true);

    try {
      const payload = buildPayload(
        form,
        !editingBill
      );

      if (editingBill) {
        await updateBilling(
          editingBill.id,
          payload
        );
      } else {
        await createBilling(payload);
      }

      await loadBills();
      closeModal();
    } catch (err) {
      setError(
        err?.message ||
          "Unable to save billing record."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(bill) {
    const confirmed = window.confirm(
      `Delete bill ${bill.bill_number}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setError("");

    try {
      await deleteBilling(bill.id);
      await loadBills();
    } catch (err) {
      setError(
        err?.message ||
          "Unable to delete billing record."
      );
    }
  }

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px]">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-cyan-700">
              <Wallet size={17} />
              Accountant Workspace
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Bills
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage hospital billing records and payment status.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadBills}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:from-cyan-700 hover:to-blue-700"
            >
              <Plus size={18} />
              Create Bill
            </button>
          </div>
        </div>

        {/* Error */}
        {error && !showModal && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle
              size={19}
              className="mt-0.5 shrink-0"
            />

            <div className="flex-1">
              <p className="font-semibold">
                Billing request failed
              </p>
              <p className="mt-0.5">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="rounded-lg p-1 hover:bg-red-100"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Summary */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Billed"
            value={formatCurrency(summary.total)}
            icon={IndianRupee}
            description={`${summary.count} billing records`}
          />

          <SummaryCard
            title="Paid Amount"
            value={formatCurrency(summary.paid)}
            icon={CheckCircle2}
            description="Amount received against bills"
          />

          <SummaryCard
            title="Outstanding"
            value={formatCurrency(summary.outstanding)}
            icon={AlertCircle}
            description="Remaining amount to collect"
          />

          <SummaryCard
            title="Bill Records"
            value={String(summary.count)}
            icon={FileText}
            description="Records returned by billing API"
          />
        </div>

        {/* Main card */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative min-w-0 flex-1 lg:max-w-xl">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search bill number, patient ID, type..."
                className={`${inputClass} pl-10`}
              />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className={`${inputClass} appearance-none pr-10 lg:w-48`}
              >
                <option value="all">
                  All payment statuses
                </option>
                <option value="pending">
                  Pending
                </option>
                <option value="paid">
                  Paid
                </option>
                <option value="partial">
                  Partial
                </option>
                <option value="partially_paid">
                  Partially Paid
                </option>
                <option value="overdue">
                  Overdue
                </option>
                <option value="cancelled">
                  Cancelled
                </option>
              </select>

              <ChevronDown
                size={17}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-slate-500">
                <Loader2
                  size={30}
                  className="animate-spin text-cyan-600"
                />
                <span className="text-sm font-medium">
                  Loading billing records...
                </span>
              </div>
            </div>
          ) : filteredBills.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <FileText size={25} />
              </div>

              <h3 className="mt-4 text-base font-bold text-slate-900">
                No billing records found
              </h3>

              <p className="mt-1 max-w-md text-sm text-slate-500">
                {bills.length === 0
                  ? "There are currently no billing records returned by the hospital billing API."
                  : "Try changing your search or payment-status filter."}
              </p>

              {bills.length === 0 && (
                <button
                  type="button"
                  onClick={openCreate}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-cyan-700"
                >
                  <Plus size={17} />
                  Create First Bill
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-left">
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Bill
                    </th>

                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Patient
                    </th>

                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Date
                    </th>

                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Type
                    </th>

                    <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                      Total
                    </th>

                    <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                      Paid
                    </th>

                    <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                      Due
                    </th>

                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredBills.map((bill) => {
                    const total = Number(
                      bill.total_amount || 0
                    );

                    const paid = Number(
                      bill.paid_amount || 0
                    );

                    const due = Math.max(
                      0,
                      total - paid
                    );

                    return (
                      <tr
                        key={bill.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900">
                            {bill.bill_number}
                          </div>

                          {bill.description && (
                            <div className="mt-0.5 max-w-[230px] truncate text-xs text-slate-500">
                              {bill.description}
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-semibold text-slate-800">
                            {bill.patient_name || `Patient #${bill.patient_id}`}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-sm text-slate-700">
                            <CalendarDays
                              size={15}
                              className="text-slate-400"
                            />
                            {formatDate(
                              bill.bill_date
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm font-medium text-slate-700">
                            {bill.bill_type}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right font-bold text-slate-900">
                          {formatCurrency(total)}
                        </td>

                        <td className="px-5 py-4 text-right font-semibold text-emerald-700">
                          {formatCurrency(paid)}
                        </td>

                        <td className="px-5 py-4 text-right font-semibold text-orange-700">
                          {formatCurrency(due)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusClasses(
                              bill.payment_status
                            )}`}
                          >
                            {statusLabel(
                              bill.payment_status
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-wrap justify-end gap-2">
                            <DocumentPdfActions title={`Bill ${bill.bill_number || bill.id}`} record={{ bill_number: bill.bill_number, patient_id: bill.patient_id, patient_name: bill.patient_name, bill_date: bill.bill_date, bill_type: bill.bill_type, description: bill.description, subtotal: bill.subtotal, discount: bill.discount, tax: bill.tax, total_amount: total, paid_amount: paid, due_amount: due, payment_status: bill.payment_status, payment_method: bill.payment_method, notes: bill.notes }} />
                            <button
                              type="button"
                              onClick={() =>
                                openEdit(bill)
                              }
                              className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
                              title="Edit bill"
                            >
                              <Edit3 size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(bill)
                              }
                              className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                              title="Delete bill"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredBills.length > 0 && (
            <div className="border-t border-slate-200 bg-slate-50/60 px-5 py-3 text-xs font-medium text-slate-500">
              Showing {filteredBills.length} of{" "}
              {bills.length} billing records
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <Modal
          title={
            editingBill
              ? "Edit Billing Record"
              : "Create Billing Record"
          }
          subtitle={
            editingBill
              ? `Update ${editingBill.bill_number}`
              : "Add a new hospital billing record."
          }
          onClose={closeModal}
          saving={saving}
        >
          <form
            onSubmit={handleSubmit}
            className="p-6"
          >
            {error && (
              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0"
                />

                <span>{error}</span>
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <PatientSelect
                label="Patient"
                value={form.patient_id}
                onChange={(value) => updateField("patient_id", value)}
                required
              />

              <Field
                label="Bill Number"
                required={!editingBill}
              >
                <input
                  type="text"
                  value={form.bill_number}
                  onChange={(event) =>
                    updateField(
                      "bill_number",
                      event.target.value
                    )
                  }
                  className={`${inputClass} ${
                    editingBill
                      ? "bg-slate-50 text-slate-500"
                      : ""
                  }`}
                  placeholder="BILL-1001"
                  disabled={Boolean(editingBill)}
                  required={!editingBill}
                />
              </Field>

              <Field
                label="Bill Date"
                required
              >
                <input
                  type="date"
                  value={form.bill_date}
                  onChange={(event) =>
                    updateField(
                      "bill_date",
                      event.target.value
                    )
                  }
                  className={inputClass}
                  required
                />
              </Field>

              <Field
                label="Bill Type"
                required
              >
                <select
                  value={form.bill_type}
                  onChange={(event) =>
                    updateField(
                      "bill_type",
                      event.target.value
                    )
                  }
                  className={inputClass}
                  required
                >
                  <option value="Hospital">
                    Hospital
                  </option>
                  <option value="Consultation">
                    Consultation
                  </option>
                  <option value="Admission">
                    Admission
                  </option>
                  <option value="Laboratory">
                    Laboratory
                  </option>
                  <option value="Radiology">
                    Radiology
                  </option>
                  <option value="Pharmacy">
                    Pharmacy
                  </option>
                  <option value="Surgery">
                    Surgery
                  </option>
                  <option value="Emergency">
                    Emergency
                  </option>
                  <option value="Other">
                    Other
                  </option>
                </select>
              </Field>

              <Field label="Subtotal">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.subtotal}
                  onChange={(event) =>
                    updateField(
                      "subtotal",
                      event.target.value
                    )
                  }
                  className={inputClass}
                  placeholder="0.00"
                />
              </Field>

              <Field label="Discount">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.discount}
                  onChange={(event) =>
                    updateField(
                      "discount",
                      event.target.value
                    )
                  }
                  className={inputClass}
                  placeholder="0.00"
                />
              </Field>

              <Field label="Tax">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.tax}
                  onChange={(event) =>
                    updateField(
                      "tax",
                      event.target.value
                    )
                  }
                  className={inputClass}
                  placeholder="0.00"
                />
              </Field>

              <Field label="Total Amount">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.total_amount}
                  onChange={(event) =>
                    updateField(
                      "total_amount",
                      event.target.value
                    )
                  }
                  className={inputClass}
                  placeholder={String(
                    calculateTotal(form)
                  )}
                />

                <p className="mt-1 text-xs text-slate-400">
                  Leave blank to calculate subtotal − discount + tax.
                </p>
              </Field>

              <Field label="Paid Amount">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.paid_amount}
                  onChange={(event) =>
                    updateField(
                      "paid_amount",
                      event.target.value
                    )
                  }
                  className={inputClass}
                  placeholder="0.00"
                />
              </Field>

              <Field label="Payment Status">
                <select
                  value={form.payment_status}
                  onChange={(event) =>
                    updateField(
                      "payment_status",
                      event.target.value
                    )
                  }
                  className={inputClass}
                >
                  <option value="pending">
                    Pending
                  </option>
                  <option value="paid">
                    Paid
                  </option>
                  <option value="partial">
                    Partial
                  </option>
                  <option value="partially_paid">
                    Partially Paid
                  </option>
                  <option value="overdue">
                    Overdue
                  </option>
                  <option value="cancelled">
                    Cancelled
                  </option>
                </select>
              </Field>

              <Field label="Payment Method">
                <select
                  value={form.payment_method}
                  onChange={(event) =>
                    updateField(
                      "payment_method",
                      event.target.value
                    )
                  }
                  className={inputClass}
                >
                  <option value="">
                    Not specified
                  </option>
                  <option value="Cash">
                    Cash
                  </option>
                  <option value="UPI">
                    UPI
                  </option>
                  <option value="Card">
                    Card
                  </option>
                  <option value="Bank Transfer">
                    Bank Transfer
                  </option>
                  <option value="Insurance">
                    Insurance
                  </option>
                  <option value="Other">
                    Other
                  </option>
                </select>
              </Field>

              <div className="sm:col-span-2">
                <Field label="Description">
                  <textarea
                    rows="2"
                    value={form.description}
                    onChange={(event) =>
                      updateField(
                        "description",
                        event.target.value
                      )
                    }
                    className={inputClass}
                    placeholder="Billing description..."
                  />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label="Notes">
                  <textarea
                    rows="2"
                    value={form.notes}
                    onChange={(event) =>
                      updateField(
                        "notes",
                        event.target.value
                      )
                    }
                    className={inputClass}
                    placeholder="Additional notes..."
                  />
                </Field>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:from-cyan-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={17} />
                    {editingBill
                      ? "Update Bill"
                      : "Create Bill"}
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
