import { useCallback, useEffect, useMemo, useState } from "react";
import PatientSelect from "../../components/accountant/PatientSelect";
import DocumentPdfActions from "../../components/pdf/DocumentPdfActions";
import {
  AlertCircle,
  ArrowDownToLine,
  CheckCircle2,
  CreditCard,
  Edit3,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";

import {
  createPayment,
  deletePayment,
  listPayments,
  updatePayment,
} from "../../services/paymentApi";

const today = new Date().toISOString().slice(0, 10);

const emptyForm = {
  payment_number: "",
  invoice_id: "",
  patient_id: "",
  payment_date: today,
  amount: "",
  payment_method: "cash",
  transaction_reference: "",
  status: "completed",
};

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "cancelled", label: "Cancelled" },
  { value: "failed", label: "Failed" },
];

const methodOptions = [
  "cash",
  "card",
  "upi",
  "bank_transfer",
  "cheque",
  "insurance",
  "other",
];

function money(value) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
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

function statusStyle(status) {
  const value = String(status || "").toLowerCase();

  if (value === "completed") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (value === "pending") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  if (value === "cancelled" || value === "failed") {
    return "bg-red-50 text-red-700 border-red-200";
  }

  return "bg-slate-50 text-slate-700 border-slate-200";
}

function getErrorMessage(error) {
  return error?.message || "Unable to complete the request.";
}

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const loadPayments = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data = await listPayments({
        paymentStatus: statusFilter || undefined,
      });

      setPayments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const filteredPayments = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return payments;
    }

    return payments.filter((payment) => {
      const searchable = [
        payment.payment_number,
        payment.invoice_id,
        payment.patient_id,
        payment.payment_method,
        payment.transaction_reference,
        payment.status,
        payment.amount,
      ]
        .filter((value) => value !== null && value !== undefined)
        .join(" ")
        .toLowerCase();

      return searchable.includes(term);
    });
  }, [payments, search]);

  const summary = useMemo(() => {
    const completed = payments.filter(
      (payment) => payment.status === "completed"
    );

    const totalReceived = completed.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    );

    const completedCount = completed.length;
    const pendingCount = payments.filter(
      (payment) => payment.status === "pending"
    ).length;

    const cancelledCount = payments.filter(
      (payment) => payment.status === "cancelled"
    ).length;

    return {
      totalReceived,
      completedCount,
      pendingCount,
      cancelledCount,
    };
  }, [payments]);

  function openCreate() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      payment_number: `PAY-${Date.now()}`,
    });
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(payment) {
    setEditingId(payment.id);

    setForm({
      payment_number: payment.payment_number || "",
      invoice_id: payment.invoice_id ?? "",
      patient_id: payment.patient_id ?? "",
      payment_date: payment.payment_date
        ? String(payment.payment_date).slice(0, 10)
        : today,
      amount: payment.amount ?? "",
      payment_method: payment.payment_method || "cash",
      transaction_reference: payment.transaction_reference || "",
      status: payment.status || "completed",
    });

    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setFormError("");

    const invoiceId = Number(form.invoice_id);
    const patientId = Number(form.patient_id);
    const amount = Number(form.amount);

    if (!form.payment_number.trim()) {
      setFormError("Payment number is required.");
      return;
    }

    if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
      setFormError("Valid Invoice ID is required.");
      return;
    }

    if (!Number.isInteger(patientId) || patientId <= 0) {
      setFormError("Valid Patient ID is required.");
      return;
    }

    if (!form.payment_date) {
      setFormError("Payment date is required.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError("Payment amount must be greater than zero.");
      return;
    }

    const payload = {
      payment_number: form.payment_number.trim(),
      invoice_id: invoiceId,
      patient_id: patientId,
      payment_date: form.payment_date,
      amount: amount.toFixed(2),
      payment_method: form.payment_method,
      transaction_reference:
        form.transaction_reference.trim() || null,
      status: form.status,
    };

    try {
      setSaving(true);

      if (editingId) {
        await updatePayment(editingId, payload);
      } else {
        await createPayment(payload);
      }

      closeModal();
      await loadPayments(true);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(payment) {
    const confirmed = window.confirm(
      `Delete payment ${payment.payment_number}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      await deletePayment(payment.id);
      await loadPayments(true);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div className="min-h-full bg-slate-50 px-5 py-6 lg:px-7">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-cyan-600">
              Accountant • Payments
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Payment Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Track hospital payments and keep invoice balances synchronized.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadPayments(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-cyan-700 hover:to-blue-700"
            >
              <Plus size={17} />
              Record Payment
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Received
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {money(summary.totalReceived)}
                </p>
              </div>

              <div className="rounded-xl bg-cyan-50 p-3 text-cyan-600">
                <CreditCard size={21} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Completed
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {summary.completedCount}
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <CheckCircle2 size={21} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Pending
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {summary.pendingCount}
                </p>
              </div>

              <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                <AlertCircle size={21} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Cancelled
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {summary.cancelledCount}
                </p>
              </div>

              <div className="rounded-xl bg-red-50 p-3 text-red-600">
                <XCircle size={21} />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Unable to load payments</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative flex-1 lg:max-w-xl">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search payment number, invoice, patient, method..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1050px] w-full">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-100">
                  {[
                    "Payment",
                    "Invoice",
                    "Patient",
                    "Date",
                    "Amount",
                    "Method",
                    "Reference",
                    "Status",
                    "Actions",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-16 text-center text-sm text-slate-500"
                    >
                      Loading payments...
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-16 text-center"
                    >
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="rounded-2xl bg-slate-100 p-4 text-slate-400">
                          <CreditCard size={28} />
                        </div>

                        <p className="mt-4 font-semibold text-slate-800">
                          No payment records found
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Record a payment or change the current filters.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-900">
                          {payment.payment_number}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-400">
                          #{payment.id}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm font-medium text-slate-700">
                        #{payment.invoice_id}
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-700">
                        {payment.patient_name || `Patient #${payment.patient_id}`}
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-600">
                        {formatDate(payment.payment_date)}
                      </td>

                      <td className="px-4 py-4 text-sm font-bold text-slate-900">
                        {money(payment.amount)}
                      </td>

                      <td className="px-4 py-4">
                        <span className="capitalize text-sm text-slate-700">
                          {String(payment.payment_method || "—").replace(
                            /_/g,
                            " "
                          )}
                        </span>
                      </td>

                      <td className="max-w-[180px] px-4 py-4 text-sm text-slate-600">
                        <span className="block truncate">
                          {payment.transaction_reference || "—"}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle(
                            payment.status
                          )}`}
                        >
                          {String(payment.status || "unknown").replace(
                            /_/g,
                            " "
                          )}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-1">
                          <DocumentPdfActions
                            title="Payment Receipt"
                            record={payment}
                            fields={[
                              ["Payment Number", payment.payment_number],
                              ["Patient", payment.patient_name || `Patient #${payment.patient_id}`],
                              ["Patient ID", payment.patient_id],
                              ["Invoice ID", payment.invoice_id],
                              ["Payment Date", formatDate(payment.payment_date)],
                              ["Amount", money(payment.amount)],
                              ["Payment Method", String(payment.payment_method || "—").replace(/_/g, " ")],
                              ["Transaction Reference", payment.transaction_reference || "—"],
                              ["Status", String(payment.status || "unknown").replace(/_/g, " ")],
                            ]}
                          />
                          <button
                            type="button"
                            title="View payment"
                            onClick={() => openEdit(payment)}
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-cyan-50 hover:text-cyan-700"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            type="button"
                            title="Edit payment"
                            onClick={() => openEdit(payment)}
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Edit3 size={16} />
                          </button>

                          <button
                            type="button"
                            title="Delete payment"
                            onClick={() => handleDelete(payment)}
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
              <span>
                Showing {filteredPayments.length} of {payments.length} payment
                records
              </span>

              <span className="inline-flex items-center gap-1.5">
                <ArrowDownToLine size={14} />
                Live backend data
              </span>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingId ? "Edit Payment" : "Record Payment"}
                </h2>

                <p className="mt-0.5 text-sm text-slate-500">
                  {editingId
                    ? "Update the existing payment record."
                    : "Create a payment linked to an existing invoice."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {formError && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Payment Number"
                  value={form.payment_number}
                  onChange={(value) =>
                    updateField("payment_number", value)
                  }
                  placeholder="PAY-1001"
                  required
                />

                <Field
                  label="Invoice ID"
                  type="number"
                  value={form.invoice_id}
                  onChange={(value) => updateField("invoice_id", value)}
                  placeholder="Invoice ID"
                  required
                />

                <PatientSelect
                  label="Patient"
                  value={form.patient_id}
                  onChange={(value) => updateField("patient_id", value)}
                  required
                />

                <Field
                  label="Payment Date"
                  type="date"
                  value={form.payment_date}
                  onChange={(value) =>
                    updateField("payment_date", value)
                  }
                  required
                />

                <Field
                  label="Amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={(value) => updateField("amount", value)}
                  placeholder="0.00"
                  required
                />

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Payment Method
                  </label>

                  <select
                    value={form.payment_method}
                    onChange={(event) =>
                      updateField(
                        "payment_method",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                  >
                    {methodOptions.map((method) => (
                      <option key={method} value={method}>
                        {method.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <Field
                  label="Transaction Reference"
                  value={form.transaction_reference}
                  onChange={(value) =>
                    updateField("transaction_reference", value)
                  }
                  placeholder="UPI / bank / receipt reference"
                />

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Status
                  </label>

                  <select
                    value={form.status}
                    onChange={(event) =>
                      updateField("status", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                  >
                    {statusOptions
                      .filter((option) => option.value)
                      .map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-cyan-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <RefreshCw size={15} className="animate-spin" />
                  )}

                  {editingId ? "Update Payment" : "Record Payment"}
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
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  min,
  step,
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        min={min}
        step={step}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
      />
    </div>
  );
}
