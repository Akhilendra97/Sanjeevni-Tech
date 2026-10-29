import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Activity,
    Building2,
    CheckCircle2,
    ChevronDown,
    Edit3,
    Eye,
    Filter,
    MapPin,
    Plus,
    RefreshCw,
    Search,
    ShieldCheck,
    Trash2,
    Users,
    X,
} from "lucide-react";

import {
    createWard,
    deleteWard,
    getWardErrorMessage,
    getWards,
    updateWard,
} from "../../services/wardApi";


const EMPTY_FORM = {
    name: "",
    code: "",
    ward_type: "",
    floor: "",
    location: "",
    description: "",
    capacity: 0,
    is_active: true,
};


const inputClass =
    "w-full rounded-xl border border-[#d8e6ef] bg-white px-3.5 py-2.5 text-sm text-[#153653] outline-none transition focus:border-[#08b9d8] focus:ring-4 focus:ring-[#08b9d8]/10 placeholder:text-[#a4b7c3]";

const labelClass =
    "mb-1.5 block text-xs font-bold uppercase tracking-[0.08em] text-[#55718a]";


function formatDate(value) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}


function normalizeWards(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data?.items)) {
        return data.items;
    }

    return [];
}


function StatusBadge({ active }) {
    return (
        <span
            className={
                active
                    ? "inline-flex items-center gap-1.5 rounded-full bg-[#e8f8f2] px-2.5 py-1 text-xs font-bold text-[#15845c]"
                    : "inline-flex items-center gap-1.5 rounded-full bg-[#f1f5f8] px-2.5 py-1 text-xs font-bold text-[#6f8495]"
            }
        >
            <span
                className={
                    active
                        ? "h-1.5 w-1.5 rounded-full bg-[#20b47a]"
                        : "h-1.5 w-1.5 rounded-full bg-[#91a4b2]"
                }
            />
            {active ? "Active" : "Inactive"}
        </span>
    );
}


function StatCard({
    icon: Icon,
    label,
    value,
    helper,
    iconClass = "bg-[#e8f7fb] text-[#08a8c4]",
}) {
    return (
        <div className="rounded-2xl border border-[#d8e6ef] bg-white p-4 shadow-[0_8px_25px_rgba(31,72,102,0.06)]">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#8298aa]">
                        {label}
                    </p>

                    <p className="mt-2 text-2xl font-black tracking-tight text-[#153653]">
                        {value}
                    </p>

                    <p className="mt-1 text-xs font-medium text-[#8298aa]">
                        {helper}
                    </p>
                </div>

                <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
                >
                    <Icon size={19} />
                </div>
            </div>
        </div>
    );
}


function WardModal({
    mode,
    form,
    setForm,
    saving,
    onClose,
    onSubmit,
}) {
    const readOnly = mode === "view";

    const title =
        mode === "create"
            ? "Add New Ward"
            : mode === "edit"
              ? "Edit Ward"
              : "Ward Details";

    const subtitle =
        mode === "create"
            ? "Create a new hospital ward"
            : mode === "edit"
              ? "Update ward information"
              : "Review ward information";

    const updateField = (field, value) => {
        if (readOnly) {
            return;
        }

        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#102f49]/45 p-4 backdrop-blur-sm sm:p-6"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="my-auto flex max-h-[calc(100vh-32px)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-[#d8e6ef] bg-white shadow-[0_25px_80px_rgba(15,48,75,0.22)] sm:max-h-[calc(100vh-48px)]">
                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#e2edf3] px-5 py-4 sm:px-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8f7fb] text-[#08a8c4]">
                                <Building2 size={18} />
                            </div>

                            <div>
                                <h2 className="text-lg font-black text-[#153653]">
                                    {title}
                                </h2>

                                <p className="text-xs font-medium text-[#8298aa]">
                                    {subtitle}
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#8298aa] transition hover:bg-[#eef5fa] hover:text-[#153653]"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className={labelClass}>
                                Ward Name *
                            </label>

                            <input
                                value={form.name}
                                disabled={readOnly}
                                onChange={(event) =>
                                    updateField(
                                        "name",
                                        event.target.value
                                    )
                                }
                                placeholder="e.g. General Ward"
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>
                                Ward Code *
                            </label>

                            <input
                                value={form.code}
                                disabled={readOnly}
                                onChange={(event) =>
                                    updateField(
                                        "code",
                                        event.target.value
                                    )
                                }
                                placeholder="e.g. GEN-01"
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>
                                Ward Type *
                            </label>

                            <input
                                value={form.ward_type}
                                disabled={readOnly}
                                onChange={(event) =>
                                    updateField(
                                        "ward_type",
                                        event.target.value
                                    )
                                }
                                placeholder="e.g. General, ICU, Private"
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>
                                Floor
                            </label>

                            <input
                                value={form.floor}
                                disabled={readOnly}
                                onChange={(event) =>
                                    updateField(
                                        "floor",
                                        event.target.value
                                    )
                                }
                                placeholder="e.g. Ground Floor"
                                className={inputClass}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelClass}>
                                Location
                            </label>

                            <input
                                value={form.location}
                                disabled={readOnly}
                                onChange={(event) =>
                                    updateField(
                                        "location",
                                        event.target.value
                                    )
                                }
                                placeholder="e.g. North Wing"
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>
                                Capacity
                            </label>

                            <input
                                type="number"
                                min="0"
                                value={form.capacity}
                                disabled={readOnly}
                                onChange={(event) =>
                                    updateField(
                                        "capacity",
                                        Math.max(
                                            0,
                                            Number(event.target.value) || 0
                                        )
                                    )
                                }
                                className={inputClass}
                            />
                        </div>

                        <div className="flex items-end">
                            <label className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-[#d8e6ef] bg-[#f8fbfd] px-4 py-3">
                                <div>
                                    <p className="text-sm font-bold text-[#153653]">
                                        Ward Status
                                    </p>

                                    <p className="mt-0.5 text-xs text-[#8298aa]">
                                        {form.is_active
                                            ? "Available for hospital operations"
                                            : "Currently inactive"}
                                    </p>
                                </div>

                                <input
                                    type="checkbox"
                                    checked={Boolean(form.is_active)}
                                    disabled={readOnly}
                                    onChange={(event) =>
                                        updateField(
                                            "is_active",
                                            event.target.checked
                                        )
                                    }
                                    className="h-4 w-4 accent-[#08b9d8]"
                                />
                            </label>
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelClass}>
                                Description
                            </label>

                            <textarea
                                rows={4}
                                value={form.description}
                                disabled={readOnly}
                                onChange={(event) =>
                                    updateField(
                                        "description",
                                        event.target.value
                                    )
                                }
                                placeholder="Add ward description, services or operational notes..."
                                className={`${inputClass} resize-none`}
                            />
                        </div>

                        {readOnly && (
                            <>
                                <div>
                                    <label className={labelClass}>
                                        Ward ID
                                    </label>

                                    <div className="rounded-xl border border-[#d8e6ef] bg-[#f8fbfd] px-3.5 py-2.5 text-sm font-bold text-[#153653]">
                                        #{form.id ?? "—"}
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClass}>
                                        Created
                                    </label>

                                    <div className="rounded-xl border border-[#d8e6ef] bg-[#f8fbfd] px-3.5 py-2.5 text-sm font-bold text-[#153653]">
                                        {formatDate(form.created_at)}
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClass}>
                                        Last Updated
                                    </label>

                                    <div className="rounded-xl border border-[#d8e6ef] bg-[#f8fbfd] px-3.5 py-2.5 text-sm font-bold text-[#153653]">
                                        {formatDate(form.updated_at)}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-[#e2edf3] bg-[#fbfdfe] px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-[#d8e6ef] bg-white px-4 py-2.5 text-sm font-bold text-[#55718a] transition hover:border-[#b9cedb] hover:text-[#153653]"
                    >
                        {readOnly ? "Close" : "Cancel"}
                    </button>

                    {!readOnly && (
                        <button
                            type="button"
                            disabled={saving}
                            onClick={onSubmit}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#08b9d8] to-[#3478ed] px-5 py-2.5 text-sm font-black text-white shadow-[0_8px_20px_rgba(52,120,237,0.20)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? (
                                <>
                                    <RefreshCw
                                        size={16}
                                        className="animate-spin"
                                    />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={16} />
                                    {mode === "create"
                                        ? "Create Ward"
                                        : "Save Changes"}
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}


export default function Wards() {
    const [wards, setWards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");

    const [modalMode, setModalMode] = useState(null);
    const [selectedWard, setSelectedWard] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const loadWards = useCallback(async (showRefresh = false) => {
        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const data = await getWards();
            setWards(normalizeWards(data));
        } catch (err) {
            setError(getWardErrorMessage(err));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadWards();
    }, [loadWards]);

    const wardTypes = useMemo(() => {
        return [
            ...new Set(
                wards
                    .map((ward) => ward.ward_type)
                    .filter(Boolean)
            ),
        ].sort((a, b) =>
            String(a).localeCompare(String(b))
        );
    }, [wards]);

    const filteredWards = useMemo(() => {
        const query = search.trim().toLowerCase();

        return wards.filter((ward) => {
            const matchesSearch =
                !query ||
                [
                    ward.name,
                    ward.code,
                    ward.ward_type,
                    ward.floor,
                    ward.location,
                ]
                    .filter(Boolean)
                    .some((value) =>
                        String(value)
                            .toLowerCase()
                            .includes(query)
                    );

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && ward.is_active) ||
                (statusFilter === "inactive" && !ward.is_active);

            const matchesType =
                typeFilter === "all" ||
                ward.ward_type === typeFilter;

            return (
                matchesSearch &&
                matchesStatus &&
                matchesType
            );
        });
    }, [
        wards,
        search,
        statusFilter,
        typeFilter,
    ]);

    const stats = useMemo(() => {
        const totalCapacity = wards.reduce(
            (sum, ward) =>
                sum + (Number(ward.capacity) || 0),
            0
        );

        const active = wards.filter(
            (ward) => ward.is_active
        ).length;

        const inactive = wards.length - active;

        const types = new Set(
            wards
                .map((ward) => ward.ward_type)
                .filter(Boolean)
        ).size;

        return {
            total: wards.length,
            active,
            inactive,
            capacity: totalCapacity,
            types,
        };
    }, [wards]);

    const openCreate = () => {
        setSelectedWard(null);
        setForm(EMPTY_FORM);
        setError("");
        setSuccess("");
        setModalMode("create");
    };

    const openEdit = (ward) => {
        setSelectedWard(ward);

        setForm({
            name: ward.name || "",
            code: ward.code || "",
            ward_type: ward.ward_type || "",
            floor: ward.floor || "",
            location: ward.location || "",
            description: ward.description || "",
            capacity: Number(ward.capacity) || 0,
            is_active: Boolean(ward.is_active),
            id: ward.id,
            created_at: ward.created_at,
            updated_at: ward.updated_at,
        });

        setError("");
        setSuccess("");
        setModalMode("edit");
    };

    const openView = (ward) => {
        setSelectedWard(ward);

        setForm({
            ...ward,
            capacity: Number(ward.capacity) || 0,
        });

        setError("");
        setSuccess("");
        setModalMode("view");
    };

    const closeModal = () => {
        if (saving) {
            return;
        }

        setModalMode(null);
        setSelectedWard(null);
    };

    const handleSubmit = async () => {
        setSaving(true);
        setError("");
        setSuccess("");

        const payload = {
            name: form.name.trim(),
            code: form.code.trim(),
            ward_type: form.ward_type.trim(),
            floor: form.floor.trim() || null,
            location: form.location.trim() || null,
            description: form.description.trim() || null,
            capacity: Number(form.capacity) || 0,
            is_active: Boolean(form.is_active),
        };

        try {
            if (
                !payload.name ||
                !payload.code ||
                !payload.ward_type
            ) {
                throw new Error(
                    "Ward name, ward code and ward type are required."
                );
            }

            if (modalMode === "create") {
                await createWard(payload);
                setSuccess("Ward created successfully.");
            } else {
                await updateWard(
                    selectedWard.id,
                    payload
                );

                setSuccess("Ward updated successfully.");
            }

            setModalMode(null);
            setSelectedWard(null);

            await loadWards(true);
        } catch (err) {
            setError(getWardErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (ward) => {
        const confirmed = window.confirm(
            `Delete "${ward.name}"? This action cannot be undone.`
        );

        if (!confirmed) {
            return;
        }

        setError("");
        setSuccess("");

        try {
            await deleteWard(ward.id);

            setSuccess(
                `${ward.name} deleted successfully.`
            );

            await loadWards(true);
        } catch (err) {
            setError(getWardErrorMessage(err));
        }
    };

    return (
        <div className="min-h-full bg-[#eef5fa] px-4 py-5 sm:px-6 lg:px-7">
            <div className="mx-auto max-w-[1600px]">
                <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#08a8c4]">
                            <Building2 size={15} />
                            Hospital Operations
                        </div>

                        <h1 className="text-2xl font-black tracking-tight text-[#153653] sm:text-3xl">
                            Ward Management
                        </h1>

                        <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-[#55718a]">
                            Manage hospital wards, capacity,
                            locations and operational status
                            from one centralized workspace.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                            type="button"
                            onClick={() => loadWards(true)}
                            disabled={refreshing}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d8e6ef] bg-white px-4 py-2.5 text-sm font-bold text-[#55718a] shadow-[0_5px_18px_rgba(31,72,102,0.05)] transition hover:border-[#b9cedb] hover:text-[#153653] disabled:opacity-60"
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
                            type="button"
                            onClick={openCreate}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#08b9d8] to-[#3478ed] px-4 py-2.5 text-sm font-black text-white shadow-[0_8px_22px_rgba(52,120,237,0.20)] transition hover:brightness-105"
                        >
                            <Plus size={17} />
                            Add Ward
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-[#f1caca] bg-[#fff7f7] px-4 py-3 text-sm font-semibold text-[#a94444]">
                        <Activity
                            size={18}
                            className="mt-0.5 shrink-0"
                        />

                        <div className="min-w-0 flex-1">
                            {error}
                        </div>

                        <button
                            type="button"
                            onClick={() => setError("")}
                            className="shrink-0 text-[#a94444]/70 hover:text-[#a94444]"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {success && (
                    <div className="mb-4 flex items-center gap-3 rounded-2xl border border-[#c8eadc] bg-[#f3fcf8] px-4 py-3 text-sm font-semibold text-[#15845c]">
                        <CheckCircle2 size={18} />
                        <span className="flex-1">
                            {success}
                        </span>

                        <button
                            type="button"
                            onClick={() => setSuccess("")}
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        icon={Building2}
                        label="Total Wards"
                        value={stats.total}
                        helper="Configured hospital wards"
                    />

                    <StatCard
                        icon={ShieldCheck}
                        label="Active Wards"
                        value={stats.active}
                        helper="Currently operational"
                        iconClass="bg-[#e8f8f2] text-[#15845c]"
                    />

                    <StatCard
                        icon={Users}
                        label="Total Capacity"
                        value={stats.capacity}
                        helper="Configured bed capacity"
                        iconClass="bg-[#eef0ff] text-[#6267df]"
                    />

                    <StatCard
                        icon={MapPin}
                        label="Ward Types"
                        value={stats.types}
                        helper={`${stats.inactive} inactive ward${stats.inactive === 1 ? "" : "s"}`}
                        iconClass="bg-[#fff5e7] text-[#d68b2c]"
                    />
                </div>

                <div className="mb-4 rounded-2xl border border-[#d8e6ef] bg-white p-3 shadow-[0_8px_25px_rgba(31,72,102,0.05)]">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                        <div className="relative min-w-0 flex-1">
                            <Search
                                size={17}
                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8298aa]"
                            />

                            <input
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                                placeholder="Search ward name, code, type, floor or location..."
                                className="w-full rounded-xl border border-[#d8e6ef] bg-[#f8fbfd] py-2.5 pl-10 pr-4 text-sm font-medium text-[#153653] outline-none transition focus:border-[#08b9d8] focus:bg-white focus:ring-4 focus:ring-[#08b9d8]/10 placeholder:text-[#a4b7c3]"
                            />
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                            <div className="relative">
                                <Filter
                                    size={15}
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8298aa]"
                                />

                                <select
                                    value={statusFilter}
                                    onChange={(event) =>
                                        setStatusFilter(
                                            event.target.value
                                        )
                                    }
                                    className="w-full appearance-none rounded-xl border border-[#d8e6ef] bg-white py-2.5 pl-9 pr-9 text-sm font-bold text-[#55718a] outline-none focus:border-[#08b9d8] sm:w-[155px]"
                                >
                                    <option value="all">
                                        All Status
                                    </option>
                                    <option value="active">
                                        Active
                                    </option>
                                    <option value="inactive">
                                        Inactive
                                    </option>
                                </select>

                                <ChevronDown
                                    size={14}
                                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8298aa]"
                                />
                            </div>

                            <div className="relative">
                                <select
                                    value={typeFilter}
                                    onChange={(event) =>
                                        setTypeFilter(
                                            event.target.value
                                        )
                                    }
                                    className="w-full appearance-none rounded-xl border border-[#d8e6ef] bg-white py-2.5 pl-3.5 pr-9 text-sm font-bold text-[#55718a] outline-none focus:border-[#08b9d8] sm:w-[180px]"
                                >
                                    <option value="all">
                                        All Ward Types
                                    </option>

                                    {wardTypes.map((type) => (
                                        <option
                                            key={type}
                                            value={type}
                                        >
                                            {type}
                                        </option>
                                    ))}
                                </select>

                                <ChevronDown
                                    size={14}
                                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8298aa]"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-[#d8e6ef] bg-white shadow-[0_10px_30px_rgba(31,72,102,0.06)]">
                    <div className="flex flex-col gap-2 border-b border-[#e2edf3] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <div>
                            <h2 className="text-sm font-black text-[#153653]">
                                Ward Directory
                            </h2>

                            <p className="mt-0.5 text-xs font-medium text-[#8298aa]">
                                {loading
                                    ? "Loading ward records..."
                                    : `${filteredWards.length} of ${wards.length} ward${wards.length === 1 ? "" : "s"} shown`}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-bold text-[#8298aa]">
                            <Activity size={14} />
                            Live backend data
                        </div>
                    </div>

                    {loading ? (
                        <div className="space-y-3 p-5">
                            {Array.from({
                                length: 6,
                            }).map((_, index) => (
                                <div
                                    key={index}
                                    className="h-14 animate-pulse rounded-xl bg-[#eef5fa]"
                                />
                            ))}
                        </div>
                    ) : filteredWards.length === 0 ? (
                        <div className="flex min-h-[300px] flex-col items-center justify-center px-5 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f7fb] text-[#08a8c4]">
                                <Building2 size={25} />
                            </div>

                            <h3 className="mt-4 text-base font-black text-[#153653]">
                                No wards found
                            </h3>

                            <p className="mt-1 max-w-md text-sm font-medium text-[#8298aa]">
                                {wards.length === 0
                                    ? "No ward records are available yet. Create the first ward to get started."
                                    : "Try changing your search or filters to find the ward you need."}
                            </p>

                            {wards.length === 0 && (
                                <button
                                    type="button"
                                    onClick={openCreate}
                                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#08b9d8] to-[#3478ed] px-4 py-2.5 text-sm font-black text-white"
                                >
                                    <Plus size={16} />
                                    Add First Ward
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[980px] border-collapse">
                                <thead>
                                    <tr className="border-b border-[#e2edf3] bg-[#f8fbfd]">
                                        <th className="px-5 py-3 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#8298aa]">
                                            Ward
                                        </th>

                                        <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#8298aa]">
                                            Type
                                        </th>

                                        <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#8298aa]">
                                            Location
                                        </th>

                                        <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#8298aa]">
                                            Capacity
                                        </th>

                                        <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#8298aa]">
                                            Status
                                        </th>

                                        <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#8298aa]">
                                            Updated
                                        </th>

                                        <th className="px-5 py-3 text-right text-[11px] font-black uppercase tracking-[0.08em] text-[#8298aa]">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredWards.map(
                                        (ward) => (
                                            <tr
                                                key={ward.id}
                                                className="border-b border-[#edf3f7] transition last:border-b-0 hover:bg-[#f8fbfd]"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f7fb] text-[#08a8c4]">
                                                            <Building2
                                                                size={
                                                                    18
                                                                }
                                                            />
                                                        </div>

                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-black text-[#153653]">
                                                                {
                                                                    ward.name
                                                                }
                                                            </p>

                                                            <p className="mt-0.5 text-xs font-bold uppercase tracking-[0.06em] text-[#8298aa]">
                                                                {
                                                                    ward.code
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-4">
                                                    <span className="rounded-lg bg-[#eef0ff] px-2.5 py-1.5 text-xs font-bold text-[#6267df]">
                                                        {
                                                            ward.ward_type
                                                        }
                                                    </span>
                                                </td>

                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin
                                                            size={
                                                                15
                                                            }
                                                            className="shrink-0 text-[#08a8c4]"
                                                        />

                                                        <div>
                                                            <p className="text-sm font-bold text-[#55718a]">
                                                                {ward.location ||
                                                                    "—"}
                                                            </p>

                                                            {ward.floor && (
                                                                <p className="text-xs text-[#8298aa]">
                                                                    {
                                                                        ward.floor
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Users
                                                            size={
                                                                15
                                                            }
                                                            className="text-[#3478ed]"
                                                        />

                                                        <span className="text-sm font-black text-[#153653]">
                                                            {Number(
                                                                ward.capacity
                                                            ) || 0}
                                                        </span>

                                                        <span className="text-xs font-medium text-[#8298aa]">
                                                            beds
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-4">
                                                    <StatusBadge
                                                        active={
                                                            ward.is_active
                                                        }
                                                    />
                                                </td>

                                                <td className="px-4 py-4 text-sm font-medium text-[#8298aa]">
                                                    {formatDate(
                                                        ward.updated_at
                                                    )}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            title="View ward"
                                                            onClick={() =>
                                                                openView(
                                                                    ward
                                                                )
                                                            }
                                                            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#55718a] transition hover:bg-[#e8f7fb] hover:text-[#08a8c4]"
                                                        >
                                                            <Eye
                                                                size={
                                                                    16
                                                                }
                                                            />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            title="Edit ward"
                                                            onClick={() =>
                                                                openEdit(
                                                                    ward
                                                                )
                                                            }
                                                            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#55718a] transition hover:bg-[#eef0ff] hover:text-[#3478ed]"
                                                        >
                                                            <Edit3
                                                                size={
                                                                    16
                                                                }
                                                            />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            title="Delete ward"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    ward
                                                                )
                                                            }
                                                            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#8298aa] transition hover:bg-[#fff1f1] hover:text-[#d65353]"
                                                        >
                                                            <Trash2
                                                                size={
                                                                    16
                                                                }
                                                            />
                                                        </button>
                                                    </div>
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

            {modalMode && (
                <WardModal
                    mode={modalMode}
                    form={form}
                    setForm={setForm}
                    saving={saving}
                    onClose={closeModal}
                    onSubmit={handleSubmit}
                />
            )}
        </div>
    );
}
