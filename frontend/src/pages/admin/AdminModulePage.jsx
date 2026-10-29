import Departments from "./Departments";
import HospitalSettings from "./HospitalSettings";
import Wards from "./Wards";
import Nurses from "./Nurses";
import Staff from "./Staff";
import Doctors from "./Doctors";
import Laboratory from "./Laboratory";
import AuditLogs from "./AuditLogs";
import Users from "./Users";

import {
    Activity,
    ArrowLeft,
    BarChart3,
    BedDouble,
    ClipboardList,
    FileText,
    FlaskConical,
    Hospital,
    Settings,
    ShieldCheck,
    Stethoscope,
    Users as UsersIcon,
} from "lucide-react";

import {
    Link,
    useLocation,
} from "react-router-dom";


const moduleConfig = {

    departments: {
        title: "Departments",
        description:
            "Manage hospital departments, specialties and operational units.",
        icon: Hospital,
    },

    doctors: {
        title: "Doctors",
        description:
            "Manage doctors, professional profiles, schedules and clinical assignments.",
        icon: Stethoscope,
    },

    nurses: {
        title: "Nurses",
        description:
            "Manage nursing staff, assignments and hospital nursing operations.",
        icon: UsersIcon,
    },

    staff: {
        title: "Staff",
        description:
            "Manage hospital staff accounts, responsibilities and workforce operations.",
        icon: ClipboardList,
    },

    users: {
        title: "Users",
        description:
            "Manage system users, roles, access and account status.",
        icon: ShieldCheck,
    },

    analytics: {
        title: "Analytics",
        description:
            "Explore hospital performance, operational intelligence and live analytics.",
        icon: BarChart3,
    },

    "audit-logs": {
        title: "Audit Logs",
        description:
            "Review security events, system activity and administrative audit records.",
        icon: FileText,
    },

    "hospital-settings": {
        title: "Hospital Settings",
        description:
            "Configure hospital-wide settings and platform preferences.",
        icon: Settings,
    },

    wards: {
        title: "Wards",
        description:
            "Manage wards, bed capacity and current hospital occupancy.",
        icon: BedDouble,
    },

    laboratory: {
        title: "Laboratory",
        description:
            "Manage laboratory services, tests, samples and reports.",
        icon: FlaskConical,
    },
};


export default function AdminModulePage() {
    const location = useLocation();

    const key =
        location.pathname
            .replace("/admin/", "")
            .replace(/\/$/, "") ||
        "dashboard";


    if (key === "departments") {
        return <Departments />;
    }

    if (key === "wards") {
        return <Wards />;
    }

    if (key === "nurses") {
        return <Nurses />;
    }

    if (key === "staff") {
        return <Staff />;
    }

    if (key === "doctors") {
        return <Doctors />;
    }

    if (key === "laboratory") {
        return <Laboratory />;
    }

    if (key === "users") {
        return <Users />;
    }

    if (key === "audit-logs") {
        return <AuditLogs />;
    }


    // Hospital Settings has its own complete page.
    // This is intentionally placed AFTER all React hooks.
    if (key === "hospital-settings") {
        return <HospitalSettings />;
    }
    const config =
        moduleConfig[key] || {
            title: "Hospital Operations",
            description:
                "Hospital management module.",
            icon: Activity,
        };

    const Icon = config.icon;


    return (
        <div className="min-h-full bg-[#eef5fa] text-[#153653]">

            <div className="mx-auto max-w-[1500px] p-6 lg:p-8">

                <div className="mb-6">

                    <Link
                        to="/admin"
                        className="inline-flex items-center gap-2 rounded-xl border border-[#d8e6ef] bg-white px-4 py-2.5 text-sm font-semibold text-[#55718a] shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-[#08b9d8]"
                    >
                        <ArrowLeft size={16} />
                        Back to Command Center
                    </Link>

                </div>


                <div className="rounded-3xl border border-[#d8e6ef] bg-white p-7 shadow-sm lg:p-9">

                    <div className="flex flex-col gap-6 md:flex-row md:items-center">

                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-[#08b9d8]">
                            <Icon size={30} />
                        </div>

                        <div>

                            <div className="mb-2 flex items-center gap-2">

                                <span className="h-2 w-2 rounded-full bg-[#08b9d8]" />

                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#55718a]">
                                    Hospital Operations
                                </span>

                            </div>

                            <h1 className="text-3xl font-bold tracking-tight text-[#153653]">
                                {config.title}
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#55718a]">
                                {config.description}
                            </p>

                        </div>

                    </div>


                    <div className="mt-8 grid gap-4 md:grid-cols-3">

                        <div className="rounded-2xl border border-[#d8e6ef] bg-[#f8fbfd] p-5">

                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8298aa]">
                                Module Status
                            </p>

                            <div className="mt-3 flex items-center gap-2">

                                <span className="h-2 w-2 rounded-full bg-emerald-500" />

                                <span className="text-sm font-semibold text-emerald-700">
                                    Connected
                                </span>

                            </div>

                        </div>


                        <div className="rounded-2xl border border-[#d8e6ef] bg-[#f8fbfd] p-5">

                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8298aa]">
                                Access
                            </p>

                            <p className="mt-3 text-sm font-semibold text-[#55718a]">
                                Administrator
                            </p>

                        </div>


                        <div className="rounded-2xl border border-[#d8e6ef] bg-[#f8fbfd] p-5">

                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8298aa]">
                                Platform
                            </p>

                            <p className="mt-3 text-sm font-semibold text-[#55718a]">
                                Sanjeevni Tech
                            </p>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}







