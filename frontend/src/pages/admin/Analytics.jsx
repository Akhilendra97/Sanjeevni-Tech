import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Activity,
    AlertTriangle,
    BedDouble,
    CalendarDays,
    CheckCircle2,
    Clock3,
    CreditCard,
    DollarSign,
    HeartPulse,
    LoaderCircle,
    RefreshCw,
    Scissors,
    ShieldAlert,
    Stethoscope,
    TrendingUp,
    Users,
} from "lucide-react";

import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import analyticsApi from "../../services/analyticsApi";


const COLORS = [
    "#08b9d8",
    "#3478ed",
    "#6267df",
    "#22b573",
    "#f59e0b",
    "#ef6b73",
    "#8b7cf6",
];


function numberValue(value) {
    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : 0;
}


function formatNumber(value) {
    return new Intl.NumberFormat("en-IN").format(
        numberValue(value)
    );
}


function formatCurrency(value) {
    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }
    ).format(numberValue(value));
}


function formatDateLabel(value) {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value).slice(5);
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
        }
    );
}


function safeArray(value) {
    return Array.isArray(value)
        ? value
        : [];
}


function distributionData(items) {
    return safeArray(items).map(
        (item) => ({
            label:
                item?.label ??
                "Unknown",

            value:
                numberValue(item?.value),
        })
    );
}


function trendData(items) {
    return safeArray(items).map(
        (item) => ({
            date:
                item?.date ?? "",

            value:
                numberValue(item?.value),
        })
    );
}


function EmptyChart({
    message = "No records available yet.",
}) {
    return (
        <div className="flex h-[250px] items-center justify-center rounded-xl border border-dashed border-[#d8e6ef] bg-[#f8fbfd]">
            <div className="text-center">
                <Activity
                    size={24}
                    className="mx-auto mb-3 text-[#a4b7c3]"
                />

                <p className="text-sm font-medium text-[#8298aa]">
                    {message}
                </p>
            </div>
        </div>
    );
}


function SectionCard({
    title,
    subtitle,
    icon: Icon,
    children,
    className = "",
}) {
    return (
        <section
            className={`min-w-0 overflow-hidden rounded-2xl border border-[#d8e6ef] bg-white p-6 shadow-[0_8px_30px_rgba(21,54,83,0.06)] ${className}`}
        >
            <div className="mb-5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <h2 className="text-lg font-bold tracking-tight text-[#153653]">
                        {title}
                    </h2>

                    {subtitle && (
                        <p className="mt-1 text-sm text-[#55718a]">
                            {subtitle}
                        </p>
                    )}
                </div>

                {Icon && (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eefbfe] text-[#08a9c8]">
                        <Icon size={20} />
                    </div>
                )}
            </div>

            {children}
        </section>
    );
}


function MetricCard({
    label,
    value,
    subtitle,
    icon: Icon,
    tone = "cyan",
}) {
    const tones = {
        cyan: {
            iconBg: "bg-[#eefbfe]",
            icon: "text-[#08a9c8]",
        },

        blue: {
            iconBg: "bg-[#eef4ff]",
            icon: "text-[#3478ed]",
        },

        indigo: {
            iconBg: "bg-[#f0efff]",
            icon: "text-[#6267df]",
        },

        green: {
            iconBg: "bg-[#ecfbf4]",
            icon: "text-[#169b63]",
        },

        amber: {
            iconBg: "bg-[#fff8e8]",
            icon: "text-[#d99100]",
        },

        red: {
            iconBg: "bg-[#fff0f1]",
            icon: "text-[#dc5c66]",
        },
    };

    const selected =
        tones[tone] ?? tones.cyan;

    return (
        <div className="min-w-0 rounded-2xl border border-[#d8e6ef] bg-white p-5 shadow-[0_8px_30px_rgba(21,54,83,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(21,54,83,0.08)]">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#55718a]">
                        {label}
                    </p>

                    <p className="mt-2 truncate text-3xl font-bold tracking-tight text-[#153653]">
                        {value}
                    </p>

                    {subtitle && (
                        <p className="mt-1 text-xs text-[#8298aa]">
                            {subtitle}
                        </p>
                    )}
                </div>

                <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${selected.iconBg} ${selected.icon}`}
                >
                    <Icon size={21} />
                </div>
            </div>
        </div>
    );
}


function CustomTooltip({
    active,
    payload,
    label,
}) {
    if (!active || !payload?.length) {
        return null;
    }

    return (
        <div className="rounded-xl border border-[#d8e6ef] bg-white px-4 py-3 shadow-[0_10px_30px_rgba(21,54,83,0.12)]">
            <p className="mb-1 text-xs font-semibold text-[#8298aa]">
                {label}
            </p>

            {payload.map(
                (entry, index) => (
                    <p
                        key={`${entry.name}-${index}`}
                        className="text-sm font-bold text-[#153653]"
                    >
                        {entry.name}:{" "}
                        {formatNumber(entry.value)}
                    </p>
                )
            )}
        </div>
    );
}


export default function Analytics() {

    const [analytics, setAnalytics] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    const [lastUpdated, setLastUpdated] =
        useState(null);


    const loadAnalytics =
        useCallback(
            async (
                isRefresh = false
            ) => {

                try {

                    if (isRefresh) {
                        setRefreshing(true);
                    }
                    else {
                        setLoading(true);
                    }

                    setError("");

                    const response =
                        await analyticsApi.overview();

                    const root =
                        response?.data ??
                        response ??
                        {};

                    setAnalytics(root);

                    setLastUpdated(
                        new Date()
                    );

                }
                catch (err) {

                    const status =
                        err?.response?.status;

                    if (status === 401) {
                        setError(
                            "Your session has expired. Please sign in again."
                        );
                    }
                    else {
                        setError(
                            err?.response?.data?.detail ??
                            "Unable to load hospital analytics."
                        );
                    }

                }
                finally {

                    setLoading(false);
                    setRefreshing(false);

                }

            },
            []
        );


    useEffect(() => {
        loadAnalytics();

        const interval =
            window.setInterval(
                () => loadAnalytics(true),
                60000
            );

        return () =>
            window.clearInterval(
                interval
            );

    }, [loadAnalytics]);


    const patients =
        analytics?.patients ?? {};

    const appointments =
        analytics?.appointments ?? {};

    const admissions =
        analytics?.admissions ?? {};

    const beds =
        analytics?.beds ?? {};

    const emergency =
        analytics?.emergency ?? {};

    const surgeries =
        analytics?.surgeries ?? {};

    const clinical =
        analytics?.clinical ?? {};

    const financial =
        analytics?.financial ?? {};

    const staff =
        analytics?.staff ?? {};

    const departments =
        analytics?.departments ?? {};

    const wards =
        analytics?.wards ?? {};


    const patientTrend =
        useMemo(
            () =>
                trendData(
                    patients.registration_trend
                ),
            [patients.registration_trend]
        );


    const appointmentTrend =
        useMemo(
            () =>
                trendData(
                    appointments.appointment_trend
                ),
            [appointments.appointment_trend]
        );


    const admissionTrend =
        useMemo(
            () =>
                trendData(
                    admissions.admission_trend
                ),
            [admissions.admission_trend]
        );


    const emergencyTrend =
        useMemo(
            () =>
                trendData(
                    emergency.emergency_trend
                ),
            [emergency.emergency_trend]
        );


    const appointmentStatus =
        useMemo(
            () =>
                distributionData(
                    appointments.status_distribution
                ),
            [appointments.status_distribution]
        );


    const bedStatus =
        useMemo(
            () =>
                distributionData(
                    beds.status_distribution
                ),
            [beds.status_distribution]
        );


    const emergencyTriage =
        useMemo(
            () =>
                distributionData(
                    emergency.triage_distribution
                ),
            [emergency.triage_distribution]
        );


    const surgeryStatus =
        useMemo(
            () =>
                distributionData(
                    surgeries.status_distribution
                ),
            [surgeries.status_distribution]
        );


    const staffData = [
        {
            name: "Doctors",
            value: numberValue(
                staff.doctors
            ),
        },
        {
            name: "Nurses",
            value: numberValue(
                staff.nurses
            ),
        },
        {
            name: "Staff",
            value: numberValue(
                staff.staff
            ),
        },
    ];


    const occupancy =
        Math.min(
            100,
            Math.max(
                0,
                numberValue(
                    beds.occupancy_percentage
                )
            )
        );


    if (loading && !analytics) {
        return (
            <div className="min-h-[calc(100vh-76px)] bg-[#eef5fa] p-6 lg:p-8">
                <div className="mx-auto max-w-[1600px]">
                    <div className="mb-8">
                        <div className="h-4 w-32 animate-pulse rounded bg-[#d8e6ef]" />

                        <div className="mt-3 h-10 w-64 animate-pulse rounded bg-[#d8e6ef]" />

                        <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-[#d8e6ef]" />
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                        {Array.from({ length: 8 }).map(
                            (_, index) => (
                                <div
                                    key={index}
                                    className="h-32 animate-pulse rounded-2xl border border-[#d8e6ef] bg-white"
                                />
                            )
                        )}
                    </div>
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-[calc(100vh-76px)] min-w-0 overflow-x-hidden bg-[#eef5fa]">

            <div className="mx-auto w-full max-w-[1600px] px-5 py-7 lg:px-8 lg:py-9">

                {/* HEADER */}

                <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">

                    <div className="min-w-0">

                        <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#08a9c8]">
                            <TrendingUp size={15} />
                            Management Intelligence
                        </div>

                        <h1 className="text-3xl font-bold tracking-tight text-[#153653] lg:text-4xl">
                            Hospital Analytics
                        </h1>

                        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#55718a] lg:text-base">
                            Real-time operational, clinical,
                            capacity and financial intelligence
                            from the hospital management system.
                        </p>

                    </div>


                    <div className="flex shrink-0 items-center gap-3">

                        {lastUpdated && (
                            <div className="hidden items-center gap-2 rounded-xl border border-[#d8e6ef] bg-white px-4 py-2.5 text-xs text-[#8298aa] md:flex">
                                <Clock3 size={14} />

                                Updated{" "}
                                {lastUpdated.toLocaleTimeString(
                                    "en-IN",
                                    {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    }
                                )}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() =>
                                loadAnalytics(true)
                            }
                            disabled={refreshing}
                            className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#08b9d8] to-[#3478ed] px-4 text-sm font-bold text-white shadow-[0_8px_22px_rgba(52,120,237,0.20)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <RefreshCw
                                size={16}
                                className={
                                    refreshing
                                        ? "animate-spin"
                                        : ""
                                }
                            />

                            {refreshing
                                ? "Refreshing..."
                                : "Refresh"}
                        </button>

                    </div>

                </div>


                {/* ERROR */}

                {error && (
                    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[#f1c7cb] bg-[#fff5f6] px-5 py-4 text-sm text-[#b94b56]">
                        <AlertTriangle
                            size={19}
                            className="mt-0.5 shrink-0"
                        />

                        <div className="min-w-0">
                            <p className="font-bold">
                                Analytics unavailable
                            </p>

                            <p className="mt-1">
                                {error}
                            </p>
                        </div>
                    </div>
                )}


                {/* PRIMARY METRICS */}

                <div className="grid min-w-0 gap-5 sm:grid-cols-2 xl:grid-cols-4">

                    <MetricCard
                        label="Total Patients"
                        value={formatNumber(
                            patients.total_patients
                        )}
                        subtitle="Registered patient records"
                        icon={Users}
                        tone="cyan"
                    />

                    <MetricCard
                        label="Appointments"
                        value={formatNumber(
                            appointments.total_appointments
                        )}
                        subtitle="All appointment records"
                        icon={CalendarDays}
                        tone="blue"
                    />

                    <MetricCard
                        label="Admissions"
                        value={formatNumber(
                            admissions.total_admissions
                        )}
                        subtitle="Total admission records"
                        icon={HeartPulse}
                        tone="indigo"
                    />

                    <MetricCard
                        label="Bed Occupancy"
                        value={`${occupancy.toFixed(1)}%`}
                        subtitle={`${formatNumber(
                            beds.occupied_beds
                        )} of ${formatNumber(
                            beds.total_beds
                        )} beds occupied`}
                        icon={BedDouble}
                        tone="green"
                    />

                    <MetricCard
                        label="Emergency Cases"
                        value={formatNumber(
                            emergency.total_emergencies
                        )}
                        subtitle="Recorded emergency cases"
                        icon={ShieldAlert}
                        tone="red"
                    />

                    <MetricCard
                        label="Surgeries"
                        value={formatNumber(
                            surgeries.total_surgeries
                        )}
                        subtitle="Total surgery records"
                        icon={Scissors}
                        tone="indigo"
                    />

                    <MetricCard
                        label="Recorded Diagnoses"
                        value={formatNumber(
                            clinical.diagnoses
                        )}
                        subtitle="Existing diagnosis records"
                        icon={HeartPulse}
                        tone="blue"
                    />

                    <MetricCard
                        label="Clinical Prescriptions"
                        value={formatNumber(
                            clinical.prescriptions
                        )}
                        subtitle="Prescription records"
                        icon={Stethoscope}
                        tone="cyan"
                    />

                    <MetricCard
                        label="Clinical Workforce"
                        value={formatNumber(
                            staff.total_clinical_staff
                        )}
                        subtitle={`${formatNumber(
                            staff.doctors
                        )} doctors · ${formatNumber(
                            staff.nurses
                        )} nurses · ${formatNumber(
                            staff.staff
                        )} staff`}
                        icon={Users}
                        tone="blue"
                    />

                    <MetricCard
                        label="Departments"
                        value={formatNumber(
                            departments.total_departments
                        )}
                        subtitle="Departments registered in the hospital database"
                        icon={Activity}
                        tone="cyan"
                    />

                    <MetricCard
                        label="Wards"
                        value={formatNumber(
                            wards.total_wards
                        )}
                        subtitle="Wards registered in the hospital database"
                        icon={BedDouble}
                        tone="indigo"
                    />

                </div>


                {/* TREND CHARTS */}

                <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-2">

                    <SectionCard
                        title="Patient Registrations"
                        subtitle="Daily patient registration trend for the latest seven days."
                        icon={Users}
                    >
                        {patientTrend.length > 0 ? (
                            <div className="h-[280px] w-full">
                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >
                                    <LineChart
                                        data={patientTrend}
                                        margin={{
                                            top: 10,
                                            right: 10,
                                            left: -15,
                                            bottom: 5,
                                        }}
                                    >
                                        <CartesianGrid
                                            stroke="#e4edf3"
                                            vertical={false}
                                        />

                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={
                                                formatDateLabel
                                            }
                                            tick={{
                                                fill: "#8298aa",
                                                fontSize: 11,
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                        />

                                        <YAxis
                                            allowDecimals={false}
                                            tick={{
                                                fill: "#8298aa",
                                                fontSize: 11,
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                        />

                                        <Tooltip
                                            content={
                                                <CustomTooltip />
                                            }
                                        />

                                        <Line
                                            type="monotone"
                                            dataKey="value"
                                            name="Registrations"
                                            stroke="#08b9d8"
                                            strokeWidth={3}
                                            dot={{
                                                r: 4,
                                                fill: "#08b9d8",
                                                strokeWidth: 2,
                                                stroke: "#ffffff",
                                            }}
                                            activeDot={{
                                                r: 6,
                                            }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <EmptyChart />
                        )}
                    </SectionCard>


                    <SectionCard
                        title="Appointment Activity"
                        subtitle="Daily appointment activity across the latest seven days."
                        icon={CalendarDays}
                    >
                        {appointmentTrend.length > 0 ? (
                            <div className="h-[280px] w-full">
                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >
                                    <LineChart
                                        data={appointmentTrend}
                                        margin={{
                                            top: 10,
                                            right: 10,
                                            left: -15,
                                            bottom: 5,
                                        }}
                                    >
                                        <CartesianGrid
                                            stroke="#e4edf3"
                                            vertical={false}
                                        />

                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={
                                                formatDateLabel
                                            }
                                            tick={{
                                                fill: "#8298aa",
                                                fontSize: 11,
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                        />

                                        <YAxis
                                            allowDecimals={false}
                                            tick={{
                                                fill: "#8298aa",
                                                fontSize: 11,
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                        />

                                        <Tooltip
                                            content={
                                                <CustomTooltip />
                                            }
                                        />

                                        <Line
                                            type="monotone"
                                            dataKey="value"
                                            name="Appointments"
                                            stroke="#3478ed"
                                            strokeWidth={3}
                                            dot={{
                                                r: 4,
                                                fill: "#3478ed",
                                                strokeWidth: 2,
                                                stroke: "#ffffff",
                                            }}
                                            activeDot={{
                                                r: 6,
                                            }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <EmptyChart />
                        )}
                    </SectionCard>


                    <SectionCard
                        title="Admissions Trend"
                        subtitle="Daily admission activity for the latest seven days."
                        icon={HeartPulse}
                    >
                        {admissionTrend.length > 0 ? (
                            <div className="h-[280px] w-full">
                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >
                                    <BarChart
                                        data={admissionTrend}
                                        margin={{
                                            top: 10,
                                            right: 10,
                                            left: -15,
                                            bottom: 5,
                                        }}
                                    >
                                        <CartesianGrid
                                            stroke="#e4edf3"
                                            vertical={false}
                                        />

                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={
                                                formatDateLabel
                                            }
                                            tick={{
                                                fill: "#8298aa",
                                                fontSize: 11,
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                        />

                                        <YAxis
                                            allowDecimals={false}
                                            tick={{
                                                fill: "#8298aa",
                                                fontSize: 11,
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                        />

                                        <Tooltip
                                            content={
                                                <CustomTooltip />
                                            }
                                        />

                                        <Bar
                                            dataKey="value"
                                            name="Admissions"
                                            fill="#6267df"
                                            radius={[
                                                6,
                                                6,
                                                0,
                                                0,
                                            ]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <EmptyChart />
                        )}
                    </SectionCard>


                    <SectionCard
                        title="Emergency Trend"
                        subtitle="Emergency arrivals across the latest seven days."
                        icon={ShieldAlert}
                    >
                        {emergencyTrend.length > 0 ? (
                            <div className="h-[280px] w-full">
                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >
                                    <LineChart
                                        data={emergencyTrend}
                                        margin={{
                                            top: 10,
                                            right: 10,
                                            left: -15,
                                            bottom: 5,
                                        }}
                                    >
                                        <CartesianGrid
                                            stroke="#e4edf3"
                                            vertical={false}
                                        />

                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={
                                                formatDateLabel
                                            }
                                            tick={{
                                                fill: "#8298aa",
                                                fontSize: 11,
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                        />

                                        <YAxis
                                            allowDecimals={false}
                                            tick={{
                                                fill: "#8298aa",
                                                fontSize: 11,
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                        />

                                        <Tooltip
                                            content={
                                                <CustomTooltip />
                                            }
                                        />

                                        <Line
                                            type="monotone"
                                            dataKey="value"
                                            name="Emergency Cases"
                                            stroke="#ef6b73"
                                            strokeWidth={3}
                                            dot={{
                                                r: 4,
                                                fill: "#ef6b73",
                                                strokeWidth: 2,
                                                stroke: "#ffffff",
                                            }}
                                            activeDot={{
                                                r: 6,
                                            }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <EmptyChart />
                        )}
                    </SectionCard>

                </div>


                {/* DISTRIBUTIONS */}

                <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-2 xl:grid-cols-4">

                    <SectionCard
                        title="Appointment Status"
                        subtitle="Current distribution"
                        icon={CalendarDays}
                    >
                        {appointmentStatus.length > 0 ? (
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >
                                    <PieChart>
                                        <Pie
                                            data={appointmentStatus}
                                            dataKey="value"
                                            nameKey="label"
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={48}
                                            outerRadius={78}
                                            paddingAngle={3}
                                        >
                                            {appointmentStatus.map(
                                                (_, index) => (
                                                    <Cell
                                                        key={index}
                                                        fill={
                                                            COLORS[
                                                                index %
                                                                    COLORS.length
                                                            ]
                                                        }
                                                    />
                                                )
                                            )}
                                        </Pie>

                                        <Tooltip
                                            formatter={(
                                                value
                                            ) =>
                                                formatNumber(
                                                    value
                                                )
                                            }
                                        />

                                        <Legend
                                            verticalAlign="bottom"
                                            height={32}
                                            iconSize={8}
                                            wrapperStyle={{
                                                fontSize: 11,
                                                color: "#55718a",
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <EmptyChart />
                        )}
                    </SectionCard>


                    <SectionCard
                        title="Bed Status"
                        subtitle="Capacity distribution"
                        icon={BedDouble}
                    >
                        {bedStatus.length > 0 ? (
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >
                                    <PieChart>
                                        <Pie
                                            data={bedStatus}
                                            dataKey="value"
                                            nameKey="label"
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={48}
                                            outerRadius={78}
                                            paddingAngle={3}
                                        >
                                            {bedStatus.map(
                                                (_, index) => (
                                                    <Cell
                                                        key={index}
                                                        fill={
                                                            COLORS[
                                                                index %
                                                                    COLORS.length
                                                            ]
                                                        }
                                                    />
                                                )
                                            )}
                                        </Pie>

                                        <Tooltip
                                            formatter={(
                                                value
                                            ) =>
                                                formatNumber(
                                                    value
                                                )
                                            }
                                        />

                                        <Legend
                                            verticalAlign="bottom"
                                            height={32}
                                            iconSize={8}
                                            wrapperStyle={{
                                                fontSize: 11,
                                                color: "#55718a",
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <EmptyChart />
                        )}
                    </SectionCard>


                    <SectionCard
                        title="Emergency Triage"
                        subtitle="Clinical urgency distribution"
                        icon={ShieldAlert}
                    >
                        {emergencyTriage.length > 0 ? (
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >
                                    <BarChart
                                        data={emergencyTriage}
                                        layout="vertical"
                                        margin={{
                                            top: 5,
                                            right: 10,
                                            left: 10,
                                            bottom: 5,
                                        }}
                                    >
                                        <CartesianGrid
                                            stroke="#e4edf3"
                                            horizontal={false}
                                        />

                                        <XAxis
                                            type="number"
                                            allowDecimals={false}
                                            tick={{
                                                fill: "#8298aa",
                                                fontSize: 11,
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                        />

                                        <YAxis
                                            type="category"
                                            dataKey="label"
                                            width={70}
                                            tick={{
                                                fill: "#55718a",
                                                fontSize: 10,
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                        />

                                        <Tooltip
                                            content={
                                                <CustomTooltip />
                                            }
                                        />

                                        <Bar
                                            dataKey="value"
                                            name="Cases"
                                            fill="#ef6b73"
                                            radius={[
                                                0,
                                                6,
                                                6,
                                                0,
                                            ]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <EmptyChart />
                        )}
                    </SectionCard>


                    <SectionCard
                        title="Surgery Status"
                        subtitle="Operational distribution"
                        icon={Scissors}
                    >
                        {surgeryStatus.length > 0 ? (
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >
                                    <PieChart>
                                        <Pie
                                            data={surgeryStatus}
                                            dataKey="value"
                                            nameKey="label"
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={48}
                                            outerRadius={78}
                                            paddingAngle={3}
                                        >
                                            {surgeryStatus.map(
                                                (_, index) => (
                                                    <Cell
                                                        key={index}
                                                        fill={
                                                            COLORS[
                                                                index %
                                                                    COLORS.length
                                                            ]
                                                        }
                                                    />
                                                )
                                            )}
                                        </Pie>

                                        <Tooltip
                                            formatter={(
                                                value
                                            ) =>
                                                formatNumber(
                                                    value
                                                )
                                            }
                                        />

                                        <Legend
                                            verticalAlign="bottom"
                                            height={32}
                                            iconSize={8}
                                            wrapperStyle={{
                                                fontSize: 11,
                                                color: "#55718a",
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <EmptyChart />
                        )}
                    </SectionCard>

                </div>


                {/* CAPACITY + FINANCE + STAFF */}

                <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-3">

                    <SectionCard
                        title="Bed Capacity"
                        subtitle="Current hospital utilization"
                        icon={BedDouble}
                    >
                        <div className="space-y-5">

                            <div>
                                <div className="mb-2 flex items-center justify-between text-sm">
                                    <span className="font-semibold text-[#55718a]">
                                        Occupancy
                                    </span>

                                    <span className="font-bold text-[#153653]">
                                        {occupancy.toFixed(1)}%
                                    </span>
                                </div>

                                <div className="h-3 overflow-hidden rounded-full bg-[#e7f0f5]">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-[#08b9d8] to-[#3478ed] transition-all"
                                        style={{
                                            width: `${occupancy}%`,
                                        }}
                                    />
                                </div>
                            </div>


                            <div className="grid grid-cols-2 gap-3">

                                <div className="rounded-xl border border-[#d8e6ef] bg-[#f8fbfd] p-4">
                                    <p className="text-xs text-[#8298aa]">
                                        Total Beds
                                    </p>

                                    <p className="mt-1 text-xl font-bold text-[#153653]">
                                        {formatNumber(
                                            beds.total_beds
                                        )}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-[#d8e6ef] bg-[#f8fbfd] p-4">
                                    <p className="text-xs text-[#8298aa]">
                                        Occupied
                                    </p>

                                    <p className="mt-1 text-xl font-bold text-[#153653]">
                                        {formatNumber(
                                            beds.occupied_beds
                                        )}
                                    </p>
                                </div>

                            </div>

                        </div>
                    </SectionCard>


                    <SectionCard
                        title="Financial Snapshot"
                        subtitle="Aggregated billing and payment figures"
                        icon={CreditCard}
                    >
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                            <div className="rounded-xl border border-[#d8e6ef] bg-[#f8fbfd] p-4">
                                <div className="flex items-center gap-2 text-[#55718a]">
                                    <DollarSign size={15} />
                                    <span className="text-xs font-semibold">
                                        Invoice Total
                                    </span>
                                </div>

                                <p className="mt-2 text-xl font-bold text-[#153653]">
                                    {formatCurrency(
                                        financial.invoice_total
                                    )}
                                </p>
                            </div>


                            <div className="rounded-xl border border-[#d8e6ef] bg-[#ecfbf4] p-4">
                                <div className="flex items-center gap-2 text-[#169b63]">
                                    <CheckCircle2 size={15} />
                                    <span className="text-xs font-semibold">
                                        Paid Amount
                                    </span>
                                </div>

                                <p className="mt-2 text-xl font-bold text-[#153653]">
                                    {formatCurrency(
                                        financial.paid_amount
                                    )}
                                </p>
                            </div>


                            <div className="rounded-xl border border-[#d8e6ef] bg-[#fff8e8] p-4">
                                <div className="flex items-center gap-2 text-[#d99100]">
                                    <Clock3 size={15} />
                                    <span className="text-xs font-semibold">
                                        Outstanding
                                    </span>
                                </div>

                                <p className="mt-2 text-xl font-bold text-[#153653]">
                                    {formatCurrency(
                                        financial.outstanding_balance
                                    )}
                                </p>
                            </div>


                            <div className="rounded-xl border border-[#d8e6ef] bg-[#eef4ff] p-4">
                                <div className="flex items-center gap-2 text-[#3478ed]">
                                    <CreditCard size={15} />
                                    <span className="text-xs font-semibold">
                                        Collections
                                    </span>
                                </div>

                                <p className="mt-2 text-xl font-bold text-[#153653]">
                                    {formatCurrency(
                                        financial.payment_collection
                                    )}
                                </p>
                            </div>

                        </div>
                    </SectionCard>


                    <SectionCard
                        title="Clinical Workforce"
                        subtitle="Doctors, nurses and staff"
                        icon={Stethoscope}
                    >
                        <div className="h-[240px] w-full">

                            {staffData.some(
                                (item) =>
                                    item.value > 0
                            ) ? (
                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >
                                    <BarChart
                                        data={staffData}
                                        margin={{
                                            top: 10,
                                            right: 10,
                                            left: -20,
                                            bottom: 5,
                                        }}
                                    >
                                        <CartesianGrid
                                            stroke="#e4edf3"
                                            vertical={false}
                                        />

                                        <XAxis
                                            dataKey="name"
                                            tick={{
                                                fill: "#55718a",
                                                fontSize: 11,
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                        />

                                        <YAxis
                                            allowDecimals={false}
                                            tick={{
                                                fill: "#8298aa",
                                                fontSize: 11,
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                        />

                                        <Tooltip
                                            content={
                                                <CustomTooltip />
                                            }
                                        />

                                        <Bar
                                            dataKey="value"
                                            name="People"
                                            fill="#3478ed"
                                            radius={[
                                                6,
                                                6,
                                                0,
                                                0,
                                            ]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyChart
                                    message="No workforce records available yet."
                                />
                            )}

                        </div>
                    </SectionCard>

                </div>


                {/* FOOTER STATUS */}

                <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-[#d8e6ef] bg-white px-5 py-4 shadow-[0_8px_30px_rgba(21,54,83,0.04)] sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-center gap-3">

                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ecfbf4] text-[#169b63]">
                            <CheckCircle2 size={18} />
                        </div>

                        <div>
                            <p className="text-sm font-bold text-[#153653]">
                                Analytics engine operational
                            </p>

                            <p className="text-xs text-[#8298aa]">
                                Data is sourced from the live hospital backend.
                            </p>
                        </div>

                    </div>


                    <div className="flex items-center gap-2 text-xs font-semibold text-[#55718a]">
                        <Activity size={14} className="text-[#08a9c8]" />

                        Auto-refresh: 60 seconds
                    </div>

                </div>

            </div>

        </div>
    );
}
