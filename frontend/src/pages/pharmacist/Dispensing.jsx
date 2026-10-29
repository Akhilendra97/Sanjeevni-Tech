import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  ClipboardList,
  Eye,
  Loader2,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import {
  listPharmacyDispensings,
  getPharmacyDispensing,
  createPharmacyDispensing,
  cancelPharmacyDispensing,
} from "../../services/pharmacyDispensingApi";

const STATUS_LABELS = {
  pending: "Pending",
  partially_dispensed: "Partially Dispensed",
  dispensed: "Dispensed",
  cancelled: "Cancelled",
};

const STATUS_STYLES = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  partially_dispensed: "border-blue-200 bg-blue-50 text-blue-700",
  dispensed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-red-200 bg-red-50 text-red-700",
};

const createEmptyItem = () => ({
  medicine_id: "",
  prescribed_quantity: "",
  dispensed_quantity: "",
  unit_price: "0",
  notes: "",
});

const createEmptyForm = () => ({
  dispensing_number: "",
  prescription_id: "",
  patient_id: "",
  pharmacist_id: "",
  notes: "",
  items: [createEmptyItem()],
});

function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-IN");
}

function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        </div>

        <div className="rounded-xl bg-cyan-50 p-3 text-cyan-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

function TableHeader({ children }) {
  return (
    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function TableCell({ children, className = "" }) {
  return (
    <td className={`px-5 py-4 text-sm text-slate-600 ${className}`}>
      {children}
    </td>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </span>

      <input
        type={type}
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "0.01" : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
      />
    </label>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Modal({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <h2 className="font-bold text-slate-900">{title}</h2>

            {subtitle && (
              <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function Dispensing() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(createEmptyForm());

  const loadRecords = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await listPharmacyDispensings({
        status: status || undefined,
      });

      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err?.message || "Unable to load dispensing records."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [status]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return records;
    }

    return records.filter((record) => {
      const values = [
        record.dispensing_number,
        record.patient_id,
        record.prescription_id,
        record.status,
      ];

      return values.some(
        (value) =>
          value !== null &&
          value !== undefined &&
          String(value).toLowerCase().includes(query)
      );
    });
  }, [records, search]);

  const stats = useMemo(
    () => ({
      total: records.length,
      pending: records.filter((item) => item.status === "pending").length,
      partial: records.filter(
        (item) => item.status === "partially_dispensed"
      ).length,
      dispensed: records.filter(
        (item) => item.status === "dispensed"
      ).length,
    }),
    [records]
  );

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateItem = (index, field, value) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: value }
          : item
      ),
    }));
  };

  const addItem = () => {
    setForm((current) => ({
      ...current,
      items: [...current.items, createEmptyItem()],
    }));
  };

  const removeItem = (index) => {
    setForm((current) => {
      if (current.items.length === 1) {
        return current;
      }

      return {
        ...current,
        items: current.items.filter(
          (_, itemIndex) => itemIndex !== index
        ),
      };
    });
  };

  const resetForm = () => {
    setForm(createEmptyForm());
    setFormError("");
  };

  const openCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const closeCreate = () => {
    if (saving) {
      return;
    }

    setCreateOpen(false);
    resetForm();
  };

  const submitCreate = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!form.dispensing_number.trim()) {
      setFormError("Dispensing number is required.");
      return;
    }

    if (Number(form.prescription_id) <= 0) {
      setFormError("Valid prescription ID is required.");
      return;
    }

    if (Number(form.patient_id) <= 0) {
      setFormError("Valid patient ID is required.");
      return;
    }

    if (!form.items.length) {
      setFormError("At least one medicine is required.");
      return;
    }

    const items = form.items.map((item) => ({
      medicine_id: Number(item.medicine_id),
      prescribed_quantity: Number(item.prescribed_quantity),
      dispensed_quantity: Number(item.dispensed_quantity),
      unit_price: Number(item.unit_price || 0),
      notes: item.notes.trim() || null,
    }));

    const invalidItem = items.some(
      (item) =>
        item.medicine_id <= 0 ||
        item.prescribed_quantity <= 0 ||
        item.dispensed_quantity <= 0 ||
        item.dispensed_quantity > item.prescribed_quantity ||
        item.unit_price < 0
    );

    if (invalidItem) {
      setFormError(
        "Please check medicine IDs and quantities. Dispensed quantity cannot exceed prescribed quantity."
      );
      return;
    }

    const payload = {
      dispensing_number: form.dispensing_number.trim(),
      prescription_id: Number(form.prescription_id),
      patient_id: Number(form.patient_id),
      pharmacist_id: form.pharmacist_id
        ? Number(form.pharmacist_id)
        : null,
      notes: form.notes.trim() || null,
      items,
    };

    setSaving(true);

    try {
      await createPharmacyDispensing(payload);

      setCreateOpen(false);
      resetForm();

      await loadRecords();
    } catch (err) {
      setFormError(
        err?.message || "Unable to create dispensing record."
      );
    } finally {
      setSaving(false);
    }
  };

  const openDetails = async (record) => {
    setError("");

    try {
      const data = await getPharmacyDispensing(record.id);

      setSelected(data);
      setDetailsOpen(true);
    } catch (err) {
      setError(
        err?.message || "Unable to load dispensing details."
      );
    }
  };

  const cancelRecord = async (record) => {
    if (record.status === "cancelled") {
      return;
    }

    const confirmed = window.confirm(
      `Cancel dispensing ${record.dispensing_number}?`
    );

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      await cancelPharmacyDispensing(record.id);

      setDetailsOpen(false);
      setSelected(null);

      await loadRecords();
    } catch (err) {
      setError(
        err?.message || "Unable to cancel dispensing."
      );
    }
  };

  return (
    <div className="min-h-full bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-600 text-white shadow-sm">
              <PackageCheck size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Dispensing
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage prescription medicine dispensing and stock allocation.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={loadRecords}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
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
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700"
            >
              <Plus size={18} />
              New Dispensing
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total"
            value={stats.total}
            icon={<ClipboardList size={21} />}
          />

          <StatCard
            label="Pending"
            value={stats.pending}
            icon={<AlertCircle size={21} />}
          />

          <StatCard
            label="Partially Dispensed"
            value={stats.partial}
            icon={<PackageCheck size={21} />}
          />

          <StatCard
            label="Dispensed"
            value={stats.dispensed}
            icon={<CheckCircle2 size={21} />}
          />
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search dispensing number, patient or prescription..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-100"
              />
            </div>

            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="partially_dispensed">
                Partially Dispensed
              </option>
              <option value="dispensed">Dispensed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-900">
              Dispensing Records
            </h2>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 size={20} className="animate-spin" />
              Loading dispensing records...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <ClipboardList size={34} className="text-slate-300" />

              <h3 className="mt-3 font-semibold text-slate-900">
                No dispensing records found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Create a dispensing record or change the current filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <TableHeader>Dispensing No.</TableHeader>
                    <TableHeader>Patient</TableHeader>
                    <TableHeader>Prescription</TableHeader>
                    <TableHeader>Amount</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Created</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="transition hover:bg-slate-50"
                    >
                      <TableCell>
                        <div className="font-semibold text-slate-900">
                          {record.dispensing_number}
                        </div>

                        <div className="mt-1 text-xs text-slate-400">
                          ID #{record.id}
                        </div>
                      </TableCell>

                      <TableCell>
                        #{record.patient_id}
                      </TableCell>

                      <TableCell>
                        #{record.prescription_id}
                      </TableCell>

                      <TableCell className="font-semibold text-slate-800">
                        {formatMoney(record.total_amount)}
                      </TableCell>

                      <TableCell>
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                            STATUS_STYLES[record.status] ||
                            "border-slate-200 bg-slate-50 text-slate-600"
                          }`}
                        >
                          {STATUS_LABELS[record.status] ||
                            record.status ||
                            "Unknown"}
                        </span>
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        {formatDate(record.created_at)}
                      </TableCell>

                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openDetails(record)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            <Eye size={15} />
                            View
                          </button>

                          {record.status !== "cancelled" && (
                            <button
                              type="button"
                              onClick={() => cancelRecord(record)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                            >
                              <Ban size={15} />
                              Cancel
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {createOpen && (
        <Modal
          title="New Dispensing"
          subtitle="Create a medicine dispensing transaction."
          onClose={closeCreate}
        >
          <form onSubmit={submitCreate} className="space-y-6">

            {formError && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field
                label="Dispensing Number *"
                value={form.dispensing_number}
                onChange={(value) =>
                  updateForm("dispensing_number", value)
                }
                placeholder="DISP-2026-0001"
              />

              <Field
                label="Prescription ID *"
                type="number"
                value={form.prescription_id}
                onChange={(value) =>
                  updateForm("prescription_id", value)
                }
              />

              <Field
                label="Patient ID *"
                type="number"
                value={form.patient_id}
                onChange={(value) =>
                  updateForm("patient_id", value)
                }
              />

              <Field
                label="Pharmacist ID"
                type="number"
                value={form.pharmacist_id}
                onChange={(value) =>
                  updateForm("pharmacist_id", value)
                }
              />
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Medicines
                  </h3>

                  <p className="text-xs text-slate-500">
                    Enter medicine IDs and exact quantities.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 hover:bg-cyan-100"
                >
                  <Plus size={15} />
                  Add Medicine
                </button>
              </div>

              <div className="space-y-3">
                {form.items.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                      <Field
                        label="Medicine ID *"
                        type="number"
                        value={item.medicine_id}
                        onChange={(value) =>
                          updateItem(index, "medicine_id", value)
                        }
                      />

                      <Field
                        label="Prescribed Qty *"
                        type="number"
                        value={item.prescribed_quantity}
                        onChange={(value) =>
                          updateItem(
                            index,
                            "prescribed_quantity",
                            value
                          )
                        }
                      />

                      <Field
                        label="Dispensed Qty *"
                        type="number"
                        value={item.dispensed_quantity}
                        onChange={(value) =>
                          updateItem(
                            index,
                            "dispensed_quantity",
                            value
                          )
                        }
                      />

                      <Field
                        label="Unit Price"
                        type="number"
                        value={item.unit_price}
                        onChange={(value) =>
                          updateItem(index, "unit_price", value)
                        }
                      />
                    </div>

                    <div className="mt-3 flex gap-2">
                      <input
                        value={item.notes}
                        onChange={(event) =>
                          updateItem(
                            index,
                            "notes",
                            event.target.value
                          )
                        }
                        placeholder="Item notes (optional)"
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500"
                      />

                      <button
                        type="button"
                        disabled={form.items.length === 1}
                        onClick={() => removeItem(index)}
                        className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <textarea
              rows={3}
              value={form.notes}
              onChange={(event) =>
                updateForm("notes", event.target.value)
              }
              placeholder="Dispensing notes (optional)"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            />

            <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
              <button
                type="button"
                onClick={closeCreate}
                disabled={saving}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && (
                  <Loader2 size={17} className="animate-spin" />
                )}

                {saving ? "Creating..." : "Create Dispensing"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {detailsOpen && selected && (
        <Modal
          title="Dispensing Details"
          subtitle={selected.dispensing_number}
          onClose={() => setDetailsOpen(false)}
        >
          <div className="space-y-6">

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <InfoCard
                label="Patient"
                value={`#${selected.patient_id}`}
              />

              <InfoCard
                label="Prescription"
                value={`#${selected.prescription_id}`}
              />

              <InfoCard
                label="Total"
                value={formatMoney(selected.total_amount)}
              />

              <InfoCard
                label="Status"
                value={
                  STATUS_LABELS[selected.status] ||
                  selected.status ||
                  "Unknown"
                }
              />
            </div>

            <div>
              <h3 className="mb-3 font-semibold text-slate-900">
                Dispensed Medicines
              </h3>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="min-w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <TableHeader>Medicine</TableHeader>
                      <TableHeader>Prescribed</TableHeader>
                      <TableHeader>Dispensed</TableHeader>
                      <TableHeader>Unit Price</TableHeader>
                      <TableHeader>Total</TableHeader>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {(selected.items || []).map((item) => (
                      <tr key={item.id}>
                        <TableCell>
                          #{item.medicine_id}
                        </TableCell>

                        <TableCell>
                          {item.prescribed_quantity}
                        </TableCell>

                        <TableCell>
                          {item.dispensed_quantity}
                        </TableCell>

                        <TableCell>
                          {formatMoney(item.unit_price)}
                        </TableCell>

                        <TableCell className="font-semibold text-slate-800">
                          {formatMoney(item.total_amount)}
                        </TableCell>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selected.notes && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Notes
                </p>

                <p className="mt-2 text-sm text-slate-700">
                  {selected.notes}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
              {selected.status !== "cancelled" && (
                <button
                  type="button"
                  onClick={() => cancelRecord(selected)}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  <Ban size={17} />
                  Cancel Dispensing
                </button>
              )}

              <button
                type="button"
                onClick={() => setDetailsOpen(false)}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
