import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  Edit3,
  Minus,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import pharmacyApi from "../../services/pharmacyApi";

const initialForm = {
  quantity: "",
  reserved_quantity: "",
  minimum_stock: "",
  maximum_stock: "",
  unit_cost: "",
  location: "",
  batch_number: "",
  expiry_date: "",
  status: "available",
  notes: "",
};

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [overview, setOverview] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [adjustment, setAdjustment] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const [inventoryData, overviewData] = await Promise.all([
        pharmacyApi.listInventory(),
        pharmacyApi.getInventoryOverview(),
      ]);

      setInventory(
        Array.isArray(inventoryData)
          ? inventoryData
          : Array.isArray(inventoryData?.items)
            ? inventoryData.items
            : []
      );

      setOverview(overviewData || null);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to load inventory."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return inventory;

    return inventory.filter((item) =>
      [
        item.medicine_id,
        item.batch_number,
        item.location,
        item.status,
      ]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [inventory, search]);

  const isLowStock = (item) =>
    Number(item.quantity || 0) <= Number(item.minimum_stock || 0);

  const openEdit = (item) => {
    setForm({
      quantity: item.quantity ?? "",
      reserved_quantity: item.reserved_quantity ?? "",
      minimum_stock: item.minimum_stock ?? "",
      maximum_stock: item.maximum_stock ?? "",
      unit_cost: item.unit_cost ?? "",
      location: item.location || "",
      batch_number: item.batch_number || "",
      expiry_date: item.expiry_date
        ? String(item.expiry_date).slice(0, 10)
        : "",
      status: item.status || "available",
      notes: item.notes || "",
    });

    setModal({ type: "edit", item });
  };

  const save = async (event) => {
    event.preventDefault();

    try {
      setError("");

      const payload = {
        quantity:
          form.quantity === "" ? null : Number(form.quantity),
        reserved_quantity:
          form.reserved_quantity === ""
            ? null
            : Number(form.reserved_quantity),
        minimum_stock:
          form.minimum_stock === "" ? null : Number(form.minimum_stock),
        maximum_stock:
          form.maximum_stock === "" ? null : Number(form.maximum_stock),
        unit_cost:
          form.unit_cost === "" ? null : Number(form.unit_cost),
        location: form.location || null,
        batch_number: form.batch_number || null,
        expiry_date: form.expiry_date
          ? new Date(form.expiry_date).toISOString()
          : null,
        status: form.status || null,
        notes: form.notes || null,
      };

      await pharmacyApi.updateInventory(modal.item.id, payload);

      setModal(null);
      await load();
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to update inventory."
      );
    }
  };

  const adjust = async (item, direction) => {
    const amount = Number(adjustment);

    if (!Number.isInteger(amount) || amount <= 0) {
      setError("Enter a positive whole-number quantity.");
      return;
    }

    try {
      setError("");

      await pharmacyApi.adjustInventoryQuantity(
        item.id,
        direction === "add" ? amount : -amount
      );

      setAdjustment("");
      setModal(null);
      await load();
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to adjust inventory quantity."
      );
    }
  };

  return (
    <div className="min-h-full bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-50 p-2.5 text-cyan-600">
              <Boxes size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Pharmacy Inventory
              </h1>
              <p className="text-sm text-slate-500">
                Monitor stock, batches and replenishment levels
              </p>
            </div>
          </div>

          <button
            onClick={load}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Inventory Items
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {overview?.inventory_items ?? inventory.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Low Stock
            </p>
            <p className="mt-2 text-2xl font-bold text-amber-600">
              {overview?.low_stock_items ??
                inventory.filter(isLowStock).length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Pharmacies
            </p>
            <p className="mt-2 text-2xl font-bold text-cyan-600">
              {overview?.pharmacies ?? 0}
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

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
                placeholder="Search medicine ID, batch, location..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <RefreshCw size={26} className="animate-spin text-cyan-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Boxes className="mx-auto text-slate-300" size={42} />
              <h3 className="mt-4 font-semibold text-slate-800">
                No inventory records
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Inventory records will appear here once stock is available.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200 text-left">
                    {[
                      "Medicine",
                      "Batch",
                      "Available",
                      "Reserved",
                      "Min / Max",
                      "Unit Cost",
                      "Expiry",
                      "Location",
                      "Status",
                      "Action",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((item) => (
                    <tr
                      key={item.id}
                      className={`border-b border-slate-100 last:border-0 ${
                        isLowStock(item) ? "bg-amber-50/40" : ""
                      }`}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {isLowStock(item) && (
                            <AlertTriangle
                              size={16}
                              className="text-amber-500"
                            />
                          )}
                          <div>
                            <div className="font-semibold text-slate-900">
                              Medicine #{item.medicine_id}
                            </div>
                            <div className="text-xs text-slate-400">
                              Inventory #{item.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-700">
                        {item.batch_number || "—"}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`font-bold ${
                            isLowStock(item)
                              ? "text-amber-700"
                              : "text-emerald-700"
                          }`}
                        >
                          {item.quantity ?? 0}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-700">
                        {item.reserved_quantity ?? 0}
                      </td>

                      <td className="px-4 py-4 text-xs text-slate-600">
                        {item.minimum_stock ?? 0} /{" "}
                        {item.maximum_stock ?? "—"}
                      </td>

                      <td className="px-4 py-4 text-sm font-semibold text-slate-800">
                        ₹{Number(item.unit_cost || 0).toFixed(2)}
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-600">
                        {item.expiry_date
                          ? String(item.expiry_date).slice(0, 10)
                          : "—"}
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-600">
                        {item.location || "—"}
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                          {item.status || "available"}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <button
                          onClick={() => openEdit(item)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-cyan-50 hover:text-cyan-700"
                          title="Manage inventory"
                        >
                          <Edit3 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modal?.type === "edit" && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 p-4">
          <div className="mx-auto my-8 w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Manage Inventory
                </h2>
                <p className="text-xs text-slate-500">
                  Medicine #{modal.item.medicine_id} · Batch{" "}
                  {modal.item.batch_number || "—"}
                </p>
              </div>

              <button
                onClick={() => setModal(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={save}>
              <div className="grid gap-4 p-6 md:grid-cols-3">
                {[
                  ["quantity", "Quantity"],
                  ["reserved_quantity", "Reserved Quantity"],
                  ["minimum_stock", "Minimum Stock"],
                  ["maximum_stock", "Maximum Stock"],
                  ["unit_cost", "Unit Cost"],
                  ["location", "Location"],
                  ["batch_number", "Batch Number"],
                ].map(([key, label]) => (
                  <label key={key}>
                    <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                      {label}
                    </span>
                    <input
                      type={
                        [
                          "quantity",
                          "reserved_quantity",
                          "minimum_stock",
                          "maximum_stock",
                          "unit_cost",
                        ].includes(key)
                          ? "number"
                          : "text"
                      }
                      min="0"
                      step={key === "unit_cost" ? "0.01" : "1"}
                      value={form[key]}
                      onChange={(e) =>
                        setForm({ ...form, [key]: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500"
                    />
                  </label>
                ))}

                <label>
                  <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Expiry Date
                  </span>
                  <input
                    type="date"
                    value={form.expiry_date}
                    onChange={(e) =>
                      setForm({ ...form, expiry_date: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Status
                  </span>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500"
                  >
                    <option value="available">available</option>
                    <option value="reserved">reserved</option>
                    <option value="expired">expired</option>
                    <option value="damaged">damaged</option>
                    <option value="inactive">inactive</option>
                  </select>
                </label>

                <label className="md:col-span-3">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Notes
                  </span>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500"
                  />
                </label>

                <div className="md:col-span-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Boxes size={17} className="text-cyan-600" />
                    <h3 className="font-semibold text-slate-800">
                      Quick Quantity Adjustment
                    </h3>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={adjustment}
                      onChange={(e) => setAdjustment(e.target.value)}
                      placeholder="Quantity"
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500"
                    />

                    <button
                      type="button"
                      onClick={() => adjust(modal.item, "add")}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white"
                    >
                      <Plus size={16} />
                      Add Stock
                    </button>

                    <button
                      type="button"
                      onClick={() => adjust(modal.item, "remove")}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white"
                    >
                      <Minus size={16} />
                      Remove Stock
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
