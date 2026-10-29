import React, { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Edit3,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import pharmacyApi from "../../services/pharmacyApi";

const initialForm = {
  name: "",
  contact_person: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  postal_code: "",
  gst_number: "",
  license_number: "",
  notes: "",
};

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={19} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
      />
    </label>
  );
}

function statusClass(status) {
  const value = String(status || "").toLowerCase();

  if (value === "active") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (value === "inactive") {
    return "bg-slate-100 text-slate-600";
  }

  return "bg-amber-50 text-amber-700";
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(initialForm);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await pharmacyApi.listSuppliers();

      if (Array.isArray(data)) {
        setSuppliers(data);
      } else if (Array.isArray(data?.items)) {
        setSuppliers(data.items);
      } else {
        setSuppliers([]);
      }
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to load suppliers."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return suppliers;

    return suppliers.filter((supplier) =>
      [
        supplier.name,
        supplier.contact_person,
        supplier.phone,
        supplier.email,
        supplier.city,
        supplier.state,
        supplier.gst_number,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [suppliers, search]);

  const openCreate = () => {
    setForm(initialForm);
    setModal({ type: "create" });
  };

  const openEdit = (supplier) => {
    setForm({
      name: supplier.name || "",
      contact_person: supplier.contact_person || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      city: supplier.city || "",
      state: supplier.state || "",
      postal_code: supplier.postal_code || "",
      gst_number: supplier.gst_number || "",
      license_number: supplier.license_number || "",
      notes: supplier.notes || "",
    });

    setModal({ type: "edit", supplier });
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Supplier name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = Object.fromEntries(
        Object.entries(form).map(([key, value]) => [
          key,
          typeof value === "string" && !value.trim() ? null : value,
        ])
      );

      if (modal.type === "create") {
        payload.supplier_code =
          payload.supplier_code || `SUP-${Date.now()}`;
        await pharmacyApi.createSupplier(payload);
      } else {
        await pharmacyApi.updateSupplier(modal.supplier.id, payload);
      }

      setModal(null);
      await loadSuppliers();
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to save supplier."
      );
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (supplier) => {
    const confirmed = window.confirm(
      `Deactivate supplier "${supplier.name}"?`
    );

    if (!confirmed) return;

    try {
      setError("");
      await pharmacyApi.deactivateSupplier(supplier.id);
      await loadSuppliers();
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to deactivate supplier."
      );
    }
  };

  return (
    <div className="min-h-full bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-cyan-50 p-2.5 text-cyan-600">
                <Building2 size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Suppliers
                </h1>
                <p className="text-sm text-slate-500">
                  Manage pharmacy procurement partners
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={loadSuppliers}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>

            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-700 hover:to-blue-700"
            >
              <Plus size={17} />
              Add Supplier
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total Suppliers
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {suppliers.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Active
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {
                suppliers.filter(
                  (item) =>
                    String(item.status || "active").toLowerCase() === "active"
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Search Results
            </p>
            <p className="mt-2 text-2xl font-bold text-cyan-600">
              {filtered.length}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <div className="relative max-w-md">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search supplier, phone, email..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
              />
            </div>
          </div>

          {error && (
            <div className="m-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <RefreshCw size={26} className="animate-spin text-cyan-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Building2 className="mx-auto text-slate-300" size={42} />
              <h3 className="mt-4 font-semibold text-slate-800">
                No suppliers found
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Add your first procurement supplier to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-slate-50 text-left">
                  <tr className="border-b border-slate-200">
                    {[
                      "Supplier",
                      "Contact",
                      "Location",
                      "GST / License",
                      "Status",
                      "Actions",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((supplier) => (
                    <tr
                      key={supplier.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">
                          {supplier.name || "—"}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                          <Mail size={12} />
                          {supplier.email || "No email"}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-sm font-medium text-slate-800">
                          {supplier.contact_person || "—"}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                          <Phone size={12} />
                          {supplier.phone || "No phone"}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-start gap-1 text-sm text-slate-700">
                          <MapPin size={14} className="mt-0.5 shrink-0" />
                          <span>
                            {[supplier.city, supplier.state]
                              .filter(Boolean)
                              .join(", ") || "—"}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-xs text-slate-600">
                          GST: {supplier.gst_number || "—"}
                        </div>
                        <div className="mt-1 text-xs text-slate-600">
                          License: {supplier.license_number || "—"}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(
                            supplier.status || "active"
                          )}`}
                        >
                          {supplier.status || "active"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(supplier)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-cyan-50 hover:text-cyan-700"
                            title="Edit supplier"
                          >
                            <Edit3 size={16} />
                          </button>

                          <button
                            onClick={() => deactivate(supplier)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                            title="Deactivate supplier"
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

      {modal && (
        <Modal
          title={
            modal.type === "create" ? "Add New Supplier" : "Edit Supplier"
          }
          onClose={() => setModal(null)}
        >
          <form onSubmit={submit}>
            <div className="grid gap-4 p-6 md:grid-cols-2">
              <Field
                label="Supplier Name *"
                value={form.name}
                onChange={(value) => setForm({ ...form, name: value })}
                placeholder="e.g. Medico Pharma Pvt. Ltd."
              />

              <Field
                label="Contact Person"
                value={form.contact_person}
                onChange={(value) =>
                  setForm({ ...form, contact_person: value })
                }
                placeholder="Contact person"
              />

              <Field
                label="Phone"
                value={form.phone}
                onChange={(value) => setForm({ ...form, phone: value })}
                placeholder="+91..."
              />

              <Field
                label="Email"
                type="email"
                value={form.email}
                onChange={(value) => setForm({ ...form, email: value })}
                placeholder="supplier@example.com"
              />

              <Field
                label="Address"
                value={form.address}
                onChange={(value) => setForm({ ...form, address: value })}
                placeholder="Street / office address"
              />

              <Field
                label="City"
                value={form.city}
                onChange={(value) => setForm({ ...form, city: value })}
                placeholder="City"
              />

              <Field
                label="State"
                value={form.state}
                onChange={(value) => setForm({ ...form, state: value })}
                placeholder="State"
              />

              <Field
                label="Postal Code"
                value={form.postal_code}
                onChange={(value) => setForm({ ...form, postal_code: value })}
                placeholder="PIN"
              />

              <Field
                label="GST Number"
                value={form.gst_number}
                onChange={(value) => setForm({ ...form, gst_number: value })}
                placeholder="GSTIN"
              />

              <Field
                label="License Number"
                value={form.license_number}
                onChange={(value) =>
                  setForm({ ...form, license_number: value })
                }
                placeholder="Drug license"
              />

              <div className="md:col-span-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Notes
                  </span>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Supplier"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
