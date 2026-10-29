import React, { useEffect, useMemo, useState } from "react";
import {
    Activity,
    ArrowDownToLine,
    ArrowUpRight,
    CalendarDays,
    CircleDollarSign,
    FileText,
    RefreshCw,
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
            const body = await response.json();
            if (body?.detail) {
                message =
                    typeof body.detail === "string"
                        ? body.detail
                        : message;
            }
        } catch {
            // Keep default error message.
        }

        throw new Error(message);
    }

    return response.json();
}

function toArray(value) {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.items)) return value.items;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.results)) return value.results;
    return [];
}

function money(value) {
    const amount = Number(value || 0);

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(amount);
}

function number(value) {
    return Number(value || 0);
}

function dateValue(value) {
    if (!value) return null;

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? null
        : date;
}

function formatDate(value) {
    const date = dateValue(value);

    if (!date) return "—";

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function monthKey(value) {
    const date = dateValue(value);

    if (!date) return null;

    return `${date.getFullYear()}-${String(
        date.getMonth() + 1
    ).padStart(2, "0")}`;
}

function monthLabel(key) {
    if (!key) return "";

    const [year, month] = key.split("-").map(Number);

    return new Date(year, month - 1, 1).toLocaleDateString(
        "en-IN",
        {
            month: "short",
            year: "numeric",
        }
    );
}

function isPaymentCompleted(payment) {
    const status = String(
        payment?.status ||
            payment?.payment_status ||
            ""
    ).toLowerCase();

    if (!status) return true;

    return [
        "completed",
        "complete",
        "paid",
        "success",
        "successful",
        "received",
    ].includes(status);
}

function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    positive,
}) {
    return (
        <div
            style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 18,
                padding: 20,
                boxShadow:
                    "0 8px 24px rgba(15, 23, 42, 0.05)",
                minHeight: 138,
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                }}
            >
                <div
                    style={{
                        width: 44,
                        height: 44,
                        borderRadius: 13,
                        display: "grid",
                        placeItems: "center",
                        background: positive
                            ? "#ecfeff"
                            : "#eff6ff",
                        color: positive
                            ? "#0891b2"
                            : "#2563eb",
                    }}
                >
                    <Icon size={21} />
                </div>

                <ArrowUpRight
                    size={17}
                    color="#94a3b8"
                />
            </div>

            <div
                style={{
                    marginTop: 16,
                    color: "#64748b",
                    fontSize: 13,
                    fontWeight: 600,
                }}
            >
                {title}
            </div>

            <div
                style={{
                    marginTop: 5,
                    color: "#0f172a",
                    fontSize: 25,
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                }}
            >
                {value}
            </div>

            <div
                style={{
                    marginTop: 5,
                    color: "#94a3b8",
                    fontSize: 12,
                }}
            >
                {subtitle}
            </div>
        </div>
    );
}

export default function Revenue() {
    const [billing, setBilling] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [payments, setPayments] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const [range, setRange] = useState("6");

    async function loadRevenue(showRefresh = false) {
        try {
            setError("");

            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const [billingResult, invoiceResult, paymentResult] =
                await Promise.all([
                    apiGet("/billing"),
                    apiGet("/invoices"),
                    apiGet("/payments"),
                ]);

            setBilling(toArray(billingResult));
            setInvoices(toArray(invoiceResult));
            setPayments(toArray(paymentResult));
        } catch (err) {
            setError(
                err?.message ||
                    "Unable to load revenue data."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => {
        loadRevenue();
    }, []);

    const completedPayments = useMemo(
        () =>
            payments.filter((payment) =>
                isPaymentCompleted(payment)
            ),
        [payments]
    );

    const totalBilled = useMemo(
        () =>
            billing.reduce(
                (sum, item) =>
                    sum + number(item?.total_amount),
                0
            ),
        [billing]
    );

    const invoiceValue = useMemo(
        () =>
            invoices.reduce(
                (sum, item) =>
                    sum + number(item?.total_amount),
                0
            ),
        [invoices]
    );

    const totalReceived = useMemo(
        () =>
            completedPayments.reduce(
                (sum, item) =>
                    sum + number(item?.amount),
                0
            ),
        [completedPayments]
    );

    const invoicePaid = useMemo(
        () =>
            invoices.reduce(
                (sum, item) =>
                    sum + number(item?.paid_amount),
                0
            ),
        [invoices]
    );

    const outstanding = useMemo(() => {
        const invoiceOutstanding = invoices.reduce(
            (sum, item) => {
                if (
                    item?.balance_amount !== undefined &&
                    item?.balance_amount !== null
                ) {
                    return (
                        sum +
                        Math.max(
                            0,
                            number(item.balance_amount)
                        )
                    );
                }

                return (
                    sum +
                    Math.max(
                        0,
                        number(item?.total_amount) -
                            number(item?.paid_amount)
                    )
                );
            },
            0
        );

        return invoiceOutstanding;
    }, [invoices]);

    const paidRate = useMemo(() => {
        if (invoiceValue <= 0) return 0;

        return Math.min(
            100,
            Math.max(
                0,
                (invoicePaid / invoiceValue) * 100
            )
        );
    }, [invoicePaid, invoiceValue]);

    const months = useMemo(() => {
        const count = Math.max(1, Number(range));

        const result = [];

        const now = new Date();

        for (let i = count - 1; i >= 0; i -= 1) {
            const date = new Date(
                now.getFullYear(),
                now.getMonth() - i,
                1
            );

            result.push(
                `${date.getFullYear()}-${String(
                    date.getMonth() + 1
                ).padStart(2, "0")}`
            );
        }

        return result;
    }, [range]);

    const monthlyRevenue = useMemo(() => {
        return months.map((key) => {
            const amount = completedPayments
                .filter(
                    (payment) =>
                        monthKey(
                            payment?.payment_date ||
                                payment?.created_at
                        ) === key
                )
                .reduce(
                    (sum, payment) =>
                        sum + number(payment?.amount),
                    0
                );

            return {
                key,
                label: monthLabel(key),
                amount,
            };
        });
    }, [completedPayments, months]);

    const maxMonthlyRevenue = useMemo(
        () =>
            Math.max(
                1,
                ...monthlyRevenue.map(
                    (item) => item.amount
                )
            ),
        [monthlyRevenue]
    );

    const recentPayments = useMemo(() => {
        return [...completedPayments]
            .sort((a, b) => {
                const dateA =
                    dateValue(
                        a?.payment_date ||
                            a?.created_at
                    )?.getTime() || 0;

                const dateB =
                    dateValue(
                        b?.payment_date ||
                            b?.created_at
                    )?.getTime() || 0;

                return dateB - dateA;
            })
            .slice(0, 8);
    }, [completedPayments]);

    const recentInvoices = useMemo(() => {
        return [...invoices]
            .sort((a, b) => {
                const dateA =
                    dateValue(
                        a?.invoice_date ||
                            a?.created_at
                    )?.getTime() || 0;

                const dateB =
                    dateValue(
                        b?.invoice_date ||
                            b?.created_at
                    )?.getTime() || 0;

                return dateB - dateA;
            })
            .slice(0, 5);
    }, [invoices]);

    return (
        <div
            style={{
                minHeight: "100%",
                background: "#f8fafc",
                padding: "24px 28px 40px",
                color: "#0f172a",
            }}
        >
            <div
                style={{
                    maxWidth: 1450,
                    margin: "0 auto",
                }}
            >
                {/* HEADER */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 20,
                        flexWrap: "wrap",
                    }}
                >
                    <div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                            }}
                        >
                            <div
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 14,
                                    display: "grid",
                                    placeItems: "center",
                                    background:
                                        "linear-gradient(135deg,#0ea5e9,#2563eb)",
                                    color: "#ffffff",
                                    boxShadow:
                                        "0 8px 18px rgba(37,99,235,.20)",
                                }}
                            >
                                <TrendingUp size={22} />
                            </div>

                            <div>
                                <h1
                                    style={{
                                        margin: 0,
                                        fontSize: 27,
                                        fontWeight: 800,
                                        letterSpacing:
                                            "-0.03em",
                                    }}
                                >
                                    Revenue Analytics
                                </h1>

                                <p
                                    style={{
                                        margin:
                                            "5px 0 0",
                                        color: "#64748b",
                                        fontSize: 13,
                                    }}
                                >
                                    Real-time financial performance
                                    from hospital billing,
                                    invoices and payments.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            flexWrap: "wrap",
                        }}
                    >
                        <select
                            value={range}
                            onChange={(event) =>
                                setRange(
                                    event.target.value
                                )
                            }
                            style={{
                                height: 42,
                                padding: "0 13px",
                                borderRadius: 11,
                                border:
                                    "1px solid #cbd5e1",
                                background: "#ffffff",
                                color: "#334155",
                                fontWeight: 600,
                                outline: "none",
                            }}
                        >
                            <option value="3">
                                Last 3 months
                            </option>
                            <option value="6">
                                Last 6 months
                            </option>
                            <option value="12">
                                Last 12 months
                            </option>
                        </select>

                        <button
                            type="button"
                            onClick={() =>
                                loadRevenue(true)
                            }
                            disabled={refreshing}
                            style={{
                                height: 42,
                                padding: "0 15px",
                                borderRadius: 11,
                                border:
                                    "1px solid #cbd5e1",
                                background: "#ffffff",
                                color: "#334155",
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                cursor: refreshing
                                    ? "not-allowed"
                                    : "pointer",
                                opacity: refreshing
                                    ? 0.65
                                    : 1,
                            }}
                        >
                            <RefreshCw
                                size={16}
                                style={{
                                    animation: refreshing
                                        ? "spin 1s linear infinite"
                                        : "none",
                                }}
                            />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* ERROR */}
                {error && (
                    <div
                        style={{
                            marginTop: 20,
                            padding: "13px 15px",
                            borderRadius: 12,
                            border:
                                "1px solid #fecaca",
                            background: "#fef2f2",
                            color: "#b91c1c",
                            fontSize: 13,
                            fontWeight: 600,
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* STATS */}
                <div
                    style={{
                        marginTop: 24,
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit,minmax(220px,1fr))",
                        gap: 16,
                    }}
                >
                    <StatCard
                        title="Total Billed"
                        value={money(totalBilled)}
                        subtitle={`${billing.length} billing records`}
                        icon={CircleDollarSign}
                    />

                    <StatCard
                        title="Revenue Received"
                        value={money(totalReceived)}
                        subtitle={`${completedPayments.length} completed payments`}
                        icon={WalletCards}
                        positive
                    />

                    <StatCard
                        title="Outstanding"
                        value={money(outstanding)}
                        subtitle="Current invoice balance"
                        icon={ArrowDownToLine}
                    />

                    <StatCard
                        title="Collection Rate"
                        value={`${paidRate.toFixed(1)}%`}
                        subtitle={`${invoices.length} invoice records`}
                        icon={Activity}
                        positive
                    />
                </div>

                {/* CHART + SNAPSHOT */}
                <div
                    style={{
                        marginTop: 20,
                        display: "grid",
                        gridTemplateColumns:
                            "minmax(0,2fr) minmax(280px,1fr)",
                        gap: 20,
                    }}
                >
                    <div
                        style={{
                            background: "#ffffff",
                            border:
                                "1px solid #e2e8f0",
                            borderRadius: 18,
                            padding: 22,
                            boxShadow:
                                "0 8px 24px rgba(15,23,42,.04)",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent:
                                    "space-between",
                                alignItems: "center",
                                gap: 12,
                            }}
                        >
                            <div>
                                <h2
                                    style={{
                                        margin: 0,
                                        fontSize: 17,
                                        fontWeight: 800,
                                    }}
                                >
                                    Monthly Revenue
                                </h2>

                                <p
                                    style={{
                                        margin:
                                            "5px 0 0",
                                        color: "#94a3b8",
                                        fontSize: 12,
                                    }}
                                >
                                    Completed payments grouped
                                    by payment month.
                                </p>
                            </div>

                            <CalendarDays
                                size={19}
                                color="#64748b"
                            />
                        </div>

                        <div
                            style={{
                                marginTop: 28,
                                height: 255,
                                display: "flex",
                                alignItems: "flex-end",
                                gap: 12,
                                overflowX: "auto",
                                paddingBottom: 8,
                            }}
                        >
                            {monthlyRevenue.map(
                                (item) => {
                                    const height =
                                        item.amount <= 0
                                            ? 5
                                            : Math.max(
                                                  10,
                                                  (item.amount /
                                                      maxMonthlyRevenue) *
                                                      205
                                              );

                                    return (
                                        <div
                                            key={item.key}
                                            style={{
                                                flex:
                                                    "1 0 54px",
                                                minWidth: 54,
                                                height: 235,
                                                display:
                                                    "flex",
                                                flexDirection:
                                                    "column",
                                                justifyContent:
                                                    "flex-end",
                                                alignItems:
                                                    "center",
                                                gap: 8,
                                            }}
                                            title={`${item.label}: ${money(item.amount)}`}
                                        >
                                            <div
                                                style={{
                                                    fontSize: 10,
                                                    color:
                                                        "#64748b",
                                                    fontWeight: 700,
                                                    whiteSpace:
                                                        "nowrap",
                                                }}
                                            >
                                                {item.amount >
                                                0
                                                    ? money(
                                                          item.amount
                                                      )
                                                    : "₹0"}
                                            </div>

                                            <div
                                                style={{
                                                    width:
                                                        "70%",
                                                    maxWidth: 48,
                                                    height,
                                                    minHeight: 5,
                                                    borderRadius:
                                                        "8px 8px 3px 3px",
                                                    background:
                                                        "linear-gradient(180deg,#0ea5e9,#2563eb)",
                                                    transition:
                                                        "height .25s ease",
                                                }}
                                            />

                                            <div
                                                style={{
                                                    color:
                                                        "#94a3b8",
                                                    fontSize: 10,
                                                    fontWeight: 600,
                                                    whiteSpace:
                                                        "nowrap",
                                                }}
                                            >
                                                {item.label}
                                            </div>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    </div>

                    <div
                        style={{
                            background: "#ffffff",
                            border:
                                "1px solid #e2e8f0",
                            borderRadius: 18,
                            padding: 22,
                            boxShadow:
                                "0 8px 24px rgba(15,23,42,.04)",
                        }}
                    >
                        <h2
                            style={{
                                margin: 0,
                                fontSize: 17,
                                fontWeight: 800,
                            }}
                        >
                            Financial Snapshot
                        </h2>

                        <div
                            style={{
                                marginTop: 22,
                                display: "grid",
                                gap: 14,
                            }}
                        >
                            <div
                                style={{
                                    padding: 15,
                                    borderRadius: 14,
                                    background: "#f8fafc",
                                    border:
                                        "1px solid #e2e8f0",
                                }}
                            >
                                <div
                                    style={{
                                        color:
                                            "#64748b",
                                        fontSize: 12,
                                    }}
                                >
                                    Invoice Value
                                </div>

                                <div
                                    style={{
                                        marginTop: 4,
                                        fontSize: 20,
                                        fontWeight: 800,
                                    }}
                                >
                                    {money(invoiceValue)}
                                </div>
                            </div>

                            <div
                                style={{
                                    padding: 15,
                                    borderRadius: 14,
                                    background:
                                        "#f0fdfa",
                                    border:
                                        "1px solid #ccfbf1",
                                }}
                            >
                                <div
                                    style={{
                                        color:
                                            "#0f766e",
                                        fontSize: 12,
                                    }}
                                >
                                    Invoice Paid
                                </div>

                                <div
                                    style={{
                                        marginTop: 4,
                                        fontSize: 20,
                                        fontWeight: 800,
                                        color:
                                            "#115e59",
                                    }}
                                >
                                    {money(invoicePaid)}
                                </div>
                            </div>

                            <div
                                style={{
                                    padding: 15,
                                    borderRadius: 14,
                                    background:
                                        "#eff6ff",
                                    border:
                                        "1px solid #dbeafe",
                                }}
                            >
                                <div
                                    style={{
                                        color:
                                            "#1d4ed8",
                                        fontSize: 12,
                                    }}
                                >
                                    Recorded Payments
                                </div>

                                <div
                                    style={{
                                        marginTop: 4,
                                        fontSize: 20,
                                        fontWeight: 800,
                                        color:
                                            "#1e3a8a",
                                    }}
                                >
                                    {completedPayments.length}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RECENT PAYMENTS */}
                <div
                    style={{
                        marginTop: 20,
                        background: "#ffffff",
                        border:
                            "1px solid #e2e8f0",
                        borderRadius: 18,
                        boxShadow:
                            "0 8px 24px rgba(15,23,42,.04)",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            padding: "20px 22px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent:
                                "space-between",
                            gap: 12,
                        }}
                    >
                        <div>
                            <h2
                                style={{
                                    margin: 0,
                                    fontSize: 17,
                                    fontWeight: 800,
                                }}
                            >
                                Recent Revenue
                            </h2>

                            <p
                                style={{
                                    margin:
                                        "5px 0 0",
                                    color: "#94a3b8",
                                    fontSize: 12,
                                }}
                            >
                                Latest completed payment
                                transactions.
                            </p>
                        </div>

                        <WalletCards
                            size={19}
                            color="#64748b"
                        />
                    </div>

                    {loading ? (
                        <div
                            style={{
                                padding: 35,
                                textAlign: "center",
                                color: "#64748b",
                                fontSize: 13,
                            }}
                        >
                            Loading revenue data...
                        </div>
                    ) : recentPayments.length === 0 ? (
                        <div
                            style={{
                                padding: 35,
                                textAlign: "center",
                                color: "#94a3b8",
                                fontSize: 13,
                            }}
                        >
                            No completed payment transactions
                            found.
                        </div>
                    ) : (
                        <div
                            style={{
                                overflowX: "auto",
                            }}
                        >
                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse:
                                        "collapse",
                                }}
                            >
                                <thead>
                                    <tr
                                        style={{
                                            background:
                                                "#f8fafc",
                                        }}
                                    >
                                        {[
                                            "Payment",
                                            "Invoice",
                                            "Patient",
                                            "Date",
                                            "Method",
                                            "Amount",
                                        ].map(
                                            (heading) => (
                                                <th
                                                    key={
                                                        heading
                                                    }
                                                    style={{
                                                        textAlign:
                                                            "left",
                                                        padding:
                                                            "12px 18px",
                                                        fontSize: 11,
                                                        color:
                                                            "#64748b",
                                                        fontWeight:
                                                            800,
                                                        textTransform:
                                                            "uppercase",
                                                        letterSpacing:
                                                            ".04em",
                                                        borderBottom:
                                                            "1px solid #e2e8f0",
                                                        whiteSpace:
                                                            "nowrap",
                                                    }}
                                                >
                                                    {
                                                        heading
                                                    }
                                                </th>
                                            )
                                        )}
                                    </tr>
                                </thead>

                                <tbody>
                                    {recentPayments.map(
                                        (
                                            payment,
                                            index
                                        ) => (
                                            <tr
                                                key={
                                                    payment?.id ||
                                                    payment?.payment_number ||
                                                    index
                                                }
                                            >
                                                <td
                                                    style={{
                                                        padding:
                                                            "14px 18px",
                                                        borderBottom:
                                                            "1px solid #f1f5f9",
                                                        fontWeight:
                                                            700,
                                                        fontSize: 13,
                                                    }}
                                                >
                                                    {payment?.payment_number ||
                                                        `Payment #${payment?.id || "—"}`}
                                                </td>

                                                <td
                                                    style={{
                                                        padding:
                                                            "14px 18px",
                                                        borderBottom:
                                                            "1px solid #f1f5f9",
                                                        color:
                                                            "#475569",
                                                        fontSize: 13,
                                                    }}
                                                >
                                                    {payment
                                                        ?.invoice
                                                        ?.invoice_number ||
                                                        payment?.invoice_number ||
                                                        payment?.invoice_id ||
                                                        "—"}
                                                </td>

                                                <td
                                                    style={{
                                                        padding:
                                                            "14px 18px",
                                                        borderBottom:
                                                            "1px solid #f1f5f9",
                                                        color:
                                                            "#475569",
                                                        fontSize: 13,
                                                    }}
                                                >
                                                    {payment?.patient_name ||
                                                        payment?.patient_id ||
                                                        "—"}
                                                </td>

                                                <td
                                                    style={{
                                                        padding:
                                                            "14px 18px",
                                                        borderBottom:
                                                            "1px solid #f1f5f9",
                                                        color:
                                                            "#64748b",
                                                        fontSize: 13,
                                                        whiteSpace:
                                                            "nowrap",
                                                    }}
                                                >
                                                    {formatDate(
                                                        payment?.payment_date ||
                                                            payment?.created_at
                                                    )}
                                                </td>

                                                <td
                                                    style={{
                                                        padding:
                                                            "14px 18px",
                                                        borderBottom:
                                                            "1px solid #f1f5f9",
                                                        color:
                                                            "#475569",
                                                        fontSize: 13,
                                                    }}
                                                >
                                                    {payment?.payment_method ||
                                                        "—"}
                                                </td>

                                                <td
                                                    style={{
                                                        padding:
                                                            "14px 18px",
                                                        borderBottom:
                                                            "1px solid #f1f5f9",
                                                        color:
                                                            "#047857",
                                                        fontWeight:
                                                            800,
                                                        fontSize: 13,
                                                        whiteSpace:
                                                            "nowrap",
                                                    }}
                                                >
                                                    {money(
                                                        payment?.amount
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* RECENT INVOICES */}
                <div
                    style={{
                        marginTop: 20,
                        background: "#ffffff",
                        border:
                            "1px solid #e2e8f0",
                        borderRadius: 18,
                        boxShadow:
                            "0 8px 24px rgba(15,23,42,.04)",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            padding: "20px 22px",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                        }}
                    >
                        <FileText
                            size={19}
                            color="#64748b"
                        />

                        <div>
                            <h2
                                style={{
                                    margin: 0,
                                    fontSize: 17,
                                    fontWeight: 800,
                                }}
                            >
                                Recent Invoices
                            </h2>

                            <p
                                style={{
                                    margin:
                                        "5px 0 0",
                                    color: "#94a3b8",
                                    fontSize: 12,
                                }}
                            >
                                Latest invoices contributing to
                                the financial position.
                            </p>
                        </div>
                    </div>

                    {recentInvoices.length === 0 ? (
                        <div
                            style={{
                                padding:
                                    "25px 22px 30px",
                                color: "#94a3b8",
                                fontSize: 13,
                            }}
                        >
                            No invoice records found.
                        </div>
                    ) : (
                        <div
                            style={{
                                overflowX: "auto",
                            }}
                        >
                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse:
                                        "collapse",
                                }}
                            >
                                <thead>
                                    <tr
                                        style={{
                                            background:
                                                "#f8fafc",
                                        }}
                                    >
                                        {[
                                            "Invoice",
                                            "Patient",
                                            "Date",
                                            "Total",
                                            "Paid",
                                            "Balance",
                                            "Status",
                                        ].map(
                                            (heading) => (
                                                <th
                                                    key={
                                                        heading
                                                    }
                                                    style={{
                                                        textAlign:
                                                            "left",
                                                        padding:
                                                            "12px 18px",
                                                        fontSize: 11,
                                                        color:
                                                            "#64748b",
                                                        fontWeight:
                                                            800,
                                                        textTransform:
                                                            "uppercase",
                                                        letterSpacing:
                                                            ".04em",
                                                        borderBottom:
                                                            "1px solid #e2e8f0",
                                                        whiteSpace:
                                                            "nowrap",
                                                    }}
                                                >
                                                    {
                                                        heading
                                                    }
                                                </th>
                                            )
                                        )}
                                    </tr>
                                </thead>

                                <tbody>
                                    {recentInvoices.map(
                                        (
                                            invoice,
                                            index
                                        ) => (
                                            <tr
                                                key={
                                                    invoice?.id ||
                                                    invoice?.invoice_number ||
                                                    index
                                                }
                                            >
                                                <td
                                                    style={{
                                                        padding:
                                                            "14px 18px",
                                                        borderBottom:
                                                            "1px solid #f1f5f9",
                                                        fontWeight:
                                                            700,
                                                        fontSize: 13,
                                                    }}
                                                >
                                                    {invoice?.invoice_number ||
                                                        `Invoice #${invoice?.id || "—"}`}
                                                </td>

                                                <td
                                                    style={{
                                                        padding:
                                                            "14px 18px",
                                                        borderBottom:
                                                            "1px solid #f1f5f9",
                                                        color:
                                                            "#475569",
                                                        fontSize: 13,
                                                    }}
                                                >
                                                    {invoice?.patient_name ||
                                                        invoice?.patient_id ||
                                                        "—"}
                                                </td>

                                                <td
                                                    style={{
                                                        padding:
                                                            "14px 18px",
                                                        borderBottom:
                                                            "1px solid #f1f5f9",
                                                        color:
                                                            "#64748b",
                                                        fontSize: 13,
                                                        whiteSpace:
                                                            "nowrap",
                                                    }}
                                                >
                                                    {formatDate(
                                                        invoice?.invoice_date ||
                                                            invoice?.created_at
                                                    )}
                                                </td>

                                                <td
                                                    style={{
                                                        padding:
                                                            "14px 18px",
                                                        borderBottom:
                                                            "1px solid #f1f5f9",
                                                        fontWeight:
                                                            700,
                                                        fontSize: 13,
                                                    }}
                                                >
                                                    {money(
                                                        invoice?.total_amount
                                                    )}
                                                </td>

                                                <td
                                                    style={{
                                                        padding:
                                                            "14px 18px",
                                                        borderBottom:
                                                            "1px solid #f1f5f9",
                                                        color:
                                                            "#047857",
                                                        fontWeight:
                                                            700,
                                                        fontSize: 13,
                                                    }}
                                                >
                                                    {money(
                                                        invoice?.paid_amount
                                                    )}
                                                </td>

                                                <td
                                                    style={{
                                                        padding:
                                                            "14px 18px",
                                                        borderBottom:
                                                            "1px solid #f1f5f9",
                                                        color:
                                                            "#b45309",
                                                        fontWeight:
                                                            700,
                                                        fontSize: 13,
                                                    }}
                                                >
                                                    {money(
                                                        invoice?.balance_amount ??
                                                            Math.max(
                                                                0,
                                                                number(
                                                                    invoice?.total_amount
                                                                ) -
                                                                    number(
                                                                        invoice?.paid_amount
                                                                    )
                                                            )
                                                    )}
                                                </td>

                                                <td
                                                    style={{
                                                        padding:
                                                            "14px 18px",
                                                        borderBottom:
                                                            "1px solid #f1f5f9",
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            display:
                                                                "inline-flex",
                                                            padding:
                                                                "5px 9px",
                                                            borderRadius:
                                                                999,
                                                            background:
                                                                "#f1f5f9",
                                                            color:
                                                                "#475569",
                                                            fontSize: 11,
                                                            fontWeight:
                                                                800,
                                                            textTransform:
                                                                "capitalize",
                                                        }}
                                                    >
                                                        {invoice?.status ||
                                                            "unpaid"}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <style>
                {`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }

                    @media (max-width: 900px) {
                        .revenue-responsive-grid {
                            grid-template-columns: 1fr !important;
                        }
                    }
                `}
            </style>
        </div>
    );
}