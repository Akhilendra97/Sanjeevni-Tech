import { useCallback, useEffect, useMemo, useState } from "react";

import {
    Activity,
    AlertCircle,
    BadgeCheck,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    Clock3,
    Edit3,
    Eye,
    FileBadge2,
    IndianRupee,
    Loader2,
    Plus,
    RefreshCw,
    Search,
    ShieldCheck,
    Stethoscope,
    Trash2,
    UserRound,
    X,
    XCircle,
} from "lucide-react";

import {
    createDoctor,
    deleteDoctor,
    getDoctorApiError,
    getDoctors,
    updateDoctor,
} from "../../services/doctorApi";

const EMPTY_FORM = {
    user_id: "",
    full_name: "",
    department_id: "",
    employee_id: "",
    registration_number: "",
    specialization: "",
    qualification: "",
    experience_years: 0,
    consultation_fee: 0,
    joining_date: "",
    bio: "",
    is_available: true,
};

function formatDate(value) {
    if (!value) return "â€”";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function formatDateTime(value) {
    if (!value) return "â€”";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatMoney(value) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
}

function StatCard({
    icon: Icon,
    label,
    value,
    detail,
    className = "text-cyan-300 bg-cyan-400/10 border-cyan-400/10",
}) {
    return (
        <div className="rounded-2xl border border-white/[0.07] bg-[#0a1322]/90 p-5 transition hover:border-cyan-400/20">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#183B56]0">
                        {label}
                    </p>

                    <p className="mt-2 text-2xl font-bold text-[#183B56]">
                        {value}
                    </p>

                    <p className="mt-1 text-xs text-[#183B56]0">
                        {detail}
                    </p>
                </div>

                <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl border ${className}`}
                >
                    <Icon size={19} />
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
    required = false,
    disabled = false,
    min,
    step,
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#183B56]0">
                {label}
                {required && (
                    <span className="ml-1 text-cyan-400">*</span>
                )}
            </span>

            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                min={min}
                step={step}
                className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#07101d] px-3.5 text-sm text-[#183B56] outline-none placeholder:text-slate-700 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-50"
            />
        </label>
    );
}

function Modal({ title, subtitle, onClose, children }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/70 p-4 backdrop-blur-sm">
            <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/[0.09] bg-[#08111f] shadow-2xl shadow-black/50">
                <div className="flex shrink-0 items-start justify-between border-b border-white/[0.07] px-6 py-5">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                                <Stethoscope size={18} />
                            </div>

                            <h2 className="text-lg font-bold text-[#183B56]">
                                {title}
                            </h2>
                        </div>

                        {subtitle && (
                            <p className="mt-2 pl-12 text-xs text-[#183B56]0">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl p-2 text-[#183B56]0 hover:bg-white/[0.05] hover:text-[#183B56]"
                    >
                        <X size={19} />
                    </button>
                </div>

                <div className="min-h-0 overflow-y-auto overscroll-contain p-6">{children}</div>
            </div>
        </div>
    );
}

export default function Doctors() {
    const [doctors, setDoctors] = useState([]);

    const [search, setSearch] = useState("");
    const [availability, setAvailability] = useState("all");

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [modal, setModal] = useState(null);
    const [selectedDoctor, setSelectedDoctor] = useState(null);

    const [form, setForm] = useState(EMPTY_FORM);

    const loadDoctors = useCallback(async (refresh = false) => {
        try {
            if (refresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const data = await getDoctors();

            setDoctors(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(getDoctorApiError(err));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadDoctors();
    }, [loadDoctors]);

    useEffect(() => {
        if (!success) return;

        const timer = setTimeout(() => {
            setSuccess("");
        }, 3500);

        return () => clearTimeout(timer);
    }, [success]);

    const filteredDoctors = useMemo(() => {
        const query = search.trim().toLowerCase();

        return doctors.filter((doctor) => {
            const searchable = [
                doctor.id,
                doctor.full_name,
                doctor.user?.full_name,
                doctor.user_id,
                doctor.department_id,
                doctor.employee_id,
                doctor.registration_number,
                doctor.specialization,
                doctor.qualification,
            ]
                .join(" ")
                .toLowerCase();

            const searchMatch =
                !query || searchable.includes(query);

            const availabilityMatch =
                availability === "all" ||
                (availability === "available" &&
                    doctor.is_available) ||
                (availability === "unavailable" &&
                    !doctor.is_available);

            return searchMatch && availabilityMatch;
        });
    }, [doctors, search, availability]);

    const stats = useMemo(() => {
        const total = doctors.length;

        const available = doctors.filter(
            (doctor) => doctor.is_available
        ).length;

        const unavailable = total - available;

        const averageExperience =
            total === 0
                ? 0
                : Math.round(
                      doctors.reduce(
                          (sum, doctor) =>
                              sum +
                              Number(
                                  doctor.experience_years || 0
                              ),
                          0
                      ) / total
                  );

        return {
            total,
            available,
            unavailable,
            averageExperience,
        };
    }, [doctors]);

    function updateField(field, value) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    }

    function openCreate() {
        setError("");
        setSelectedDoctor(null);
        setForm(EMPTY_FORM);
        setModal("create");
    }

    function openEdit(doctor) {
        setError("");

        setSelectedDoctor(doctor);

        setForm({
            user_id: String(doctor.user_id ?? ""),
            full_name: doctor.full_name ?? doctor.user?.full_name ?? "",
            department_id: String(
                doctor.department_id ?? ""
            ),
            employee_id: doctor.employee_id ?? "",
            registration_number:
                doctor.registration_number ?? "",
            specialization:
                doctor.specialization ?? "",
            qualification:
                doctor.qualification ?? "",
            experience_years:
                doctor.experience_years ?? 0,
            consultation_fee:
                doctor.consultation_fee ?? 0,
            joining_date:
                doctor.joining_date?.slice(0, 10) || "",
            bio: doctor.bio ?? "",
            is_available:
                doctor.is_available ?? true,
        });

        setModal("edit");
    }

    function openView(doctor) {
        setSelectedDoctor(doctor);
        setModal("view");
    }

    function closeModal() {
        if (saving) return;

        setModal(null);
        setSelectedDoctor(null);
        setForm(EMPTY_FORM);
    }

    async function handleSubmit(event) {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            if (modal === "create") {
                await createDoctor({
                    user_id: Number(form.user_id),
                    full_name: form.full_name.trim(),
                    department_id: Number(
                        form.department_id
                    ),
                    employee_id:
                        form.employee_id.trim(),
                    registration_number:
                        form.registration_number.trim(),
                    specialization:
                        form.specialization.trim(),
                    qualification:
                        form.qualification.trim(),
                    experience_years: Number(
                        form.experience_years || 0
                    ),
                    consultation_fee: Number(
                        form.consultation_fee || 0
                    ),
                    joining_date:
                        form.joining_date || null,
                    bio: form.bio.trim() || null,
                    is_available: Boolean(
                        form.is_available
                    ),
                });

                setSuccess(
                    "Doctor profile created successfully."
                );
            } else {
                await updateDoctor(
                    selectedDoctor.id,
                    {
                        full_name: form.full_name.trim(),
                        department_id: Number(
                            form.department_id
                        ),
                        specialization:
                            form.specialization.trim(),
                        qualification:
                            form.qualification.trim(),
                        experience_years: Number(
                            form.experience_years || 0
                        ),
                        consultation_fee: Number(
                            form.consultation_fee || 0
                        ),
                        joining_date:
                            form.joining_date || null,
                        bio: form.bio.trim() || null,
                        is_available: Boolean(
                            form.is_available
                        ),
                    }
                );

                setSuccess(
                    "Doctor profile updated successfully."
                );
            }

            closeModal();

            await loadDoctors(true);
        } catch (err) {
            setError(getDoctorApiError(err));
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(doctor) {
        const confirmed = window.confirm(
            `Delete doctor profile #${doctor.id}?`
        );

        if (!confirmed) return;

        try {
            setDeletingId(doctor.id);
            setError("");

            await deleteDoctor(doctor.id);

            setSuccess(
                `Doctor profile #${doctor.id} deleted successfully.`
            );

            await loadDoctors(true);
        } catch (err) {
            setError(getDoctorApiError(err));
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <div className="min-h-full bg-transparent text-[#183B56]">
            <div className="mx-auto max-w-[1500px] p-5 sm:p-6 lg:p-8">

                {/* HEADER */}
                <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <div className="mb-3 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-cyan-400" />

                            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300">
                                Hospital Operations
                            </span>
                        </div>

                        <h1 className="text-3xl font-bold tracking-tight text-[#183B56] sm:text-4xl">
                            Doctors
                        </h1>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#183B56]0">
                            Manage doctors, professional credentials,
                            availability and consultation information.
                        </p>
                    </div>

                    <div className="doctor-actions flex flex-row items-center justify-end gap-3 flex-wrap">
                        <button
                            type="button"
                            onClick={() =>
                                loadDoctors(true)
                            }
                            disabled={refreshing}
                            className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-sm font-semibold text-[#55718A] hover:bg-white/[0.06] disabled:opacity-50"
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
                            className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-400 px-5 text-sm font-bold text-slate-950 hover:bg-cyan-300"
                        >
                            <Plus size={17} />
                            Add Doctor
                        </button>
                    </div>
                </div>

                {/* ALERT */}
                {error && (
                    <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-400/15 bg-red-400/[0.06] p-4">
                        <AlertCircle
                            size={18}
                            className="mt-0.5 shrink-0 text-red-300"
                        />

                        <div className="flex-1">
                            <p className="text-sm font-semibold text-red-200">
                                Operation failed
                            </p>

                            <p className="mt-1 text-xs text-red-200/70">
                                {error}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setError("")}
                            className="text-red-300"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {success && (
                    <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06] p-4 text-sm text-emerald-200">
                        <CheckCircle2 size={18} />
                        {success}
                    </div>
                )}

                {/* STATS */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        icon={Stethoscope}
                        label="Total Doctors"
                        value={stats.total}
                        detail="Registered profiles"
                    />

                    <StatCard
                        icon={BadgeCheck}
                        label="Available"
                        value={stats.available}
                        detail="Available for care"
                        className="text-emerald-300 bg-emerald-400/10 border-emerald-400/10"
                    />

                    <StatCard
                        icon={XCircle}
                        label="Unavailable"
                        value={stats.unavailable}
                        detail="Currently unavailable"
                        className="text-amber-300 bg-amber-400/10 border-amber-400/10"
                    />

                    <StatCard
                        icon={Clock3}
                        label="Avg Experience"
                        value={`${stats.averageExperience} yrs`}
                        detail="Across all doctors"
                        className="text-violet-300 bg-violet-400/10 border-violet-400/10"
                    />
                </div>

                {/* SEARCH */}
                <div className="mt-6 rounded-2xl border border-white/[0.07] bg-[#09111f]/90 p-4">
                    <div className="doctor-actions flex flex-row items-center justify-end gap-3 flex-wrap lg:flex-row">
                        <div className="relative flex-1">
                            <Search
                                size={17}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
                            />

                            <input
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                                placeholder="Search doctors by ID, employee ID, registration, specialization..."
                                className="h-11 w-full rounded-xl border border-white/[0.07] bg-[#060d18] pl-11 pr-4 text-sm text-[#183B56] outline-none placeholder:text-slate-700 focus:border-cyan-400/30"
                            />
                        </div>

                        <div className="relative lg:w-52">
                            <select
                                value={availability}
                                onChange={(event) =>
                                    setAvailability(
                                        event.target.value
                                    )
                                }
                                className="h-11 w-full appearance-none rounded-xl border border-white/[0.07] bg-[#060d18] px-4 pr-10 text-sm text-[#55718A] outline-none focus:border-cyan-400/30"
                            >
                                <option value="all">
                                    All Availability
                                </option>

                                <option value="available">
                                    Available
                                </option>

                                <option value="unavailable">
                                    Unavailable
                                </option>
                            </select>

                            <ChevronDown
                                size={16}
                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600"
                            />
                        </div>
                    </div>
                </div>

                {/* DIRECTORY */}
                <div className="mt-5 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#09111f]/90">
                    <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                        <div>
                            <h2 className="font-semibold text-[#183B56]">
                                Doctor Directory
                            </h2>

                            <p className="mt-1 text-xs text-slate-600">
                                Showing{" "}
                                {filteredDoctors.length}{" "}
                                of {doctors.length} records
                            </p>
                        </div>

                        <div className="hidden items-center gap-2 text-xs text-[#183B56]0 sm:flex">
                            <Activity
                                size={14}
                                className="text-cyan-400"
                            />
                            Live backend data
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex min-h-[360px] flex-col items-center justify-center">
                            <Loader2
                                size={30}
                                className="animate-spin text-cyan-300"
                            />

                            <p className="mt-3 text-xs text-[#183B56]0">
                                Loading doctor records...
                            </p>
                        </div>
                    ) : filteredDoctors.length === 0 ? (
                        <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03] text-slate-600">
                                <Stethoscope size={24} />
                            </div>

                            <h3 className="mt-4 text-sm font-semibold text-[#55718A]">
                                No doctor records found
                            </h3>

                            <p className="mt-2 max-w-md text-xs leading-5 text-slate-600">
                                {doctors.length === 0
                                    ? "There are currently no doctor profiles in the database."
                                    : "Try changing your search or availability filter."}
                            </p>

                            {doctors.length === 0 && (
                                <button
                                    type="button"
                                    onClick={openCreate}
                                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-300"
                                >
                                    <Plus size={15} />
                                    Create First Doctor
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1050px] text-left">
                                <thead>
                                    <tr className="border-b border-white/[0.05] text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
                                        <th className="px-5 py-4">
                                            Doctor
                                        </th>

                                        <th className="px-5 py-4">
                                            Professional ID
                                        </th>

                                        <th className="px-5 py-4">
                                            Specialization
                                        </th>

                                        <th className="px-5 py-4">
                                            Department
                                        </th>

                                        <th className="px-5 py-4">
                                            Experience
                                        </th>

                                        <th className="px-5 py-4">
                                            Fee
                                        </th>

                                        <th className="px-5 py-4">
                                            Status
                                        </th>

                                        <th className="px-5 py-4 text-right">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredDoctors.map(
                                        (doctor) => (
                                            <tr
                                                key={doctor.id}
                                                className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.018]"
                                            >
                                                <td className="w-[260px] min-w-[260px] px-5 py-4 align-middle">
                                                    <div className="flex w-full min-w-0 items-center gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/[0.06] text-xs font-bold text-cyan-300">
                                                            DR
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <p className="break-words text-sm font-semibold leading-5 text-[#183B56]">
                                                                {doctor.full_name || doctor.user?.full_name || doctor.name || "Doctor name unavailable"}
                                                            </p>

                                                            <p className="mt-1 text-[11px] leading-4 text-slate-600">
                                                                User #{doctor.user_id}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <p className="text-xs font-semibold text-[#55718A]">
                                                        {
                                                            doctor.employee_id
                                                        }
                                                    </p>

                                                    <p className="mt-1 text-[11px] text-slate-600">
                                                        {
                                                            doctor.registration_number
                                                        }
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <p className="text-sm text-[#55718A]">
                                                        {
                                                            doctor.specialization
                                                        }
                                                    </p>

                                                    <p className="mt-1 max-w-[220px] truncate text-[11px] text-slate-600">
                                                        {
                                                            doctor.qualification
                                                        }
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span className="rounded-lg border border-white/[0.06] bg-white/[0.025] px-2.5 py-1.5 text-xs text-[#6B8094]">
                                                        Dept #
                                                        {
                                                            doctor.department_id
                                                        }
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4 text-sm text-[#55718A]">
                                                    {
                                                        doctor.experience_years
                                                    }{" "}
                                                    yrs
                                                </td>

                                                <td className="px-5 py-4 text-sm font-semibold text-[#55718A]">
                                                    {formatMoney(
                                                        doctor.consultation_fee
                                                    )}
                                                </td>

                                                <td className="px-5 py-4">
                                                    {doctor.is_available ? (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/[0.06] px-2.5 py-1.5 text-[11px] font-semibold text-emerald-300">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                                            Available
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-400/[0.05] px-2.5 py-1.5 text-[11px] font-semibold text-[#183B56]0">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                                                            Unavailable
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex justify-end gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openView(
                                                                    doctor
                                                                )
                                                            }
                                                            className="rounded-lg p-2 text-[#183B56]0 hover:bg-cyan-400/10 hover:text-cyan-300"
                                                            title="View"
                                                        >
                                                            <Eye
                                                                size={
                                                                    16
                                                                }
                                                            />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openEdit(
                                                                    doctor
                                                                )
                                                            }
                                                            className="rounded-lg p-2 text-[#183B56]0 hover:bg-violet-400/10 hover:text-violet-300"
                                                            title="Edit"
                                                        >
                                                            <Edit3
                                                                size={
                                                                    16
                                                                }
                                                            />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            disabled={
                                                                deletingId ===
                                                                doctor.id
                                                            }
                                                            onClick={() =>
                                                                handleDelete(
                                                                    doctor
                                                                )
                                                            }
                                                            className="rounded-lg p-2 text-[#183B56]0 hover:bg-red-400/10 hover:text-red-300 disabled:opacity-50"
                                                            title="Delete"
                                                        >
                                                            {deletingId ===
                                                            doctor.id ? (
                                                                <Loader2
                                                                    size={
                                                                        16
                                                                    }
                                                                    className="animate-spin"
                                                                />
                                                            ) : (
                                                                <Trash2
                                                                    size={
                                                                        16
                                                                    }
                                                                />
                                                            )}
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

            {/* CREATE / EDIT */}
            {(modal === "create" ||
                modal === "edit") && (
                <Modal
                    title={
                        modal === "create"
                            ? "Add Doctor"
                            : "Edit Doctor"
                    }
                    subtitle={
                        modal === "create"
                            ? "Create a doctor profile linked to an existing user."
                            : `Update doctor profile #${selectedDoctor?.id}.`
                    }
                    onClose={closeModal}
                >
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-6"
                    >
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <Field
                                label="Doctor Full Name"
                                value={form.full_name}
                                onChange={(e) => updateField("full_name", e.target.value)}
                                placeholder="Enter doctor's full name"
                                required
                            />

                            <Field
                                label="User ID"
                                type="number"
                                value={form.user_id}
                                onChange={(e) =>
                                    updateField(
                                        "user_id",
                                        e.target.value
                                    )
                                }
                                placeholder="Existing user ID"
                                required
                                min="1"
                                disabled={
                                    modal === "edit"
                                }
                            />

                            <Field
                                label="Department ID"
                                type="number"
                                value={form.department_id}
                                onChange={(e) =>
                                    updateField(
                                        "department_id",
                                        e.target.value
                                    )
                                }
                                placeholder="Department ID"
                                required
                                min="1"
                            />

                            <Field
                                label="Employee ID"
                                value={form.employee_id}
                                onChange={(e) =>
                                    updateField(
                                        "employee_id",
                                        e.target.value
                                    )
                                }
                                placeholder="DOC-001"
                                required
                                disabled={
                                    modal === "edit"
                                }
                            />

                            <Field
                                label="Registration Number"
                                value={
                                    form.registration_number
                                }
                                onChange={(e) =>
                                    updateField(
                                        "registration_number",
                                        e.target.value
                                    )
                                }
                                placeholder="Medical registration"
                                required
                                disabled={
                                    modal === "edit"
                                }
                            />

                            <Field
                                label="Specialization"
                                value={form.specialization}
                                onChange={(e) =>
                                    updateField(
                                        "specialization",
                                        e.target.value
                                    )
                                }
                                placeholder="Cardiology"
                                required
                            />

                            <Field
                                label="Qualification"
                                value={form.qualification}
                                onChange={(e) =>
                                    updateField(
                                        "qualification",
                                        e.target.value
                                    )
                                }
                                placeholder="MBBS, MD"
                                required
                            />

                            <Field
                                label="Experience (Years)"
                                type="number"
                                value={
                                    form.experience_years
                                }
                                onChange={(e) =>
                                    updateField(
                                        "experience_years",
                                        e.target.value
                                    )
                                }
                                min="0"
                                step="1"
                            />

                            <Field
                                label="Consultation Fee"
                                type="number"
                                value={
                                    form.consultation_fee
                                }
                                onChange={(e) =>
                                    updateField(
                                        "consultation_fee",
                                        e.target.value
                                    )
                                }
                                min="0"
                                step="1"
                            />

                            <Field
                                label="Joining Date"
                                type="date"
                                value={form.joining_date}
                                onChange={(e) =>
                                    updateField(
                                        "joining_date",
                                        e.target.value
                                    )
                                }
                            />
                        </div>

                        <label className="block">
                            <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#183B56]0">
                                Professional Bio
                            </span>

                            <textarea
                                value={form.bio}
                                onChange={(e) =>
                                    updateField(
                                        "bio",
                                        e.target.value
                                    )
                                }
                                rows={4}
                                placeholder="Professional biography..."
                                className="w-full resize-none rounded-xl border border-white/[0.08] bg-[#07101d] px-3.5 py-3 text-sm text-[#183B56] outline-none placeholder:text-slate-700 focus:border-cyan-400/40"
                            />
                        </label>

                        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
                            <input
                                type="checkbox"
                                checked={
                                    form.is_available
                                }
                                onChange={(e) =>
                                    updateField(
                                        "is_available",
                                        e.target.checked
                                    )
                                }
                                className="h-4 w-4 accent-cyan-400"
                            />

                            <div>
                                <p className="text-sm font-semibold text-[#55718A]">
                                    Doctor currently available
                                </p>

                                <p className="mt-1 text-xs text-slate-600">
                                    Controls the doctor's availability status.
                                </p>
                            </div>
                        </label>

                        <div className="flex justify-end gap-3 border-t border-white/[0.06] pt-5">
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={saving}
                                className="h-11 rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 text-sm font-semibold text-[#6B8094] hover:text-[#183B56]"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-400 px-6 text-sm font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
                            >
                                {saving ? (
                                    <>
                                        <Loader2
                                            size={16}
                                            className="animate-spin"
                                        />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2
                                            size={16}
                                        />

                                        {modal === "create"
                                            ? "Create Doctor"
                                            : "Save Changes"}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* VIEW */}
            {modal === "view" &&
                selectedDoctor && (
                    <Modal
                        title={selectedDoctor.full_name || selectedDoctor.user?.full_name || selectedDoctor.name || `Doctor #${selectedDoctor.id}`}
                        subtitle="Doctor profile details"
                        onClose={closeModal}
                    >
                        <div className="space-y-5">
                            <div className="flex flex-col gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 sm:flex-row sm:items-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400/[0.07] text-lg font-bold text-cyan-300">
                                    DR
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-[#183B56]">
                                        {selectedDoctor.full_name || selectedDoctor.user?.full_name || selectedDoctor.name || "Doctor name unavailable"}
                                    </h3>

                                    <p className="mt-1 text-sm text-cyan-300">
                                        {
                                            selectedDoctor.specialization
                                        }
                                    </p>

                                    <p className="mt-1 text-xs text-slate-600">
                                        {
                                            selectedDoctor.qualification
                                        }
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        closeModal();
                                        openEdit(
                                            selectedDoctor
                                        );
                                    }}
                                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-violet-400/10 px-4 text-xs font-bold text-violet-300"
                                >
                                    <Edit3 size={15} />
                                    Edit
                                </button>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <Info
                                    icon={UserRound}
                                    label="User ID"
                                    value={`#${selectedDoctor.user_id}`}
                                />

                                <Info
                                    icon={FileBadge2}
                                    label="Employee ID"
                                    value={
                                        selectedDoctor.employee_id
                                    }
                                />

                                <Info
                                    icon={ShieldCheck}
                                    label="Registration"
                                    value={
                                        selectedDoctor.registration_number
                                    }
                                />

                                <Info
                                    icon={Activity}
                                    label="Department"
                                    value={`#${selectedDoctor.department_id}`}
                                />

                                <Info
                                    icon={Clock3}
                                    label="Experience"
                                    value={`${selectedDoctor.experience_years} years`}
                                />

                                <Info
                                    icon={IndianRupee}
                                    label="Consultation Fee"
                                    value={formatMoney(
                                        selectedDoctor.consultation_fee
                                    )}
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Info
                                    icon={CalendarDays}
                                    label="Joining Date"
                                    value={formatDate(
                                        selectedDoctor.joining_date
                                    )}
                                />

                                <Info
                                    icon={BadgeCheck}
                                    label="Availability"
                                    value={
                                        selectedDoctor.is_available
                                            ? "Available"
                                            : "Unavailable"
                                    }
                                />
                            </div>

                            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                    Professional Bio
                                </p>

                                <p className="mt-3 text-sm leading-6 text-[#6B8094]">
                                    {selectedDoctor.bio ||
                                        "No professional bio added."}
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Info
                                    icon={CalendarDays}
                                    label="Created"
                                    value={formatDateTime(
                                        selectedDoctor.created_at
                                    )}
                                />

                                <Info
                                    icon={CalendarDays}
                                    label="Last Updated"
                                    value={formatDateTime(
                                        selectedDoctor.updated_at
                                    )}
                                />
                            </div>
                        </div>
                    </Modal>
                )}
        </div>
    );
}

function Info({ icon: Icon, label, value }) {
    return (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <Icon size={17} className="text-cyan-300" />

            <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                {label}
            </p>

            <p className="mt-1 break-words text-sm font-semibold text-[#55718A]">
                {value}
            </p>
        </div>
    );
}




