import DocumentPdfActions from "../../components/pdf/DocumentPdfActions";
import { useCallback, useEffect, useMemo, useState } from "react";
import PatientSelect from "../../components/accountant/PatientSelect";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Eye,
  FileText,
  IndianRupee,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";

import {
  createInvoice,
  deleteInvoice,
  listInvoices,
  updateInvoice,
} from "../../services/invoiceApi";

const today = new Date().toISOString().slice(0, 10);

const EMPTY_FORM = {
  invoice_number: "",
  patient_id: "",
  admission_id: "",
  invoice_date: today,
  due_date: "",
  subtotal: "",
  tax_amount: "0",
  discount_amount: "0",
  paid_amount: "0",
  notes: "",
};

function money(value) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusLabel(status) {
  const labels = {
    unpaid: "Unpaid",
    partially_paid: "Partially Paid",
    paid: "Paid",
  };

  return labels[status] || status || "Unknown";
}

function statusClass(status) {
  if (status === "paid") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (status === "partially_paid") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  return "bg-rose-50 text-rose-700 border-rose-200";
}

function calculateAmounts(form) {
  const subtotal = Number(form.subtotal || 0);
  const tax = Number(form.tax_amount || 0);
  const discount = Number(form.discount_amount || 0);
  const paid = Number(form.paid_amount || 0);

  const total = subtotal + tax - discount;
  const balance = total - paid;

  let status = "unpaid";

  if (paid > 0 && paid < total) {
    status = "partially_paid";
  } else if (total > 0 && paid >= total) {
    status = "paid";
  }

  return {
    subtotal,
    tax,
    discount,
    paid,
    total,
    balance,
    status,
  };
}

function Field({ label, required, children, hint }) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </span>

        {hint && (
          <span className="text-[11px] text-slate-400">
            {hint}
          </span>
        )}
      </div>

      {children}
    </label>
  );
}

function inputClass() {
  return "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-50";
}

function StatCard({ icon: Icon, label, value, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <div className="rounded-xl bg-cyan-50 p-2.5 text-cyan-600">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const amounts = useMemo(() => calculateAmounts(form), [form]);

  const loadInvoices = useCallback(async (isRefresh = false) => {
    try {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await listInvoices();

      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Unable to load invoices.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const matchesStatus =
        statusFilter === "all" ||
        invoice.status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        invoice.invoice_number,
        invoice.patient_id,
        invoice.admission_id,
        invoice.status,
        statusLabel(invoice.status),
      ]
        .filter((value) => value !== null && value !== undefined)
        .some((value) =>
          String(value).toLowerCase().includes(query)
        );
    });
  }, [invoices, search, statusFilter]);

  const stats = useMemo(() => {
    return invoices.reduce(
      (acc, invoice) => {
        acc.total += Number(invoice.total_amount || 0);
        acc.paid += Number(invoice.paid_amount || 0);
        acc.balance += Number(invoice.balance_amount || 0);

        if (invoice.status === "paid") {
          acc.paidCount += 1;
        }

        if (invoice.status === "unpaid") {
          acc.unpaidCount += 1;
        }

        if (invoice.status === "partially_paid") {
          acc.partialCount += 1;
        }

        return acc;
      },
      {
        total: 0,
        paid: 0,
        balance: 0,
        paidCount: 0,
        unpaidCount: 0,
        partialCount: 0,
      }
    );
  }, [invoices]);

  function openCreate() {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      invoice_date: today,
    });
    setModalOpen(true);
  }

  function openEdit(invoice) {
    setEditing(invoice);

    setForm({
      invoice_number: invoice.invoice_number || "",
      patient_id: invoice.patient_id ?? "",
      admission_id: invoice.admission_id ?? "",
      invoice_date: invoice.invoice_date || today,
      due_date: invoice.due_date || "",
      subtotal: invoice.subtotal ?? "",
      tax_amount: invoice.tax_amount ?? "0",
      discount_amount: invoice.discount_amount ?? "0",
      paid_amount: invoice.paid_amount ?? "0",
      notes: invoice.notes || "",
    });

    setModalOpen(true);
  }

  function openView(invoice) {
    setSelected(invoice);
    setViewOpen(true);
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.invoice_number.trim()) {
      setError("Invoice number is required.");
      return;
    }

    if (!form.patient_id || Number(form.patient_id) <= 0) {
      setError("Valid Patient ID is required.");
      return;
    }

    if (!form.invoice_date) {
      setError("Invoice date is required.");
      return;
    }

    if (amounts.discount > amounts.subtotal + amounts.tax) {
      setError(
        "Discount cannot exceed subtotal plus tax."
      );
      return;
    }

    if (amounts.total < 0) {
      setError("Total amount cannot be negative.");
      return;
    }

    if (amounts.paid > amounts.total) {
      setError("Paid amount cannot exceed total amount.");
      return;
    }

    const payload = {
      invoice_number: form.invoice_number.trim(),
      patient_id: Number(form.patient_id),
      admission_id:
        form.admission_id === ""
          ? null
          : Number(form.admission_id),
      invoice_date: form.invoice_date,
      due_date: form.due_date || null,
      subtotal: amounts.subtotal.toFixed(2),
      tax_amount: amounts.tax.toFixed(2),
      discount_amount: amounts.discount.toFixed(2),
      total_amount: amounts.total.toFixed(2),
      paid_amount: amounts.paid.toFixed(2),
      balance_amount: amounts.balance.toFixed(2),
      status: amounts.status,
      notes: form.notes.trim() || null,
    };

    try {
      setSaving(true);
      setError("");

      if (editing?.id) {
        await updateInvoice(editing.id, payload);
      } else {
        await createInvoice(payload);
      }

      setModalOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);

      await loadInvoices(true);
    } catch (err) {
      setError(err?.message || "Unable to save invoice.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(invoice) {
    const confirmed = window.confirm(
      `Delete invoice ${invoice.invoice_number}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(invoice.id);
      setError("");

      await deleteInvoice(invoice.id);

      await loadInvoices(true);
    } catch (err) {
      setError(err?.message || "Unable to delete invoice.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-full bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-[1500px]">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-600">
              <FileText size={20} />
              <span className="text-xs font-bold uppercase tracking-[0.18em]">
                Accountant
              </span>
            </div>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Invoices
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage hospital invoices, payments and outstanding balances.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadInvoices(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:text-cyan-700 disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-cyan-600 hover:to-blue-700"
            >
              <Plus size={18} />
              Create Invoice
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <AlertCircle size={19} className="mt-0.5 shrink-0" />

            <div className="flex-1">
              <p className="font-semibold">
                Invoice operation failed
              </p>
              <p className="mt-0.5">{error}</p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="rounded-lg p-1 hover:bg-rose-100"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={IndianRupee}
            label="Total Invoiced"
            value={money(stats.total)}
            description={`${invoices.length} invoice records`}
          />

          <StatCard
            icon={WalletCards}
            label="Amount Received"
            value={money(stats.paid)}
            description={`${stats.paidCount} fully paid invoices`}
          />

          <StatCard
            icon={AlertCircle}
            label="Outstanding"
            value={money(stats.balance)}
            description={`${stats.unpaidCount + stats.partialCount} invoices pending`}
          />

          <StatCard
            icon={CheckCircle2}
            label="Paid Invoices"
            value={stats.paidCount}
            description={`${stats.partialCount} partially paid`}
          />
        </div>

        {/* Main card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Toolbar */}
          <div className="border-b border-slate-100 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-xl">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search invoice number, patient ID, admission ID..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-50"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-50"
              >
                <option value="all">All Statuses</option>
                <option value="unpaid">Unpaid</option>
                <option value="partially_paid">
                  Partially Paid
                </option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <div className="text-center">
                <RefreshCw
                  size={28}
                  className="mx-auto animate-spin text-cyan-500"
                />
                <p className="mt-3 text-sm font-medium text-slate-500">
                  Loading invoices...
                </p>
              </div>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="flex min-h-[360px] items-center justify-center px-6">
              <div className="max-w-md text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <FileText size={26} />
                </div>

                <h3 className="mt-4 text-base font-bold text-slate-800">
                  No invoices found
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {invoices.length === 0
                    ? "There are no invoice records in the system yet."
                    : "No invoices match the current search or status filter."}
                </p>

                {invoices.length === 0 && (
                  <button
                    type="button"
                    onClick={openCreate}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700"
                  >
                    <Plus size={17} />
                    Create First Invoice
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1050px] w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                      Invoice
                    </th>
                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                      Patient
                    </th>
                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                      Invoice Date
                    </th>
                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                      Due Date
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
                      Total
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
                      Paid
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
                      Balance
                    </th>
                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                      Status
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => openView(invoice)}
                          className="text-left"
                        >
                          <p className="font-bold text-slate-800 hover:text-cyan-600">
                            {invoice.invoice_number}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            #{invoice.id}
                          </p>
                        </button>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-700">
                          {invoice.patient_name || `Patient #${invoice.patient_id}`}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          Admission{" "}
                          {invoice.admission_id ?? "—"}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDate(invoice.invoice_date)}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDate(invoice.due_date)}
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-bold text-slate-800">
                        {money(invoice.total_amount)}
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-semibold text-emerald-600">
                        {money(invoice.paid_amount)}
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-bold text-slate-800">
                        {money(invoice.balance_amount)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(
                            invoice.status
                          )}`}
                        >
                          {statusLabel(invoice.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <DocumentPdfActions title={`Invoice ${invoice.invoice_number || invoice.id}`} record={{ invoice_number: invoice.invoice_number, patient_id: invoice.patient_id, patient_name: invoice.patient_name, admission_id: invoice.admission_id, invoice_date: invoice.invoice_date, due_date: invoice.due_date, subtotal: invoice.subtotal, tax_amount: invoice.tax_amount, discount_amount: invoice.discount_amount, total_amount: invoice.total_amount, paid_amount: invoice.paid_amount, balance_amount: invoice.balance_amount, status: invoice.status, notes: invoice.notes }} />
                          <button
                            type="button"
                            title="View"
                            onClick={() => openView(invoice)}
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-cyan-50 hover:text-cyan-600"
                          >
                            <Eye size={17} />
                          </button>

                          <button
                            type="button"
                            title="Edit"
                            onClick={() => openEdit(invoice)}
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            type="button"
                            title="Delete"
                            onClick={() => handleDelete(invoice)}
                            disabled={deletingId === invoice.id}
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                          >
                            {deletingId === invoice.id ? (
                              <RefreshCw
                                size={17}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2 size={17} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredInvoices.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3 text-xs text-slate-500">
              Showing{" "}
              <span className="font-bold text-slate-700">
                {filteredInvoices.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-slate-700">
                {invoices.length}
              </span>{" "}
              invoices
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-600">
                  Accountant
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {editing ? "Edit Invoice" : "Create Invoice"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={21} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="max-h-[calc(92vh-90px)] overflow-y-auto p-6"
            >
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                <Field label="Invoice Number" required>
                  <input
                    value={form.invoice_number}
                    onChange={(event) =>
                      updateField(
                        "invoice_number",
                        event.target.value
                      )
                    }
                    placeholder="INV-2026-001"
                    className={inputClass()}
                    required
                  />
                </Field>

                <PatientSelect
                  label="Patient"
                  value={form.patient_id}
                  onChange={(value) => updateField("patient_id", value)}
                  required
                />

                <Field label="Admission ID">
                  <input
                    type="number"
                    min="1"
                    value={form.admission_id}
                    onChange={(event) =>
                      updateField(
                        "admission_id",
                        event.target.value
                      )
                    }
                    placeholder="Optional"
                    className={inputClass()}
                  />
                </Field>

                <Field label="Invoice Date" required>
                  <div className="relative">
                    <CalendarDays
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="date"
                      value={form.invoice_date}
                      onChange={(event) =>
                        updateField(
                          "invoice_date",
                          event.target.value
                        )
                      }
                      className={`${inputClass()} pl-10`}
                      required
                    />
                  </div>
                </Field>

                <Field label="Due Date">
                  <div className="relative">
                    <CalendarDays
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="date"
                      value={form.due_date}
                      onChange={(event) =>
                        updateField(
                          "due_date",
                          event.target.value
                        )
                      }
                      className={`${inputClass()} pl-10`}
                    />
                  </div>
                </Field>

                <Field label="Subtotal" required>
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
                    placeholder="0.00"
                    className={inputClass()}
                    required
                  />
                </Field>

                <Field label="Tax Amount">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.tax_amount}
                    onChange={(event) =>
                      updateField(
                        "tax_amount",
                        event.target.value
                      )
                    }
                    placeholder="0.00"
                    className={inputClass()}
                  />
                </Field>

                <Field label="Discount Amount">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.discount_amount}
                    onChange={(event) =>
                      updateField(
                        "discount_amount",
                        event.target.value
                      )
                    }
                    placeholder="0.00"
                    className={inputClass()}
                  />
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
                    placeholder="0.00"
                    className={inputClass()}
                  />
                </Field>
              </div>

              {/* Calculated summary */}
              <div className="mt-6 grid gap-3 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4 md:grid-cols-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    Subtotal
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-800">
                    {money(amounts.subtotal)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    Tax
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-800">
                    {money(amounts.tax)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    Total
                  </p>
                  <p className="mt-1 text-lg font-bold text-cyan-700">
                    {money(amounts.total)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    Balance
                  </p>
                  <p className="mt-1 text-lg font-bold text-amber-700">
                    {money(amounts.balance)}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <Field label="Calculated Status">
                  <div
                    className={`flex min-h-[46px] items-center rounded-xl border px-3.5 text-sm font-bold ${statusClass(
                      amounts.status
                    )}`}
                  >
                    {statusLabel(amounts.status)}
                  </div>
                </Field>

                <Field
                  label="Notes"
                  hint="Optional"
                >
                  <textarea
                    value={form.notes}
                    onChange={(event) =>
                      updateField(
                        "notes",
                        event.target.value
                      )
                    }
                    rows={3}
                    placeholder="Additional invoice notes..."
                    className={`${inputClass()} resize-none`}
                  />
                </Field>
              </div>

              <div className="mt-7 flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-cyan-600 hover:to-blue-700 disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="animate-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={17} />
                      {editing
                        ? "Update Invoice"
                        : "Create Invoice"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-600">
                  Invoice Details
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {selected.invoice_number}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setViewOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={21} />
              </button>
            </div>

            <div className="p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-400">
                    Patient ID
                  </p>
                  <p className="mt-1 font-bold text-slate-800">
                    {selected.patient_name || `Patient #${selected.patient_id}`}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-400">
                    Admission ID
                  </p>
                  <p className="mt-1 font-bold text-slate-800">
                    {selected.admission_id ?? "—"}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-400">
                    Invoice Date
                  </p>
                  <p className="mt-1 font-bold text-slate-800">
                    {formatDate(selected.invoice_date)}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-400">
                    Due Date
                  </p>
                  <p className="mt-1 font-bold text-slate-800">
                    {formatDate(selected.due_date)}
                  </p>
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <span className="text-sm text-slate-500">
                    Subtotal
                  </span>
                  <span className="font-semibold text-slate-800">
                    {money(selected.subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <span className="text-sm text-slate-500">
                    Tax
                  </span>
                  <span className="font-semibold text-slate-800">
                    {money(selected.tax_amount)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <span className="text-sm text-slate-500">
                    Discount
                  </span>
                  <span className="font-semibold text-rose-600">
                    - {money(selected.discount_amount)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 bg-cyan-50/60 px-4 py-3">
                  <span className="font-semibold text-slate-700">
                    Total
                  </span>
                  <span className="text-lg font-bold text-cyan-700">
                    {money(selected.total_amount)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <span className="text-sm text-slate-500">
                    Paid
                  </span>
                  <span className="font-semibold text-emerald-600">
                    {money(selected.paid_amount)}
                  </span>
                </div>

                <div className="flex items-center justify-between px-4 py-3">
                  <span className="font-semibold text-slate-700">
                    Balance
                  </span>
                  <span className="font-bold text-amber-700">
                    {money(selected.balance_amount)}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <span
                  className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold ${statusClass(
                    selected.status
                  )}`}
                >
                  {statusLabel(selected.status)}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setViewOpen(false);
                    openEdit(selected);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  <Pencil size={16} />
                  Edit Invoice
                </button>
              </div>

              {selected.notes && (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Notes
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                    {selected.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
