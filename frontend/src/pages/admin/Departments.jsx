import "./Departments.css";
import React, { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  Edit3,
  Eye,
  Filter,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
  AlertCircle,
  Activity,
  Building,
} from "lucide-react";

import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getApiErrorMessage,
} from "../../services/departmentApi";

const EMPTY_FORM = {
  name: "",
  code: "",
  description: "",
  location: "",
  contact_number: "",
};

function normalizeDepartments(response) {
  if (Array.isArray(response)) return response;

  if (Array.isArray(response?.data)) return response.data;

  if (Array.isArray(response?.items)) return response.items;

  if (Array.isArray(response?.data?.items)) return response.data.items;

  return [];
}

function formatDate(value) {
  if (!value) return "â€”";

  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "â€”";
  }
}

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modal, setModal] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadDepartments = async (showRefresh = false) => {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getDepartments(false);
      setDepartments(normalizeDepartments(response));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => {
      setSuccess("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [success]);

  const stats = useMemo(() => {
    const total = departments.length;
    const active = departments.filter((d) => d.is_active !== false).length;
    const inactive = total - active;

    return {
      total,
      active,
      inactive,
    };
  }, [departments]);

  const filteredDepartments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return departments.filter((department) => {
      const matchesSearch =
        !query ||
        String(department.name || "").toLowerCase().includes(query) ||
        String(department.code || "").toLowerCase().includes(query) ||
        String(department.location || "").toLowerCase().includes(query);

      const isActive = department.is_active !== false;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && isActive) ||
        (statusFilter === "inactive" && !isActive);

      return matchesSearch && matchesStatus;
    });
  }, [departments, search, statusFilter]);

  const openCreate = () => {
    setError("");
    setSelectedDepartment(null);
    setForm(EMPTY_FORM);
    setModal("create");
  };

  const openEdit = (department) => {
    setError("");
    setSelectedDepartment(department);

    setForm({
      name: department.name || "",
      code: department.code || "",
      description: department.description || "",
      location: department.location || "",
      contact_number: department.contact_number || "",
      is_active: department.is_active !== false,
    });

    setModal("edit");
  };

  const openView = (department) => {
    setError("");
    setSelectedDepartment(department);
    setModal("view");
  };

  const closeModal = () => {
    if (saving || deleting) return;

    setModal(null);
    setSelectedDepartment(null);
    setForm(EMPTY_FORM);
    setError("");
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Department name is required.");
      return;
    }

    if (!form.code.trim()) {
      setError("Department code is required.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || null,
      location: form.location.trim() || null,
      contact_number: form.contact_number.trim() || null,
    };

    if (modal === "edit") {
      payload.is_active = form.is_active !== false;
    }

    try {
      setSaving(true);

      if (modal === "create") {
        await createDepartment(payload);
        setSuccess("Department created successfully.");
      } else {
        await updateDepartment(selectedDepartment.id, payload);
        setSuccess("Department updated successfully.");
      }

      closeModal();
      await loadDepartments(true);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (department) => {
    const confirmed = window.confirm(
      `Delete "${department.name}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError("");
      setSuccess("");

      await deleteDepartment(department.id);

      setSuccess("Department deleted successfully.");

      if (selectedDepartment?.id === department.id) {
        closeModal();
      }

      await loadDepartments(true);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div id="departments-light-root" className="min-h-[calc(100vh-76px)] bg-[#eef5fa] text-[#153653]">
      <div className="mx-auto w-full max-w-[1600px] px-5 py-6 sm:px-7 lg:px-8">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#08b9d8]">
              <Building2 size={16} />
              Hospital Operations
            </div>

            <h1 className="text-3xl font-black tracking-tight text-[#153653] sm:text-4xl">
              Departments
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#55718a] sm:text-base">
              Manage hospital departments, locations, contact details and
              operational status from one centralized workspace.
            </p>
          </div>

          <div className="departments-header-actions">

            <button
              type="button"
              onClick={() => loadDepartments(true)}
              disabled={refreshing}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#d8e6ef] bg-white px-4 text-sm font-bold text-[#55718a] shadow-sm transition hover:border-[#08b9d8] hover:text-[#153653] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#08b9d8] to-[#3478ed] px-5 text-sm font-bold text-[#183B56] shadow-lg shadow-blue-200/50 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <Plus size={18} />
              Add Department
            </button>

          </div>
        </div>

        {/* ======================================================
            ALERTS
        ====================================================== */}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <div className="font-medium">{error}</div>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-700">
            <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
            <div className="font-medium">{success}</div>
          </div>
        )}

        {/* ======================================================
            STATS
        ====================================================== */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

          <StatCard
            icon={Building2}
            label="Total Departments"
            value={stats.total}
            description="Registered departments"
            iconClass="bg-[#e8f8fb] text-[#08b9d8]"
          />

          <StatCard
            icon={Activity}
            label="Active"
            value={stats.active}
            description="Currently operational"
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <StatCard
            icon={AlertCircle}
            label="Inactive"
            value={stats.inactive}
            description="Currently disabled"
            iconClass="bg-amber-50 text-amber-600"
          />

        </div>

        {/* ======================================================
            DIRECTORY CARD
        ====================================================== */}

        <section className="overflow-hidden rounded-3xl border border-[#d8e6ef] bg-white shadow-[0_12px_35px_rgba(21,54,83,0.07)]">

          <div className="border-b border-[#e4edf3] px-5 py-5 sm:px-6">

            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef8fb] text-[#08b9d8]">
                    <Building size={19} />
                  </div>

                  <div>
                    <h2 className="text-lg font-extrabold text-[#153653]">
                      Department Directory
                    </h2>

                    <p className="text-xs text-[#8298aa]">
                      {filteredDepartments.length} department
                      {filteredDepartments.length === 1 ? "" : "s"} shown
                    </p>
                  </div>
                </div>
              </div>

              <div className="department-actions flex flex-row items-center justify-end gap-3 flex-wrap sm:flex-row">

                <div className="relative min-w-0 sm:w-72">
                  <Search
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8298aa]"
                  />

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search department..."
                    className="h-11 w-full rounded-xl border border-[#d8e6ef] bg-white pl-10 pr-4 text-sm font-medium text-[#153653] outline-none transition placeholder:text-[#9ab0bf] focus:border-[#08b9d8] focus:ring-4 focus:ring-[#08b9d8]/10"
                  />
                </div>

                <div className="relative">
                  <Filter
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8298aa]"
                  />

                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="h-11 w-full appearance-none rounded-xl border border-[#d8e6ef] bg-white pl-10 pr-10 text-sm font-semibold text-[#55718a] outline-none transition focus:border-[#08b9d8] focus:ring-4 focus:ring-[#08b9d8]/10 sm:w-40"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>

                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8298aa]"
                  />
                </div>

              </div>

            </div>
          </div>

          {/* ====================================================
              TABLE
          ==================================================== */}

          {loading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-16 animate-pulse rounded-xl bg-[#f0f6fa]"
                />
              ))}
            </div>
          ) : filteredDepartments.length === 0 ? (
            <EmptyDepartments
              search={search}
              onAdd={openCreate}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] table-fixed border-collapse">

                <thead>
                  <tr className="border-b border-[#e4edf3] bg-[#f8fbfd] text-left">
                    <th className="w-[31%] px-6 py-4 text-[11px] font-black uppercase tracking-wider text-[#8298aa]">
                      Department
                    </th>

                    <th className="w-[11%] px-6 py-4 text-[11px] font-black uppercase tracking-wider text-[#8298aa]">
                      Code
                    </th>

                    <th className="w-[15%] px-6 py-4 text-[11px] font-black uppercase tracking-wider text-[#8298aa]">
                      Location
                    </th>

                    <th className="w-[14%] px-6 py-4 text-[11px] font-black uppercase tracking-wider text-[#8298aa]">
                      Contact
                    </th>

                    <th className="w-[13%] px-6 py-4 text-[11px] font-black uppercase tracking-wider text-[#8298aa]">
                      Status
                    </th>

                    <th className="w-[16%] px-6 py-4 text-right text-[11px] font-black uppercase tracking-wider text-[#8298aa]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#edf3f7]">

                  {filteredDepartments.map((department) => {
                    const active = department.is_active !== false;

                    return (
                      <tr
                        key={department.id}
                        className="group transition hover:bg-[#f8fbfd]"
                      >
                        <td className="px-6 py-4 align-middle">
                          <div className="flex min-w-0 items-center justify-start gap-3">

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eef8fb] text-[#08b9d8]">
                              <Building2 size={20} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="break-words font-bold leading-6 text-[#153653]">
                                {department.name}
                              </div>

                              <div className="mt-0.5 max-w-[280px] truncate text-xs text-[#8298aa]">
                                {department.description || "No description provided"}
                              </div>
                            </div>

                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="rounded-lg bg-[#eef5fa] px-2.5 py-1.5 text-xs font-black tracking-wider text-[#3478ed]">
                            {department.code}
                          </span>
                        </td>

                        <td className="px-6 py-4 align-middle">
                          <div className="flex min-w-0 items-start gap-2 text-sm font-medium leading-5 text-[#55718a]">
                            <MapPin size={16} className="mt-0.5 shrink-0 text-[#8298aa]" />
                            <span className="min-w-0 break-words">{department.location || "Not specified"}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4 align-middle">
                          <div className="flex min-w-0 items-start gap-2 text-sm font-medium leading-5 text-[#55718a]">
                            <Phone size={15} className="mt-0.5 shrink-0 text-[#8298aa]" />
                            <span className="min-w-0 break-words">{department.contact_number || "Not provided"}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={
                              active
                                ? "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700"
                                : "inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600"
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
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <div className="flex items-center justify-end gap-1 whitespace-nowrap">

                            <ActionButton
                              title="View"
                              onClick={() => openView(department)}
                              icon={Eye}
                            />

                            <ActionButton
                              title="Edit"
                              onClick={() => openEdit(department)}
                              icon={Edit3}
                            />

                            <ActionButton
                              title="Delete"
                              danger
                              onClick={() => handleDelete(department)}
                              icon={Trash2}
                            />

                          </div>
                        </td>
                      </tr>
                    );
                  })}

                </tbody>
              </table>
            </div>
          )}

        </section>

      </div>

      {/* ========================================================
          CREATE / EDIT MODAL
          COMPLETELY LIGHT - SAME PATTERN AS ADD DOCTOR
      ======================================================== */}

      {(modal === "create" || modal === "edit") && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-[#071b2b]/65 px-4 py-6 backdrop-blur-md sm:px-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            className="my-auto flex max-h-[calc(100vh-48px)] w-full max-w-[1050px] flex-col overflow-hidden rounded-[28px] border border-[#d8e6ef] bg-white shadow-[0_30px_90px_rgba(21,54,83,0.28)]"
            onMouseDown={(event) => event.stopPropagation()}
          >

            {/* --------------------------------------------------
                MODAL HEADER
            -------------------------------------------------- */}

            <div className="shrink-0 border-b border-[#e2edf3] bg-white px-6 py-5 sm:px-8 sm:py-6">

              <div className="flex items-start justify-between gap-4">

                <div className="flex items-center gap-4">

                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#eaf9fc] text-[#08b9d8]">
                    <Building2 size={27} strokeWidth={1.9} />
                  </div>

                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-[#153653]">
                      {modal === "create"
                        ? "Add Department"
                        : "Edit Department"}
                    </h2>

                    <p className="mt-1 text-sm font-medium text-[#8298aa]">
                      {modal === "create"
                        ? "Create a new hospital department."
                        : "Update department information and operational status."}
                    </p>
                  </div>

                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f4f9fc] text-[#55718a] transition hover:bg-[#eaf3f8] hover:text-[#153653] disabled:opacity-50"
                >
                  <X size={21} />
                </button>

              </div>

            </div>

            {/* --------------------------------------------------
                MODAL BODY
            -------------------------------------------------- */}

            <form
              onSubmit={handleSubmit}
              className="min-h-0 overflow-y-auto bg-white px-6 py-6 sm:px-8 sm:py-7"
            >

              {error && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                {/* Department Name */}

                <Field label="Department Name" required>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    maxLength={100}
                    placeholder="e.g. Cardiology"
                    className="h-14 w-full rounded-2xl border border-[#d8e6ef] bg-white px-4 text-[15px] font-medium text-[#153653] outline-none placeholder:text-[#8ba2b3] transition focus:border-[#08b9d8] focus:ring-4 focus:ring-[#08b9d8]/10"
                  />
                </Field>

                {/* Department Code */}

                <Field label="Department Code" required>
                  <input
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    maxLength={20}
                    placeholder="e.g. CARD"
                    className="h-14 w-full rounded-2xl border border-[#d8e6ef] bg-white px-4 text-[15px] font-bold uppercase tracking-wide text-[#153653] outline-none placeholder:normal-case placeholder:font-medium placeholder:tracking-normal placeholder:text-[#8ba2b3] transition focus:border-[#08b9d8] focus:ring-4 focus:ring-[#08b9d8]/10"
                  />
                </Field>

                {/* Location */}

                <Field
                  label="Location"
                  icon={MapPin}
                >
                  <div className="relative">
                    <MapPin
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8298aa]"
                    />

                    <input
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      maxLength={255}
                      placeholder="e.g. Block A, Floor 2"
                      className="h-14 w-full rounded-2xl border border-[#d8e6ef] bg-white pl-11 pr-4 text-[15px] font-medium text-[#153653] outline-none placeholder:text-[#8ba2b3] transition focus:border-[#08b9d8] focus:ring-4 focus:ring-[#08b9d8]/10"
                    />
                  </div>
                </Field>

                {/* Contact */}

                <Field label="Contact Number">
                  <div className="relative">
                    <Phone
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8298aa]"
                    />

                    <input
                      name="contact_number"
                      value={form.contact_number}
                      onChange={handleChange}
                      maxLength={20}
                      placeholder="Department contact number"
                      className="h-14 w-full rounded-2xl border border-[#d8e6ef] bg-white pl-11 pr-4 text-[15px] font-medium text-[#153653] outline-none placeholder:text-[#8ba2b3] transition focus:border-[#08b9d8] focus:ring-4 focus:ring-[#08b9d8]/10"
                    />
                  </div>
                </Field>

              </div>

              {/* Description */}

              <div className="mt-5">
                <label className="mb-2.5 block text-xs font-black uppercase tracking-[0.12em] text-[#153653]">
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Briefly describe the department..."
                  className="min-h-[145px] w-full resize-y rounded-2xl border border-[#d8e6ef] bg-white px-4 py-3.5 text-[15px] font-medium leading-6 text-[#153653] outline-none placeholder:text-[#8ba2b3] transition focus:border-[#08b9d8] focus:ring-4 focus:ring-[#08b9d8]/10"
                />
              </div>

              {/* Active toggle only on edit */}

              {modal === "edit" && (
                <div className="mt-5 flex items-center justify-between rounded-2xl border border-[#d8e6ef] bg-[#f8fbfd] px-4 py-4">

                  <div>
                    <div className="text-sm font-bold text-[#153653]">
                      Department Status
                    </div>

                    <div className="mt-1 text-xs text-[#8298aa]">
                      Control whether this department is operational.
                    </div>
                  </div>

                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={form.is_active !== false}
                      onChange={handleChange}
                      className="peer sr-only"
                    />

                    <div className="h-7 w-12 rounded-full bg-[#cbd9e2] transition peer-checked:bg-[#08b9d8] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#08b9d8]/15 after:absolute after:left-[3px] after:top-[3px] after:h-[22px] after:w-[22px] after:rounded-full after:bg-white after:shadow-sm after:transition-all peer-checked:after:translate-x-5" />
                  </label>

                </div>
              )}

              {/* ------------------------------------------------
                  MODAL FOOTER
              ------------------------------------------------ */}

              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[#e2edf3] bg-white pt-5 sm:flex-row sm:items-center sm:justify-end">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-[#d8e6ef] bg-white px-6 text-sm font-bold text-[#55718a] transition hover:bg-[#f4f9fc] hover:text-[#153653] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-12 min-w-[190px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#08b9d8] to-[#3478ed] px-6 text-sm font-black text-[#183B56] shadow-lg shadow-blue-200/40 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={17} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={17} />
                      {modal === "create"
                        ? "Create Department"
                        : "Save Changes"}
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================
          VIEW MODAL
      ======================================================== */}

      {modal === "view" && selectedDepartment && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-[#071b2b]/65 px-4 py-6 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            className="my-auto w-full max-w-[700px] overflow-hidden rounded-[28px] border border-[#d8e6ef] bg-white shadow-[0_30px_90px_rgba(21,54,83,0.28)]"
            onMouseDown={(event) => event.stopPropagation()}
          >

            <div className="flex items-center justify-between border-b border-[#e2edf3] bg-white px-6 py-5 sm:px-7">

              <div className="department-actions flex flex-row items-center justify-end gap-3 flex-wrap">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf9fc] text-[#08b9d8]">
                  <Building2 size={23} />
                </div>

                <div>
                  <h2 className="text-xl font-black text-[#153653]">
                    Department Details
                  </h2>
                  <p className="text-sm text-[#8298aa]">
                    Complete department information
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4f9fc] text-[#55718a] hover:bg-[#eaf3f8] hover:text-[#153653]"
              >
                <X size={20} />
              </button>

            </div>

            <div className="bg-white p-6 sm:p-7">

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <Detail label="Department Name" value={selectedDepartment.name} />

                <Detail label="Department Code" value={selectedDepartment.code} />

                <Detail
                  label="Location"
                  value={selectedDepartment.location || "Not specified"}
                />

                <Detail
                  label="Contact Number"
                  value={selectedDepartment.contact_number || "Not provided"}
                />

                <Detail
                  label="Status"
                  value={
                    selectedDepartment.is_active !== false
                      ? "Active"
                      : "Inactive"
                  }
                />

                <Detail
                  label="Created"
                  value={formatDate(selectedDepartment.created_at)}
                />

              </div>

              <div className="mt-5 rounded-2xl border border-[#d8e6ef] bg-[#f8fbfd] p-5">
                <div className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-[#8298aa]">
                  Description
                </div>

                <p className="text-sm leading-7 text-[#55718a]">
                  {selectedDepartment.description ||
                    "No description provided."}
                </p>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="h-11 rounded-xl border border-[#d8e6ef] bg-white px-6 text-sm font-bold text-[#55718a] hover:bg-[#f4f9fc] hover:text-[#153653]"
                >
                  Close
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

/* ==============================================================
   SMALL COMPONENTS
============================================================== */

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  iconClass,
}) {
  return (
    <div className="rounded-2xl border border-[#d8e6ef] bg-white p-5 shadow-[0_8px_25px_rgba(21,54,83,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(21,54,83,0.08)]">

      <div className="flex items-start justify-between">

        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#8298aa]">
            {label}
          </div>

          <div className="mt-2 text-3xl font-black tracking-tight text-[#153653]">
            {value}
          </div>

          <div className="mt-1 text-xs font-medium text-[#8298aa]">
            {description}
          </div>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={20} />
        </div>

      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="mb-2.5 block text-xs font-black uppercase tracking-[0.12em] text-[#153653]">
        {label}
        {required && <span className="ml-1 text-[#08b9d8]">*</span>}
      </label>

      {children}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#d8e6ef] bg-white p-4">
      <div className="text-[10px] font-black uppercase tracking-[0.13em] text-[#8298aa]">
        {label}
      </div>

      <div className="mt-2 break-words text-sm font-bold text-[#153653]">
        {value}
      </div>
    </div>
  );
}

function ActionButton({ title, icon: Icon, onClick, danger = false }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={
        danger
          ? "flex h-9 w-9 items-center justify-center rounded-lg text-[#8298aa] transition hover:bg-red-50 hover:text-red-600"
          : "flex h-9 w-9 items-center justify-center rounded-lg text-[#8298aa] transition hover:bg-[#eef8fb] hover:text-[#08b9d8]"
      }
    >
      <Icon size={16} />
    </button>
  );
}

function EmptyDepartments({ search, onAdd }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center">

      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eef8fb] text-[#08b9d8]">
        <Building2 size={29} />
      </div>

      <h3 className="mt-5 text-lg font-black text-[#153653]">
        {search ? "No departments found" : "No departments yet"}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-[#8298aa]">
        {search
          ? "Try changing your search or status filter."
          : "Create your first hospital department to start managing the department directory."}
      </p>

      {!search && (
        <button
          type="button"
          onClick={onAdd}
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#08b9d8] to-[#3478ed] px-5 text-sm font-bold text-[#183B56] shadow-lg shadow-blue-200/40"
        >
          <Plus size={17} />
          Add Department
        </button>
      )}

    </div>
  );
}


