import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle, CheckCircle2, ClipboardCheck, PackageCheck, RefreshCw,
  Search, Truck, CalendarDays, FileText, Boxes
} from "lucide-react";
import pharmacyApi from "../../services/pharmacyApi";
import DocumentPdfActions from "../../components/pdf/DocumentPdfActions";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
const today = new Date().toISOString().slice(0, 10);
const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 disabled:cursor-not-allowed disabled:bg-slate-50";
const labelClass = "block text-sm font-medium text-slate-600";

export default function StockReceiving() {
  const [orders, setOrders] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [receiptNumber, setReceiptNumber] = useState(`GRN-${Date.now()}`);
  const [receivedDate, setReceivedDate] = useState(today);
  const [notes, setNotes] = useState("");
  const [quantities, setQuantities] = useState({});
  const [batchNumbers, setBatchNumbers] = useState({});
  const [expiryDates, setExpiryDates] = useState({});
  const [locations, setLocations] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [orderData, receiptData] = await Promise.all([
        pharmacyApi.listPurchaseOrders(),
        pharmacyApi.listStockReceipts(),
      ]);
      setOrders(Array.isArray(orderData) ? orderData : []);
      setReceipts(Array.isArray(receiptData) ? receiptData : []);
    } catch (e) {
      setError(
        e?.response?.data?.detail ||
          e?.message ||
          "Unable to load stock receiving data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const eligibleOrders = useMemo(
    () =>
      orders.filter((order) =>
        ["approved", "ordered", "partially_received"].includes(
          String(order.status || "").toLowerCase()
        )
      ),
    [orders]
  );

  const selected = orders.find((order) => String(order.id) === String(selectedId));
  const visibleReceipts = receipts.filter((receipt) => {
    const term = search.trim().toLowerCase();
    return (
      !term ||
      [
        receipt.receipt_number,
        receipt.purchase_order_id,
        receipt.notes,
      ].some((value) => String(value || "").toLowerCase().includes(term))
    );
  });

  const updateItemField = (setter, itemId, value) =>
    setter((current) => ({ ...current, [itemId]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!selected) {
      setError("Select an approved or ordered purchase order.");
      return;
    }

    const items = (selected.items || [])
      .filter((item) => Number(quantities[item.id] || 0) > 0)
      .map((item) => ({
        purchase_order_item_id: Number(item.id),
        received_quantity: Number(quantities[item.id]),
        unit_cost: Number(item.unit_price || 0),
        batch_number: batchNumbers[item.id]?.trim() || null,
        expiry_date: expiryDates[item.id]
          ? new Date(`${expiryDates[item.id]}T00:00:00`).toISOString()
          : null,
        location: locations[item.id]?.trim() || null,
      }));

    if (!items.length) {
      setError("Enter a received quantity for at least one order item.");
      return;
    }

    try {
      setSaving(true);
      await pharmacyApi.createStockReceipt({
        receipt_number: receiptNumber.trim(),
        purchase_order_id: Number(selected.id),
        received_date: receivedDate,
        notes: notes.trim() || null,
        items,
      });
      setMessage("Stock receipt saved successfully. Inventory has been updated by the receiving workflow.");
      setSelectedId("");
      setQuantities({});
      setBatchNumbers({});
      setExpiryDates({});
      setLocations({});
      setNotes("");
      setReceiptNumber(`GRN-${Date.now()}`);
      await load();
    } catch (e) {
      setError(
        e?.response?.data?.detail ||
          e?.message ||
          "Unable to save stock receipt."
      );
    } finally {
      setSaving(false);
    }
  };

  const totalReceivingLines = Object.values(quantities).filter(
    (quantity) => Number(quantity) > 0
  ).length;

  return (
    <div className="min-w-0 space-y-6 text-slate-900">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
            <Truck size={23} strokeWidth={1.9} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">
              Procurement / Inventory
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Stock Receiving
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Receive goods against approved purchase orders and capture batch, expiry, and storage details.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800 disabled:cursor-wait disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </header>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {message && (
        <div role="status" className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={submit} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <PackageCheck size={19} />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Receive a purchase order</h2>
            <p className="mt-0.5 text-xs text-slate-500">Select an eligible order and record the quantity physically received.</p>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className={labelClass}>
              Purchase order <span className="text-rose-500">*</span>
              <select
                required
                value={selectedId}
                onChange={(event) => {
                  setSelectedId(event.target.value);
                  setQuantities({});
                  setBatchNumbers({});
                  setExpiryDates({});
                  setLocations({});
                }}
                className={inputClass}
              >
                <option value="">Select eligible order</option>
                {eligibleOrders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.purchase_order_number || `PO-${order.id}`} · {order.status}
                  </option>
                ))}
              </select>
              {!loading && eligibleOrders.length === 0 && (
                <span className="mt-1.5 block text-xs font-normal text-amber-700">
                  No eligible orders. An approved or ordered purchase order is required.
                </span>
              )}
            </label>
            <label className={labelClass}>
              Receipt number <span className="text-rose-500">*</span>
              <input
                required
                value={receiptNumber}
                onChange={(event) => setReceiptNumber(event.target.value)}
                className={inputClass}
                placeholder="GRN reference"
              />
            </label>
            <label className={labelClass}>
              Received date <span className="text-rose-500">*</span>
              <span className="relative block">
                <CalendarDays size={16} className="pointer-events-none absolute left-3 top-4 text-slate-400" />
                <input
                  type="date"
                  required
                  value={receivedDate}
                  onChange={(event) => setReceivedDate(event.target.value)}
                  className={`${inputClass} pl-9`}
                />
              </span>
            </label>
          </div>

          {selected && (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Boxes size={17} className="text-cyan-700" />
                  Items in {selected.purchase_order_number || `PO-${selected.id}`}
                </div>
                <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-800">
                  {totalReceivingLines} line{totalReceivingLines === 1 ? "" : "s"} selected
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-white text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      {["Medicine / Item", "Ordered", "Unit cost", "Receive now", "Batch number", "Expiry date", "Storage location"].map((heading) => (
                        <th key={heading} className="whitespace-nowrap px-4 py-3 font-semibold">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selected.items || []).map((item) => (
                      <tr key={item.id} className="align-middle transition hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-medium text-slate-800">{item.medicine_name || item.item_name || item.medicine_id || `Item ${item.id}`}</td>
                        <td className="px-4 py-3 tabular-nums text-slate-600">{item.quantity}</td>
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-700">{money(item.unit_price)}</td>
                        <td className="px-4 py-3">
                          <input
                            aria-label={`Quantity received for item ${item.id}`}
                            type="number"
                            min="0"
                            max={item.quantity}
                            step="1"
                            value={quantities[item.id] || ""}
                            onChange={(event) => updateItemField(setQuantities, item.id, event.target.value)}
                            className="w-24 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                            placeholder="0"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            aria-label={`Batch number for item ${item.id}`}
                            value={batchNumbers[item.id] || ""}
                            onChange={(event) => updateItemField(setBatchNumbers, item.id, event.target.value)}
                            className="w-32 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                            placeholder="Optional"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            aria-label={`Expiry date for item ${item.id}`}
                            type="date"
                            value={expiryDates[item.id] || ""}
                            onChange={(event) => updateItemField(setExpiryDates, item.id, event.target.value)}
                            className="w-36 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            aria-label={`Storage location for item ${item.id}`}
                            value={locations[item.id] || ""}
                            onChange={(event) => updateItemField(setLocations, item.id, event.target.value)}
                            className="w-32 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                            placeholder="Optional"
                          />
                        </td>
                      </tr>
                    ))}
                    {(!selected.items || selected.items.length === 0) && (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">No order items were returned for this purchase order.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-xs text-slate-500">
                Enter only quantities physically received. Batch, expiry, and location fields are optional unless required by your receiving policy.
              </p>
            </div>
          )}

          <label className={labelClass}>
            Receiving notes <span className="font-normal text-slate-400">(optional)</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              className={inputClass}
              placeholder="Add delivery condition, shortage, damage, or other receiving notes..."
            />
          </label>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">Confirm only after checking the physical delivery against the order.</p>
            <button
              type="submit"
              disabled={saving || loading || !selected || !(selected.items || []).length}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800 focus:outline-none focus:ring-4 focus:ring-cyan-600/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ClipboardCheck size={17} />
              {saving ? "Saving receipt…" : "Confirm goods received"}
            </button>
          </div>
        </div>
      </form>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Receipt history</h2>
              <p className="mt-0.5 text-xs text-slate-500">Previously recorded goods receipts</p>
            </div>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search size={16} className="pointer-events-none absolute left-3 top-3 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search receipt number or notes"
              aria-label="Search receipts"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
            />
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-10 text-sm text-slate-500">
            <RefreshCw size={16} className="animate-spin" /> Loading receipts…
          </div>
        ) : visibleReceipts.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <PackageCheck size={20} />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-700">
              {search.trim() ? "No matching receipts" : "No stock receipts yet"}
            </p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {search.trim()
                ? "Try a different receipt number or search term."
                : "Receipts will appear here after goods are confirmed against a purchase order."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {["Receipt", "Purchase order", "Received date", "Items", "Notes"].map((heading) => (
                    <th key={heading} className="whitespace-nowrap px-5 py-3 font-semibold">{heading}</th>
                  ))}
                  <th className="whitespace-nowrap px-5 py-3 font-semibold">Document</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleReceipts.map((receipt) => (
                  <tr key={receipt.id} className="transition hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-800">{receipt.receipt_number || `GRN-${receipt.id}`}</td>
                    <td className="px-5 py-4 text-slate-600">{receipt.purchase_order_number || receipt.purchase_order_id || "—"}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">{receipt.received_date ? String(receipt.received_date).slice(0, 10) : "—"}</td>
                    <td className="px-5 py-4 text-slate-600">{receipt.items?.length ?? "—"}</td>
                    <td className="max-w-xs px-5 py-4 text-slate-500"><span className="line-clamp-2">{receipt.notes || "—"}</span></td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <DocumentPdfActions
                        title="Stock Receipt"
                        record={receipt}
                        fields={[
                          ["Receipt Number", receipt.receipt_number || `GRN-${receipt.id}`],
                          ["Purchase Order", receipt.purchase_order_number || receipt.purchase_order_id || "—"],
                          ["Received Date", receipt.received_date ? String(receipt.received_date).slice(0, 10) : "—"],
                          ["Receipt Items", receipt.items || []],
                          ["Notes", receipt.notes || "—"],
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
