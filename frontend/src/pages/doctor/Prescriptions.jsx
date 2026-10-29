import DocumentPdfActions from "../../components/pdf/DocumentPdfActions";
import React, { useEffect, useMemo, useState } from "react";
import {
    CalendarDays,
    ChevronDown,
    ClipboardList,
    Edit3,
    Eye,
    FileText,
    Plus,
    RefreshCw,
    Search,
    Stethoscope,
    Trash2,
    UserRound,
    X,
} from "lucide-react";

import api from "../../services/api";

import {
    createPrescription,
    deletePrescription,
    listPrescriptions,
    updatePrescription,
} from "../../services/prescriptionsApi";

const EMPTY_FORM = {
    prescription_number: "",
    patient_id: "",
    doctor_id: "",
    prescription_date: new Date()
        .toISOString()
        .slice(0, 10),
    diagnosis: "",
    medicines: "",
    instructions: "",
    duration: "",
    follow_up_date: "",
    notes: "",
};

function formatDate(value) {
    if (!value) return "—";

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function getErrorMessage(error) {
    return (
        error?.response?.data?.detail ||
        error?.message ||
        "Something went wrong."
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
}) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                {label}
                {required && (
                    <span className="ml-1 text-red-500">*</span>
                )}
            </span>

            <input
                type={type}
                value={value}
                onChange={(event) =>
                    onChange(event.target.value)
                }
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:bg-slate-100"
            />
        </label>
    );
}

function TextArea({
    label,
    value,
    onChange,
    placeholder = "",
    required = false,
}) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                {label}
                {required && (
                    <span className="ml-1 text-red-500">*</span>
                )}
            </span>

            <textarea
                value={value}
                onChange={(event) =>
                    onChange(event.target.value)
                }
                placeholder={placeholder}
                required={required}
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
            />
        </label>
    );
}

function StatCard({
    label,
    value,
    icon: Icon,
    description,
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {label}
                    </p>

                    <p className="mt-2 text-3xl font-black text-slate-900">
                        {value}
                    </p>

                    <p className="mt-1 text-xs font-medium text-slate-500">
                        {description}
                    </p>
                </div>

                <div className="rounded-xl bg-cyan-50 p-3 text-cyan-600">
                    <Icon size={21} />
                </div>
            </div>
        </div>
    );
}

export default function Prescriptions() {
    const [prescriptions, setPrescriptions] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const doctorName = (item) => item?.doctor_name || item?.doctor?.full_name || item?.doctor?.name || doctors.find((d) => Number(d.id) === Number(item?.doctor_id))?.full_name || doctors.find((d) => Number(d.id) === Number(item?.doctor_id))?.user?.full_name || `Doctor #${item?.doctor_id ?? "—"}`;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");

    const [modalOpen, setModalOpen] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);

    const loadPrescriptions = async () => {
        setLoading(true);
        setError("");

        try {
            const data = await listPrescriptions();
            setPrescriptions(
                Array.isArray(data) ? data : []
            );
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPrescriptions();
        api.get("/doctors").then((r) => setDoctors(Array.isArray(r.data) ? r.data : r.data?.items || [])).catch(() => setDoctors([]));
    }, []);

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();

        return prescriptions.filter((item) => {
            const matchesSearch =
                !query ||
                String(item.prescription_number || "")
                    .toLowerCase()
                    .includes(query) ||
                String(item.patient_id || "")
                    .toLowerCase()
                    .includes(query) ||
                String(item.doctor_id || "")
                    .toLowerCase()
                    .includes(query) ||
                String(item.diagnosis || "")
                    .toLowerCase()
                    .includes(query) ||
                String(item.medicines || "")
                    .toLowerCase()
                    .includes(query);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const followUp = item.follow_up_date
                ? new Date(
                      `${item.follow_up_date}T00:00:00`
                  )
                : null;

            let matchesFilter = true;

            if (filter === "follow-up") {
                matchesFilter =
                    followUp &&
                    followUp >= today;
            }

            if (filter === "past-follow-up") {
                matchesFilter =
                    followUp &&
                    followUp < today;
            }

            return matchesSearch && matchesFilter;
        });
    }, [prescriptions, search, filter]);

    const openCreate = () => {
        setEditingId(null);
        setForm({
            ...EMPTY_FORM,
            prescription_date: new Date()
                .toISOString()
                .slice(0, 10),
        });
        setError("");
        setModalOpen(true);
    };

    const openEdit = (item) => {
        setEditingId(item.id);

        setForm({
            prescription_number:
                item.prescription_number || "",
            patient_id:
                item.patient_id?.toString() || "",
            doctor_id:
                item.doctor_id?.toString() || "",
            prescription_date:
                item.prescription_date || "",
            diagnosis: item.diagnosis || "",
            medicines: item.medicines || "",
            instructions: item.instructions || "",
            duration: item.duration || "",
            follow_up_date:
                item.follow_up_date || "",
            notes: item.notes || "",
        });

        setError("");
        setModalOpen(true);
    };

    const openView = (item) => {
        setSelected(item);
        setViewOpen(true);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");

        try {
            if (!editingId) {
                await createPrescription({
                    prescription_number:
                        form.prescription_number.trim(),
                    patient_id: Number(form.patient_id),
                    doctor_id: Number(form.doctor_id),
                    prescription_date:
                        form.prescription_date,
                    diagnosis:
                        form.diagnosis.trim() || null,
                    medicines:
                        form.medicines.trim(),
                    instructions:
                        form.instructions.trim() || null,
                    duration:
                        form.duration.trim() || null,
                    follow_up_date:
                        form.follow_up_date || null,
                    notes:
                        form.notes.trim() || null,
                });
            } else {
                await updatePrescription(
                    editingId,
                    {
                        prescription_date:
                            form.prescription_date,
                        diagnosis:
                            form.diagnosis.trim() || null,
                        medicines:
                            form.medicines.trim() || null,
                        instructions:
                            form.instructions.trim() || null,
                        duration:
                            form.duration.trim() || null,
                        follow_up_date:
                            form.follow_up_date || null,
                        notes:
                            form.notes.trim() || null,
                    }
                );
            }

            setModalOpen(false);
            setEditingId(null);
            setForm(EMPTY_FORM);

            await loadPrescriptions();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (item) => {
        const confirmed = window.confirm(
            `Delete prescription ${item.prescription_number}? This action cannot be undone.`
        );

        if (!confirmed) return;

        setDeletingId(item.id);
        setError("");

        try {
            await deletePrescription(item.id);
            await loadPrescriptions();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setDeletingId(null);
        }
    };

    const activeFollowUps = prescriptions.filter(
        (item) => {
            if (!item.follow_up_date) return false;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            return (
                new Date(
                    `${item.follow_up_date}T00:00:00`
                ) >= today
            );
        }
    ).length;

    return (
        <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* HEADER */}
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-600">
                            <ClipboardList size={15} />
                            Pharmacy
                        </div>

                        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
                            Prescriptions
                        </h1>

                        <p className="mt-1 text-sm font-medium text-slate-500">
                            Manage prescriptions received from doctors.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={loadPrescriptions}
                            disabled={loading}
                            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:text-cyan-700 disabled:opacity-60"
                        >
                            <RefreshCw
                                size={17}
                                className={
                                    loading
                                        ? "animate-spin"
                                        : ""
                                }
                            />
                            Refresh
                        </button>

                        <button
                            type="button"
                            onClick={openCreate}
                            className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5"
                        >
                            <Plus size={18} />
                            New Prescription
                        </button>
                    </div>
                </div>

                {/* ERROR */}
                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                        {error}
                    </div>
                )}

                {/* STATS */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <StatCard
                        label="Total prescriptions"
                        value={prescriptions.length}
                        icon={FileText}
                        description="All pharmacy prescriptions"
                    />

                    <StatCard
                        label="Upcoming follow-ups"
                        value={activeFollowUps}
                        icon={CalendarDays}
                        description="Follow-up dates from today"
                    />

                    <StatCard
                        label="Filtered records"
                        value={filtered.length}
                        icon={ClipboardList}
                        description="Current workspace result"
                    />
                </div>

                {/* TOOLBAR */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 lg:flex-row">
                        <div className="relative flex-1">
                            <Search
                                size={18}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                                placeholder="Search prescription number, patient ID, doctor ID, diagnosis..."
                                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium text-slate-800 outline-none focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                            />
                        </div>

                        <div className="relative min-w-[210px]">
                            <select
                                value={filter}
                                onChange={(event) =>
                                    setFilter(
                                        event.target.value
                                    )
                                }
                                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm font-bold text-slate-700 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                            >
                                <option value="all">
                                    All prescriptions
                                </option>
                                <option value="follow-up">
                                    Upcoming follow-ups
                                </option>
                                <option value="past-follow-up">
                                    Past follow-ups
                                </option>
                            </select>

                            <ChevronDown
                                size={17}
                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                        </div>
                    </div>
                </div>

                {/* TABLE */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-[1050px] w-full">
                            <thead className="border-b border-slate-200 bg-slate-50">
                                <tr>
                                    {[
                                        "Prescription",
                                        "Patient",
                                        "Doctor",
                                        "Date",
                                        "Diagnosis",
                                        "Follow-up",
                                        "Actions",
                                    ].map((heading) => (
                                        <th
                                            key={heading}
                                            className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider text-slate-400"
                                        >
                                            {heading}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-5 py-16 text-center"
                                        >
                                            <RefreshCw
                                                size={24}
                                                className="mx-auto animate-spin text-cyan-500"
                                            />

                                            <p className="mt-3 text-sm font-semibold text-slate-500">
                                                Loading prescriptions...
                                            </p>
                                        </td>
                                    </tr>
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-5 py-16 text-center"
                                        >
                                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                                <FileText
                                                    size={24}
                                                />
                                            </div>

                                            <p className="mt-3 text-sm font-bold text-slate-700">
                                                No prescriptions found
                                            </p>

                                            <p className="mt-1 text-xs font-medium text-slate-400">
                                                Try changing your search or filter.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="transition hover:bg-slate-50/80"
                                        >
                                            <td className="px-5 py-4">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openView(
                                                            item
                                                        )
                                                    }
                                                    className="font-black text-cyan-700 hover:text-cyan-900"
                                                >
                                                    {
                                                        item.prescription_number
                                                    }
                                                </button>

                                                <p className="mt-1 text-xs font-medium text-slate-400">
                                                    ID #{item.id}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                                                        <UserRound
                                                            size={15}
                                                        />
                                                    </div>

                                                    <span className="text-sm font-bold text-slate-700">
                                                        Patient #
                                                        {
                                                            item.patient_id
                                                        }
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="rounded-lg bg-cyan-50 p-2 text-cyan-600">
                                                        <Stethoscope
                                                            size={15}
                                                        />
                                                    </div>

                                                    <span className="text-sm font-bold text-slate-700">
                                                        {doctorName(item)}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 text-sm font-semibold text-slate-600">
                                                {formatDate(
                                                    item.prescription_date
                                                )}
                                            </td>

                                            <td className="max-w-[220px] px-5 py-4">
                                                <p className="truncate text-sm font-semibold text-slate-700">
                                                    {item.diagnosis ||
                                                        "No diagnosis recorded"}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4">
                                                {item.follow_up_date ? (
                                                    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                                                        {formatDate(
                                                            item.follow_up_date
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm font-medium text-slate-400">
                                                        —
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex flex-wrap items-center gap-1">
                                                    <DocumentPdfActions title={`Prescription ${item.prescription_number || item.id}`} record={{ prescription_number: item.prescription_number, patient_id: item.patient_id, doctor_name: doctorName(item), prescription_date: item.prescription_date, diagnosis: item.diagnosis, medicines: item.medicines, instructions: item.instructions, duration: item.duration, follow_up_date: item.follow_up_date, notes: item.notes }} />
                                                    <button
                                                        type="button"
                                                        title="View"
                                                        onClick={() =>
                                                            openView(
                                                                item
                                                            )
                                                        }
                                                        className="rounded-lg p-2 text-slate-500 transition hover:bg-cyan-50 hover:text-cyan-700"
                                                    >
                                                        <Eye
                                                            size={17}
                                                        />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        title="Edit"
                                                        onClick={() =>
                                                            openEdit(
                                                                item
                                                            )
                                                        }
                                                        className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-700"
                                                    >
                                                        <Edit3
                                                            size={17}
                                                        />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        title="Delete"
                                                        disabled={
                                                            deletingId ===
                                                            item.id
                                                        }
                                                        onClick={() =>
                                                            handleDelete(
                                                                item
                                                            )
                                                        }
                                                        className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                                    >
                                                        <Trash2
                                                            size={17}
                                                        />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* CREATE / EDIT MODAL */}
            {modalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
                    <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
                            <div>
                                <h2 className="text-xl font-black text-slate-900">
                                    {editingId
                                        ? "Edit Prescription"
                                        : "New Prescription"}
                                </h2>

                                <p className="mt-1 text-xs font-medium text-slate-500">
                                    {editingId
                                        ? "Update prescription details."
                                        : "Create a prescription record."}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setModalOpen(false)
                                }
                                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-5 p-6"
                        >
                            <div className="grid gap-4 md:grid-cols-3">
                                <Field
                                    label="Prescription Number"
                                    value={
                                        form.prescription_number
                                    }
                                    onChange={(value) =>
                                        setForm((current) => ({
                                            ...current,
                                            prescription_number:
                                                value,
                                        }))
                                    }
                                    placeholder="RX-2026-001"
                                    required
                                    disabled={Boolean(
                                        editingId
                                    )}
                                />

                                <Field
                                    label="Patient ID"
                                    type="number"
                                    value={form.patient_id}
                                    onChange={(value) =>
                                        setForm((current) => ({
                                            ...current,
                                            patient_id: value,
                                        }))
                                    }
                                    placeholder="Patient ID"
                                    required
                                    disabled={Boolean(
                                        editingId
                                    )}
                                />

                                <Field
                                    label="Doctor ID"
                                    type="number"
                                    value={form.doctor_id}
                                    onChange={(value) =>
                                        setForm((current) => ({
                                            ...current,
                                            doctor_id: value,
                                        }))
                                    }
                                    placeholder="Doctor ID"
                                    required
                                    disabled={Boolean(
                                        editingId
                                    )}
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <Field
                                    label="Prescription Date"
                                    type="date"
                                    value={
                                        form.prescription_date
                                    }
                                    onChange={(value) =>
                                        setForm((current) => ({
                                            ...current,
                                            prescription_date:
                                                value,
                                        }))
                                    }
                                    required
                                />

                                <Field
                                    label="Follow-up Date"
                                    type="date"
                                    value={
                                        form.follow_up_date
                                    }
                                    onChange={(value) =>
                                        setForm((current) => ({
                                            ...current,
                                            follow_up_date:
                                                value,
                                        }))
                                    }
                                />
                            </div>

                            <Field
                                label="Diagnosis"
                                value={form.diagnosis}
                                onChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        diagnosis: value,
                                    }))
                                }
                                placeholder="Diagnosis / clinical indication"
                            />

                            <TextArea
                                label="Medicines"
                                value={form.medicines}
                                onChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        medicines: value,
                                    }))
                                }
                                placeholder="Paracetamol 500mg - 1 tablet twice daily for 5 days&#10;Cetirizine 10mg - 1 tablet at night"
                                required
                            />

                            <div className="grid gap-4 md:grid-cols-2">
                                <Field
                                    label="Duration"
                                    value={form.duration}
                                    onChange={(value) =>
                                        setForm((current) => ({
                                            ...current,
                                            duration: value,
                                        }))
                                    }
                                    placeholder="5 days"
                                />

                                <TextArea
                                    label="Instructions"
                                    value={
                                        form.instructions
                                    }
                                    onChange={(value) =>
                                        setForm((current) => ({
                                            ...current,
                                            instructions:
                                                value,
                                        }))
                                    }
                                    placeholder="Take after meals..."
                                />
                            </div>

                            <TextArea
                                label="Notes"
                                value={form.notes}
                                onChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        notes: value,
                                    }))
                                }
                                placeholder="Additional notes..."
                            />

                            {error && (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                                    {error}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setModalOpen(false)
                                    }
                                    className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 disabled:opacity-60"
                                >
                                    {saving && (
                                        <RefreshCw
                                            size={16}
                                            className="animate-spin"
                                        />
                                    )}

                                    {editingId
                                        ? "Save Changes"
                                        : "Create Prescription"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* VIEW MODAL */}
            {viewOpen && selected && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-cyan-600">
                                    Prescription
                                </p>

                                <h2 className="mt-1 text-2xl font-black text-slate-900">
                                    {
                                        selected.prescription_number
                                    }
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setViewOpen(false)
                                }
                                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="grid gap-4 p-6 sm:grid-cols-2">
                            <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-xs font-bold uppercase text-slate-400">
                                    Patient
                                </p>

                                <p className="mt-1 font-black text-slate-800">
                                    Patient #
                                    {selected.patient_id}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-xs font-bold uppercase text-slate-400">
                                    Doctor
                                </p>

                                <p className="mt-1 font-black text-slate-800">
                                    {doctorName(selected)}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-xs font-bold uppercase text-slate-400">
                                    Prescription Date
                                </p>

                                <p className="mt-1 font-black text-slate-800">
                                    {formatDate(
                                        selected.prescription_date
                                    )}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-xs font-bold uppercase text-slate-400">
                                    Follow-up
                                </p>

                                <p className="mt-1 font-black text-slate-800">
                                    {formatDate(
                                        selected.follow_up_date
                                    )}
                                </p>
                            </div>

                            <div className="sm:col-span-2">
                                <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-400">
                                    Diagnosis
                                </p>

                                <p className="rounded-2xl border border-slate-100 bg-white p-4 text-sm font-medium leading-6 text-slate-700">
                                    {selected.diagnosis ||
                                        "No diagnosis recorded."}
                                </p>
                            </div>

                            <div className="sm:col-span-2">
                                <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-400">
                                    Medicines
                                </p>

                                <p className="whitespace-pre-wrap rounded-2xl border border-cyan-100 bg-cyan-50/50 p-4 text-sm font-semibold leading-7 text-slate-800">
                                    {selected.medicines}
                                </p>
                            </div>

                            <div className="sm:col-span-2">
                                <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-400">
                                    Instructions
                                </p>

                                <p className="whitespace-pre-wrap rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-700">
                                    {selected.instructions ||
                                        "No special instructions."}
                                </p>
                            </div>

                            {selected.duration && (
                                <div className="sm:col-span-2">
                                    <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-400">
                                        Duration
                                    </p>

                                    <p className="text-sm font-bold text-slate-700">
                                        {selected.duration}
                                    </p>
                                </div>
                            )}

                            {selected.notes && (
                                <div className="sm:col-span-2">
                                    <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-400">
                                        Notes
                                    </p>

                                    <p className="whitespace-pre-wrap text-sm font-medium leading-6 text-slate-700">
                                        {selected.notes}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end border-t border-slate-100 px-6 py-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setViewOpen(false);
                                    openEdit(selected);
                                }}
                                className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white hover:bg-slate-800"
                            >
                                <Edit3 size={16} />
                                Edit Prescription
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
