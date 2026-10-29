import React, { useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    ArrowRight,
    BarChart3,
    Boxes,
    ClipboardList,
    Clock3,
    DollarSign,
    Package,
    Pill,
    RefreshCw,
    ShoppingCart,
    Stethoscope,
    TrendingUp,
    Truck,
    Users,
    XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000/api/v1";

const getToken = () =>
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    "";

const request = async (endpoint) => {
    const token = getToken();

    const headers = {
        "Content-Type": "application/json",
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        headers,
    });

    let data = null;

    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {
        const detail =
            data?.detail ||
            data?.message ||
            `Request failed with status ${response.status}`;

        throw new Error(
            Array.isArray(detail)
                ? detail.map((item) => item?.msg || String(item)).join(", ")
                : String(detail)
        );
    }

    return data;
};

const formatCurrency = (value) => {
    const number = Number(value || 0);

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(number);
};

const formatDateTime = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const getStatusClass = (status) => {
    switch (String(status || "").toLowerCase()) {
        case "dispensed":
            return "bg-emerald-50 text-emerald-700 border-emerald-200";

        case "partially_dispensed":
            return "bg-amber-50 text-amber-700 border-amber-200";

        case "pending":
            return "bg-blue-50 text-blue-700 border-blue-200";

        case "cancelled":
            return "bg-red-50 text-red-700 border-red-200";

        default:
            return "bg-slate-50 text-slate-600 border-slate-200";
    }
};

function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    iconClass,
    onClick,
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="group w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-slate-500">
                        {title}
                    </p>

                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                        {value}
                    </p>

                    <p className="mt-1 text-xs font-medium text-slate-400">
                        {subtitle}
                    </p>
                </div>

                <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
                >
                    <Icon size={21} />
                </div>
            </div>

            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-cyan-700 opacity-0 transition group-hover:opacity-100">
                Open module
                <ArrowRight size={14} />
            </div>
        </button>
    );
}

function QuickAction({ icon: Icon, title, description, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-cyan-200 hover:bg-cyan-50/40"
        >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                <Icon size={18} />
            </div>

            <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-800">
                    {title}
                </p>

                <p className="truncate text-xs text-slate-500">
                    {description}
                </p>
            </div>

            <ArrowRight
                size={16}
                className="ml-auto shrink-0 text-slate-300"
            />
        </button>
    );
}

export default function Dashboard() {
    const navigate = useNavigate();

    const [medicines, setMedicines] = useState([]);
    const [lowStock, setLowStock] = useState([]);
    const [expired, setExpired] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [dispensings, setDispensings] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const loadDashboard = async (isRefresh = false) => {
        try {
            setError("");

            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const results = await Promise.allSettled([
                request("/medicines?limit=500"),
                request("/medicines/low-stock"),
                request("/medicines/expired"),
                request("/prescriptions"),
                request("/pharmacy-dispensing"),
            ]);

            const [
                medicinesResult,
                lowStockResult,
                expiredResult,
                prescriptionsResult,
                dispensingsResult,
            ] = results;

            const failures = [];

            if (medicinesResult.status === "fulfilled") {
                setMedicines(
                    Array.isArray(medicinesResult.value)
                        ? medicinesResult.value
                        : []
                );
            } else {
                failures.push("medicines");
            }

            if (lowStockResult.status === "fulfilled") {
                setLowStock(
                    Array.isArray(lowStockResult.value)
                        ? lowStockResult.value
                        : []
                );
            } else {
                failures.push("low-stock");
            }

            if (expiredResult.status === "fulfilled") {
                setExpired(
                    Array.isArray(expiredResult.value)
                        ? expiredResult.value
                        : []
                );
            } else {
                failures.push("expired");
            }

            if (prescriptionsResult.status === "fulfilled") {
                setPrescriptions(
                    Array.isArray(prescriptionsResult.value)
                        ? prescriptionsResult.value
                        : []
                );
            } else {
                failures.push("prescriptions");
            }

            if (dispensingsResult.status === "fulfilled") {
                setDispensings(
                    Array.isArray(dispensingsResult.value)
                        ? dispensingsResult.value
                        : []
                );
            } else {
                failures.push("dispensing");
            }

            if (failures.length === results.length) {
                throw new Error(
                    "Unable to load pharmacist dashboard data."
                );
            }

            if (failures.length > 0) {
                setError(
                    `Some dashboard data could not be loaded: ${failures.join(
                        ", "
                    )}.`
                );
            }
        } catch (err) {
            setError(err?.message || "Unable to load dashboard.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    const activeMedicines = useMemo(
        () =>
            medicines.filter(
                (medicine) =>
                    medicine?.is_active !== false
            ),
        [medicines]
    );

    const pendingPrescriptions = useMemo(
        () =>
            prescriptions.filter((prescription) => {
                const status = String(
                    prescription?.status || ""
                ).toLowerCase();

                return (
                    !status ||
                    ["pending", "active", "issued"].includes(status)
                );
            }),
        [prescriptions]
    );

    const todayDispensings = useMemo(() => {
        const today = new Date();

        return dispensings.filter((item) => {
            if (!item?.created_at && !item?.dispensed_at) {
                return false;
            }

            const date = new Date(
                item.dispensed_at || item.created_at
            );

            return (
                date.getFullYear() === today.getFullYear() &&
                date.getMonth() === today.getMonth() &&
                date.getDate() === today.getDate()
            );
        });
    }, [dispensings]);

    const todayDispensedValue = useMemo(
        () =>
            todayDispensings.reduce(
                (sum, item) =>
                    sum + Number(item?.total_amount || 0),
                0
            ),
        [todayDispensings]
    );

    const recentDispensings = useMemo(
        () =>
            [...dispensings]
                .sort((a, b) => {
                    const first = new Date(
                        b?.created_at ||
                            b?.dispensed_at ||
                            0
                    ).getTime();

                    const second = new Date(
                        a?.created_at ||
                            a?.dispensed_at ||
                            0
                    ).getTime();

                    return first - second;
                })
                .slice(0, 6),
        [dispensings]
    );

    const criticalMedicines = useMemo(
        () =>
            [...lowStock]
                .sort(
                    (a, b) =>
                        Number(a?.stock_quantity || 0) -
                        Number(b?.stock_quantity || 0)
                )
                .slice(0, 6),
        [lowStock]
    );

    const openPrescription = (prescription) => {
        if (!prescription?.id) {
            navigate("/pharmacist/prescriptions");
            return;
        }

        navigate(
            `/pharmacist/prescriptions?prescription=${prescription.id}`
        );
    };

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">
                        <Pill size={15} />
                        Pharmacy Operations
                    </div>

                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                        Pharmacist Dashboard
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Monitor medicines, prescriptions, inventory and
                        dispensing activity from one place.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => loadDashboard(true)}
                    disabled={loading || refreshing}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <RefreshCw
                        size={17}
                        className={
                            refreshing
                                ? "animate-spin"
                                : ""
                        }
                    />
                    {refreshing ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            {/* ERROR */}
            {error && (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <AlertTriangle
                        size={19}
                        className="mt-0.5 shrink-0"
                    />

                    <div className="flex-1">
                        <p className="font-bold">
                            Dashboard warning
                        </p>
                        <p className="mt-0.5">{error}</p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setError("")}
                        className="text-amber-700"
                    >
                        <XCircle size={18} />
                    </button>
                </div>
            )}

            {/* STATS */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Active Medicines"
                    value={loading ? "—" : activeMedicines.length}
                    subtitle="Medicine catalogue"
                    icon={Pill}
                    iconClass="bg-cyan-50 text-cyan-700"
                    onClick={() =>
                        navigate("/pharmacist/medicines")
                    }
                />

                <StatCard
                    title="Low Stock"
                    value={loading ? "—" : lowStock.length}
                    subtitle="Needs replenishment"
                    icon={Boxes}
                    iconClass="bg-amber-50 text-amber-700"
                    onClick={() =>
                        navigate("/pharmacist/inventory")
                    }
                />

                <StatCard
                    title="Pending Prescriptions"
                    value={
                        loading
                            ? "—"
                            : pendingPrescriptions.length
                    }
                    subtitle="Awaiting pharmacy action"
                    icon={ClipboardList}
                    iconClass="bg-blue-50 text-blue-700"
                    onClick={() =>
                        navigate("/pharmacist/prescriptions")
                    }
                />

                <StatCard
                    title="Today's Dispensing"
                    value={
                        loading
                            ? "—"
                            : todayDispensings.length
                    }
                    subtitle={
                        loading
                            ? "Today's activity"
                            : formatCurrency(todayDispensedValue)
                    }
                    icon={TrendingUp}
                    iconClass="bg-emerald-50 text-emerald-700"
                    onClick={() =>
                        navigate("/pharmacist/dispensing")
                    }
                />
            </div>

            {/* MAIN GRID */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                {/* RECENT DISPENSING */}
                <section className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <Clock3
                                    size={18}
                                    className="text-cyan-700"
                                />
                                <h2 className="font-bold text-slate-900">
                                    Recent Dispensing
                                </h2>
                            </div>

                            <p className="mt-1 text-xs text-slate-500">
                                Latest pharmacy dispensing transactions
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/pharmacist/dispensing"
                                )
                            }
                            className="text-xs font-bold text-cyan-700 hover:text-cyan-800"
                        >
                            View all
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="p-8 text-center text-sm text-slate-500">
                                Loading dispensing activity...
                            </div>
                        ) : recentDispensings.length === 0 ? (
                            <div className="p-10 text-center">
                                <Package
                                    size={30}
                                    className="mx-auto text-slate-300"
                                />
                                <p className="mt-3 text-sm font-semibold text-slate-600">
                                    No dispensing activity found.
                                </p>
                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(
                                            "/pharmacist/dispensing"
                                        )
                                    }
                                    className="mt-3 text-xs font-bold text-cyan-700"
                                >
                                    Open Dispensing
                                </button>
                            </div>
                        ) : (
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-xs uppercase tracking-wide text-slate-400">
                                        <th className="px-5 py-3 font-bold">
                                            Number
                                        </th>
                                        <th className="px-5 py-3 font-bold">
                                            Patient
                                        </th>
                                        <th className="px-5 py-3 font-bold">
                                            Amount
                                        </th>
                                        <th className="px-5 py-3 font-bold">
                                            Status
                                        </th>
                                        <th className="px-5 py-3 font-bold">
                                            Date
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {recentDispensings.map(
                                        (item) => (
                                            <tr
                                                key={
                                                    item.id
                                                }
                                                className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                                            >
                                                <td className="whitespace-nowrap px-5 py-3 font-bold text-slate-800">
                                                    {item.dispensing_number ||
                                                        `#${item.id}`}
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                                                    {item.patient_id
                                                        ? `Patient #${item.patient_id}`
                                                        : "—"}
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-3 font-semibold text-slate-800">
                                                    {formatCurrency(
                                                        item.total_amount
                                                    )}
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-3">
                                                    <span
                                                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${getStatusClass(
                                                            item.status
                                                        )}`}
                                                    >
                                                        {String(
                                                            item.status ||
                                                                "unknown"
                                                        )
                                                            .replace(
                                                                /_/g,
                                                                " "
                                                            )
                                                            .replace(
                                                                /\b\w/g,
                                                                (char) =>
                                                                    char.toUpperCase()
                                                            )}
                                                    </span>
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-500">
                                                    {formatDateTime(
                                                        item.created_at ||
                                                            item.dispensed_at
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </section>

                {/* QUICK ACTIONS */}
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2">
                        <BarChart3
                            size={18}
                            className="text-cyan-700"
                        />
                        <h2 className="font-bold text-slate-900">
                            Quick Actions
                        </h2>
                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                        Jump directly to common pharmacy operations.
                    </p>

                    <div className="mt-4 space-y-2.5">
                        <QuickAction
                            icon={Pill}
                            title="Manage Medicines"
                            description="Add, edit and monitor medicines"
                            onClick={() =>
                                navigate(
                                    "/pharmacist/medicines"
                                )
                            }
                        />

                        <QuickAction
                            icon={Boxes}
                            title="Check Inventory"
                            description="Review stock and batches"
                            onClick={() =>
                                navigate(
                                    "/pharmacist/inventory"
                                )
                            }
                        />

                        <QuickAction
                            icon={ClipboardList}
                            title="Prescriptions"
                            description="Review pharmacy prescriptions"
                            onClick={() =>
                                navigate(
                                    "/pharmacist/prescriptions"
                                )
                            }
                        />

                        <QuickAction
                            icon={ShoppingCart}
                            title="New Dispensing"
                            description="Dispense medicines against prescription"
                            onClick={() =>
                                navigate(
                                    "/pharmacist/dispensing"
                                )
                            }
                        />

                        <QuickAction
                            icon={Truck}
                            title="Purchase Orders"
                            description="Manage pharmacy procurement"
                            onClick={() =>
                                navigate(
                                    "/pharmacist/purchase-orders"
                                )
                            }
                        />
                    </div>
                </section>
            </div>

            {/* INVENTORY ALERTS */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <section className="rounded-2xl border border-amber-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-amber-100 px-5 py-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <AlertTriangle
                                    size={18}
                                    className="text-amber-600"
                                />
                                <h2 className="font-bold text-slate-900">
                                    Low Stock Alerts
                                </h2>
                            </div>

                            <p className="mt-1 text-xs text-slate-500">
                                Medicines at or below reorder level
                            </p>
                        </div>

                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                            {lowStock.length}
                        </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {criticalMedicines.length === 0 ? (
                            <div className="p-8 text-center text-sm text-slate-500">
                                No low-stock medicines.
                            </div>
                        ) : (
                            criticalMedicines.map(
                                (medicine) => (
                                    <div
                                        key={
                                            medicine.id
                                        }
                                        className="flex items-center justify-between gap-4 px-5 py-3.5"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-slate-800">
                                                {medicine.name ||
                                                    "Unnamed medicine"}
                                            </p>

                                            <p className="mt-0.5 text-xs text-slate-500">
                                                {medicine.medicine_code ||
                                                    "No code"}
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-sm font-bold text-amber-700">
                                                {Number(
                                                    medicine.stock_quantity ||
                                                        0
                                                )}
                                            </p>

                                            <p className="text-[11px] text-slate-400">
                                                reorder{" "}
                                                {Number(
                                                    medicine.reorder_level ||
                                                        0
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                )
                            )
                        )}
                    </div>
                </section>

                <section className="rounded-2xl border border-red-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-red-100 px-5 py-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <XCircle
                                    size={18}
                                    className="text-red-600"
                                />
                                <h2 className="font-bold text-slate-900">
                                    Expired Medicines
                                </h2>
                            </div>

                            <p className="mt-1 text-xs text-slate-500">
                                Active medicines past their expiry date
                            </p>
                        </div>

                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
                            {expired.length}
                        </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {expired.length === 0 ? (
                            <div className="p-8 text-center text-sm text-slate-500">
                                No expired medicines.
                            </div>
                        ) : (
                            expired
                                .slice(0, 6)
                                .map((medicine) => (
                                    <div
                                        key={
                                            medicine.id
                                        }
                                        className="flex items-center justify-between gap-4 px-5 py-3.5"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-slate-800">
                                                {medicine.name ||
                                                    "Unnamed medicine"}
                                            </p>

                                            <p className="mt-0.5 text-xs text-slate-500">
                                                {medicine.medicine_code ||
                                                    "No code"}
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-xs font-bold text-red-700">
                                                {medicine.expiry_date
                                                    ? new Date(
                                                          medicine.expiry_date
                                                      ).toLocaleDateString(
                                                          "en-IN"
                                                      )
                                                    : "Expired"}
                                            </p>
                                        </div>
                                    </div>
                                ))
                        )}
                    </div>
                </section>
            </div>

            {/* FOOTER SUMMARY */}
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-cyan-50 to-blue-50 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-cyan-700 shadow-sm">
                            <Stethoscope size={21} />
                        </div>

                        <div>
                            <p className="font-bold text-slate-900">
                                Pharmacy Operations Overview
                            </p>

                            <p className="mt-1 text-sm text-slate-600">
                                {activeMedicines.length} active medicines
                                {" • "}
                                {lowStock.length} low-stock alerts
                                {" • "}
                                {expired.length} expired
                                {" • "}
                                {todayDispensings.length} today's dispensing
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/pharmacist/purchase-orders"
                            )
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                    >
                        Manage Procurement
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
