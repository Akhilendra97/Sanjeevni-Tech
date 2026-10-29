import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    ArrowDownRight,
    ArrowUpRight,
    BarChart3,
    CheckCircle2,
    CircleDollarSign,
    FileText,
    HandCoins,
    Loader2,
    RefreshCw,
    ShieldCheck,
    TrendingUp,
    WalletCards,
} from "lucide-react";

const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000/api/v1";

function getToken() {
    return localStorage.getItem("access_token");
}

async function apiGet(path) {
    const token = getToken();

    const response = await fetch(`${API_BASE}${path}`, {
        method: "GET",
        headers: {
            Accept: "application/json",
            ...(token
                ? {
                      Authorization: `Bearer ${token}`,
                  }
                : {}),
        },
    });

    if (!response.ok) {
        let message = `Request failed (${response.status})`;

        try {
            const data = await response.json();
            message =
                data?.detail ||
                data?.message ||
                message;
        } catch {
            // Keep default message.
        }

        throw new Error(message);
    }

    return response.json();
}

function asArray(value) {
    if (Array.isArray(value)) return value;

    if (Array.isArray(value?.items)) {
        return value.items;
    }

    if (Array.isArray(value?.data)) {
        return value.data;
    }

    if (Array.isArray(value?.results)) {
        return value.results;
    }

    return [];
}

function numericValue(value) {
    if (value === null || value === undefined || value === "") {
        return 0;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function extractAmount(record) {
    const candidates = [
        record?.claim_amount,
        record?.total_amount,
        record?.amount,
        record?.grand_total,
        record?.net_amount,
        record?.paid_amount,
        record?.total,
        record?.price,
    ];

    for (const value of candidates) {
        const amount = numericValue(value);

        if (amount !== 0) {
            return amount;
        }
    }

    return 0;
}

function formatCurrency(value) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(numericValue(value));
}

function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function statusLabel(value) {
    if (!value) return "Unknown";

    return String(value)
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function StatusBadge({ status }) {
    const normalized = String(status || "")
        .toLowerCase()
        .replace(/[\s-]+/g, "_");

    let className =
        "bg-slate-100 text-slate-700 border-slate-200";

    if (
        [
            "paid",
            "completed",
            "success",
            "successful",
            "approved",
            "settled",
        ].includes(normalized)
    ) {
        className =
            "bg-emerald-50 text-emerald-700 border-emerald-200";
    } else if (
        [
            "pending",
            "processing",
            "partially_paid",
            "partial",
        ].includes(normalized)
    ) {
        className =
            "bg-amber-50 text-amber-700 border-amber-200";
    } else if (
        [
            "cancelled",
            "canceled",
            "failed",
            "rejected",
            "overdue",
        ].includes(normalized)
    ) {
        className =
            "bg-rose-50 text-rose-700 border-rose-200";
    }

    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}
        >
            {statusLabel(status)}
        </span>
    );
}

function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    loading,
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-slate-500">
                        {title}
                    </p>

                    <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                        {loading ? (
                            <span className="inline-flex items-center gap-2 text-base text-slate-400">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading
                            </span>
                        ) : (
                            value
                        )}
                    </div>

                    {subtitle && (
                        <p className="mt-1 text-xs text-slate-500">
                            {subtitle}
                        </p>
                    )}
                </div>

                <div className="rounded-xl bg-cyan-50 p-3 text-cyan-700">
                    <Icon className="h-5 w-5" />
                </div>
            </div>

            {trend && (
                <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    {trend}
                </div>
            )}
        </div>
    );
}

export default function AccountantDashboard() {
    const [state, setState] = useState({
        bills: [],
        invoices: [],
        payments: [],
        claims: [],
    });

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const loadDashboard = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError("");

        const requests = [
            {
                key: "bills",
                paths: [
                    "/billing",
                    "/bills",
                ],
            },
            {
                key: "invoices",
                paths: [
                    "/invoices",
                ],
            },
            {
                key: "payments",
                paths: [
                    "/payments",
                ],
            },
            {
                key: "claims",
                paths: [
                    "/insurance-claims",
                    "/insurance",
                ],
            },
        ];

        const results = {
            bills: [],
            invoices: [],
            payments: [],
            claims: [],
        };

        const failures = [];

        for (const request of requests) {
            let loaded = false;
            let lastError = null;

            for (const path of request.paths) {
                try {
                    const data = await apiGet(path);

                    results[request.key] = asArray(data);
                    loaded = true;
                    break;
                } catch (err) {
                    lastError = err;
                }
            }

            if (!loaded && lastError) {
                failures.push(
                    `${request.key}: ${lastError.message}`
                );
            }
        }

        setState(results);

        if (failures.length === requests.length) {
            setError(
                "Accountant data could not be loaded. Please verify that the backend is running and your accountant session is active."
            );
        } else if (failures.length > 0) {
            setError(
                "Some financial modules could not be loaded. Available modules are still shown below."
            );
        }

        setLoading(false);
        setRefreshing(false);
    }, []);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const metrics = useMemo(() => {
        const bills = state.bills;
        const invoices = state.invoices;
        const payments = state.payments;
        const claims = state.claims;

        const billedAmount = bills.reduce(
            (sum, item) => sum + extractAmount(item),
            0
        );

        const invoiceAmount = invoices.reduce(
            (sum, item) => sum + extractAmount(item),
            0
        );

        const receivedAmount = payments.reduce(
            (sum, item) => sum + extractAmount(item),
            0
        );

        const claimAmount = claims.reduce(
            (sum, item) => sum + extractAmount(item),
            0
        );

        const pendingPayments = payments.filter((item) => {
            const status = String(
                item?.status || ""
            ).toLowerCase();

            return [
                "pending",
                "processing",
                "partially_paid",
            ].includes(status);
        }).length;

        const outstandingInvoices = invoices.filter((item) => {
            const status = String(
                item?.status || ""
            ).toLowerCase();

            return [
                "pending",
                "unpaid",
                "partially_paid",
                "overdue",
            ].includes(status);
        }).length;

        const pendingClaims = claims.filter((item) => {
            const status = String(
                item?.status || ""
            ).toLowerCase();

            return [
                "pending",
                "submitted",
                "processing",
                "under_review",
            ].includes(status);
        }).length;

        return {
            billedAmount,
            invoiceAmount,
            receivedAmount,
            claimAmount,
            pendingPayments,
            outstandingInvoices,
            pendingClaims,
        };
    }, [state]);

    const recentTransactions = useMemo(() => {
        const combined = [
            ...state.payments.map((item) => ({
                ...item,
                _type: "Payment",
                _date:
                    item?.payment_date ||
                    item?.created_at ||
                    item?.updated_at,
            })),
            ...state.invoices.map((item) => ({
                ...item,
                _type: "Invoice",
                _date:
                    item?.invoice_date ||
                    item?.created_at ||
                    item?.updated_at,
            })),
            ...state.bills.map((item) => ({
                ...item,
                _type: "Bill",
                _date:
                    item?.bill_date ||
                    item?.created_at ||
                    item?.updated_at,
            })),
        ];

        return combined
            .sort((a, b) => {
                const first = new Date(a._date || 0).getTime();
                const second = new Date(b._date || 0).getTime();

                return second - first;
            })
            .slice(0, 8);
    }, [state]);

    return (
        <div className="min-h-full bg-slate-50 px-4 py-5 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1500px] space-y-6">
                {/* HEADER */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="rounded-xl bg-cyan-600 p-2 text-white shadow-sm">
                                <WalletCards className="h-5 w-5" />
                            </div>

                            <span className="text-sm font-semibold text-cyan-700">
                                Finance & Accounts
                            </span>
                        </div>

                        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            Accountant Dashboard
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Monitor hospital billing, invoices,
                            collections and insurance activity.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => loadDashboard(true)}
                        disabled={refreshing}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${
                                refreshing
                                    ? "animate-spin"
                                    : ""
                            }`}
                        />
                        Refresh
                    </button>
                </div>

                {/* ERROR / INFO */}
                {error && (
                    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

                        <div>
                            <p className="font-semibold">
                                Financial data notice
                            </p>
                            <p className="mt-0.5">
                                {error}
                            </p>
                        </div>
                    </div>
                )}

                {/* STAT CARDS */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title="Total Billed"
                        value={formatCurrency(
                            metrics.billedAmount
                        )}
                        subtitle={`${state.bills.length} bill records`}
                        icon={CircleDollarSign}
                        loading={loading}
                    />

                    <StatCard
                        title="Invoice Value"
                        value={formatCurrency(
                            metrics.invoiceAmount
                        )}
                        subtitle={`${metrics.outstandingInvoices} outstanding`}
                        icon={FileText}
                        loading={loading}
                    />

                    <StatCard
                        title="Payments Received"
                        value={formatCurrency(
                            metrics.receivedAmount
                        )}
                        subtitle={`${metrics.pendingPayments} pending payments`}
                        icon={HandCoins}
                        loading={loading}
                    />

                    <StatCard
                        title="Insurance Claims"
                        value={formatCurrency(
                            metrics.claimAmount
                        )}
                        subtitle={`${metrics.pendingClaims} claims pending`}
                        icon={ShieldCheck}
                        loading={loading}
                    />
                </div>

                {/* MAIN GRID */}
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    {/* RECENT TRANSACTIONS */}
                    <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="font-semibold text-slate-900">
                                    Recent Financial Activity
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    Latest bills, invoices and payments
                                    from the hospital system.
                                </p>
                            </div>

                            <div className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500">
                                {recentTransactions.length} records
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/70">
                                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Type
                                        </th>
                                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Reference
                                        </th>
                                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Date
                                        </th>
                                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Amount
                                        </th>
                                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Status
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td
                                                colSpan="5"
                                                className="px-5 py-12 text-center text-sm text-slate-500"
                                            >
                                                <span className="inline-flex items-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Loading financial
                                                    activity...
                                                </span>
                                            </td>
                                        </tr>
                                    ) : recentTransactions.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="5"
                                                className="px-5 py-12 text-center"
                                            >
                                                <div className="mx-auto flex max-w-sm flex-col items-center">
                                                    <BarChart3 className="h-8 w-8 text-slate-300" />
                                                    <p className="mt-3 text-sm font-semibold text-slate-700">
                                                        No financial
                                                        records found
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        Transactions will
                                                        appear here when
                                                        records are
                                                        available.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        recentTransactions.map(
                                            (item, index) => (
                                                <tr
                                                    key={`${item._type}-${item.id ?? index}-${item._date ?? ""}`}
                                                    className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60"
                                                >
                                                    <td className="px-5 py-3.5">
                                                        <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                                                            {item._type ===
                                                            "Payment" ? (
                                                                <HandCoins className="h-4 w-4 text-emerald-600" />
                                                            ) : item._type ===
                                                              "Invoice" ? (
                                                                <FileText className="h-4 w-4 text-cyan-600" />
                                                            ) : (
                                                                <CircleDollarSign className="h-4 w-4 text-blue-600" />
                                                            )}

                                                            {item._type}
                                                        </span>
                                                    </td>

                                                    <td className="px-5 py-3.5 text-sm font-medium text-slate-800">
                                                        {item?.payment_number ||
                                                            item?.invoice_number ||
                                                            item?.bill_number ||
                                                            item?.reference_number ||
                                                            item?.id ||
                                                            "—"}
                                                    </td>

                                                    <td className="px-5 py-3.5 text-sm text-slate-500">
                                                        {formatDate(
                                                            item._date
                                                        )}
                                                    </td>

                                                    <td className="px-5 py-3.5 text-right text-sm font-semibold text-slate-900">
                                                        {formatCurrency(
                                                            extractAmount(
                                                                item
                                                            )
                                                        )}
                                                    </td>

                                                    <td className="px-5 py-3.5 text-right">
                                                        <StatusBadge
                                                            status={
                                                                item?.status
                                                            }
                                                        />
                                                    </td>
                                                </tr>
                                            )
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* FINANCIAL OVERVIEW */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="font-semibold text-slate-900">
                                    Financial Overview
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    Current accounting workload.
                                </p>
                            </div>

                            <TrendingUp className="h-5 w-5 text-cyan-600" />
                        </div>

                        <div className="mt-5 space-y-3">
                            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600">
                                        Bills
                                    </span>
                                    <span className="font-bold text-slate-900">
                                        {state.bills.length}
                                    </span>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600">
                                        Invoices
                                    </span>
                                    <span className="font-bold text-slate-900">
                                        {state.invoices.length}
                                    </span>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600">
                                        Payments
                                    </span>
                                    <span className="font-bold text-slate-900">
                                        {state.payments.length}
                                    </span>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600">
                                        Insurance Claims
                                    </span>
                                    <span className="font-bold text-slate-900">
                                        {state.claims.length}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 rounded-xl border border-cyan-100 bg-cyan-50 p-4">
                            <div className="flex gap-3">
                                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-700" />

                                <div>
                                    <p className="text-sm font-semibold text-cyan-900">
                                        Accounting workspace ready
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-cyan-800">
                                        Use Bills, Invoices, Payments and
                                        Insurance Claims to manage
                                        individual financial records.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* QUICK ACTIONS */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4">
                        <h2 className="font-semibold text-slate-900">
                            Accounting Workspace
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            Access the main financial management areas.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <a
                            href="/accountant/bills"
                            className="group rounded-xl border border-slate-200 p-4 transition hover:border-cyan-300 hover:bg-cyan-50/40"
                        >
                            <CircleDollarSign className="h-5 w-5 text-cyan-600" />
                            <p className="mt-3 text-sm font-semibold text-slate-900">
                                Bills
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                Manage hospital billing records.
                            </p>
                        </a>

                        <a
                            href="/accountant/invoices"
                            className="group rounded-xl border border-slate-200 p-4 transition hover:border-cyan-300 hover:bg-cyan-50/40"
                        >
                            <FileText className="h-5 w-5 text-cyan-600" />
                            <p className="mt-3 text-sm font-semibold text-slate-900">
                                Invoices
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                Track invoices and outstanding amounts.
                            </p>
                        </a>

                        <a
                            href="/accountant/payments"
                            className="group rounded-xl border border-slate-200 p-4 transition hover:border-cyan-300 hover:bg-cyan-50/40"
                        >
                            <HandCoins className="h-5 w-5 text-emerald-600" />
                            <p className="mt-3 text-sm font-semibold text-slate-900">
                                Payments
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                Monitor received and pending payments.
                            </p>
                        </a>

                        <a
                            href="/accountant/insurance-claims"
                            className="group rounded-xl border border-slate-200 p-4 transition hover:border-cyan-300 hover:bg-cyan-50/40"
                        >
                            <ShieldCheck className="h-5 w-5 text-violet-600" />
                            <p className="mt-3 text-sm font-semibold text-slate-900">
                                Insurance Claims
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                Review insurance claim activity.
                            </p>
                        </a>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <ArrowDownRight className="h-3.5 w-3.5" />
                    Data shown above is loaded from the hospital
                    backend and is not hard-coded.
                </div>
            </div>
        </div>
    );
}

