import { useCallback, useEffect, useState } from "react";
import {
    FlaskConical, RefreshCw, Save, ShieldCheck,
    Pencil, Plus, X, MapPin, Phone, Building2
} from "lucide-react";
import {
    getLaboratories,
    createLaboratory,
    updateLaboratory,
    getLaboratoryErrorMessage,
} from "../../services/laboratoryApi";

const emptyForm = {
    name: "",
    code: "",
    description: "",
    location: "",
    contact_number: "",
    is_active: true,
};

function toForm(lab) {
    return {
        name: lab?.name ?? "",
        code: lab?.code ?? "",
        description: lab?.description ?? "",
        location: lab?.location ?? "",
        contact_number: lab?.contact_number ?? "",
        is_active: lab?.is_active ?? true,
    };
}

export default function LaboratoryProfile() {
    const [laboratories, setLaboratories] = useState([]);
    const [selectedId, setSelectedId] = useState("");
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const selected = laboratories.find(
        (lab) => String(lab.id) === selectedId
    );

    const loadLaboratories = useCallback(async () => {
        setLoading(true);
        setError("");
        setNotice("");

        try {
            // getLaboratories already returns response.data.
            const result = await getLaboratories();
            const records = Array.isArray(result)
                ? result
                : Array.isArray(result?.items)
                    ? result.items
                    : Array.isArray(result?.data)
                        ? result.data
                        : [];

            setLaboratories(records);
            setSelectedId((current) => {
                if (records.some((lab) => String(lab.id) === current)) {
                    return current;
                }
                return records.length ? String(records[0].id) : "";
            });
        } catch (err) {
            setError(getLaboratoryErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadLaboratories();
    }, [loadLaboratories]);

    useEffect(() => {
        if (!editing) {
            setForm(toForm(selected));
        }
    }, [selected, editing]);

    const startCreate = () => {
        setError("");
        setNotice("");
        setSelectedId("");
        setForm(emptyForm);
        setEditing(true);
    };

    const startEdit = () => {
        if (!selected) return;
        setError("");
        setNotice("");
        setForm(toForm(selected));
        setEditing(true);
    };

    const cancelEdit = () => {
        setEditing(false);
        setError("");
        setForm(toForm(selected));
    };

    const changeField = (event) => {
        const { name, value, type, checked } = event.target;
        setForm((current) => ({
            ...current,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const saveChanges = async (event) => {
        event.preventDefault();
        setError("");
        setNotice("");

        const payload = {
            name: form.name.trim(),
            code: form.code.trim(),
            description: form.description.trim() || null,
            location: form.location.trim() || null,
            contact_number: form.contact_number.trim() || null,
            is_active: form.is_active,
        };

        if (payload.name.length < 2 || payload.code.length < 2) {
            setError("Laboratory name and code must contain at least 2 characters.");
            return;
        }

        setSaving(true);
        try {
            if (selectedId && selected) {
                await updateLaboratory(selected.id, payload);
                setNotice("Laboratory settings updated successfully.");
            } else {
                await createLaboratory(payload);
                setNotice("Laboratory created successfully.");
            }

            setEditing(false);
            await loadLaboratories();
        } catch (err) {
            setError(getLaboratoryErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    const fieldClass =
        "mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100 disabled:bg-slate-100";

    return (
        <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="rounded-2xl bg-cyan-50 p-4 text-cyan-700">
                            <FlaskConical size={28} />
                        </div>
                        <div>
                            <p className="text-xs font-bold tracking-[0.2em] text-cyan-700">
                                LABORATORY WORKSPACE
                            </p>
                            <h1 className="mt-1 text-2xl font-bold text-slate-900">
                                Profile &amp; Settings
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">
                                Manage laboratory details and contact information.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={loadLaboratories}
                            disabled={loading || saving}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                            <RefreshCw size={17} /> Refresh
                        </button>
                        {!editing && (
                            <button
                                type="button"
                                onClick={selected ? startEdit : startCreate}
                                disabled={loading || saving}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                                {selected
                                    ? <><Pencil size={17} /> Edit Details</>
                                    : <><Plus size={18} /> Create Laboratory</>}
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {error && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    <p className="font-semibold">Unable to complete the request</p>
                    <p className="mt-1">{error}</p>
                    <p className="mt-2 text-red-700">
                        If this is a permission error, ask an administrator to grant the required laboratory.manage permission.
                    </p>
                </div>
            )}

            {notice && (
                <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
                    {notice}
                </div>
            )}

            {editing ? (
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="rounded-xl bg-cyan-50 p-3 text-cyan-700">
                            <Building2 size={23} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">
                                {selected ? "Edit Laboratory Details" : "Create Laboratory"}
                            </h2>
                            <p className="text-sm text-slate-500">
                                Changes are sent to the hospital backend.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={saveChanges} className="space-y-5">
                        <div className="grid gap-5 md:grid-cols-2">
                            <label className="block text-sm font-semibold text-slate-700">
                                Laboratory Name *
                                <input
                                    className={fieldClass}
                                    name="name"
                                    value={form.name}
                                    onChange={changeField}
                                    minLength={2}
                                    maxLength={150}
                                    required
                                    disabled={saving}
                                    placeholder="Enter laboratory name"
                                />
                            </label>
                            <label className="block text-sm font-semibold text-slate-700">
                                Laboratory Code *
                                <input
                                    className={fieldClass}
                                    name="code"
                                    value={form.code}
                                    onChange={changeField}
                                    minLength={2}
                                    maxLength={50}
                                    required
                                    disabled={saving}
                                    placeholder="Enter unique laboratory code"
                                />
                            </label>
                            <label className="block text-sm font-semibold text-slate-700">
                                <span className="inline-flex items-center gap-2">
                                    <MapPin size={15} /> Location
                                </span>
                                <input
                                    className={fieldClass}
                                    name="location"
                                    value={form.location}
                                    onChange={changeField}
                                    maxLength={255}
                                    disabled={saving}
                                    placeholder="Building, floor or address"
                                />
                            </label>
                            <label className="block text-sm font-semibold text-slate-700">
                                <span className="inline-flex items-center gap-2">
                                    <Phone size={15} /> Contact Number
                                </span>
                                <input
                                    className={fieldClass}
                                    name="contact_number"
                                    type="tel"
                                    value={form.contact_number}
                                    onChange={changeField}
                                    maxLength={20}
                                    disabled={saving}
                                    placeholder="Laboratory contact number"
                                />
                            </label>
                        </div>

                        <label className="block text-sm font-semibold text-slate-700">
                            Description
                            <textarea
                                className={fieldClass}
                                name="description"
                                value={form.description}
                                onChange={changeField}
                                rows={3}
                                disabled={saving}
                                placeholder="Describe the laboratory or its services"
                            />
                        </label>

                        <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
                            <input
                                type="checkbox"
                                name="is_active"
                                checked={form.is_active}
                                onChange={changeField}
                                disabled={saving}
                                className="h-4 w-4 accent-cyan-700"
                            />
                            <span>
                                <span className="block font-semibold text-slate-800">
                                    Laboratory active
                                </span>
                                <span className="text-sm text-slate-500">
                                    Mark this laboratory as active in the system.
                                </span>
                            </span>
                        </label>

                        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
                            <button
                                type="button"
                                onClick={cancelEdit}
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                                <X size={17} /> Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                                <Save size={17} />
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </section>
            ) : (
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                    <div className="mb-6 flex items-center gap-3">
                        <ShieldCheck className="text-cyan-700" size={25} />
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                Laboratory Information
                            </h2>
                            <p className="text-sm text-slate-500">
                                Current details from the database.
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <p className="py-10 text-center text-slate-500">
                            Loading laboratory information...
                        </p>
                    ) : laboratories.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center">
                            <FlaskConical className="mx-auto mb-3 text-slate-400" size={36} />
                            <h3 className="font-semibold text-slate-900">
                                No laboratory record is registered yet
                            </h3>
                            <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
                                Create the official laboratory record to configure its name, code, location and contact details. Your account must have permission to manage laboratories.
                            </p>
                            <button
                                type="button"
                                onClick={startCreate}
                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                            >
                                <Plus size={18} /> Create Laboratory
                            </button>
                        </div>
                    ) : (
                        <>
                            {laboratories.length > 1 && (
                                <label className="mb-5 block max-w-md text-sm font-semibold text-slate-700">
                                    Select Laboratory
                                    <select
                                        className={fieldClass}
                                        value={selectedId}
                                        onChange={(event) => setSelectedId(event.target.value)}
                                    >
                                        {laboratories.map((lab) => (
                                            <option key={lab.id} value={String(lab.id)}>
                                                {lab.name} ({lab.code})
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            )}

                            {selected && (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {[
                                        ["Laboratory Name", selected.name],
                                        ["Laboratory Code", selected.code],
                                        ["Location", selected.location],
                                        ["Contact Number", selected.contact_number],
                                        ["Description", selected.description],
                                        ["Status", selected.is_active ? "Active" : "Inactive"],
                                    ].map(([label, value]) => (
                                        <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                {label}
                                            </p>
                                            <p className="mt-2 break-words font-semibold text-slate-900">
                                                {value == null || value === "" ? "Not provided" : String(value)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </section>
            )}
        </div>
    );
}
