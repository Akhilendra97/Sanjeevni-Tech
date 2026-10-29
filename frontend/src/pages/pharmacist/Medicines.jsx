import React, {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    AlertTriangle,
    CalendarDays,
    CheckCircle2,
    ChevronLeft,
    CircleAlert,
    Edit3,
    Loader2,
    Package,
    Plus,
    Search,
    Trash2,
    X,
} from "lucide-react";

import {
    createMedicine,
    deleteMedicine,
    getExpiredMedicines,
    getLowStockMedicines,
    listMedicines,
    updateMedicine,
} from "../../services/medicinesApi";

const EMPTY_FORM = {
    medicine_code: "",
    name: "",
    generic_name: "",
    category: "",
    manufacturer: "",
    dosage_form: "",
    strength: "",
    unit: "unit",
    purchase_price: "0",
    selling_price: "0",
    stock_quantity: "0",
    reorder_level: "10",
    expiry_date: "",
    description: "",
    is_active: true,
};

const FILTERS = [
    {
        key: "all",
        label: "All Medicines",
    },
    {
        key: "active",
        label: "Active",
    },
    {
        key: "low",
        label: "Low Stock",
    },
    {
        key: "expired",
        label: "Expired",
    },
    {
        key: "inactive",
        label: "Inactive",
    },
];

const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const isExpired = (value) => {
    if (!value) return false;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return false;
    }

    return date.getTime() < Date.now();
};

const currency = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(Number(value || 0));

const statusClass = (medicine) => {
    if (!medicine.is_active) {
        return "border-slate-200 bg-slate-100 text-slate-500";
    }

    if (isExpired(medicine.expiry_date)) {
        return "border-red-200 bg-red-50 text-red-700";
    }

    if (
        Number(medicine.stock_quantity || 0) <=
        Number(medicine.reorder_level || 0)
    ) {
        return "border-amber-200 bg-amber-50 text-amber-700";
    }

    return "border-emerald-200 bg-emerald-50 text-emerald-700";
};

const statusLabel = (medicine) => {
    if (!medicine.is_active) {
        return "Inactive";
    }

    if (isExpired(medicine.expiry_date)) {
        return "Expired";
    }

    if (
        Number(medicine.stock_quantity || 0) <=
        Number(medicine.reorder_level || 0)
    ) {
        return "Low Stock";
    }

    return "Active";
};

function Field({
    label,
    value,
    onChange,
    type = "text",
    required = false,
    placeholder = "",
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                {label}
                {required ? " *" : ""}
            </span>

            <input
                type={type}
                value={value}
                required={required}
                placeholder={placeholder}
                onChange={(event) =>
                    onChange(event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-50"
            />
        </label>
    );
}

function SelectField({
    label,
    value,
    onChange,
    options,
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                {label}
            </span>

            <select
                value={value}
                onChange={(event) =>
                    onChange(event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-50"
            >
                {options.map((option) => (
                    <option
                        key={option}
                        value={option}
                    >
                        {option}
                    </option>
                ))}
            </select>
        </label>
    );
}

function StatCard({
    label,
    value,
    icon: Icon,
    tone,
}) {
    const tones = {
        blue: "bg-blue-50 text-blue-600",
        emerald:
            "bg-emerald-50 text-emerald-600",
        amber: "bg-amber-50 text-amber-600",
        red: "bg-red-50 text-red-600",
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                        {label}
                    </p>

                    <p className="mt-2 text-2xl font-black text-slate-900">
                        {value}
                    </p>
                </div>

                <div
                    className={[
                        "flex h-11 w-11 items-center justify-center rounded-2xl",
                        tones[tone] || tones.blue,
                    ].join(" ")}
                >
                    <Icon size={20} />
                </div>
            </div>
        </div>
    );
}

export default function Medicines() {
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");

    const [modal, setModal] = useState(null);
    const [form, setForm] = useState(
        EMPTY_FORM
    );

    const loadMedicines = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await listMedicines();

            setMedicines(
                Array.isArray(data) ? data : []
            );
        } catch (err) {
            setError(
                err?.response?.data?.detail ||
                    "Unable to load medicines."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMedicines();
    }, []);

    const stats = useMemo(() => {
        const active = medicines.filter(
            (item) => item.is_active
        );

        const low = active.filter(
            (item) =>
                Number(item.stock_quantity || 0) <=
                Number(item.reorder_level || 0)
        );

        const expired = active.filter((item) =>
            isExpired(item.expiry_date)
        );

        return {
            total: medicines.length,
            active: active.length,
            low: low.length,
            expired: expired.length,
        };
    }, [medicines]);

    const filteredMedicines = useMemo(() => {
        const query = search
            .trim()
            .toLowerCase();

        return medicines.filter((medicine) => {
            const matchesSearch =
                !query ||
                [
                    medicine.medicine_code,
                    medicine.name,
                    medicine.generic_name,
                    medicine.category,
                    medicine.manufacturer,
                ]
                    .filter(Boolean)
                    .some((value) =>
                        String(value)
                            .toLowerCase()
                            .includes(query)
                    );

            if (!matchesSearch) {
                return false;
            }

            if (filter === "active") {
                return medicine.is_active;
            }

            if (filter === "inactive") {
                return !medicine.is_active;
            }

            if (filter === "low") {
                return (
                    medicine.is_active &&
                    Number(
                        medicine.stock_quantity || 0
                    ) <=
                        Number(
                            medicine.reorder_level || 0
                        )
                );
            }

            if (filter === "expired") {
                return (
                    medicine.is_active &&
                    isExpired(
                        medicine.expiry_date
                    )
                );
            }

            return true;
        });
    }, [medicines, search, filter]);

    const openCreate = () => {
        setForm(EMPTY_FORM);
        setError("");
        setModal({ type: "create" });
    };

    const openEdit = (medicine) => {
        setForm({
            medicine_code:
                medicine.medicine_code || "",
            name: medicine.name || "",
            generic_name:
                medicine.generic_name || "",
            category:
                medicine.category || "",
            manufacturer:
                medicine.manufacturer || "",
            dosage_form:
                medicine.dosage_form || "",
            strength:
                medicine.strength || "",
            unit:
                medicine.unit || "unit",
            purchase_price: String(
                medicine.purchase_price ?? 0
            ),
            selling_price: String(
                medicine.selling_price ?? 0
            ),
            stock_quantity: String(
                medicine.stock_quantity ?? 0
            ),
            reorder_level: String(
                medicine.reorder_level ?? 10
            ),
            expiry_date: medicine.expiry_date
                ? String(
                      medicine.expiry_date
                  ).slice(0, 10)
                : "",
            description:
                medicine.description || "",
            is_active:
                medicine.is_active !== false,
        });

        setError("");
        setModal({
            type: "edit",
            medicine,
        });
    };

    const closeModal = () => {
        if (saving) return;

        setModal(null);
        setForm(EMPTY_FORM);
        setError("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");

            const payload = {
                medicine_code:
                    form.medicine_code.trim(),
                name: form.name.trim(),
                generic_name:
                    form.generic_name.trim() ||
                    null,
                category:
                    form.category.trim(),
                manufacturer:
                    form.manufacturer.trim() ||
                    null,
                dosage_form:
                    form.dosage_form.trim() ||
                    null,
                strength:
                    form.strength.trim() ||
                    null,
                unit:
                    form.unit.trim() || "unit",
                purchase_price:
                    Number(form.purchase_price || 0),
                selling_price:
                    Number(form.selling_price || 0),
                stock_quantity:
                    Number(form.stock_quantity || 0),
                reorder_level:
                    Number(form.reorder_level || 0),
                expiry_date:
                    form.expiry_date
                        ? `${form.expiry_date}T00:00:00`
                        : null,
                description:
                    form.description.trim() ||
                    null,
                is_active:
                    form.is_active,
            };

            if (modal?.type === "create") {
                await createMedicine(payload);
            } else {
                await updateMedicine(
                    modal.medicine.id,
                    payload
                );
            }

            closeModal();
            await loadMedicines();
        } catch (err) {
            setError(
                err?.response?.data?.detail ||
                    "Unable to save medicine."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (medicine) => {
        try {
            setError("");

            await updateMedicine(
                medicine.id,
                {
                    is_active:
                        !medicine.is_active,
                }
            );

            await loadMedicines();
        } catch (err) {
            setError(
                err?.response?.data?.detail ||
                    "Unable to update medicine status."
            );
        }
    };

    const handleDelete = async (medicine) => {
        const confirmed = window.confirm(
            `Delete "${medicine.name}"? This action cannot be undone.`
        );

        if (!confirmed) return;

        try {
            setError("");

            await deleteMedicine(
                medicine.id
            );

            await loadMedicines();
        } catch (err) {
            setError(
                err?.response?.data?.detail ||
                    "Unable to delete medicine."
            );
        }
    };

    return (
        <div className="min-h-full bg-slate-50 text-slate-900">
            <div className="mx-auto max-w-[1550px] p-4 sm:p-6 lg:p-8">

                <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="mb-2 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-cyan-500" />

                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                Pharmacy
                            </span>
                        </div>

                        <h1 className="text-3xl font-black tracking-tight text-slate-900">
                            Medicines
                        </h1>

                        <p className="mt-2 max-w-2xl text-sm text-slate-500">
                            Manage medicine master data,
                            pricing, stock thresholds and
                            expiry monitoring.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openCreate}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-100 transition hover:from-cyan-600 hover:to-blue-700"
                    >
                        <Plus size={18} />
                        Add Medicine
                    </button>
                </div>

                {error && (
                    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        <CircleAlert
                            size={19}
                            className="mt-0.5 shrink-0"
                        />

                        <div className="flex-1">
                            <p className="font-bold">
                                Something went wrong
                            </p>

                            <p className="mt-1">
                                {error}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setError("")
                            }
                            className="rounded-lg p-1 hover:bg-red-100"
                        >
                            <X size={17} />
                        </button>
                    </div>
                )}

                <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Total Medicines"
                        value={stats.total}
                        icon={Package}
                        tone="blue"
                    />

                    <StatCard
                        label="Active"
                        value={stats.active}
                        icon={CheckCircle2}
                        tone="emerald"
                    />

                    <StatCard
                        label="Low Stock"
                        value={stats.low}
                        icon={AlertTriangle}
                        tone="amber"
                    />

                    <StatCard
                        label="Expired"
                        value={stats.expired}
                        icon={CalendarDays}
                        tone="red"
                    />
                </div>

                <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

                        <div className="relative w-full xl:max-w-xl">
                            <Search
                                size={18}
                                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                                placeholder="Search medicine, code, generic name, category..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-50"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {FILTERS.map((item) => (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() =>
                                        setFilter(
                                            item.key
                                        )
                                    }
                                    className={[
                                        "rounded-xl px-4 py-2.5 text-xs font-bold transition",
                                        filter === item.key
                                            ? "bg-slate-900 text-white shadow-sm"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                                    ].join(" ")}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {loading ? (
                        <div className="flex min-h-[420px] items-center justify-center">
                            <div className="text-center">
                                <Loader2
                                    size={34}
                                    className="mx-auto animate-spin text-cyan-500"
                                />

                                <p className="mt-3 text-sm font-semibold text-slate-500">
                                    Loading medicines...
                                </p>
                            </div>
                        </div>
                    ) : filteredMedicines.length === 0 ? (
                        <div className="flex min-h-[420px] items-center justify-center px-6">
                            <div className="max-w-md text-center">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                    <Package size={25} />
                                </div>

                                <h3 className="mt-4 text-lg font-black text-slate-900">
                                    No medicines found
                                </h3>

                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    {search
                                        ? "Try a different search term."
                                        : "Add your first medicine to start managing the pharmacy catalogue."}
                                </p>

                                {!search &&
                                    filter ===
                                        "all" && (
                                        <button
                                            type="button"
                                            onClick={
                                                openCreate
                                            }
                                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-cyan-600"
                                        >
                                            <Plus
                                                size={
                                                    17
                                                }
                                            />
                                            Add Medicine
                                        </button>
                                    )}
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-[1250px] w-full">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50">
                                        <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                                            Medicine
                                        </th>

                                        <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                                            Category
                                        </th>

                                        <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                                            Form / Strength
                                        </th>

                                        <th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                                            Purchase
                                        </th>

                                        <th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                                            Selling
                                        </th>

                                        <th className="px-5 py-4 text-center text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                                            Stock
                                        </th>

                                        <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                                            Expiry
                                        </th>

                                        <th className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                                            Status
                                        </th>

                                        <th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {filteredMedicines.map(
                                        (medicine) => (
                                            <tr
                                                key={
                                                    medicine.id
                                                }
                                                className="transition hover:bg-slate-50/80"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                                                            <Package
                                                                size={
                                                                    18
                                                                }
                                                            />
                                                        </div>

                                                        <div className="min-w-0">
                                                            <p className="truncate font-bold text-slate-900">
                                                                {
                                                                    medicine.name
                                                                }
                                                            </p>

                                                            <p className="mt-0.5 text-xs text-slate-400">
                                                                {
                                                                    medicine.medicine_code
                                                                }
                                                            </p>

                                                            {medicine.generic_name && (
                                                                <p className="mt-0.5 max-w-[220px] truncate text-xs text-slate-500">
                                                                    {
                                                                        medicine.generic_name
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
                                                        {
                                                            medicine.category
                                                        }
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <p className="text-sm font-semibold text-slate-700">
                                                        {medicine.dosage_form ||
                                                            "—"}
                                                    </p>

                                                    <p className="mt-1 text-xs text-slate-400">
                                                        {medicine.strength ||
                                                            "Strength not specified"}
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4 text-right text-sm font-semibold text-slate-700">
                                                    {currency(
                                                        medicine.purchase_price
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 text-right text-sm font-bold text-slate-900">
                                                    {currency(
                                                        medicine.selling_price
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 text-center">
                                                    <p className="text-sm font-black text-slate-900">
                                                        {
                                                            medicine.stock_quantity
                                                        }{" "}
                                                        <span className="text-xs font-semibold text-slate-400">
                                                            {
                                                                medicine.unit
                                                            }
                                                        </span>
                                                    </p>

                                                    <p className="mt-1 text-[11px] text-slate-400">
                                                        Reorder at{" "}
                                                        {
                                                            medicine.reorder_level
                                                        }
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                                        <CalendarDays
                                                            size={
                                                                15
                                                            }
                                                            className="text-slate-400"
                                                        />

                                                        {formatDate(
                                                            medicine.expiry_date
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span
                                                        className={[
                                                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-bold",
                                                            statusClass(
                                                                medicine
                                                            ),
                                                        ].join(
                                                            " "
                                                        )}
                                                    >
                                                        <span className="h-1.5 w-1.5 rounded-full bg-current" />

                                                        {statusLabel(
                                                            medicine
                                                        )}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            title="Edit medicine"
                                                            onClick={() =>
                                                                openEdit(
                                                                    medicine
                                                                )
                                                            }
                                                            className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-600"
                                                        >
                                                            <Edit3
                                                                size={
                                                                    16
                                                                }
                                                            />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            title={
                                                                medicine.is_active
                                                                    ? "Deactivate"
                                                                    : "Activate"
                                                            }
                                                            onClick={() =>
                                                                handleToggle(
                                                                    medicine
                                                                )
                                                            }
                                                            className={[
                                                                "rounded-xl border p-2 transition",
                                                                medicine.is_active
                                                                    ? "border-amber-200 text-amber-600 hover:bg-amber-50"
                                                                    : "border-emerald-200 text-emerald-600 hover:bg-emerald-50",
                                                            ].join(
                                                                " "
                                                            )}
                                                        >
                                                            {medicine.is_active ? (
                                                                <CircleAlert
                                                                    size={
                                                                        16
                                                                    }
                                                                />
                                                            ) : (
                                                                <CheckCircle2
                                                                    size={
                                                                        16
                                                                    }
                                                                />
                                                            )}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            title="Delete medicine"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    medicine
                                                                )
                                                            }
                                                            className="rounded-xl border border-red-200 p-2 text-red-500 transition hover:bg-red-50"
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

                <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                    <span>
                        Showing{" "}
                        <strong className="text-slate-600">
                            {filteredMedicines.length}
                        </strong>{" "}
                        of{" "}
                        <strong className="text-slate-600">
                            {medicines.length}
                        </strong>{" "}
                        medicines
                    </span>

                    <span>
                        Pharmacy medicine master
                    </span>
                </div>
            </div>

            {modal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
                    <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">

                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-600">
                                    Pharmacy
                                </p>

                                <h2 className="mt-1 text-xl font-black text-slate-900">
                                    {modal.type ===
                                    "create"
                                        ? "Add Medicine"
                                        : "Edit Medicine"}
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    closeModal
                                }
                                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form
                            onSubmit={
                                handleSubmit
                            }
                            className="p-6"
                        >
                            {error && (
                                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                    {error}
                                </div>
                            )}

                            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                                <Field
                                    label="Medicine Code"
                                    value={
                                        form.medicine_code
                                    }
                                    required
                                    placeholder="MED-001"
                                    onChange={(
                                        value
                                    ) =>
                                        setForm({
                                            ...form,
                                            medicine_code:
                                                value,
                                        })
                                    }
                                />

                                <Field
                                    label="Medicine Name"
                                    value={
                                        form.name
                                    }
                                    required
                                    placeholder="Paracetamol"
                                    onChange={(
                                        value
                                    ) =>
                                        setForm({
                                            ...form,
                                            name: value,
                                        })
                                    }
                                />

                                <Field
                                    label="Generic Name"
                                    value={
                                        form.generic_name
                                    }
                                    placeholder="Paracetamol"
                                    onChange={(
                                        value
                                    ) =>
                                        setForm({
                                            ...form,
                                            generic_name:
                                                value,
                                        })
                                    }
                                />

                                <Field
                                    label="Category"
                                    value={
                                        form.category
                                    }
                                    required
                                    placeholder="Analgesic"
                                    onChange={(
                                        value
                                    ) =>
                                        setForm({
                                            ...form,
                                            category:
                                                value,
                                        })
                                    }
                                />

                                <Field
                                    label="Manufacturer"
                                    value={
                                        form.manufacturer
                                    }
                                    placeholder="Manufacturer"
                                    onChange={(
                                        value
                                    ) =>
                                        setForm({
                                            ...form,
                                            manufacturer:
                                                value,
                                        })
                                    }
                                />

                                <Field
                                    label="Dosage Form"
                                    value={
                                        form.dosage_form
                                    }
                                    placeholder="Tablet"
                                    onChange={(
                                        value
                                    ) =>
                                        setForm({
                                            ...form,
                                            dosage_form:
                                                value,
                                        })
                                    }
                                />

                                <Field
                                    label="Strength"
                                    value={
                                        form.strength
                                    }
                                    placeholder="500 mg"
                                    onChange={(
                                        value
                                    ) =>
                                        setForm({
                                            ...form,
                                            strength:
                                                value,
                                        })
                                    }
                                />

                                <SelectField
                                    label="Unit"
                                    value={
                                        form.unit
                                    }
                                    onChange={(
                                        value
                                    ) =>
                                        setForm({
                                            ...form,
                                            unit: value,
                                        })
                                    }
                                    options={[
                                        "unit",
                                        "tablet",
                                        "capsule",
                                        "bottle",
                                        "strip",
                                        "box",
                                        "vial",
                                        "ampoule",
                                        "tube",
                                    ]}
                                />

                                <Field
                                    label="Purchase Price"
                                    type="number"
                                    value={
                                        form.purchase_price
                                    }
                                    onChange={(
                                        value
                                    ) =>
                                        setForm({
                                            ...form,
                                            purchase_price:
                                                value,
                                        })
                                    }
                                />

                                <Field
                                    label="Selling Price"
                                    type="number"
                                    value={
                                        form.selling_price
                                    }
                                    onChange={(
                                        value
                                    ) =>
                                        setForm({
                                            ...form,
                                            selling_price:
                                                value,
                                        })
                                    }
                                />

                                <Field
                                    label="Stock Quantity"
                                    type="number"
                                    value={
                                        form.stock_quantity
                                    }
                                    onChange={(
                                        value
                                    ) =>
                                        setForm({
                                            ...form,
                                            stock_quantity:
                                                value,
                                        })
                                    }
                                />

                                <Field
                                    label="Reorder Level"
                                    type="number"
                                    value={
                                        form.reorder_level
                                    }
                                    onChange={(
                                        value
                                    ) =>
                                        setForm({
                                            ...form,
                                            reorder_level:
                                                value,
                                        })
                                    }
                                />

                                <Field
                                    label="Expiry Date"
                                    type="date"
                                    value={
                                        form.expiry_date
                                    }
                                    onChange={(
                                        value
                                    ) =>
                                        setForm({
                                            ...form,
                                            expiry_date:
                                                value,
                                        })
                                    }
                                />

                                <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={
                                            form.is_active
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setForm({
                                                ...form,
                                                is_active:
                                                    event
                                                        .target
                                                        .checked,
                                            })
                                        }
                                        className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                                    />

                                    <span>
                                        <span className="block text-sm font-bold text-slate-800">
                                            Active Medicine
                                        </span>

                                        <span className="block text-xs text-slate-500">
                                            Available for
                                            pharmacy
                                            operations
                                        </span>
                                    </span>
                                </label>
                            </div>

                            <div className="mt-5">
                                <label className="block">
                                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                                        Description
                                    </span>

                                    <textarea
                                        value={
                                            form.description
                                        }
                                        rows={4}
                                        placeholder="Medicine description, storage notes or other relevant information..."
                                        onChange={(
                                            event
                                        ) =>
                                            setForm({
                                                ...form,
                                                description:
                                                    event
                                                        .target
                                                        .value,
                                            })
                                        }
                                        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-50"
                                    />
                                </label>
                            </div>

                            <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={
                                        closeModal
                                    }
                                    disabled={saving}
                                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-100 transition hover:from-cyan-600 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {saving && (
                                        <Loader2
                                            size={
                                                17
                                            }
                                            className="animate-spin"
                                        />
                                    )}

                                    {modal.type ===
                                    "create"
                                        ? "Create Medicine"
                                        : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
