import DocumentPdfActions from "../../components/pdf/DocumentPdfActions";
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Activity,
    AlertCircle,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Droplets,
    Eye,
    Mail,
    MapPin,
    Phone,
    RefreshCw,
    Search,
    ShieldCheck,
    UserRound,
    X,
} from "lucide-react";

import {
    getPatient,
    getPatients,
} from "../../services/patientApi";


const PAGE_SIZE = 50;


const formatDate = (value) => {
    if (!value) {
        return "—";
    }

    try {
        return new Intl.DateTimeFormat(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        ).format(new Date(value));
    } catch {
        return value;
    }
};


const calculateAge = (value) => {
    if (!value) {
        return null;
    }

    const birthDate = new Date(value);

    if (Number.isNaN(birthDate.getTime())) {
        return null;
    }

    const today = new Date();

    let age =
        today.getFullYear() -
        birthDate.getFullYear();

    const monthDifference =
        today.getMonth() -
        birthDate.getMonth();

    if (
        monthDifference < 0 ||
        (
            monthDifference === 0 &&
            today.getDate() < birthDate.getDate()
        )
    ) {
        age -= 1;
    }

    return age >= 0 ? age : null;
};


const fullName = (patient) => {
    const name = [
        patient?.first_name,
        patient?.last_name,
    ]
        .filter(Boolean)
        .join(" ")
        .trim();

    return (
        name ||
        patient?.full_name ||
        "Unnamed Patient"
    );
};


const initials = (patient) => {
    const name = fullName(patient);

    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(
            (part) =>
                part.charAt(0).toUpperCase()
        )
        .join("") || "P";
};


const statusLabel = (patient) =>
    patient?.is_active === false
        ? "Inactive"
        : "Active";


const StatusBadge = ({ active }) => (
    <span
        className={
            active
                ? "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                : "inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
        }
    >
        <span
            className={
                active
                    ? "h-1.5 w-1.5 rounded-full bg-emerald-500"
                    : "h-1.5 w-1.5 rounded-full bg-slate-400"
            }
        />
        {active ? "Active" : "Inactive"}
    </span>
);


const DetailRow = ({
    icon: Icon,
    label,
    value,
}) => (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-cyan-600 shadow-sm">
            <Icon size={16} />
        </div>

        <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {label}
            </p>

            <p className="mt-1 break-words text-sm font-medium text-slate-700">
                {value || "—"}
            </p>
        </div>
    </div>
);


const PatientDetailsModal = ({
    patient,
    loading,
    onClose,
}) => {
    if (!patient && !loading) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
                if (
                    event.target ===
                    event.currentTarget
                ) {
                    onClose();
                }
            }}
        >
            <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-600">
                            Clinical Patient Profile
                        </p>

                        <h2 className="mt-1 text-xl font-bold text-slate-900">
                            Patient Details
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                        aria-label="Close patient details"
                    >
                        <X size={19} />
                    </button>
                </div>

                <div className="max-h-[calc(90vh-90px)] overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex min-h-72 items-center justify-center">
                            <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                                <RefreshCw
                                    size={18}
                                    className="animate-spin text-cyan-600"
                                />
                                Loading patient profile...
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col gap-5 rounded-2xl border border-cyan-100 bg-gradient-to-r from-cyan-50 via-white to-blue-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-lg font-bold text-white shadow-lg shadow-cyan-100">
                                        {initials(patient)}
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">
                                            {fullName(patient)}
                                        </h3>

                                        <p className="mt-1 text-sm text-slate-500">
                                            {patient?.patient_number ||
                                                "Patient number unavailable"}
                                        </p>
                                    </div>
                                </div>

                                <StatusBadge
                                    active={
                                        patient?.is_active !==
                                        false
                                    }
                                />
                            </div>

                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                <DetailRow
                                    icon={CalendarDays}
                                    label="Date of Birth"
                                    value={
                                        formatDate(
                                            patient?.date_of_birth
                                        )
                                    }
                                />

                                <DetailRow
                                    icon={UserRound}
                                    label="Gender"
                                    value={
                                        patient?.gender
                                    }
                                />

                                <DetailRow
                                    icon={Droplets}
                                    label="Blood Group"
                                    value={
                                        patient?.blood_group
                                    }
                                />

                                <DetailRow
                                    icon={Phone}
                                    label="Phone"
                                    value={
                                        patient?.phone
                                    }
                                />

                                <DetailRow
                                    icon={Mail}
                                    label="Email"
                                    value={
                                        patient?.email
                                    }
                                />

                                <DetailRow
                                    icon={MapPin}
                                    label="Location"
                                    value={[
                                        patient?.city,
                                        patient?.state,
                                        patient?.postal_code,
                                    ]
                                        .filter(Boolean)
                                        .join(", ")}
                                />
                            </div>

                            <div className="mt-5">
                                <h4 className="mb-3 text-sm font-bold text-slate-900">
                                    Address & Emergency Contact
                                </h4>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <DetailRow
                                        icon={MapPin}
                                        label="Address"
                                        value={
                                            patient?.address
                                        }
                                    />

                                    <DetailRow
                                        icon={ShieldCheck}
                                        label="Emergency Contact"
                                        value={[
                                            patient?.emergency_contact_name,
                                            patient?.emergency_contact_phone,
                                            patient?.emergency_contact_relation
                                                ? `(${patient.emergency_contact_relation})`
                                                : null,
                                        ]
                                            .filter(Boolean)
                                            .join(" ")}
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};


export default function Patients() {
    const [patients, setPatients] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    const [searchInput, setSearchInput] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [page, setPage] =
        useState(0);

    const [selectedPatient, setSelectedPatient] =
        useState(null);

    const [detailsLoading, setDetailsLoading] =
        useState(false);

    const [detailsError, setDetailsError] =
        useState("");

    const loadPatients = useCallback(
        async ({
            silent = false,
            nextPage = page,
            nextSearch = search,
        } = {}) => {
            try {
                if (silent) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }

                setError("");

                const data =
                    await getPatients({
                        search: nextSearch,
                        skip:
                            nextPage *
                            PAGE_SIZE,
                        limit: PAGE_SIZE,
                    });

                setPatients(
                    Array.isArray(data)
                        ? data
                        : []
                );
            } catch (requestError) {
                const message =
                    requestError?.response?.data
                        ?.detail ||
                    requestError?.message ||
                    "Unable to load patients.";

                setError(message);
                setPatients([]);
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [page, search]
    );


    useEffect(() => {
        loadPatients();
    }, [loadPatients]);


    const activeCount = useMemo(
        () =>
            patients.filter(
                (patient) =>
                    patient?.is_active !== false
            ).length,
        [patients]
    );


    const inactiveCount = useMemo(
        () =>
            patients.filter(
                (patient) =>
                    patient?.is_active === false
            ).length,
        [patients]
    );


    const averageAge = useMemo(() => {
        const ages = patients
            .map((patient) =>
                calculateAge(
                    patient?.date_of_birth
                )
            )
            .filter(
                (age) =>
                    typeof age === "number"
            );

        if (!ages.length) {
            return "—";
        }

        return Math.round(
            ages.reduce(
                (sum, age) => sum + age,
                0
            ) / ages.length
        );
    }, [patients]);


    const handleSearch = (event) => {
        event.preventDefault();

        setPage(0);
        setSearch(searchInput.trim());
    };


    const handleResetSearch = () => {
        setSearchInput("");
        setSearch("");
        setPage(0);
    };


    const openPatientDetails = async (
        patient
    ) => {
        setSelectedPatient(patient);
        setDetailsError("");

        if (!patient?.id) {
            return;
        }

        try {
            setDetailsLoading(true);

            const details =
                await getPatient(patient.id);

            setSelectedPatient(details);
        } catch (requestError) {
            setDetailsError(
                requestError?.response?.data
                    ?.detail ||
                requestError?.message ||
                "Unable to load patient details."
            );
        } finally {
            setDetailsLoading(false);
        }
    };


    const closeDetails = () => {
        setSelectedPatient(null);
        setDetailsError("");
        setDetailsLoading(false);
    };


    const canGoPrevious =
        page > 0;

    const canGoNext =
        patients.length === PAGE_SIZE;


    return (
        <div className="min-h-full bg-slate-50/70 p-4 sm:p-6 lg:p-7">
            <div className="mx-auto max-w-[1600px]">
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                            <Activity size={14} />
                            Clinical Workspace
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            Patients
                        </h1>

                        <p className="mt-1 max-w-2xl text-sm text-slate-500">
                            Search and review patient
                            profiles available to the
                            doctor workspace.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            loadPatients({
                                silent: true,
                            })
                        }
                        disabled={
                            loading ||
                            refreshing
                        }
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
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
                </div>

                <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Loaded Patients
                                </p>

                                <p className="mt-2 text-2xl font-bold text-slate-900">
                                    {patients.length}
                                </p>
                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                                <UserRound size={20} />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Active
                                </p>

                                <p className="mt-2 text-2xl font-bold text-slate-900">
                                    {activeCount}
                                </p>
                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <ShieldCheck size={20} />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Inactive
                                </p>

                                <p className="mt-2 text-2xl font-bold text-slate-900">
                                    {inactiveCount}
                                </p>
                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                <UserRound size={20} />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Avg. Age
                                </p>

                                <p className="mt-2 text-2xl font-bold text-slate-900">
                                    {averageAge}
                                </p>
                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <CalendarDays size={20} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 p-4 sm:p-5">
                        <form
                            onSubmit={
                                handleSearch
                            }
                            className="flex flex-col gap-3 lg:flex-row"
                        >
                            <div className="relative flex-1">
                                <Search
                                    size={18}
                                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    type="text"
                                    value={
                                        searchInput
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setSearchInput(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="Search patient number, name, phone or email..."
                                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-50"
                                />
                            </div>

                            <button
                                type="submit"
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:from-cyan-700 hover:to-blue-700"
                            >
                                <Search size={16} />
                                Search
                            </button>

                            {search && (
                                <button
                                    type="button"
                                    onClick={
                                        handleResetSearch
                                    }
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                                >
                                    <X size={16} />
                                    Clear
                                </button>
                            )}
                        </form>

                        {search && (
                            <p className="mt-3 text-xs text-slate-500">
                                Showing results for{" "}
                                <span className="font-semibold text-slate-700">
                                    “{search}”
                                </span>
                            </p>
                        )}
                    </div>

                    {error ? (
                        <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                                <AlertCircle size={22} />
                            </div>

                            <h3 className="mt-4 text-base font-bold text-slate-900">
                                Unable to load patients
                            </h3>

                            <p className="mt-1 max-w-md text-sm text-slate-500">
                                {error}
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    loadPatients()
                                }
                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                                <RefreshCw size={15} />
                                Try Again
                            </button>
                        </div>
                    ) : loading ? (
                        <div className="flex min-h-80 items-center justify-center">
                            <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                                <RefreshCw
                                    size={18}
                                    className="animate-spin text-cyan-600"
                                />
                                Loading patient directory...
                            </div>
                        </div>
                    ) : patients.length === 0 ? (
                        <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                <UserRound size={24} />
                            </div>

                            <h3 className="mt-4 text-base font-bold text-slate-900">
                                No patients found
                            </h3>

                            <p className="mt-1 max-w-md text-sm text-slate-500">
                                {search
                                    ? "Try another patient number, name, phone or email."
                                    : "There are no patient records available in this view."}
                            </p>

                            {search && (
                                <button
                                    type="button"
                                    onClick={
                                        handleResetSearch
                                    }
                                    className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                                >
                                    Clear Search
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="hidden overflow-x-auto md:block">
                                <table className="w-full min-w-[1050px]">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                                            <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-400">
                                                Patient
                                            </th>

                                            <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-400">
                                                Demographics
                                            </th>

                                            <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-400">
                                                Contact
                                            </th>

                                            <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-400">
                                                Location
                                            </th>

                                            <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-400">
                                                Status
                                            </th>

                                            <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {patients.map(
                                            (
                                                patient
                                            ) => {
                                                const age =
                                                    calculateAge(
                                                        patient?.date_of_birth
                                                    );

                                                return (
                                                    <tr
                                                        key={
                                                            patient.id
                                                        }
                                                        className="border-b border-slate-100 last:border-b-0 hover:bg-cyan-50/30"
                                                    >
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white">
                                                                    {initials(
                                                                        patient
                                                                    )}
                                                                </div>

                                                                <div className="min-w-0">
                                                                    <p className="truncate text-sm font-bold text-slate-800">
                                                                        {fullName(
                                                                            patient
                                                                        )}
                                                                    </p>

                                                                    <p className="mt-0.5 text-xs font-medium text-cyan-700">
                                                                        {patient?.patient_number ||
                                                                            "—"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <div className="space-y-1">
                                                                <p className="text-sm font-medium text-slate-700">
                                                                    {patient?.gender ||
                                                                        "—"}
                                                                    {age !==
                                                                        null
                                                                        ? ` • ${age} yrs`
                                                                        : ""}
                                                                </p>

                                                                <p className="text-xs text-slate-400">
                                                                    DOB:{" "}
                                                                    {formatDate(
                                                                        patient?.date_of_birth
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <div className="space-y-1">
                                                                <p className="flex items-center gap-1.5 text-sm text-slate-600">
                                                                    <Phone
                                                                        size={
                                                                            13
                                                                        }
                                                                    />
                                                                    {patient?.phone ||
                                                                        "—"}
                                                                </p>

                                                                <p className="flex max-w-[210px] items-center gap-1.5 truncate text-xs text-slate-400">
                                                                    <Mail
                                                                        size={
                                                                            13
                                                                        }
                                                                    />
                                                                    {patient?.email ||
                                                                        "—"}
                                                                </p>
                                                            </div>
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <p className="max-w-[180px] text-sm text-slate-600">
                                                                {[
                                                                    patient?.city,
                                                                    patient?.state,
                                                                ]
                                                                    .filter(
                                                                        Boolean
                                                                    )
                                                                    .join(
                                                                        ", "
                                                                    ) ||
                                                                    "—"}
                                                            </p>
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <StatusBadge
                                                                active={
                                                                    patient?.is_active !==
                                                                    false
                                                                }
                                                            />
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <div className="flex flex-wrap items-center justify-end gap-2">
                                                                <DocumentPdfActions title={`Patient Record ${patient?.patient_number || patient?.id}`} record={{ patient_number: patient?.patient_number, patient_id: patient?.id, full_name: fullName(patient), date_of_birth: patient?.date_of_birth, age, gender: patient?.gender, phone: patient?.phone, email: patient?.email, city: patient?.city, state: patient?.state, blood_group: patient?.blood_group, is_active: patient?.is_active !== false }} />
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openPatientDetails(
                                                                        patient
                                                                    )
                                                                }
                                                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:text-cyan-700"
                                                            >
                                                                <Eye
                                                                    size={
                                                                        15
                                                                    }
                                                                />
                                                                View
                                                            </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="grid gap-3 p-4 md:hidden">
                                {patients.map(
                                    (
                                        patient
                                    ) => (
                                        <div
                                            key={
                                                patient.id
                                            }
                                            className="rounded-2xl border border-slate-200 bg-white p-4"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white">
                                                        {initials(
                                                            patient
                                                        )}
                                                    </div>

                                                    <div>
                                                        <p className="font-bold text-slate-800">
                                                            {fullName(
                                                                patient
                                                            )}
                                                        </p>

                                                        <p className="mt-0.5 text-xs font-semibold text-cyan-700">
                                                            {patient?.patient_number ||
                                                                "—"}
                                                        </p>
                                                    </div>
                                                </div>

                                                <StatusBadge
                                                    active={
                                                        patient?.is_active !==
                                                        false
                                                    }
                                                />
                                            </div>

                                            <div className="mt-4 grid grid-cols-2 gap-2">
                                                <div className="rounded-xl bg-slate-50 p-3">
                                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                        Gender
                                                    </p>

                                                    <p className="mt-1 text-sm font-semibold text-slate-700">
                                                        {patient?.gender ||
                                                            "—"}
                                                    </p>
                                                </div>

                                                <div className="rounded-xl bg-slate-50 p-3">
                                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                        Blood Group
                                                    </p>

                                                    <p className="mt-1 text-sm font-semibold text-slate-700">
                                                        {patient?.blood_group ||
                                                            "—"}
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openPatientDetails(
                                                        patient
                                                    )
                                                }
                                                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
                                            >
                                                <Eye
                                                    size={16}
                                                />
                                                View Patient
                                            </button>
                                        </div>
                                    )
                                )}
                            </div>

                            <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                                <p className="text-xs font-medium text-slate-500">
                                    Page{" "}
                                    <span className="font-bold text-slate-700">
                                        {page + 1}
                                    </span>

                                    {search
                                        ? ` • Search: ${search}`
                                        : ""}
                                </p>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={
                                            !canGoPrevious
                                        }
                                        onClick={() =>
                                            setPage(
                                                (
                                                    current
                                                ) =>
                                                    Math.max(
                                                        0,
                                                        current -
                                                            1
                                                    )
                                            )
                                        }
                                        className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <ChevronLeft
                                            size={15}
                                        />
                                        Previous
                                    </button>

                                    <button
                                        type="button"
                                        disabled={
                                            !canGoNext
                                        }
                                        onClick={() =>
                                            setPage(
                                                (
                                                    current
                                                ) =>
                                                    current +
                                                    1
                                            )
                                        }
                                        className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Next
                                        <ChevronRight
                                            size={15}
                                        />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {selectedPatient && (
                <PatientDetailsModal
                    patient={
                        detailsError
                            ? selectedPatient
                            : selectedPatient
                    }
                    loading={
                        detailsLoading
                    }
                    onClose={
                        closeDetails
                    }
                />
            )}

            {detailsError &&
                selectedPatient &&
                !detailsLoading && (
                    <div className="fixed bottom-5 right-5 z-[60] max-w-sm rounded-2xl border border-red-100 bg-white p-4 shadow-2xl">
                        <div className="flex items-start gap-3">
                            <AlertCircle
                                size={18}
                                className="mt-0.5 shrink-0 text-red-500"
                            />

                            <div>
                                <p className="text-sm font-bold text-slate-900">
                                    Patient details warning
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                    {detailsError}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setDetailsError(
                                        ""
                                    )
                                }
                                className="text-slate-400 hover:text-slate-700"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                )}
        </div>
    );
}
