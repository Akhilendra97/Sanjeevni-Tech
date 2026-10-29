import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Search,
  RefreshCw,
  Filter,
  X,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  CircleAlert,
  UserRound,
  Stethoscope,
  ClipboardList,
  ChevronDown,
} from "lucide-react";

import {
  getAppointments,
  updateAppointment,
  deleteAppointment,
} from "../../services/appointmentApi";

const STATUS_OPTIONS = [
  "all",
  "scheduled",
  "confirmed",
  "checked_in",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
];

const PRIORITY_OPTIONS = [
  "all",
  "normal",
  "urgent",
  "emergency",
];

const normalizeStatus = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

const formatStatus = (value) => {
  const text = String(value || "unknown").replace(/_/g, " ");
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) return "—";

  const parts = String(value).split(":");

  if (parts.length < 2) return value;

  const hour = Number(parts[0]);
  const minute = parts[1];

  if (Number.isNaN(hour)) return value;

  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute} ${suffix}`;
};

const isToday = (dateValue) => {
  if (!dateValue) return false;

  const today = new Date();
  const value = new Date(`${dateValue}T00:00:00`);

  return (
    value.getFullYear() === today.getFullYear() &&
    value.getMonth() === today.getMonth() &&
    value.getDate() === today.getDate()
  );
};

const getStatusClasses = (status) => {
  switch (normalizeStatus(status)) {
    case "completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "cancelled":
      return "bg-red-50 text-red-700 border-red-200";

    case "in_progress":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "checked_in":
      return "bg-cyan-50 text-cyan-700 border-cyan-200";

    case "confirmed":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";

    case "no_show":
      return "bg-orange-50 text-orange-700 border-orange-200";

    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

const getPriorityClasses = (priority) => {
  switch (normalizeStatus(priority)) {
    case "emergency":
      return "bg-red-50 text-red-700 border-red-200";

    case "urgent":
      return "bg-amber-50 text-amber-700 border-amber-200";

    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
};

const emptyEditForm = {
  appointment_date: "",
  appointment_time: "",
  reason: "",
  notes: "",
  cancellation_reason: "",
  status: "",
  priority: "",
};

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadAppointments = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data = await getAppointments();

      const sorted = [...data].sort((a, b) => {
        const aDate = `${a.appointment_date || ""} ${
          a.appointment_time || ""
        }`;

        const bDate = `${b.appointment_date || ""} ${
          b.appointment_time || ""
        }`;

        return aDate.localeCompare(bDate);
      });

      setAppointments(sorted);
    } catch (err) {
      console.error("Failed to load appointments:", err);

      const status = err?.response?.status;

      if (status === 401) {
        setError("Your session has expired. Please login again.");
      } else if (status === 403) {
        setError(
          "You do not have permission to view appointments."
        );
      } else {
        setError(
          err?.response?.data?.detail ||
            "Unable to load appointments right now."
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const filteredAppointments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return appointments.filter((appointment) => {
      const status = normalizeStatus(appointment.status);
      const priority = normalizeStatus(appointment.priority);

      const searchable = [
        appointment.appointment_number,
        appointment.patient_id,
        appointment.doctor_id,
        appointment.reason,
        appointment.notes,
        status,
        priority,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchable.includes(query);

      const matchesStatus =
        statusFilter === "all" || status === statusFilter;

      const matchesPriority =
        priorityFilter === "all" ||
        priority === priorityFilter;

      const matchesDate =
        !dateFilter ||
        appointment.appointment_date === dateFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesDate
      );
    });
  }, [
    appointments,
    search,
    statusFilter,
    priorityFilter,
    dateFilter,
  ]);

  const stats = useMemo(() => {
    const today = appointments.filter((item) =>
      isToday(item.appointment_date)
    );

    return {
      total: appointments.length,
      today: today.length,
      pending: appointments.filter((item) =>
        ["scheduled", "confirmed"].includes(
          normalizeStatus(item.status)
        )
      ).length,
      completed: appointments.filter(
        (item) => normalizeStatus(item.status) === "completed"
      ).length,
    };
  }, [appointments]);

  const openDetails = (appointment) => {
    setSelectedAppointment(appointment);
  };

  const openEdit = (appointment) => {
    setSelectedAppointment(null);
    setEditingAppointment(appointment);

    setEditForm({
      appointment_date: appointment.appointment_date || "",
      appointment_time: appointment.appointment_time
        ? String(appointment.appointment_time).slice(0, 5)
        : "",
      reason: appointment.reason || "",
      notes: appointment.notes || "",
      cancellation_reason:
        appointment.cancellation_reason || "",
      status: normalizeStatus(appointment.status),
      priority: normalizeStatus(appointment.priority),
    });
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;

    setEditForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const saveAppointment = async (event) => {
    event.preventDefault();

    if (!editingAppointment) return;

    try {
      setSaving(true);
      setError("");

      const payload = {
        appointment_date: editForm.appointment_date,
        appointment_time: editForm.appointment_time
          ? `${editForm.appointment_time}:00`
          : undefined,
        reason: editForm.reason || null,
        notes: editForm.notes || null,
        cancellation_reason:
          editForm.cancellation_reason || null,
        status: editForm.status,
        priority: editForm.priority,
      };

      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      });

      const updated = await updateAppointment(
        editingAppointment.id,
        payload
      );

      setAppointments((current) =>
        current.map((item) =>
          item.id === updated.id ? updated : item
        )
      );

      setEditingAppointment(null);
      setEditForm(emptyEditForm);
    } catch (err) {
      console.error("Failed to update appointment:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to update this appointment."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (appointment) => {
    const confirmed = window.confirm(
      `Delete appointment ${appointment.appointment_number || `#${appointment.id}`}?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(appointment.id);
      setError("");

      await deleteAppointment(appointment.id);

      setAppointments((current) =>
        current.filter((item) => item.id !== appointment.id)
      );

      if (selectedAppointment?.id === appointment.id) {
        setSelectedAppointment(null);
      }
    } catch (err) {
      console.error("Failed to delete appointment:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to delete this appointment."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setDateFilter("");
  };

  const hasFilters =
    search ||
    statusFilter !== "all" ||
    priorityFilter !== "all" ||
    dateFilter;

  return (
    <div className="min-h-full bg-slate-50 px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-5">
        {/* HEADER */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-cyan-600">
              <CalendarDays size={17} />
              Clinical Operations
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Appointments
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Review and manage your clinical appointments.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadAppointments(true)}
            disabled={refreshing}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <CircleAlert
              size={19}
              className="mt-0.5 shrink-0"
            />

            <div className="flex-1">
              <p className="font-semibold">Something went wrong</p>
              <p className="mt-0.5">{error}</p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="rounded-lg p-1 hover:bg-red-100"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<ClipboardList size={20} />}
            label="Total Appointments"
            value={stats.total}
            description="All accessible appointments"
          />

          <StatCard
            icon={<CalendarDays size={20} />}
            label="Today's Appointments"
            value={stats.today}
            description="Scheduled for today"
          />

          <StatCard
            icon={<Clock3 size={20} />}
            label="Pending"
            value={stats.pending}
            description="Scheduled or confirmed"
          />

          <StatCard
            icon={<CheckCircle2 size={20} />}
            label="Completed"
            value={stats.completed}
            description="Completed consultations"
          />
        </div>

        {/* FILTER BAR */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Filter size={17} />
            Search & Filters
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_auto]">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search appointment, patient ID, reason..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100"
              />
            </div>

            <SelectField
              value={statusFilter}
              onChange={setStatusFilter}
              options={STATUS_OPTIONS}
              label="Status"
            />

            <SelectField
              value={priorityFilter}
              onChange={setPriorityFilter}
              options={PRIORITY_OPTIONS}
              label="Priority"
            />

            <input
              type="date"
              value={dateFilter}
              onChange={(event) =>
                setDateFilter(event.target.value)
              }
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100"
            />

            {hasFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <X size={16} />
                Clear
              </button>
            ) : (
              <div className="hidden xl:block" />
            )}
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">
                Appointment List
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Showing {filteredAppointments.length} of{" "}
                {appointments.length} appointments
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Stethoscope size={15} />
              Doctor workspace
            </div>
          </div>

          {loading ? (
            <LoadingState />
          ) : filteredAppointments.length === 0 ? (
            <EmptyState
              filtered={Boolean(hasFilters)}
              onClear={clearFilters}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1050px] w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <TableHead>Appointment</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead align="right">Actions</TableHead>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredAppointments.map((appointment) => (
                    <tr
                      key={appointment.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">
                          {appointment.appointment_number ||
                            `APT-${appointment.id}`}
                        </div>

                        <div className="mt-1 text-xs text-slate-400">
                          ID #{appointment.id}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                            <UserRound size={17} />
                          </div>

                          <div>
                            <div className="font-medium text-slate-800">
                              Patient #{appointment.patient_id}
                            </div>

                            <div className="text-xs text-slate-400">
                              Patient ID {appointment.patient_id}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-800">
                          {formatDate(
                            appointment.appointment_date
                          )}
                        </div>

                        <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                          <Clock3 size={13} />
                          {formatTime(
                            appointment.appointment_time
                          )}
                        </div>
                      </td>

                      <td className="max-w-[230px] px-5 py-4">
                        <p
                          className="truncate text-sm font-medium text-slate-700"
                          title={appointment.reason || ""}
                        >
                          {appointment.reason || "General consultation"}
                        </p>

                        {appointment.notes && (
                          <p
                            className="mt-1 truncate text-xs text-slate-400"
                            title={appointment.notes}
                          >
                            {appointment.notes}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                            appointment.status
                          )}`}
                        >
                          {formatStatus(appointment.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getPriorityClasses(
                            appointment.priority
                          )}`}
                        >
                          {formatStatus(
                            appointment.priority || "normal"
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <ActionButton
                            title="View details"
                            onClick={() =>
                              openDetails(appointment)
                            }
                          >
                            <Eye size={16} />
                          </ActionButton>

                          <ActionButton
                            title="Edit appointment"
                            onClick={() =>
                              openEdit(appointment)
                            }
                          >
                            <Pencil size={16} />
                          </ActionButton>

                          <ActionButton
                            title="Delete appointment"
                            danger
                            disabled={
                              deletingId === appointment.id
                            }
                            onClick={() =>
                              handleDelete(appointment)
                            }
                          >
                            <Trash2
                              size={16}
                              className={
                                deletingId === appointment.id
                                  ? "animate-pulse"
                                  : ""
                              }
                            />
                          </ActionButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* DETAILS MODAL */}
      {selectedAppointment && (
        <Modal
          title="Appointment Details"
          subtitle={
            selectedAppointment.appointment_number ||
            `Appointment #${selectedAppointment.id}`
          }
          onClose={() => setSelectedAppointment(null)}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailItem
              label="Appointment Number"
              value={
                selectedAppointment.appointment_number ||
                `#${selectedAppointment.id}`
              }
            />

            <DetailItem
              label="Patient"
              value={`Patient #${selectedAppointment.patient_id}`}
            />

            <DetailItem
              label="Doctor"
              value={selectedAppointment.doctor_name || selectedAppointment.doctor?.full_name || selectedAppointment.doctor?.user?.full_name || selectedAppointment.doctor?.name || "Doctor name unavailable"}
            />

            <DetailItem
              label="Date"
              value={formatDate(
                selectedAppointment.appointment_date
              )}
            />

            <DetailItem
              label="Time"
              value={formatTime(
                selectedAppointment.appointment_time
              )}
            />

            <DetailItem
              label="Status"
              value={formatStatus(
                selectedAppointment.status
              )}
            />

            <DetailItem
              label="Priority"
              value={formatStatus(
                selectedAppointment.priority || "normal"
              )}
            />

            <DetailItem
              label="Reason"
              value={
                selectedAppointment.reason ||
                "General consultation"
              }
            />

            <div className="sm:col-span-2">
              <DetailItem
                label="Notes"
                value={
                  selectedAppointment.notes ||
                  "No notes available."
                }
              />
            </div>

            {selectedAppointment.cancellation_reason && (
              <div className="sm:col-span-2">
                <DetailItem
                  label="Cancellation Reason"
                  value={
                    selectedAppointment.cancellation_reason
                  }
                />
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() =>
                openEdit(selectedAppointment)
              }
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700"
            >
              <Pencil size={16} />
              Edit
            </button>
          </div>
        </Modal>
      )}

      {/* EDIT MODAL */}
      {editingAppointment && (
        <Modal
          title="Edit Appointment"
          subtitle={
            editingAppointment.appointment_number ||
            `Appointment #${editingAppointment.id}`
          }
          onClose={() => {
            if (!saving) {
              setEditingAppointment(null);
              setEditForm(emptyEditForm);
            }
          }}
        >
          <form
            onSubmit={saveAppointment}
            className="space-y-5"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Appointment Date">
                <input
                  required
                  type="date"
                  name="appointment_date"
                  value={editForm.appointment_date}
                  onChange={handleEditChange}
                  className={inputClass}
                />
              </FormField>

              <FormField label="Appointment Time">
                <input
                  required
                  type="time"
                  name="appointment_time"
                  value={editForm.appointment_time}
                  onChange={handleEditChange}
                  className={inputClass}
                />
              </FormField>

              <FormField label="Status">
                <SelectInput
                  name="status"
                  value={editForm.status}
                  onChange={handleEditChange}
                  options={STATUS_OPTIONS.filter(
                    (item) => item !== "all"
                  )}
                />
              </FormField>

              <FormField label="Priority">
                <SelectInput
                  name="priority"
                  value={editForm.priority}
                  onChange={handleEditChange}
                  options={PRIORITY_OPTIONS.filter(
                    (item) => item !== "all"
                  )}
                />
              </FormField>

              <div className="sm:col-span-2">
                <FormField label="Reason">
                  <input
                    type="text"
                    name="reason"
                    value={editForm.reason}
                    onChange={handleEditChange}
                    placeholder="Consultation reason"
                    className={inputClass}
                  />
                </FormField>
              </div>

              <div className="sm:col-span-2">
                <FormField label="Notes">
                  <textarea
                    name="notes"
                    value={editForm.notes}
                    onChange={handleEditChange}
                    rows={3}
                    placeholder="Clinical or appointment notes"
                    className={`${inputClass} h-auto py-3`}
                  />
                </FormField>
              </div>

              {editForm.status === "cancelled" && (
                <div className="sm:col-span-2">
                  <FormField label="Cancellation Reason">
                    <textarea
                      name="cancellation_reason"
                      value={
                        editForm.cancellation_reason
                      }
                      onChange={handleEditChange}
                      rows={2}
                      placeholder="Reason for cancellation"
                      className={`${inputClass} h-auto py-3`}
                    />
                  </FormField>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setEditingAppointment(null);
                  setEditForm(emptyEditForm);
                }}
                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && (
                  <RefreshCw
                    size={16}
                    className="animate-spin"
                  />
                )}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

function TableHead({ children, align = "left" }) {
  return (
    <th
      className={`px-5 py-3 text-${align} text-[11px] font-bold uppercase tracking-wider text-slate-500`}
    >
      {children}
    </th>
  );
}

function ActionButton({
  children,
  title,
  onClick,
  danger = false,
  disabled = false,
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-9 w-9 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-50 ${
        danger
          ? "border-slate-200 bg-white text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          : "border-slate-200 bg-white text-slate-500 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
      }`}
    >
      {children}
    </button>
  );
}

function SelectField({
  value,
  onChange,
  options,
  label,
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        aria-label={label}
        className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 pr-9 text-sm capitalize text-slate-700 outline-none focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option === "all"
              ? `All ${label}s`
              : formatStatus(option)}
          </option>
        ))}
      </select>

      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[330px] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cyan-50">
          <RefreshCw
            size={22}
            className="animate-spin text-cyan-600"
          />
        </div>

        <p className="mt-4 text-sm font-semibold text-slate-700">
          Loading appointments...
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Fetching clinical appointment data
        </p>
      </div>
    </div>
  );
}

function EmptyState({ filtered, onClear }) {
  return (
    <div className="flex min-h-[330px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <CalendarDays size={26} />
      </div>

      <h3 className="mt-4 font-semibold text-slate-800">
        {filtered
          ? "No matching appointments"
          : "No appointments found"}
      </h3>

      <p className="mt-1 max-w-md text-sm text-slate-500">
        {filtered
          ? "Try changing your search or filters."
          : "There are currently no appointments available for your account."}
      </p>

      {filtered && (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-cyan-700 hover:border-cyan-200 hover:bg-cyan-50"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}

function Modal({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {title}
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              {subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={19} />
          </button>
        </div>

        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </span>

      {children}
    </label>
  );
}

function SelectInput({
  name,
  value,
  onChange,
  options,
}) {
  return (
    <select
      name={name}
      value={value}
      onChange={onChange}
      className={inputClass}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {formatStatus(option)}
        </option>
      ))}
    </select>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100";

