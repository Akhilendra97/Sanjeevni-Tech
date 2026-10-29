import React, { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Eye,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import pharmacyApi from "../../services/pharmacyApi";

const emptyItem = {
  medicine_id: "",
  quantity: 1,
  unit_price: "",
  tax_percent: 0,
  discount_amount: 0,
  notes: "",
};

const initialForm = {
  purchase_order_number: "",
  supplier_id: "",
  order_date: new Date().toISOString().slice(0, 10),
  expected_delivery_date: "",
  status: "draft",
  tax_amount: 0,
  discount_amount: 0,
  notes: "",
  items: [{ ...emptyItem }],
};

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function PurchaseOrders() {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(initialForm);

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const [orderData, supplierData] = await Promise.all([
        pharmacyApi.listPurchaseOrders(),
        pharmacyApi.listSuppliers(),
      ]);

      setOrders(
        Array.isArray(orderData)
          ? orderData
          : Array.isArray(orderData?.items)
            ? orderData.items
            : []
      );

      setSuppliers(
        Array.isArray(supplierData)
          ? supplierData
          : Array.isArray(supplierData?.items)
            ? supplierData.items
            : []
      );
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to load purchase orders."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const supplierName = (id) =>
    suppliers.find((item) => Number(item.id) === Number(id))?.name ||
    `Supplier #${id}`;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return orders;

    return orders.filter((order) =>
      [
        order.purchase_order_number,
        order.status,
        supplierName(order.supplier_id),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [orders, search, suppliers]);

  const subtotal = useMemo(
    () =>
      form.items.reduce(
        (sum, item) =>
          sum +
          Number(item.quantity || 0) * Number(item.unit_price || 0) -
          Number(item.discount_amount || 0),
        0
      ),
    [form.items]
  );

  const total = useMemo(
    () =>
      subtotal +
      Number(form.tax_amount || 0) -
      Number(form.discount_amount || 0),
    [subtotal, form.tax_amount, form.discount_amount]
  );

  const openCreate = () => {
    setError("");
    setForm({
      ...initialForm,
      purchase_order_number: `PO-${Date.now()}`,
      items: [{ ...emptyItem }],
    });
    setModal("create");
  };

  const addItem = () => {
    setForm((current) => ({
      ...current,
      items: [...current.items, { ...emptyItem }],
    }));
  };

  const removeItem = (index) => {
    if (form.items.length === 1) return;

    setForm((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const updateItem = (index, key, value) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      ),
    }));
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!form.purchase_order_number.trim()) {
      setError("Purchase order number is required.");
      return;
    }

    if (!form.supplier_id) {
      setError("Please select a supplier.");
      return;
    }

    if (!form.items.length) {
      setError("At least one purchase order item is required.");
      return;
    }

    if (
      form.items.some(
        (item) =>
          !item.medicine_id ||
          Number(item.quantity) <= 0 ||
          Number(item.unit_price) < 0
      )
    ) {
      setError("Every item needs a valid medicine ID, quantity and unit price.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        purchase_order_number: form.purchase_order_number.trim(),
        supplier_id: Number(form.supplier_id),
        order_date: form.order_date || undefined,
        expected_delivery_date: form.expected_delivery_date || null,
        status: form.status,
        tax_amount: Number(form.tax_amount || 0),
        discount_amount: Number(form.discount_amount || 0),
        notes: form.notes || null,
        items: form.items.map((item) => ({
          medicine_id: Number(item.medicine_id),
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          tax_percent: Number(item.tax_percent || 0),
          discount_amount: Number(item.discount_amount || 0),
          notes: item.notes || null,
        })),
      };

      await pharmacyApi.createPurchaseOrder(payload);

      setModal(null);
      await load();
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to create purchase order."
      );
    } finally {
      setSaving(false);
    }
  };

  const viewOrder = async (order) => {
    try {
      setError("");
      const data = await pharmacyApi.getPurchaseOrder(order.id);
      setSelected(data);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to load purchase order."
      );
    }
  };

  const changeStatus = async (order, status) => {
    try {
      setError("");
      await pharmacyApi.updatePurchaseOrderStatus(order.id, status);
      await load();
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to update order status."
      );
    }
  };

  const statusClass = (status) => {
    const value = String(status || "").toLowerCase();

    if (value === "approved" || value === "received") {
      return "bg-emerald-50 text-emerald-700";
    }

    if (value === "cancelled" || value === "rejected") {
      return "bg-red-50 text-red-700";
    }

    if (value === "pending") {
      return "bg-amber-50 text-amber-700";
    }

    return "bg-slate-100 text-slate-700";
  };

  return (
    <div className="min-h-full bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
              <ClipboardList size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Purchase Orders
              </h1>
              <p className="text-sm text-slate-500">
                Create and manage pharmacy procurement orders
              </p>
            </div>
          </div>

          <button
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20"
          >
            <Plus size={17} />
            New Purchase Order
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Total Orders
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {orders.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Draft
            </p>
            <p className="mt-2 text-2xl font-bold text-blue-600">
              {
                orders.filter(
                  (item) => String(item.status).toLowerCase() === "draft"
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Received
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {
                orders.filter(
                  (item) => String(item.status).toLowerCase() === "received"
                ).length
              }
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
            <div className="relative max-w-md flex-1">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search PO number, supplier, status..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-cyan-500"
              />
            </div>

            <button
              onClick={load}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
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
              <ClipboardList
                className="mx-auto text-slate-300"
                size={42}
              />
              <h3 className="mt-4 font-semibold text-slate-800">
                No purchase orders
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Create a purchase order when pharmacy stock needs replenishment.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200 text-left">
                    {[
                      "PO Number",
                      "Supplier",
                      "Order Date",
                      "Delivery",
                      "Total",
                      "Status",
                      "Action",
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
                  {filtered.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <span className="font-semibold text-slate-900">
                          {order.purchase_order_number}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {supplierName(order.supplier_id)}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {order.order_date || "—"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {order.expected_delivery_date || "—"}
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {money(order.total_amount)}
                      </td>

                      <td className="px-5 py-4">
                        <select
                          value={order.status || "draft"}
                          onChange={(e) =>
                            changeStatus(order, e.target.value)
                          }
                          className={`rounded-full border-0 px-3 py-1.5 text-xs font-bold outline-none ${statusClass(
                            order.status
                          )}`}
                        >
                          <option value="draft">draft</option>
                          <option value="pending">pending</option>
                          <option value="approved">approved</option>
                          <option value="received">received</option>
                          <option value="cancelled">cancelled</option>
                        </select>
                      </td>

                      <td className="px-5 py-4">
                        <button
                          onClick={() => viewOrder(order)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-cyan-50 hover:text-cyan-700"
                          title="View order"
                        >
                          <Eye size={17} />
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

      {modal === "create" && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 p-4">
          <div className="mx-auto my-6 w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Create Purchase Order
                </h2>
                <p className="text-xs text-slate-500">
                  Add supplier and procurement items
                </p>
              </div>

              <button
                onClick={() => setModal(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={submit}>
              <div className="space-y-5 p-6">
                <div className="grid gap-4 md:grid-cols-4">
                  <label>
                    <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                      PO Number *
                    </span>
                    <input
                      value={form.purchase_order_number}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          purchase_order_number: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500"
                    />
                  </label>

                  <label>
                    <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                      Supplier *
                    </span>
                    <select
                      value={form.supplier_id}
                      onChange={(e) =>
                        setForm({ ...form, supplier_id: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-500"
                    >
                      <option value="">Select supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                      Order Date
                    </span>
                    <input
                      type="date"
                      value={form.order_date}
                      onChange={(e) =>
                        setForm({ ...form, order_date: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500"
                    />
                  </label>

                  <label>
                    <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                      Expected Delivery
                    </span>
                    <input
                      type="date"
                      value={form.expected_delivery_date}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          expected_delivery_date: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500"
                    />
                  </label>
                </div>

                <div className="rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        Order Items
                      </h3>
                      <p className="text-xs text-slate-500">
                        Enter medicine IDs from the pharmacy medicine master.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addItem}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-50 px-3 py-2 text-xs font-bold text-cyan-700"
                    >
                      <Plus size={14} />
                      Add Item
                    </button>
                  </div>

                  <div className="space-y-3 p-4">
                    {form.items.map((item, index) => (
                      <div
                        key={index}
                        className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 md:grid-cols-7"
                      >
                        <label>
                          <span className="mb-1 block text-[11px] font-bold text-slate-500">
                            Medicine ID *
                          </span>
                          <input
                            type="number"
                            min="1"
                            value={item.medicine_id}
                            onChange={(e) =>
                              updateItem(index, "medicine_id", e.target.value)
                            }
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm outline-none focus:border-cyan-500"
                          />
                        </label>

                        <label>
                          <span className="mb-1 block text-[11px] font-bold text-slate-500">
                            Quantity *
                          </span>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(index, "quantity", e.target.value)
                            }
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm outline-none focus:border-cyan-500"
                          />
                        </label>

                        <label>
                          <span className="mb-1 block text-[11px] font-bold text-slate-500">
                            Unit Price *
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) =>
                              updateItem(index, "unit_price", e.target.value)
                            }
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm outline-none focus:border-cyan-500"
                          />
                        </label>

                        <label>
                          <span className="mb-1 block text-[11px] font-bold text-slate-500">
                            Tax %
                          </span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={item.tax_percent}
                            onChange={(e) =>
                              updateItem(index, "tax_percent", e.target.value)
                            }
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm outline-none focus:border-cyan-500"
                          />
                        </label>

                        <label>
                          <span className="mb-1 block text-[11px] font-bold text-slate-500">
                            Discount
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.discount_amount}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "discount_amount",
                                e.target.value
                              )
                            }
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm outline-none focus:border-cyan-500"
                          />
                        </label>

                        <div className="flex items-end">
                          <div className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm font-semibold text-slate-700">
                            {money(
                              Number(item.quantity || 0) *
                                Number(item.unit_price || 0) -
                                Number(item.discount_amount || 0)
                            )}
                          </div>
                        </div>

                        <div className="flex items-end justify-end">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            disabled={form.items.length === 1}
                            className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                            title="Remove item"
                          >
                            <X size={17} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  <label>
                    <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                      PO Tax Amount
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.tax_amount}
                      onChange={(e) =>
                        setForm({ ...form, tax_amount: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500"
                    />
                  </label>

                  <label>
                    <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                      PO Discount
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.discount_amount}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          discount_amount: e.target.value,
                        })
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
                      <option value="draft">draft</option>
                      <option value="pending">pending</option>
                      <option value="approved">approved</option>
                    </select>
                  </label>

                  <div className="rounded-xl bg-slate-900 p-3 text-white">
                    <div className="text-xs text-slate-300">Estimated Total</div>
                    <div className="mt-1 text-xl font-bold">
                      {money(total)}
                    </div>
                  </div>
                </div>

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
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-500"
                  />
                </label>
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
                  disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving ? "Creating..." : "Create Purchase Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 p-4">
          <div className="mx-auto my-8 w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {selected.purchase_order_number}
                </h2>
                <p className="text-xs text-slate-500">
                  {supplierName(selected.supplier_id)}
                </p>
              </div>

              <button
                onClick={() => setSelected(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <div className="grid gap-4 p-6 md:grid-cols-4">
              <div>
                <p className="text-xs text-slate-500">Status</p>
                <p className="mt-1 font-bold text-slate-800">
                  {selected.status}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Subtotal</p>
                <p className="mt-1 font-bold text-slate-800">
                  {money(selected.subtotal)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Tax</p>
                <p className="mt-1 font-bold text-slate-800">
                  {money(selected.tax_amount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Total</p>
                <p className="mt-1 font-bold text-cyan-700">
                  {money(selected.total_amount)}
                </p>
              </div>
            </div>

            <div className="px-6 pb-6">
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[700px]">
                  <thead className="bg-slate-50 text-left">
                    <tr>
                      <th className="px-4 py-3 text-xs text-slate-500">
                        Medicine
                      </th>
                      <th className="px-4 py-3 text-xs text-slate-500">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-xs text-slate-500">
                        Unit Price
                      </th>
                      <th className="px-4 py-3 text-xs text-slate-500">
                        Tax
                      </th>
                      <th className="px-4 py-3 text-xs text-slate-500">
                        Total
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {(selected.items || []).map((item) => (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="px-4 py-3 text-sm text-slate-700">
                          #{item.medicine_id}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {money(item.unit_price)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {item.tax_percent}%
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                          {money(item.total_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
