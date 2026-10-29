import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  FlaskConical,
  HeartPulse,
  RefreshCw,
  Stethoscope,
  Users,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { loadDoctorDashboard } from "../../services/doctorDashboardApi";
import { getMyDoctorProfile } from "../../services/doctorApi";

const getValue = (obj, keys, fallback = "") => {
  for (const key of keys) {
    if (
      obj &&
      obj[key] !== undefined &&
      obj[key] !== null &&
      obj[key] !== ""
    ) {
      return obj[key];
    }
  }
  return fallback;
};

const toDate = (value) => {
  if (!value) return null;

  const date = new Date(value);

  if (!Number.isNaN(date.getTime())) return date;

  return null;
};

const getDateValue = (item) =>
  getValue(item, [
    "appointment_date",
    "scheduled_date",
    "date",
    "visit_date",
    "created_at",
  ]);

const getStatus = (item) =>
  String(
    getValue(item, ["status", "appointment_status", "payment_status"], "")
  ).toLowerCase();

const getPatientName = (item) =>
  getValue(
    item,
    [
      "patient_name",
      "patient_full_name",
      "full_name",
      "name",
      "patientName",
    ],
    "Patient"
  );

const formatDate = (value) => {
  const date = toDate(value);
  if (!date) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) return "";

  if (typeof value === "string" && /^\d{1,2}:\d{2}/.test(value)) {
    return value.slice(0, 5);
  }

  const date = toDate(value);
  if (!date) return "";

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const isToday = (value) => {
  const date = toDate(value);
  if (!date) return false;

  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

const statusClass = (status) => {
  if (["completed", "confirmed", "active", "done"].includes(status)) {
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }

  if (["cancelled", "canceled", "rejected"].includes(status)) {
    return "bg-rose-50 text-rose-700 border-rose-100";
  }

  if (["pending", "scheduled", "requested"].includes(status)) {
    return "bg-amber-50 text-amber-700 border-amber-100";
  }

  return "bg-slate-50 text-slate-600 border-slate-100";
};

const titleCase = (value) => {
  if (!value) return "Pending";

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const StatCard = ({ icon: Icon, label, value, description, iconClass }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          {value}
        </p>
        <p className="mt-1 text-xs text-slate-400">{description}</p>
      </div>

      <div className={`rounded-xl p-3 ${iconClass}`}>
        <Icon size={21} />
      </div>
    </div>
  </div>
);

const SectionHeader = ({ icon: Icon, title, subtitle, action }) => (
  <div className="mb-4 flex items-center justify-between gap-3">
    <div className="flex items-center gap-3">
      <div className="rounded-xl bg-cyan-50 p-2 text-cyan-600">
        <Icon size={18} />
      </div>

      <div>
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        {subtitle && (
          <p className="text-xs text-slate-500">{subtitle}</p>
        )}
      </div>
    </div>

    {action}
  </div>
);

export default function DoctorDashboard() {
  const [data, setData] = useState({
    appointments: [],
    patients: [],
    labReports: [],
    prescriptions: [],
    schedules: [],
    errors: [],
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const result = await loadDoctorDashboard();
      setData(result);

      if (result.errors.length === 5) {
        setError(
          "Unable to load Doctor Dashboard data. Please check your session and backend connection."
        );
      }
    } catch (err) {
      setError(err?.message || "Unable to load dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const todayAppointments = useMemo(
    () =>
      data.appointments.filter((item) =>
        isToday(getDateValue(item))
      ),
    [data.appointments]
  );

  const completedAppointments = useMemo(
    () =>
      data.appointments.filter((item) =>
        ["completed", "done"].includes(getStatus(item))
      ),
    [data.appointments]
  );

  const pendingAppointments = useMemo(
    () =>
      data.appointments.filter((item) =>
        ["pending", "scheduled", "requested", "confirmed"].includes(
          getStatus(item)
        )
      ),
    [data.appointments]
  );

  const recentAppointments = useMemo(
    () =>
      [...data.appointments]
        .sort((a, b) => {
          const da = toDate(getDateValue(a))?.getTime() || 0;
          const db = toDate(getDateValue(b))?.getTime() || 0;
          return db - da;
        })
        .slice(0, 6),
    [data.appointments]
  );

  const recentPatients = useMemo(
    () =>
      [...data.patients]
        .sort((a, b) => {
          const da = toDate(
            getValue(a, ["created_at", "registration_date", "date"])
          )?.getTime() || 0;

          const db = toDate(
            getValue(b, ["created_at", "registration_date", "date"])
          )?.getTime() || 0;

          return db - da;
        })
        .slice(0, 5),
    [data.patients]
  );

  const pendingLabs = useMemo(
    () =>
      data.labReports.filter((item) =>
        ["pending", "requested", "processing", "in_progress"].includes(
          getStatus(item)
        )
      ),
    [data.labReports]
  );

  const [doctorProfileName, setDoctorProfileName] = useState("");

  useEffect(() => {
    let active = true;
    getMyDoctorProfile()
      .then((profile) => {
        if (active) {
          setDoctorProfileName(
            profile?.full_name || profile?.user?.full_name || ""
          );
        }
      })
      .catch(() => {
        // Fall back to the authenticated user cache if the profile endpoint is unavailable.
      });
    return () => {
      active = false;
    };
  }, []);

  const doctorName = useMemo(() => {
    if (doctorProfileName) return doctorProfileName;
    try {
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        const user = JSON.parse(storedUser);

        return (
          getValue(
            user,
            ["full_name", "fullName", "name", "username"],
            "Doctor"
          ) || "Doctor"
        );
      }
    } catch {
      // Ignore malformed local storage.
    }

    return "Doctor";
  }, [doctorProfileName]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl animate-pulse space-y-6">
          <div className="h-32 rounded-3xl bg-white" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-32 rounded-2xl bg-white"
              />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="h-96 rounded-2xl bg-white xl:col-span-2" />
            <div className="h-96 rounded-2xl bg-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 p-6 text-white shadow-lg">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2 text-cyan-100">
                <Stethoscope size={18} />
                <span className="text-xs font-bold uppercase tracking-[0.18em]">
                  Doctor Workspace
                </span>
              </div>

              <h1 className="text-2xl font-bold sm:text-3xl">
                Good day, {doctorName}
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-blue-100">
                Review your appointments, patients, clinical activity and
                pending work from one workspace.
              </p>
            </div>

            <button
              type="button"
              onClick={() => load(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </section>

        {/* Error / partial API notice */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
            <AlertCircle className="mt-0.5 shrink-0" size={19} />
            <div>
              <p className="font-semibold">Dashboard data unavailable</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
        )}

        {!error && data.errors.length > 0 && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
            <AlertCircle className="mt-0.5 shrink-0" size={19} />
            <div>
              <p className="font-semibold">
                Some clinical data could not be loaded
              </p>
              <p className="mt-1 text-sm">
                Available backend data is still displayed below.
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={CalendarDays}
            label="Today's Appointments"
            value={todayAppointments.length}
            description="Appointments scheduled today"
            iconClass="bg-cyan-50 text-cyan-600"
          />

          <StatCard
            icon={Users}
            label="Total Patients"
            value={data.patients.length}
            description="Patients available to your workspace"
            iconClass="bg-blue-50 text-blue-600"
          />

          <StatCard
            icon={Clock3}
            label="Pending Appointments"
            value={pendingAppointments.length}
            description="Scheduled or awaiting action"
            iconClass="bg-amber-50 text-amber-600"
          />

          <StatCard
            icon={CheckCircle2}
            label="Completed Consultations"
            value={completedAppointments.length}
            description="Completed appointment records"
            iconClass="bg-emerald-50 text-emerald-600"
          />
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

          {/* Appointments */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
            <SectionHeader
              icon={CalendarDays}
              title="Recent Appointments"
              subtitle="Latest appointment records from the hospital system"
              action={
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {data.appointments.length} records
                </span>
              }
            />

            {recentAppointments.length === 0 ? (
              <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center">
                <CalendarDays className="mb-3 text-slate-300" size={30} />
                <p className="font-semibold text-slate-600">
                  No appointment records
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Appointment data will appear here when available.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                      <th className="pb-3 font-semibold">Patient</th>
                      <th className="pb-3 font-semibold">Date</th>
                      <th className="pb-3 font-semibold">Time</th>
                      <th className="pb-3 font-semibold">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentAppointments.map((item, index) => {
                      const status = getStatus(item);

                      return (
                        <tr
                          key={
                            item.id ||
                            item.appointment_id ||
                            `${getPatientName(item)}-${index}`
                          }
                          className="border-b border-slate-50 last:border-0"
                        >
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-50 text-sm font-bold text-cyan-700">
                                {getPatientName(item)
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>
                                <p className="text-sm font-semibold text-slate-800">
                                  {getPatientName(item)}
                                </p>

                                <p className="text-xs text-slate-400">
                                  {getValue(
                                    item,
                                    ["appointment_number", "appointment_no"],
                                    "Appointment"
                                  )}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 text-sm text-slate-600">
                            {formatDate(getDateValue(item))}
                          </td>

                          <td className="py-4 text-sm text-slate-600">
                            {formatTime(
                              getValue(item, [
                                "appointment_time",
                                "scheduled_time",
                                "time",
                              ])
                            ) || "—"}
                          </td>

                          <td className="py-4">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(
                                status
                              )}`}
                            >
                              {titleCase(status)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Today's schedule */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeader
              icon={Clock3}
              title="Today's Schedule"
              subtitle="Appointments scheduled for today"
            />

            {todayAppointments.length === 0 ? (
              <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center">
                <Clock3 className="mb-3 text-slate-300" size={30} />
                <p className="font-semibold text-slate-600">
                  No appointments today
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Your current schedule is clear.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayAppointments.slice(0, 6).map((item, index) => {
                  const status = getStatus(item);

                  return (
                    <div
                      key={item.id || index}
                      className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-white p-2 text-cyan-600 shadow-sm">
                            <HeartPulse size={17} />
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {getPatientName(item)}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500">
                              {formatTime(
                                getValue(item, [
                                  "appointment_time",
                                  "scheduled_time",
                                  "time",
                                ])
                              ) || "Time not specified"}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`rounded-full border px-2 py-1 text-[10px] font-bold ${statusClass(
                            status
                          )}`}
                        >
                          {titleCase(status)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Lower section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Patients */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeader
              icon={Users}
              title="Recent Patients"
              subtitle="Latest patient records"
            />

            {recentPatients.length === 0 ? (
              <div className="py-10 text-center">
                <Users className="mx-auto mb-3 text-slate-300" size={30} />
                <p className="text-sm font-semibold text-slate-600">
                  No patient records
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPatients.map((patient, index) => (
                  <div
                    key={patient.id || patient.patient_id || index}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                        {getValue(
                          patient,
                          ["full_name", "name"],
                          "P"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {getValue(
                            patient,
                            ["full_name", "name"],
                            "Patient"
                          )}
                        </p>

                        <p className="truncate text-xs text-slate-400">
                          {getValue(
                            patient,
                            ["patient_number", "patient_code", "id"],
                            "Patient record"
                          )}
                        </p>
                      </div>
                    </div>

                    <ArrowRight size={15} className="text-slate-300" />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Labs */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeader
              icon={FlaskConical}
              title="Pending Lab Reports"
              subtitle="Reports requiring attention"
            />

            <div className="mb-4 rounded-xl bg-amber-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    Pending Reports
                  </p>
                  <p className="mt-1 text-xs text-amber-700">
                    Current laboratory workload
                  </p>
                </div>

                <p className="text-3xl font-bold text-amber-800">
                  {pendingLabs.length}
                </p>
              </div>
            </div>

            {pendingLabs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center">
                <CheckCircle2
                  className="mx-auto mb-2 text-emerald-500"
                  size={25}
                />
                <p className="text-sm font-semibold text-slate-600">
                  No pending lab reports
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingLabs.slice(0, 4).map((report, index) => (
                  <div
                    key={report.id || report.report_id || index}
                    className="flex items-center justify-between rounded-xl bg-slate-50 p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        {getValue(
                          report,
                          ["test_name", "test_type", "name"],
                          "Laboratory Report"
                        )}
                      </p>

                      <p className="text-xs text-slate-400">
                        {getPatientName(report)}
                      </p>
                    </div>

                    <Activity size={16} className="text-amber-500" />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Clinical summary */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeader
              icon={FileText}
              title="Clinical Activity"
              subtitle="Current clinical record summary"
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                    <FileText size={17} />
                  </div>
                  <span className="text-sm font-medium text-slate-700">
                    Prescriptions
                  </span>
                </div>

                <span className="text-lg font-bold text-slate-900">
                  {data.prescriptions.length}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-cyan-50 p-2 text-cyan-600">
                    <FlaskConical size={17} />
                  </div>
                  <span className="text-sm font-medium text-slate-700">
                    Lab Reports
                  </span>
                </div>

                <span className="text-lg font-bold text-slate-900">
                  {data.labReports.length}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                    <Activity size={17} />
                  </div>
                  <span className="text-sm font-medium text-slate-700">
                    Schedules
                  </span>
                </div>

                <span className="text-lg font-bold text-slate-900">
                  {data.schedules.length}
                </span>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <Stethoscope
                    size={18}
                    className="mt-0.5 shrink-0 text-blue-600"
                  />

                  <div>
                    <p className="text-sm font-semibold text-blue-900">
                      Clinical workspace
                    </p>
                    <p className="mt-1 text-xs leading-5 text-blue-700">
                      Use the Doctor navigation to open appointments,
                      patients, medical records, prescriptions, laboratory
                      reports, radiology, surgery and duty schedule modules.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Quick actions */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <SectionHeader
            icon={Stethoscope}
            title="Quick Actions"
            subtitle="Jump directly to common Doctor workflows"
          />

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              {
                label: "Appointments",
                path: "/doctor/appointments",
                icon: CalendarDays,
              },
              {
                label: "Patients",
                path: "/doctor/patients",
                icon: Users,
              },
              {
                label: "Prescriptions",
                path: "/doctor/prescriptions",
                icon: FileText,
              },
              {
                label: "Medical Records",
                path: "/doctor/medical-records",
                icon: HeartPulse,
              },
            ].map(({ label, path, icon: Icon }) => (
              <button
                key={path}
                type="button"
                onClick={() => {
                  window.location.href = path;
                }}
                className="group flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-cyan-200 hover:bg-cyan-50"
              >
                <div className="rounded-lg bg-slate-100 p-2.5 text-slate-600 transition group-hover:bg-white group-hover:text-cyan-600">
                  <Icon size={18} />
                </div>

                <span className="text-sm font-semibold text-slate-700">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Empty backend notice */}
        {data.appointments.length === 0 &&
          data.patients.length === 0 &&
          data.labReports.length === 0 &&
          data.prescriptions.length === 0 && (
            <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <XCircle className="mt-0.5 text-slate-400" size={20} />

              <div>
                <p className="font-semibold text-slate-700">
                  No clinical records available yet
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  The dashboard is connected to the hospital backend. Once
                  Doctor-related records are available, they will appear here
                  automatically.
                </p>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
