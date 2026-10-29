import { useEffect, useMemo, useState } from "react";
import {
    Activity,
    AlertCircle,
    CalendarClock,
    CheckCircle2,
    Clock3,
    Eye,
    Filter,
    Globe2,
    Loader2,
    RefreshCw,
    Search,
    ShieldCheck,
    Trash2,
    UserRound,
    X,
} from "lucide-react";

import {
    deleteAuditLog,
    getAuditLogs,
} from "../../services/auditLogApi";

const formatDateTime = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    });
};

const safeText = (value) => {
    if (value === null || value === undefined || value === "") {
        return "—";
    }

    return String(value);
};

const getActionClass = (action) => {
    const value = String(action || "").toLowerCase();

    if (
        value.includes("delete") ||
        value.includes("remove") ||
        value.includes("failed") ||
        value.includes("error")
    ) {
        return "bg-rose-50 text-rose-700 border-rose-100";
    }

    if (
        value.includes("create") ||
        value.includes("add") ||
        value.includes("success") ||
        value.includes("login")
    ) {
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
    }

    if (
        value.includes("update") ||
        value.includes("edit") ||
        value.includes("change")
    ) {
        return "bg-amber-50 text-amber-700 border-amber-100";
    }

    return "bg-cyan-50 text-cyan-700 border-cyan-100";
};

const getInitialFilters = () => ({
    search: "",
    action: "all",
    module: "all",
    userId: "",
});

export default function AuditLogs() {
    const [logs, setLogs] = useState([]);
    const [filters, setFilters] = useState(getInitialFilters);
    const [selectedLog, setSelectedLog] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState("");

    const loadLogs = async (isRefresh = false) => {
        try {
            setError("");

            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const data = await getAuditLogs();

            setLogs(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Audit logs loading failed:", err);

            const status = err?.response?.status;

            if (status === 401) {
                localStorage.removeItem("access_token");
                localStorage.removeItem("user");
                window.location.href = "/login";
                return;
            }

            if (status === 403) {
                setError(
                    "You do not have permission to view audit logs."
                );
            } else {
                setError(
                    err?.response?.data?.detail ||
                    "Unable to load audit logs."
                );
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, []);

    const actionOptions = useMemo(() => {
        return [...new Set(
            logs
                .map((log) => safeText(log.action))
                .filter((value) => value !== "—")
        )].sort();
    }, [logs]);

    const moduleOptions = useMemo(() => {
        return [...new Set(
            logs
                .map((log) => safeText(log.module))
                .filter((value) => value !== "—")
        )].sort();
    }, [logs]);

    const filteredLogs = useMemo(() => {
        const search = filters.search.trim().toLowerCase();
        const userId = filters.userId.trim();

        return logs.filter((log) => {
            const searchableText = [
                log.action,
                log.module,
                log.entity_type,
                log.entity_id,
                log.description,
                log.ip_address,
                log.user_id,
            ]
                .map((value) => safeText(value).toLowerCase())
                .join(" ");

            const matchesSearch =
                !search || searchableText.includes(search);

            const matchesAction =
                filters.action === "all" ||
                safeText(log.action) === filters.action;

            const matchesModule =
                filters.module === "all" ||
                safeText(log.module) === filters.module;

            const matchesUser =
                !userId ||
                safeText(log.user_id) === userId;

            return (
                matchesSearch &&
                matchesAction &&
                matchesModule &&
                matchesUser
            );
        });
    }, [logs, filters]);

    const recentLogs = useMemo(
        () => logs.slice(0, 5),
        [logs]
    );

    const stats = [
        {
            label: "Total Logs",
            value: logs.length,
            icon: Activity,
            iconClass: "bg-cyan-50 text-cyan-600",
        },
        {
            label: "Visible Results",
            value: filteredLogs.length,
            icon: Filter,
            iconClass: "bg-blue-50 text-blue-600",
        },
        {
            label: "Recent Activity",
            value: recentLogs.length,
            icon: Clock3,
            iconClass: "bg-indigo-50 text-indigo-600",
        },
        {
            label: "Unique Modules",
            value: moduleOptions.length,
            icon: ShieldCheck,
            iconClass: "bg-emerald-50 text-emerald-600",
        },
    ];

    const clearFilters = () => {
        setFilters(getInitialFilters());
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        try {
            setDeleting(true);

            await deleteAuditLog(deleteTarget.id);

            setLogs((current) =>
                current.filter(
                    (log) => log.id !== deleteTarget.id
                )
            );

            if (selectedLog?.id === deleteTarget.id) {
                setSelectedLog(null);
            }

            setDeleteTarget(null);
        } catch (err) {
            console.error("Audit log deletion failed:", err);

            const status = err?.response?.status;

            if (status === 401) {
                localStorage.removeItem("access_token");
                localStorage.removeItem("user");
                window.location.href = "/login";
                return;
            }

            setError(
                err?.response?.data?.detail ||
                "Unable to delete the audit log."
            );
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="min-h-full bg-[#eef5fa] p-4 sm:p-6 lg:p-7">
            <div className="mx-auto max-w-[1600px] space-y-6">

                {/* Header */}
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#08b9d8]">
                            <ShieldCheck size={17} />
                            Security & Compliance
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight text-[#153653] sm:text-3xl">
                            Audit Logs
                        </h1>

                        <p className="mt-1 max-w-3xl text-sm text-[#55718a]">
                            Review system activity, administrative actions,
                            entity changes and security-related events.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => loadLogs(true)}
                        disabled={refreshing || loading}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#08b9d8] to-[#3478ed] px-4 py-3 text-sm font-semibold text-white shadow-md shadow-cyan-100 transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                        <RefreshCw
                            size={17}
                            className={refreshing ? "animate-spin" : ""}
                        />
                        {refreshing ? "Refreshing..." : "Refresh Logs"}
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map((stat) => {
                        const Icon = stat.icon;

                        return (
                            <div
                                key={stat.label}
                                className="rounded-2xl border border-[#dce9f2] bg-white p-5 shadow-sm shadow-[#dbeaf3]"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-[#8298aa]">
                                            {stat.label}
                                        </p>

                                        <p className="mt-2 text-2xl font-bold text-[#153653]">
                                            {stat.value}
                                        </p>
                                    </div>

                                    <div
                                        className={`rounded-xl p-3 ${stat.iconClass}`}
                                    >
                                        <Icon size={21} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Error */}
                {error && (
                    <div className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        <AlertCircle
                            size={18}
                            className="mt-0.5 shrink-0"
                        />

                        <div className="flex-1">
                            <p className="font-semibold">
                                Audit Logs Error
                            </p>
                            <p className="mt-0.5">
                                {error}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setError("")}
                            className="rounded-lg p-1 hover:bg-rose-100"
                            aria-label="Close error"
                        >
                            <X size={17} />
                        </button>
                    </div>
                )}

                {/* Filters */}
                <div className="rounded-2xl border border-[#dce9f2] bg-white p-4 shadow-sm shadow-[#dbeaf3]">
                    <div className="mb-4 flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm font-bold text-[#153653]">
                            <Filter size={17} className="text-[#08b9d8]" />
                            Log Filters
                        </div>

                        <p className="text-xs text-[#8298aa]">
                            Filters are applied to the audit logs currently
                            returned by the backend.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                        <div className="relative xl:col-span-2">
                            <Search
                                size={17}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8298aa]"
                            />

                            <input
                                type="text"
                                value={filters.search}
                                onChange={(event) =>
                                    setFilters((current) => ({
                                        ...current,
                                        search: event.target.value,
                                    }))
                                }
                                placeholder="Search action, module, entity, IP..."
                                className="w-full rounded-xl border border-[#dce9f2] bg-white py-3 pl-10 pr-3 text-sm text-[#153653] outline-none transition placeholder:text-[#a4b7c3] focus:border-[#08b9d8] focus:ring-2 focus:ring-[#08b9d8]/10"
                            />
                        </div>

                        <select
                            value={filters.action}
                            onChange={(event) =>
                                setFilters((current) => ({
                                    ...current,
                                    action: event.target.value,
                                }))
                            }
                            className="rounded-xl border border-[#dce9f2] bg-white px-3 py-3 text-sm text-[#153653] outline-none focus:border-[#08b9d8] focus:ring-2 focus:ring-[#08b9d8]/10"
                        >
                            <option value="all">All Actions</option>

                            {actionOptions.map((action) => (
                                <option key={action} value={action}>
                                    {action}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filters.module}
                            onChange={(event) =>
                                setFilters((current) => ({
                                    ...current,
                                    module: event.target.value,
                                }))
                            }
                            className="rounded-xl border border-[#dce9f2] bg-white px-3 py-3 text-sm text-[#153653] outline-none focus:border-[#08b9d8] focus:ring-2 focus:ring-[#08b9d8]/10"
                        >
                            <option value="all">All Modules</option>

                            {moduleOptions.map((module) => (
                                <option key={module} value={module}>
                                    {module}
                                </option>
                            ))}
                        </select>

                        <input
                            type="number"
                            min="1"
                            value={filters.userId}
                            onChange={(event) =>
                                setFilters((current) => ({
                                    ...current,
                                    userId: event.target.value,
                                }))
                            }
                            placeholder="User ID"
                            className="rounded-xl border border-[#dce9f2] bg-white px-3 py-3 text-sm text-[#153653] outline-none placeholder:text-[#a4b7c3] focus:border-[#08b9d8] focus:ring-2 focus:ring-[#08b9d8]/10"
                        />
                    </div>

                    <div className="mt-3 flex justify-end">
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="text-xs font-semibold text-[#3478ed] transition hover:text-[#153653]"
                        >
                            Clear filters
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-2xl border border-[#dce9f2] bg-white shadow-sm shadow-[#dbeaf3]">
                    <div className="flex flex-col gap-1 border-b border-[#e5eef4] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="font-bold text-[#153653]">
                                Activity History
                            </h2>

                            <p className="mt-1 text-xs text-[#8298aa]">
                                Showing {filteredLogs.length} of {logs.length} fetched logs
                            </p>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-[#55718a]">
                            <CalendarClock size={15} />
                            Newest activity first
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex min-h-[360px] items-center justify-center">
                            <div className="flex flex-col items-center gap-3 text-[#55718a]">
                                <Loader2
                                    size={30}
                                    className="animate-spin text-[#08b9d8]"
                                />
                                <span className="text-sm font-medium">
                                    Loading audit logs...
                                </span>
                            </div>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
                            <div className="rounded-2xl bg-[#eef8fb] p-4 text-[#08b9d8]">
                                <ShieldCheck size={30} />
                            </div>

                            <h3 className="mt-4 font-bold text-[#153653]">
                                No audit logs found
                            </h3>

                            <p className="mt-1 max-w-md text-sm text-[#8298aa]">
                                {logs.length === 0
                                    ? "There are currently no audit events available."
                                    : "No records match the selected filters."}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-[1100px] w-full">
                                <thead className="bg-[#f7fafc]">
                                    <tr className="border-b border-[#e5eef4] text-left">
                                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-[#8298aa]">
                                            Time
                                        </th>

                                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-[#8298aa]">
                                            Action
                                        </th>

                                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-[#8298aa]">
                                            Module
                                        </th>

                                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-[#8298aa]">
                                            User
                                        </th>

                                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-[#8298aa]">
                                            Entity
                                        </th>

                                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-[#8298aa]">
                                            IP Address
                                        </th>

                                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-[#8298aa]">
                                            Description
                                        </th>

                                        <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-[#8298aa]">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredLogs.map((log) => (
                                        <tr
                                            key={log.id}
                                            className="border-b border-[#edf3f7] transition hover:bg-[#f8fbfd]"
                                        >
                                            <td className="whitespace-nowrap px-5 py-4">
                                                <div className="flex items-center gap-2 text-sm font-medium text-[#153653]">
                                                    <Clock3
                                                        size={15}
                                                        className="text-[#8298aa]"
                                                    />
                                                    {formatDateTime(log.created_at)}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${getActionClass(log.action)}`}
                                                >
                                                    {safeText(log.action)}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="font-semibold text-[#3478ed]">
                                                    {safeText(log.module)}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="rounded-lg bg-[#eef5fa] p-2 text-[#55718a]">
                                                        <UserRound size={15} />
                                                    </span>

                                                    <span className="text-sm font-semibold text-[#153653]">
                                                        {log.user_id
                                                            ? `User #${log.user_id}`
                                                            : "System"}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="text-sm text-[#153653]">
                                                    <span className="font-semibold">
                                                        {safeText(log.entity_type)}
                                                    </span>

                                                    {log.entity_id && (
                                                        <span className="ml-1 text-[#8298aa]">
                                                            #{log.entity_id}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2 text-sm text-[#55718a]">
                                                    <Globe2 size={15} />
                                                    {safeText(log.ip_address)}
                                                </div>
                                            </td>

                                            <td className="max-w-[280px] px-5 py-4">
                                                <p
                                                    className="truncate text-sm text-[#55718a]"
                                                    title={safeText(log.description)}
                                                >
                                                    {safeText(log.description)}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedLog(log)}
                                                        className="rounded-lg border border-[#dce9f2] bg-white p-2 text-[#3478ed] transition hover:border-[#bcd9eb] hover:bg-[#f4f9fc]"
                                                        title="View details"
                                                        aria-label="View audit log details"
                                                    >
                                                        <Eye size={17} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteTarget(log)}
                                                        className="rounded-lg border border-rose-100 bg-white p-2 text-rose-600 transition hover:bg-rose-50"
                                                        title="Delete audit log"
                                                        aria-label="Delete audit log"
                                                    >
                                                        <Trash2 size={17} />
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

                {/* Recent Activity */}
                {!loading && recentLogs.length > 0 && (
                    <div className="rounded-2xl border border-[#dce9f2] bg-white p-5 shadow-sm shadow-[#dbeaf3]">
                        <div className="mb-4">
                            <h2 className="font-bold text-[#153653]">
                                Recent Activity
                            </h2>

                            <p className="mt-1 text-xs text-[#8298aa]">
                                Latest five records returned by the backend.
                            </p>
                        </div>

                        <div className="space-y-3">
                            {recentLogs.map((log) => (
                                <button
                                    type="button"
                                    key={`recent-${log.id}`}
                                    onClick={() => setSelectedLog(log)}
                                    className="flex w-full items-center gap-3 rounded-xl border border-[#e5eef4] bg-[#fbfdfe] p-3 text-left transition hover:border-[#c8e4ef] hover:bg-[#f6fbfd]"
                                >
                                    <span className="rounded-lg bg-cyan-50 p-2 text-[#08b9d8]">
                                        <Activity size={16} />
                                    </span>

                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-semibold text-[#153653]">
                                            {safeText(log.action)} · {safeText(log.module)}
                                        </span>

                                        <span className="mt-0.5 block truncate text-xs text-[#8298aa]">
                                            {safeText(log.description)}
                                        </span>
                                    </span>

                                    <span className="whitespace-nowrap text-xs text-[#8298aa]">
                                        {formatDateTime(log.created_at)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Details Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#153653]/35 p-4 backdrop-blur-[2px]">
                    <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#dce9f2] bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-[#e5eef4] px-5 py-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <ShieldCheck
                                        size={19}
                                        className="text-[#08b9d8]"
                                    />
                                    <h2 className="font-bold text-[#153653]">
                                        Audit Log Details
                                    </h2>
                                </div>

                                <p className="mt-1 text-xs text-[#8298aa]">
                                    Record #{selectedLog.id}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedLog(null)}
                                className="rounded-lg p-2 text-[#55718a] hover:bg-[#eef5fa]"
                                aria-label="Close details"
                            >
                                <X size={19} />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-5">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {[
                                    ["Action", selectedLog.action],
                                    ["Module", selectedLog.module],
                                    ["User ID", selectedLog.user_id],
                                    ["Entity Type", selectedLog.entity_type],
                                    ["Entity ID", selectedLog.entity_id],
                                    ["IP Address", selectedLog.ip_address],
                                    ["Created At", formatDateTime(selectedLog.created_at)],
                                ].map(([label, value]) => (
                                    <div
                                        key={label}
                                        className="rounded-xl border border-[#e5eef4] bg-[#f8fbfd] p-4"
                                    >
                                        <p className="text-[11px] font-bold uppercase tracking-wide text-[#8298aa]">
                                            {label}
                                        </p>

                                        <p className="mt-1 break-words text-sm font-semibold text-[#153653]">
                                            {safeText(value)}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 rounded-xl border border-[#e5eef4] bg-[#f8fbfd] p-4">
                                <p className="text-[11px] font-bold uppercase tracking-wide text-[#8298aa]">
                                    Description
                                </p>

                                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#55718a]">
                                    {safeText(selectedLog.description)}
                                </p>
                            </div>

                            <div className="mt-4 rounded-xl border border-[#e5eef4] bg-[#f8fbfd] p-4">
                                <p className="text-[11px] font-bold uppercase tracking-wide text-[#8298aa]">
                                    User Agent
                                </p>

                                <p className="mt-2 break-words text-xs leading-5 text-[#55718a]">
                                    {safeText(selectedLog.user_agent)}
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end border-t border-[#e5eef4] px-5 py-4">
                            <button
                                type="button"
                                onClick={() => setSelectedLog(null)}
                                className="rounded-xl border border-[#dce9f2] bg-white px-4 py-2.5 text-sm font-semibold text-[#153653] hover:bg-[#f6fafc]"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteTarget && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#153653]/40 p-4">
                    <div className="w-full max-w-md rounded-2xl border border-[#dce9f2] bg-white p-6 shadow-2xl">
                        <div className="flex items-start gap-4">
                            <div className="rounded-xl bg-rose-50 p-3 text-rose-600">
                                <Trash2 size={21} />
                            </div>

                            <div className="flex-1">
                                <h2 className="text-lg font-bold text-[#153653]">
                                    Delete Audit Log?
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-[#55718a]">
                                    This will permanently delete audit log #
                                    {deleteTarget.id}. This action cannot be
                                    undone.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={() => setDeleteTarget(null)}
                                className="rounded-xl border border-[#dce9f2] bg-white px-4 py-2.5 text-sm font-semibold text-[#153653] hover:bg-[#f6fafc] disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                disabled={deleting}
                                onClick={handleDelete}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                            >
                                {deleting && (
                                    <Loader2
                                        size={16}
                                        className="animate-spin"
                                    />
                                )}

                                {deleting
                                    ? "Deleting..."
                                    : "Delete Log"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
