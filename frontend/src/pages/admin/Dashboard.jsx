import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Activity,
    AlertTriangle,
    BedDouble,
    CalendarDays,
    CheckCircle2,
    Clock3,
    FlaskConical,
    HeartPulse,
    Hospital,
    LoaderCircle,
    RefreshCw,
    ShieldCheck,
    Siren,
    Stethoscope,
    Users,
} from "lucide-react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import api from "../../services/api";

function toNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}

function formatNumber(value) {
    return new Intl.NumberFormat("en-IN").format(toNumber(value));
}

function normalizeAnalytics(response) {
    // Supports both:
    // response
    // response.data
    // response.data.data
    const root =
        response?.data?.data ??
        response?.data ??
        response ??
        {};

    return {
        generatedAt: root.generated_at ?? null,

        hospital: {
            patients: toNumber(root.patients?.total_patients),
            doctors: toNumber(root.staff?.doctors),
            nurses: toNumber(root.staff?.nurses),
            staff: toNumber(root.staff?.staff),
            departments: toNumber(root.departments?.total_departments),
            wards: toNumber(root.wards?.total_wards),
        },

        capacity: (() => {
            const beds = root.beds ?? root.capacity ?? {};
            const distribution = Array.isArray(beds.status_distribution)
                ? beds.status_distribution
                : [];

            const counts = {};
            for (const item of distribution) {
                const status = String(item?.label ?? "")
                    .trim()
                    .toLowerCase();
                counts[status] = toNumber(item?.value);
            }

            const totalBeds = toNumber(beds.total_beds ?? beds.totalBeds);
            const occupiedBeds = toNumber(
                beds.occupied_beds ?? beds.occupiedBeds ?? counts.occupied
            );
            const reservedBeds = toNumber(
                beds.reserved_beds ?? beds.reservedBeds ?? counts.reserved
            );
            const maintenanceBeds = toNumber(
                beds.maintenance_beds ??
                    beds.maintenanceBeds ??
                    counts.maintenance
            );
            const cleaningBeds = toNumber(counts.cleaning);

            const availableBeds = counts.available != null
                ? counts.available
                : beds.available_beds != null
                    ? toNumber(beds.available_beds)
                    : beds.availableBeds != null
                        ? toNumber(beds.availableBeds)
                        : Math.max(
                            0,
                            totalBeds - occupiedBeds - reservedBeds -
                                maintenanceBeds - cleaningBeds
                        );

            const occupancy = beds.occupancy_percentage != null
                ? toNumber(beds.occupancy_percentage)
                : totalBeds > 0
                    ? Number(((occupiedBeds / totalBeds) * 100).toFixed(2))
                    : 0;

            return {
                totalBeds,
                occupiedBeds,
                availableBeds,
                reservedBeds,
                maintenanceBeds,
                occupancy,
            };
        })(),
        appointments: {
            total: toNumber(root.appointments?.total_appointments),
            today: toNumber(
                root.appointments?.appointment_trend?.find(
                    (item) => item.date === new Date().toISOString().slice(0, 10)
                )?.value
            ),
            scheduled: toNumber(
                root.appointments?.status_distribution?.find(
                    (item) => item.label?.toLowerCase() === "scheduled"
                )?.value
            ),
            confirmed: toNumber(
                root.appointments?.status_distribution?.find(
                    (item) => item.label?.toLowerCase() === "confirmed"
                )?.value
            ),
            completed: toNumber(
                root.appointments?.status_distribution?.find(
                    (item) => item.label?.toLowerCase() === "completed"
                )?.value
            ),
            cancelled: toNumber(
                root.appointments?.status_distribution?.find(
                    (item) => item.label?.toLowerCase() === "cancelled"
                )?.value
            ),
            completion: (() => {
                const total = toNumber(root.appointments?.total_appointments);
                const completed = toNumber(
                    root.appointments?.status_distribution?.find(
                        (item) => String(item?.label ?? "").toLowerCase() === "completed"
                    )?.value
                );
                return total > 0
                    ? Number(((completed / total) * 100).toFixed(2))
                    : 0;
            })(),
        },

        admissions: {
            total: toNumber(root.admissions?.total_admissions),
            active: toNumber(
                root.admissions?.status_distribution?.find(
                    (item) => ["active", "admitted"].includes(
                        String(item?.label ?? "").toLowerCase()
                    )
                )?.value
            ),
            discharged: toNumber(
                root.admissions?.status_distribution?.find(
                    (item) => item.label?.toLowerCase() === "discharged"
                )?.value
            ),
        },

        emergency: {
            total: toNumber(root.emergency?.total_emergencies),
            active: toNumber(
                root.emergency?.status_distribution?.find(
                    (item) => item.label?.toLowerCase() === "active"
                )?.value
            ),
            today: toNumber(
                root.emergency?.emergency_trend?.find(
                    (item) => item.date === new Date().toISOString().slice(0, 10)
                )?.value
            ),
            critical: toNumber(
                root.emergency?.triage_distribution?.find(
                    (item) => item.label?.toLowerCase() === "critical"
                )?.value
            ),
            emergency: toNumber(
                root.emergency?.triage_distribution?.find(
                    (item) => item.label?.toLowerCase() === "emergency"
                )?.value
            ),
            urgent: toNumber(
                root.emergency?.triage_distribution?.find(
                    (item) => item.label?.toLowerCase() === "urgent"
                )?.value
            ),
        },

        surgical: {
            total: toNumber(root.surgeries?.total_surgeries),
            scheduled: toNumber(
                root.surgeries?.status_distribution?.find(
                    (item) => item.label?.toLowerCase() === "scheduled"
                )?.value
            ),
            completed: toNumber(
                root.surgeries?.status_distribution?.find(
                    (item) => item.label?.toLowerCase() === "completed"
                )?.value
            ),
            theatres: toNumber(root.surgeries?.operation_theatres),
            activeTheatres: toNumber(root.surgeries?.active_theatres),
        },

        clinical: {
            prescriptions: toNumber(root.clinical?.prescriptions),
            diagnoses: toNumber(root.clinical?.diagnoses),
            todayPrescriptions: toNumber(
                root.clinical?.prescription_trend?.find(
                    (item) => item.date === new Date().toISOString().slice(0, 10)
                )?.value
            ),
            laboratoryTests: toNumber(root.clinical?.laboratory_tests),
            radiologyRecords: toNumber(root.clinical?.radiology_records),
        },

        pharmacy: {
            pharmacies: toNumber(
                root.pharmacy_inventory?.pharmacies
            ),
            inventoryItems: toNumber(
                root.pharmacy_inventory?.inventory_items
            ),
            lowStock: toNumber(
                root.pharmacy_inventory?.low_stock_items
            ),
        },

        financial: {
            invoiceTotal: toNumber(
                root.financial?.invoice_total
            ),
            invoicePaid: toNumber(
                root.financial?.invoice_paid
            ),
            invoiceBalance: toNumber(
                root.financial?.invoice_balance
            ),
            paymentCollection: toNumber(
                root.financial?.payment_collection
            ),
        },

        alerts: Array.isArray(root.alerts)
            ? root.alerts
            : [],
    };
}

function StatCard({
    icon: Icon,
    label,
    value,
    detail,
    tone = "cyan",
}) {
    const tones = {
        cyan: "border-cyan-400/10 bg-cyan-400/[0.04] text-cyan-300",
        blue: "border-blue-400/10 bg-blue-400/[0.04] text-blue-300",
        violet:
            "border-violet-400/10 bg-violet-400/[0.04] text-violet-300",
        emerald:
            "border-emerald-400/10 bg-emerald-400/[0.04] text-emerald-300",
        amber:
            "border-amber-400/10 bg-amber-400/[0.04] text-amber-300",
        rose: "border-rose-400/10 bg-rose-400/[0.04] text-rose-300",
    };

    return (
        <div className="group rounded-2xl border border-white/[0.07] bg-[#09111f]/80 p-5 transition duration-300 hover:-translate-y-0.5 hover:border-white/[0.12]">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#183B56]0">
                        {label}
                    </p>

                    <p className="mt-3 text-3xl font-bold tracking-tight text-[#183B56]">
                        {formatNumber(value)}
                    </p>

                    <p className="mt-2 text-xs text-[#183B56]0">
                        {detail}
                    </p>
                </div>

                <div
                    className={`rounded-xl border p-3 ${tones[tone] || tones.cyan}`}
                >
                    <Icon size={21} />
                </div>
            </div>
        </div>
    );
}

function SectionHeader({ icon: Icon, title, subtitle }) {
    return (
        <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/[0.05] p-2.5 text-cyan-300">
                <Icon size={18} />
            </div>

            <div>
                <h2 className="text-sm font-semibold text-[#183B56]">
                    {title}
                </h2>
                <p className="text-xs text-[#183B56]0">
                    {subtitle}
                </p>
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const loadAnalytics = useCallback(async (manual = false) => {
        if (manual) {
            setRefreshing(true);
        }

        try {
            setError("");

            const response = await api.get(
                "/analytics/overview"
            );

            setAnalytics(normalizeAnalytics(response));
        } catch (requestError) {
            console.error(
                "Analytics overview failed:",
                requestError
            );

            setError(
                requestError?.userMessage ||
                    "Unable to load live hospital analytics."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadAnalytics();

        const interval = window.setInterval(() => {
            loadAnalytics();
        }, 30000);

        return () => window.clearInterval(interval);
    }, [loadAnalytics]);

    const today = useMemo(() => {
        return new Intl.DateTimeFormat("en-IN", {
            weekday: "long",
            day: "2-digit",
            month: "short",
            year: "numeric",
        }).format(new Date());
    }, []);

    const chartData = useMemo(() => {

        /*
         * Keep the chart frame visually complete even when
         * live analytics are temporarily unavailable.
         *
         * These are zero placeholders only. They are never
         * presented as real hospital statistics.
         */

        if (!analytics) {
            return [
                {
                    name: "Patients",
                    value: 0,
                },
                {
                    name: "Doctors",
                    value: 0,
                },
                {
                    name: "Appointments",
                    value: 0,
                },
                {
                    name: "Admissions",
                    value: 0,
                },
                {
                    name: "Emergency",
                    value: 0,
                },
                {
                    name: "Surgeries",
                    value: 0,
                },
            ];
        }

        return [
            {
                name: "Patients",
                value: analytics.hospital.patients,
            },
            {
                name: "Doctors",
                value: analytics.hospital.doctors,
            },
            {
                name: "Appointments",
                value: analytics.appointments.total,
            },
            {
                name: "Admissions",
                value: analytics.admissions.total,
            },
            {
                name: "Emergency",
                value: analytics.emergency.total,
            },
            {
                name: "Surgeries",
                value: analytics.surgical.total,
            },
        ];
    }, [analytics]);

    const chartMax = Math.max(
        ...chartData.map((item) => toNumber(item.value)),
        1
    );

    if (loading && !analytics) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center">
                <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-5 py-4 text-sm text-[#6B8094]">
                    <LoaderCircle
                        size={18}
                        className="animate-spin text-cyan-400"
                    />
                    Loading live hospital intelligence...
                </div>
            </div>
        );
    }

    const data = analytics || {
        hospital: {},
        capacity: {},
        appointments: {},
        admissions: {},
        emergency: {},
        surgical: {},
        clinical: {},
        pharmacy: {},
        financial: {},
        alerts: [],
    };

    return (
        <div className="min-h-full bg-[#030712] text-[#183B56]">
            <div className="mx-auto max-w-[1600px] space-y-6 p-5 lg:p-7">
                {/* Header */}
                <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
                    <div>
                        <div className="mb-3 flex items-center gap-2">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
                            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-300">
                                Hospital Command Center
                            </span>
                        </div>

                        <h1 className="text-3xl font-bold tracking-tight text-[#183B56] lg:text-4xl">
                            Good day, Administrator.
                        </h1>

                        <p className="mt-2 text-sm text-[#183B56]0">
                            Real-time operational overview powered by
                            your hospital database.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                                Today
                            </p>
                            <p className="mt-1 text-sm text-[#55718A]">
                                {today}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => loadAnalytics(true)}
                            disabled={refreshing}
                            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm font-medium text-[#55718A] transition hover:border-cyan-400/20 hover:bg-cyan-400/[0.05] hover:text-[#183B56] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <RefreshCw
                                size={17}
                                className={
                                    refreshing
                                        ? "animate-spin"
                                        : ""
                                }
                            />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Live status */}
                <div className="flex flex-col justify-between gap-4 rounded-2xl border border-cyan-400/10 bg-gradient-to-r from-cyan-400/[0.05] via-transparent to-blue-500/[0.04] p-5 md:flex-row md:items-center">
                    <div className="flex items-center gap-4">
                        <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/[0.07] p-3 text-cyan-300">
                            <HeartPulse size={23} />
                        </div>

                        <div>
                            <h2 className="font-semibold text-[#183B56]">
                                Hospital systems
                            </h2>
                            <p className="mt-1 text-xs text-[#183B56]0">
                                Live database-connected operational
                                monitoring
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-full border border-emerald-400/10 bg-emerald-400/[0.04] px-4 py-2 text-xs font-semibold text-emerald-300">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        LIVE DATABASE
                    </div>
                </div>

                {error && (
                    <div className="flex items-start gap-3 rounded-2xl border border-rose-400/15 bg-rose-400/[0.05] p-4 text-sm text-rose-300">
                        <AlertTriangle
                            size={18}
                            className="mt-0.5 shrink-0"
                        />
                        <div>
                            <p className="font-semibold">
                                Live analytics unavailable
                            </p>
                            <p className="mt-1 text-xs text-rose-300/70">
                                {error}
                            </p>
                        </div>
                    </div>
                )}

                {/* Primary stats */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        icon={Users}
                        label="Registered patients"
                        value={data.hospital.patients}
                        detail="Current database count"
                        tone="cyan"
                    />

                    <StatCard
                        icon={Stethoscope}
                        label="Doctors"
                        value={data.hospital.doctors}
                        detail="Current database count"
                        tone="blue"
                    />

                    <StatCard
                        icon={CalendarDays}
                        label="Appointments"
                        value={data.appointments.total}
                        detail={`${formatNumber(
                            data.appointments.today
                        )} scheduled today`}
                        tone="violet"
                    />

                    <StatCard
                        icon={BedDouble}
                        label="Beds"
                        value={data.capacity.totalBeds}
                        detail={`${formatNumber(
                            data.capacity.occupancy
                        )}% occupancy`}
                        tone="emerald"
                    />
                </div>

                {/* Main content */}
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]">
                    {/* Activity */}
                    <div className="dashboard-card rounded-2xl border border-white/[0.07] bg-[#09111f]/75 p-5">
                        <SectionHeader
                            icon={Activity}
                            title="Hospital activity"
                            subtitle="Live database-backed operational volume"
                        />

                        <div className="dashboard-activity-chart h-[340px] min-w-0 w-full">

    <div className="flex h-full min-w-0 flex-col">

        <div className="mb-4 flex items-center justify-between">
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#183B56]0">
                    Operational volume
                </p>

                <p className="mt-1 text-[11px] text-[#6B8094]">
                    Current database counts by service
                </p>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1.5 text-[10px] font-semibold text-cyan-700">
                <span className="h-2 w-2 rounded-full bg-cyan-500"></span>
                LIVE DATA
            </div>
        </div>


        <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-[#dceaf2] bg-gradient-to-b from-[#f9fcfe] to-[#f1f8fc] px-4 pb-3 pt-5">

            {/* horizontal guide lines */}

            <div className="pointer-events-none absolute inset-x-4 top-[22%] border-t border-dashed border-[#dbe8ef]"></div>
            <div className="pointer-events-none absolute inset-x-4 top-[47%] border-t border-dashed border-[#dbe8ef]"></div>
            <div className="pointer-events-none absolute inset-x-4 top-[72%] border-t border-dashed border-[#dbe8ef]"></div>
            <div className="pointer-events-none absolute inset-x-4 bottom-[16%] border-t border-[#cbdde7]"></div>


            <div className="relative z-10 flex h-full items-end justify-between gap-3 sm:gap-5">

                {chartData.map((item) => {

                    const value = toNumber(item.value);

                    const height =
                        value <= 0
                            ? 7
                            : Math.max(
                                  10,
                                  Math.round(
                                      (value / chartMax) * 100
                                  )
                              );

                    return (
                        <div
                            key={item.name}
                            className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                        >

                            <div className="mb-2 flex h-7 items-end justify-center">
                                <span className="rounded-lg border border-cyan-100 bg-white px-2 py-1 text-[10px] font-bold text-[#315875] opacity-0 shadow-sm transition duration-200 group-hover:opacity-100">
                                    {formatNumber(value)}
                                </span>
                            </div>


                            <div className="flex h-[72%] w-full items-end justify-center">

                                <div
                                    className="w-[58%] min-w-[22px] max-w-[58px] rounded-t-xl bg-gradient-to-t from-[#3478ed] via-[#08b9d8] to-[#55d8ec] shadow-[0_8px_18px_rgba(52,120,237,0.18)] transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_12px_24px_rgba(52,120,237,0.26)]"
                                    style={{
                                        height: `${height}%`,
                                    }}
                                >
                                    <div className="h-1.5 w-full rounded-t-xl bg-white/30"></div>
                                </div>

                            </div>


                            <div className="mt-3 h-9 text-center">

                                <p className="text-[10px] font-semibold text-[#55718a] sm:text-[11px]">
                                    {item.name}
                                </p>

                                <p className="mt-0.5 text-[9px] font-medium text-[#8298aa]">
                                    {formatNumber(value)}
                                </p>

                            </div>

                        </div>
                    );

                })}

            </div>

        </div>

    </div>

</div>
                    </div>

                    {/* System status */}
                    <div className="dashboard-card rounded-2xl border border-white/[0.07] bg-[#09111f]/75 p-5">
                        <SectionHeader
                            icon={ShieldCheck}
                            title="System status"
                            subtitle="Current hospital platform health"
                        />

                        <div className="space-y-3">
                            {[
                                [
                                    Hospital,
                                    "Core platform",
                                    "Hospital management API",
                                    "Online",
                                ],
                                [
                                    Stethoscope,
                                    "Clinical services",
                                    "Patient care workflows",
                                    "Available",
                                ],
                                [
                                    FlaskConical,
                                    "Analytics",
                                    "Live database intelligence",
                                    "Connected",
                                ],
                                [
                                    RefreshCw,
                                    "Data refresh",
                                    "Automatic dashboard refresh",
                                    "30 sec",
                                ],
                            ].map(
                                (
                                    [
                                        Icon,
                                        title,
                                        subtitle,
                                        status,
                                    ],
                                    index
                                ) => (
                                    <div
                                        key={title}
                                        className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg bg-white/[0.04] p-2.5 text-[#6B8094]">
                                                <Icon size={18} />
                                            </div>

                                            <div>
                                                <p className="text-sm font-semibold text-[#183B56]">
                                                    {title}
                                                </p>
                                                <p className="mt-1 text-[11px] text-slate-600">
                                                    {subtitle}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-[#55718A]">
                                                {status}
                                            </p>
                                            <p className="mt-1 flex items-center justify-end gap-1 text-[10px] text-emerald-400">
                                                <CheckCircle2
                                                    size={12}
                                                />
                                                Operational
                                            </p>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>

                {/* Clinical operations */}
                <div className="dashboard-card rounded-2xl border border-white/[0.07] bg-[#09111f]/75 p-5">
                    <SectionHeader
                        icon={Activity}
                        title="Clinical operations"
                        subtitle="Live counts from the hospital database"
                    />

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            icon={Hospital}
                            label="Admissions"
                            value={data.admissions.total}
                            detail={`${formatNumber(
                                data.admissions.active
                            )} currently active`}
                            tone="blue"
                        />

                        <StatCard
                            icon={Siren}
                            label="Emergency cases"
                            value={data.emergency.total}
                            detail={`${formatNumber(
                                data.emergency.active
                            )} currently active`}
                            tone="rose"
                        />

                        <StatCard
                            icon={Activity}
                            label="Surgeries"
                            value={data.surgical.total}
                            detail={`${formatNumber(
                                data.surgical.scheduled
                            )} scheduled`}
                            tone="violet"
                        />

                        <StatCard
                            icon={FlaskConical}
                            label="Lab test catalogue"
                            value={data.clinical.laboratoryTests}
                            detail="Configured test types"
                            tone="cyan"
                        />

                        <StatCard
                            icon={HeartPulse}
                            label="Recorded diagnoses"
                            value={data.clinical.diagnoses}
                            detail="Existing diagnosis records"
                            tone="blue"
                        />
                    </div>
                </div>

                {/* Capacity + appointments + emergency */}
                <div className="grid gap-5 lg:grid-cols-3">
                    <div className="dashboard-card rounded-2xl border border-white/[0.07] bg-[#09111f]/75 p-5">
                        <SectionHeader
                            icon={BedDouble}
                            title="Bed capacity"
                            subtitle="Current occupancy breakdown"
                        />

                        <div className="space-y-4">
                            <div>
                                <div className="mb-2 flex justify-between text-xs">
                                    <span className="text-[#6B8094]">
                                        Occupancy
                                    </span>
                                    <span className="font-semibold text-cyan-300">
                                        {data.capacity.occupancy}%
                                    </span>
                                </div>

                                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-700"
                                        style={{
                                            width: `${Math.min(
                                                100,
                                                data.capacity
                                                    .occupancy
                                            )}%`,
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <MiniMetric
                                    label="Occupied"
                                    value={
                                        data.capacity
                                            .occupiedBeds
                                    }
                                />
                                <MiniMetric
                                    label="Available"
                                    value={
                                        data.capacity
                                            .availableBeds
                                    }
                                />
                                <MiniMetric
                                    label="Reserved"
                                    value={
                                        data.capacity
                                            .reservedBeds
                                    }
                                />
                                <MiniMetric
                                    label="Maintenance"
                                    value={
                                        data.capacity
                                            .maintenanceBeds
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-card rounded-2xl border border-white/[0.07] bg-[#09111f]/75 p-5">
                        <SectionHeader
                            icon={CalendarDays}
                            title="Appointments"
                            subtitle="Current appointment pipeline"
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <MiniMetric
                                label="Today"
                                value={
                                    data.appointments.today
                                }
                            />
                            <MiniMetric
                                label="Scheduled"
                                value={
                                    data.appointments
                                        .scheduled
                                }
                            />
                            <MiniMetric
                                label="Confirmed"
                                value={
                                    data.appointments
                                        .confirmed
                                }
                            />
                            <MiniMetric
                                label="Completed"
                                value={
                                    data.appointments
                                        .completed
                                }
                            />
                        </div>

                        <div className="mt-4 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                            <span className="text-xs text-[#183B56]0">
                                Completion rate
                            </span>
                            <span className="text-sm font-semibold text-emerald-300">
                                {data.appointments.completion}%
                            </span>
                        </div>
                    </div>

                    <div className="dashboard-card rounded-2xl border border-white/[0.07] bg-[#09111f]/75 p-5">
                        <SectionHeader
                            icon={Siren}
                            title="Emergency"
                            subtitle="Current emergency pressure"
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <MiniMetric
                                label="Active"
                                value={
                                    data.emergency.active
                                }
                            />
                            <MiniMetric
                                label="Today"
                                value={
                                    data.emergency.today
                                }
                            />
                            <MiniMetric
                                label="Critical"
                                value={
                                    data.emergency.critical
                                }
                            />
                            <MiniMetric
                                label="Urgent"
                                value={
                                    data.emergency.urgent
                                }
                            />
                        </div>
                    </div>
                </div>

                {/* Alerts */}
                <div className="dashboard-card rounded-2xl border border-white/[0.07] bg-[#09111f]/75 p-5">
                    <SectionHeader
                        icon={AlertTriangle}
                        title="Operational alerts"
                        subtitle="Generated only from actual backend thresholds"
                    />

                    {data.alerts.length === 0 ? (
                        <div className="flex items-center gap-3 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.03] p-4">
                            <CheckCircle2
                                size={19}
                                className="text-emerald-400"
                            />
                            <div>
                                <p className="text-sm font-semibold text-[#183B56]">
                                    No active operational alerts
                                </p>
                                <p className="mt-1 text-xs text-slate-600">
                                    Current backend thresholds are
                                    within normal range.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-3 md:grid-cols-2">
                            {data.alerts.map(
                                (alert, index) => (
                                    <div
                                        key={`${alert.type}-${index}`}
                                        className="rounded-xl border border-amber-400/10 bg-amber-400/[0.03] p-4"
                                    >
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle
                                                size={18}
                                                className="mt-0.5 text-amber-300"
                                            />
                                            <div>
                                                <p className="text-sm font-semibold text-[#183B56]">
                                                    {
                                                        alert.title
                                                    }
                                                </p>
                                                <p className="mt-1 text-xs leading-5 text-[#183B56]0">
                                                    {
                                                        alert.message
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </div>

                {/* Footer telemetry */}
                <div className="flex flex-col justify-between gap-2 border-t border-white/[0.06] pt-4 text-[11px] text-slate-600 md:flex-row">
                    <span>
                        Live hospital intelligence â€¢ PostgreSQL
                        backed
                    </span>

                    <span className="flex items-center gap-2">
                        <Clock3 size={13} />
                        Last backend snapshot:{" "}
                        {data.generatedAt
                            ? new Date(
                                  data.generatedAt
                              ).toLocaleTimeString(
                                  "en-IN"
                              )
                            : "Unavailable"}
                    </span>
                </div>
            </div>
        </div>
    );
}

function MiniMetric({ label, value }) {
    return (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                {label}
            </p>
            <p className="mt-2 text-lg font-bold text-[#183B56]">
                {formatNumber(value)}
            </p>
        </div>
    );
}






