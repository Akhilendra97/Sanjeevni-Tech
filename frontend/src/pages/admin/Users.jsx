import {
    Check,
    ChevronLeft,
    ChevronRight,
    Edit3,
    KeyRound,
    Loader2,
    Plus,
    RefreshCw,
    Search,
    ShieldCheck,
    UserCheck,
    UserX,
    X,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
    createUser,
    getUsers,
    resetUserPassword,
    updateUser,
    updateUserStatus,
} from "../../services/usersApi";


const ROLES = [
    "admin",
    "doctor",
    "nurse",
    "staff",
    "receptionist",
    "pharmacist",
    "laboratory",
    "accountant",
    "patient",
];

const STATUSES = [
    "active",
    "inactive",
    "suspended",
    "pending",
];


const emptyForm = {
    username: "",
    email: "",
    password: "",
    full_name: "",
    phone: "",
    role: "staff",
    status: "active",
    is_verified: false,
};

function getApiErrorMessage(err, fallback) {
    const detail = err?.response?.data?.detail ?? err?.response?.data?.message;
    if (typeof detail === "string" && detail.trim()) return detail;
    if (Array.isArray(detail)) {
        const messages = detail.map((item) => {
            if (typeof item === "string") return item;
            if (item && typeof item.msg === "string") {
                const location = Array.isArray(item.loc)
                    ? item.loc.filter((part) => part !== "body").join(" → ")
                    : "";
                return location ? `${location}: ${item.msg}` : item.msg;
            }
            return "";
        }).filter(Boolean);
        if (messages.length) return messages.join(" · ");
    }
    if (detail && typeof detail === "object") {
        if (typeof detail.msg === "string") return detail.msg;
        try { return JSON.stringify(detail); } catch { /* use fallback */ }
    }
    return fallback;
}


function formatRole(value) {
    if (!value) return "—";

    return value
        .replaceAll("_", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}


function formatDate(value) {
    if (!value) return "Never";

    return new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}


function StatusBadge({ status }) {
    const styles = {
        active: "bg-emerald-50 text-emerald-700 border-emerald-200",
        inactive: "bg-slate-100 text-slate-600 border-slate-200",
        suspended: "bg-rose-50 text-rose-700 border-rose-200",
        pending: "bg-amber-50 text-amber-700 border-amber-200",
    };

    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
                styles[status] || styles.inactive
            }`}
        >
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
            {formatRole(status)}
        </span>
    );
}


function Modal({ title, children, onClose, wide = false }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
            <div
                className={`w-full ${
                    wide ? "max-w-3xl" : "max-w-xl"
                } overflow-hidden rounded-3xl border border-[#d8e6ef] bg-white shadow-2xl`}
            >
                <div className="flex items-center justify-between border-b border-[#e6eef4] px-6 py-5">
                    <h2 className="text-lg font-bold text-[#153653]">
                        {title}
                    </h2>

                    <button
                        onClick={onClose}
                        className="rounded-xl p-2 text-[#6d8497] transition hover:bg-slate-100 hover:text-[#153653]"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="max-h-[78vh] overflow-y-auto p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}


function Field({
    label,
    value,
    onChange,
    type = "text",
    placeholder = "",
    disabled = false,
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#71889b]">
                {label}
            </span>

            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                className="w-full rounded-xl border border-[#d8e6ef] bg-white px-4 py-3 text-sm text-[#153653] outline-none transition placeholder:text-[#9aabba] focus:border-cyan-400 focus:ring-4 focus:ring-cyan-50 disabled:bg-slate-50 disabled:text-slate-400"
            />
        </label>
    );
}


export default function Users() {
    const [users, setUsers] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);

    const [search, setSearch] = useState("");
    const [role, setRole] = useState("");
    const [status, setStatus] = useState("");

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const [modal, setModal] = useState(null);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState(emptyForm);

    const [passwordUser, setPasswordUser] = useState(null);
    const [newPassword, setNewPassword] = useState("");

    const loadUsers = async ({
        targetPage = page,
        showRefresh = false,
    } = {}) => {
        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const result = await getUsers({
                search,
                role,
                status,
                page: targetPage,
                pageSize: 10,
            });

            setUsers(result.items || []);
            setTotal(result.total || 0);
            setPage(result.page || targetPage);
            setPages(result.pages || 1);
        } catch (err) {
            setError(getApiErrorMessage(err, "Unable to load users right now."));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };


    useEffect(() => {
        loadUsers({ targetPage: 1 });
        // Initial load only.
        // Filters are applied through the Search button.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const activeCount = useMemo(
        () => users.filter((user) => user.status === "active").length,
        [users]
    );


    const openCreate = () => {
        setForm(emptyForm);
        setModal("create");
    };


    const openEdit = (user) => {
        setForm({
            username: user.username,
            email: user.email,
            password: "",
            full_name: user.full_name,
            phone: user.phone || "",
            role: user.role,
            status: user.status,
            is_verified: user.is_verified,
        });

        setModal({
            type: "edit",
            userId: user.id,
        });
    };


    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");

            if (modal === "create") {
                await createUser({
                    username: form.username.trim(),
                    email: form.email.trim(),
                    password: form.password,
                    full_name: form.full_name.trim(),
                    phone: form.phone.trim() || null,
                    role: form.role,
                    status: form.status,
                    is_verified: form.is_verified,
                });
            } else {
                await updateUser(modal.userId, {
                    email: form.email.trim(),
                    full_name: form.full_name.trim(),
                    phone: form.phone.trim() || null,
                    role: form.role,
                    status: form.status,
                    is_verified: form.is_verified,
                });
            }

            setModal(null);

            await loadUsers({
                targetPage: modal === "create" ? 1 : page,
            });
        } catch (err) {
            setError(getApiErrorMessage(err, "Unable to save the user."));
        } finally {
            setSaving(false);
        }
    };


    const handleToggleStatus = async (user) => {
        const nextStatus =
            user.status === "active"
                ? "inactive"
                : "active";

        const confirmed = window.confirm(
            `${nextStatus === "active" ? "Activate" : "Deactivate"} ${user.full_name}?`
        );

        if (!confirmed) return;

        try {
            setError("");

            await updateUserStatus(user.id, nextStatus);

            await loadUsers({
                targetPage: page,
                showRefresh: true,
            });
        } catch (err) {
            setError(getApiErrorMessage(err, "Unable to update user status."));
        }
    };


    const handlePasswordReset = async (event) => {
        event.preventDefault();

        if (newPassword.length < 8) {
            setError("Password must contain at least 8 characters.");
            return;
        }

        try {
            setSaving(true);
            setError("");

            await resetUserPassword(
                passwordUser.id,
                newPassword
            );

            setPasswordUser(null);
            setNewPassword("");
        } catch (err) {
            setError(getApiErrorMessage(err, "Unable to reset password."));
        } finally {
            setSaving(false);
        }
    };


    return (
        <div className="min-h-full bg-[#eef5fa] text-[#153653]">

            <div className="mx-auto max-w-[1500px] p-6 lg:p-8">

                <div className="mb-6">
                    <Link
                        to="/admin"
                        className="inline-flex items-center gap-2 rounded-xl border border-[#d8e6ef] bg-white px-4 py-2.5 text-sm font-semibold text-[#55718a] shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-[#08b9d8]"
                    >
                        <ChevronLeft size={16} />
                        Back to Command Center
                    </Link>
                </div>


                <div className="rounded-3xl border border-[#d8e6ef] bg-white shadow-sm">

                    <div className="border-b border-[#e6eef4] p-6 lg:p-7">

                        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

                            <div>
                                <div className="mb-2 flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-cyan-500" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#71889b]">
                                        Access & Identity Management
                                    </span>
                                </div>

                                <h1 className="text-3xl font-bold tracking-tight text-[#153653]">
                                    Users
                                </h1>

                                <p className="mt-2 text-sm text-[#71889b]">
                                    Manage system accounts, roles, access and account status.
                                </p>
                            </div>


                            <div className="flex flex-wrap gap-3">

                                <button
                                    onClick={() =>
                                        loadUsers({
                                            targetPage: page,
                                            showRefresh: true,
                                        })
                                    }
                                    className="inline-flex items-center gap-2 rounded-xl border border-[#d8e6ef] bg-white px-4 py-2.5 text-sm font-semibold text-[#55718a] transition hover:bg-slate-50"
                                >
                                    <RefreshCw
                                        size={16}
                                        className={
                                            refreshing
                                                ? "animate-spin"
                                                : ""
                                        }
                                    />
                                    Refresh
                                </button>

                                <button
                                    onClick={openCreate}
                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:shadow-lg"
                                >
                                    <Plus size={17} />
                                    Create User
                                </button>

                            </div>

                        </div>


                        <div className="mt-6 grid gap-4 md:grid-cols-3">

                            <div className="rounded-2xl border border-[#d8e6ef] bg-[#f8fbfd] p-5">
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8298aa]">
                                    Total Users
                                </p>

                                <p className="mt-2 text-2xl font-bold text-[#153653]">
                                    {total}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-[#d8e6ef] bg-[#f8fbfd] p-5">
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8298aa]">
                                    Active on Page
                                </p>

                                <p className="mt-2 text-2xl font-bold text-emerald-600">
                                    {activeCount}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-[#d8e6ef] bg-[#f8fbfd] p-5">
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8298aa]">
                                    Administrator Access
                                </p>

                                <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#55718a]">
                                    <ShieldCheck size={18} className="text-cyan-500" />
                                    RBAC Protected
                                </div>
                            </div>

                        </div>

                    </div>


                    <div className="border-b border-[#e6eef4] bg-[#fbfdff] p-5">

                        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto]">

                            <div className="relative">
                                <Search
                                    size={18}
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8da2b2]"
                                />

                                <input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                            loadUsers({
                                                targetPage: 1,
                                            });
                                        }
                                    }}
                                    placeholder="Search username, name, email or phone..."
                                    className="w-full rounded-xl border border-[#d8e6ef] bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-50"
                                />
                            </div>


                            <select
                                value={role}
                                onChange={(event) =>
                                    setRole(event.target.value)
                                }
                                className="rounded-xl border border-[#d8e6ef] bg-white px-4 py-3 text-sm text-[#55718a] outline-none focus:border-cyan-400"
                            >
                                <option value="">All roles</option>

                                {ROLES.map((item) => (
                                    <option key={item} value={item}>
                                        {formatRole(item)}
                                    </option>
                                ))}
                            </select>


                            <select
                                value={status}
                                onChange={(event) =>
                                    setStatus(event.target.value)
                                }
                                className="rounded-xl border border-[#d8e6ef] bg-white px-4 py-3 text-sm text-[#55718a] outline-none focus:border-cyan-400"
                            >
                                <option value="">All statuses</option>

                                {STATUSES.map((item) => (
                                    <option key={item} value={item}>
                                        {formatRole(item)}
                                    </option>
                                ))}
                            </select>


                            <button
                                onClick={() =>
                                    loadUsers({
                                        targetPage: 1,
                                    })
                                }
                                className="rounded-xl bg-[#153653] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1d496f]"
                            >
                                Apply
                            </button>

                        </div>

                    </div>


                    {error && (
                        <div className="mx-5 mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                            {error}
                        </div>
                    )}


                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[1050px]">

                            <thead>
                                <tr className="border-b border-[#e6eef4] bg-[#f8fbfd] text-left">
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8298aa]">
                                        User
                                    </th>

                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8298aa]">
                                        Role
                                    </th>

                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8298aa]">
                                        Status
                                    </th>

                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8298aa]">
                                        Verification
                                    </th>

                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8298aa]">
                                        Last Login
                                    </th>

                                    <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-[0.14em] text-[#8298aa]">
                                        Actions
                                    </th>
                                </tr>
                            </thead>


                            <tbody>

                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="px-6 py-16 text-center"
                                        >
                                            <Loader2
                                                size={28}
                                                className="mx-auto animate-spin text-cyan-500"
                                            />

                                            <p className="mt-3 text-sm font-medium text-[#71889b]">
                                                Loading users...
                                            </p>
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="px-6 py-16 text-center"
                                        >
                                            <UserX
                                                size={32}
                                                className="mx-auto text-[#a6b6c2]"
                                            />

                                            <p className="mt-3 text-sm font-bold text-[#55718a]">
                                                No users found
                                            </p>

                                            <p className="mt-1 text-xs text-[#8298aa]">
                                                Try changing your search or filters.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="border-b border-[#edf2f6] transition hover:bg-[#fbfdff]"
                                        >

                                            <td className="px-6 py-4">

                                                <div className="flex items-center gap-3">

                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-sm font-bold text-cyan-700">
                                                        {user.full_name
                                                            ?.charAt(0)
                                                            ?.toUpperCase()}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-bold text-[#153653]">
                                                            {user.full_name}
                                                        </p>

                                                        <p className="truncate text-xs text-[#8298aa]">
                                                            @{user.username}
                                                        </p>

                                                        <p className="truncate text-xs text-[#8298aa]">
                                                            {user.email}
                                                        </p>
                                                    </div>

                                                </div>

                                            </td>


                                            <td className="px-6 py-4">
                                                <span className="text-sm font-semibold text-[#55718a]">
                                                    {formatRole(user.role)}
                                                </span>
                                            </td>


                                            <td className="px-6 py-4">
                                                <StatusBadge status={user.status} />
                                            </td>


                                            <td className="px-6 py-4">

                                                {user.is_verified ? (
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                                                        <Check size={15} />
                                                        Verified
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-semibold text-[#8298aa]">
                                                        Not verified
                                                    </span>
                                                )}

                                            </td>


                                            <td className="px-6 py-4 text-xs font-medium text-[#71889b]">
                                                {formatDate(user.last_login_at)}
                                            </td>


                                            <td className="px-6 py-4">

                                                <div className="flex justify-end gap-2">

                                                    <button
                                                        onClick={() =>
                                                            openEdit(user)
                                                        }
                                                        title="Edit user"
                                                        className="rounded-lg border border-[#d8e6ef] bg-white p-2 text-[#55718a] transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-600"
                                                    >
                                                        <Edit3 size={15} />
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            setPasswordUser(user);
                                                            setNewPassword("");
                                                        }}
                                                        title="Reset password"
                                                        className="rounded-lg border border-[#d8e6ef] bg-white p-2 text-[#55718a] transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600"
                                                    >
                                                        <KeyRound size={15} />
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            handleToggleStatus(
                                                                user
                                                            )
                                                        }
                                                        title={
                                                            user.status === "active"
                                                                ? "Deactivate"
                                                                : "Activate"
                                                        }
                                                        className={`rounded-lg border bg-white p-2 transition ${
                                                            user.status === "active"
                                                                ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                                                                : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                                        }`}
                                                    >
                                                        {user.status === "active" ? (
                                                            <UserX size={15} />
                                                        ) : (
                                                            <UserCheck size={15} />
                                                        )}
                                                    </button>

                                                </div>

                                            </td>

                                        </tr>
                                    ))
                                )}

                            </tbody>

                        </table>

                    </div>


                    <div className="flex flex-col gap-3 border-t border-[#e6eef4] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

                        <p className="text-xs font-medium text-[#8298aa]">
                            Showing {users.length} of {total} users
                        </p>

                        <div className="flex items-center gap-2">

                            <button
                                disabled={page <= 1}
                                onClick={() =>
                                    loadUsers({
                                        targetPage: page - 1,
                                        showRefresh: true,
                                    })
                                }
                                className="rounded-lg border border-[#d8e6ef] bg-white p-2 text-[#55718a] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ChevronLeft size={16} />
                            </button>

                            <span className="px-3 text-xs font-bold text-[#55718a]">
                                Page {page} of {pages}
                            </span>

                            <button
                                disabled={page >= pages}
                                onClick={() =>
                                    loadUsers({
                                        targetPage: page + 1,
                                        showRefresh: true,
                                    })
                                }
                                className="rounded-lg border border-[#d8e6ef] bg-white p-2 text-[#55718a] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ChevronRight size={16} />
                            </button>

                        </div>

                    </div>

                </div>

            </div>


            {modal && (
                <Modal
                    title={
                        modal === "create"
                            ? "Create New User"
                            : "Edit User"
                    }
                    onClose={() => !saving && setModal(null)}
                    wide
                >
                    <form onSubmit={handleSubmit}>

                        <div className="grid gap-5 md:grid-cols-2">

                            <Field
                                label="Username"
                                value={form.username}
                                disabled={modal !== "create"}
                                placeholder="e.g. john.smith"
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        username: event.target.value,
                                    })
                                }
                            />

                            <Field
                                label="Full Name"
                                value={form.full_name}
                                placeholder="Full name"
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        full_name: event.target.value,
                                    })
                                }
                            />

                            <Field
                                label="Email"
                                type="email"
                                value={form.email}
                                placeholder="user@hospital.com"
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        email: event.target.value,
                                    })
                                }
                            />

                            <Field
                                label="Phone"
                                value={form.phone}
                                placeholder="Phone number"
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        phone: event.target.value,
                                    })
                                }
                            />

                            {modal === "create" && (
                                <Field
                                    label="Initial Password"
                                    type="password"
                                    value={form.password}
                                    placeholder="Minimum 8 characters"
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            password: event.target.value,
                                        })
                                    }
                                />
                            )}

                            <label>
                                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#71889b]">
                                    Role
                                </span>

                                <select
                                    value={form.role}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            role: event.target.value,
                                        })
                                    }
                                    className="w-full rounded-xl border border-[#d8e6ef] bg-white px-4 py-3 text-sm text-[#153653] outline-none focus:border-cyan-400"
                                >
                                    {ROLES.map((item) => (
                                        <option key={item} value={item}>
                                            {formatRole(item)}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#71889b]">
                                    Account Status
                                </span>

                                <select
                                    value={form.status}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            status: event.target.value,
                                        })
                                    }
                                    className="w-full rounded-xl border border-[#d8e6ef] bg-white px-4 py-3 text-sm text-[#153653] outline-none focus:border-cyan-400"
                                >
                                    {STATUSES.map((item) => (
                                        <option key={item} value={item}>
                                            {formatRole(item)}
                                        </option>
                                    ))}
                                </select>
                            </label>

                        </div>


                        <label className="mt-5 flex items-center gap-3 rounded-xl border border-[#d8e6ef] bg-[#f8fbfd] px-4 py-3">
                            <input
                                type="checkbox"
                                checked={form.is_verified}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        is_verified:
                                            event.target.checked,
                                    })
                                }
                                className="h-4 w-4 accent-cyan-600"
                            />

                            <span className="text-sm font-semibold text-[#55718a]">
                                Mark account as verified
                            </span>
                        </label>


                        <div className="mt-7 flex justify-end gap-3">

                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => setModal(null)}
                                className="rounded-xl border border-[#d8e6ef] px-5 py-2.5 text-sm font-bold text-[#55718a]"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm disabled:opacity-60"
                            >
                                {saving && (
                                    <Loader2
                                        size={16}
                                        className="animate-spin"
                                    />
                                )}

                                {modal === "create"
                                    ? "Create User"
                                    : "Save Changes"}
                            </button>

                        </div>

                    </form>
                </Modal>
            )}


            {passwordUser && (
                <Modal
                    title={`Reset Password — ${passwordUser.full_name}`}
                    onClose={() =>
                        !saving && setPasswordUser(null)
                    }
                >
                    <form onSubmit={handlePasswordReset}>

                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            Set a new password for this account. The existing password will no longer work.
                        </div>

                        <div className="mt-5">
                            <Field
                                label="New Password"
                                type="password"
                                value={newPassword}
                                placeholder="Minimum 8 characters"
                                onChange={(event) =>
                                    setNewPassword(
                                        event.target.value
                                    )
                                }
                            />
                        </div>

                        <div className="mt-7 flex justify-end gap-3">

                            <button
                                type="button"
                                disabled={saving}
                                onClick={() =>
                                    setPasswordUser(null)
                                }
                                className="rounded-xl border border-[#d8e6ef] px-5 py-2.5 text-sm font-bold text-[#55718a]"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#153653] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                            >
                                {saving && (
                                    <Loader2
                                        size={16}
                                        className="animate-spin"
                                    />
                                )}

                                Reset Password
                            </button>

                        </div>

                    </form>
                </Modal>
            )}

        </div>
    );
}
