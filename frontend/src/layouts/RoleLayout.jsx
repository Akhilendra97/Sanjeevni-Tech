import React from "react";
import {
    ChevronDown,
    Home,
    LogOut,
    Menu,
    PanelLeftClose,
    PanelLeftOpen,
    Settings,
    UserCircle,
} from "lucide-react";
import {
    NavLink,
    Outlet,
    useNavigate,
} from "react-router-dom";
import QuickSearch from "../components/navigation/QuickSearch";
import NotificationBell from "../components/navigation/NotificationBell";

const ROLE_CONFIG = {
    staff: {
        title: "Staff Portal",
        subtitle: "Hospital support workspace",
        home: "/staff",
        items: [
            ["Dashboard", "/staff", Home],
            ["My Profile", "/staff/profile", UserCircle],
            ["Duty & Availability", "/staff/availability", Settings],
        ],
    },

    doctor: {
        title: "Doctor Portal",
        subtitle: "Clinical workspace",
        home: "/doctor",
        items: [
            ["Dashboard", "/doctor", Home],
            ["Appointments", "/doctor/appointments", UserCircle],
            ["Patients", "/doctor/patients", UserCircle],
            ["Medical Records", "/doctor/medical-records", UserCircle],
            ["Prescriptions", "/doctor/prescriptions", UserCircle],
            ["Laboratory", "/doctor/lab-reports", UserCircle],
            ["Radiology", "/doctor/radiology-reports", UserCircle],
            ["Surgery", "/doctor/surgery", UserCircle],
            ["Duty Schedule", "/doctor/duty-schedule", UserCircle],
            ["Profile & Settings", "/doctor/profile", Settings],
        ],
    },

    nurse: {
        title: "Nurse Portal",
        subtitle: "Patient care workspace",
        home: "/nurse",
        items: [
            ["Dashboard", "/nurse", Home],
            ["Assigned Patients", "/nurse/assigned-patients", UserCircle],
            ["Vitals", "/nurse/vitals", UserCircle],
            ["Medication Schedule", "/nurse/medication-schedule", UserCircle],
            ["Nursing Notes", "/nurse/nursing-notes", UserCircle],
            ["Care Plans", "/nurse/care-plans", UserCircle],
        ],
    },

    patient: {
        title: "Patient Portal",
        subtitle: "Your healthcare workspace",
        home: "/patient",
        items: [
            ["Dashboard", "/patient", Home],
            ["Appointments", "/patient/appointments", UserCircle],
            ["Medical History", "/patient/medical-history", UserCircle],
            ["Prescriptions", "/patient/prescriptions", UserCircle],
            ["Lab Reports", "/patient/lab-reports", UserCircle],
            ["Radiology Reports", "/patient/radiology-reports", UserCircle],
            ["Bills", "/patient/bills", UserCircle],
            ["Payments", "/patient/payments", UserCircle],
            ["Documents", "/patient/documents", UserCircle],
            ["Insurance", "/patient/insurance", UserCircle],
        ],
    },

    receptionist: {
        title: "Receptionist Portal",
        subtitle: "Front desk operations",
        home: "/receptionist",
        items: [
            ["Dashboard", "/receptionist", Home],
            ["Patients", "/receptionist/patients", UserCircle],
            ["Register Patient", "/receptionist/register-patient", UserCircle],
            ["Appointments", "/receptionist/appointments", UserCircle],
            ["Admissions", "/receptionist/admissions", UserCircle],
            ["Discharges", "/receptionist/discharges", UserCircle],
            ["Queue", "/receptionist/queue", UserCircle],
        ],
    },

    laboratory: {
        title: "Laboratory Portal",
        subtitle: "Laboratory operations",
        home: "/laboratory",
        items: [
            ["Dashboard", "/laboratory", Home],
            ["Samples", "/laboratory/samples", UserCircle],
            ["Test Requests", "/laboratory/test-requests", UserCircle],
            ["Test Results", "/laboratory/test-results", UserCircle],
            ["Reports", "/laboratory/reports", UserCircle],
        ],
    },

    pharmacist: {
        title: "Pharmacy Portal",
        subtitle: "Medication & inventory",
        home: "/pharmacist",
        items: [
            ["Dashboard", "/pharmacist", Home],
            ["Medicines", "/pharmacist/medicines", UserCircle],
            ["Inventory", "/pharmacist/inventory", UserCircle],
            ["Suppliers", "/pharmacist/suppliers", UserCircle],
            ["Purchase Orders", "/pharmacist/purchase-orders", UserCircle],
            ["Stock Receiving", "/pharmacist/stock-receiving", UserCircle],
            ["Prescriptions", "/pharmacist/prescriptions", UserCircle],
            ["Dispensing", "/pharmacist/dispensing", UserCircle],
        ],
    },

    accountant: {
        title: "Accountant Portal",
        subtitle: "Finance & billing workspace",
        home: "/accountant",
        items: [
            ["Dashboard", "/accountant", Home],
            ["Bills", "/accountant/bills", UserCircle],
            ["Invoices", "/accountant/invoices", UserCircle],
            ["Payments", "/accountant/payments", UserCircle],
            ["Revenue", "/accountant/revenue", UserCircle],
            ["Insurance Claims", "/accountant/insurance-claims", UserCircle],
        ],
    },
};

export default function RoleLayout({ role = "doctor" }) {
    const navigate = useNavigate();
    const config = ROLE_CONFIG[role] || ROLE_CONFIG.doctor;

    const [collapsed, setCollapsed] = React.useState(false);
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const [profileOpen, setProfileOpen] = React.useState(false);

    const user = (() => {
        try {
            return JSON.parse(localStorage.getItem("user") || "{}");
        } catch {
            return {};
        }
    })();

    const logout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">

            {/* MOBILE OVERLAY */}
            {mobileOpen && (
                <button
                    type="button"
                    aria-label="Close navigation"
                    onClick={() => setMobileOpen(false)}
                    className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden"
                />
            )}

            {/* SIDEBAR */}
            <aside
                className={[
                    "fixed inset-y-0 left-0 z-50 flex flex-col",
                    "border-r border-slate-200 bg-white",
                    "transition-all duration-200",
                    collapsed ? "w-[76px]" : "w-[260px]",
                    mobileOpen
                        ? "translate-x-0"
                        : "-translate-x-full lg:translate-x-0",
                ].join(" ")}
            >

                {/* BRAND */}
                <div className="flex h-20 items-center border-b border-slate-200 px-5">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-100">
                            <span className="text-lg font-black">S</span>
                        </div>

                        {!collapsed && (
                            <div className="min-w-0">
                                <p className="truncate text-sm font-black tracking-wide text-slate-900">
                                    SANJEEVNI TECH
                                </p>
                                <p className="truncate text-xs font-medium text-slate-500">
                                    Smart Hospital
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* NAVIGATION */}
                <nav className="flex-1 overflow-y-auto px-3 py-5">
                    <p
                        className={[
                            "mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400",
                            collapsed ? "text-center" : "",
                        ].join(" ")}
                    >
                        {collapsed ? "MENU" : "Workspace"}
                    </p>

                    <div className="space-y-1.5">
                        {config.items.map(([label, path, Icon]) => (
                            <NavLink
                                key={path}
                                to={path}
                                end={path === config.home}
                                onClick={() => setMobileOpen(false)}
                                className={({ isActive }) =>
                                    [
                                        "group flex items-center gap-3 rounded-xl px-3 py-3",
                                        "text-sm font-semibold transition-all",
                                        isActive
                                            ? "bg-gradient-to-r from-cyan-50 to-blue-50 text-blue-700 shadow-sm"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                                    ].join(" ")
                                }
                                title={collapsed ? label : undefined}
                            >
                                <Icon size={18} className="shrink-0" />

                                {!collapsed && (
                                    <span className="truncate">
                                        {label}
                                    </span>
                                )}
                            </NavLink>
                        ))}
                    </div>
                </nav>

                {/* SIDEBAR FOOTER */}
                <div className="border-t border-slate-200 p-3">
                    <button
                        type="button"
                        onClick={() => navigate(`${config.home}/profile`)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-slate-50"
                    >
                        <UserCircle size={20} className="text-slate-500" />

                        {!collapsed && (
                            <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-slate-800">
                                    {user?.full_name || user?.username || "User"}
                                </p>
                                <p className="truncate text-xs capitalize text-slate-500">
                                    {user?.role || role}
                                </p>
                            </div>
                        )}
                    </button>
                </div>
            </aside>

            {/* MAIN */}
            <div
                className={[
                    "min-h-screen transition-all duration-200",
                    collapsed ? "lg:pl-[76px]" : "lg:pl-[260px]",
                ].join(" ")}
            >

                {/* HEADER */}
                <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setMobileOpen(true)}
                            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
                            aria-label="Open navigation"
                        >
                            <Menu size={21} />
                        </button>

                        <button
                            type="button"
                            onClick={() => setCollapsed((value) => !value)}
                            className="hidden rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:block"
                            aria-label="Toggle sidebar"
                        >
                            {collapsed ? (
                                <PanelLeftOpen size={21} />
                            ) : (
                                <PanelLeftClose size={21} />
                            )}
                        </button>

                        <div>
                            <h1 className="text-lg font-black text-slate-900">
                                {config.title}
                            </h1>
                            <p className="hidden text-xs font-medium text-slate-500 sm:block">
                                {config.subtitle}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">

                        <div className="hidden md:block"><QuickSearch /></div>
                        <NotificationBell />

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setProfileOpen((value) => !value)}
                                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2 hover:bg-slate-50"
                            >
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-sm font-black text-white">
                                    {(user?.full_name || user?.username || "U")
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>

                                <div className="hidden text-left md:block">
                                    <p className="max-w-[130px] truncate text-xs font-bold text-slate-800">
                                        {user?.full_name || user?.username || "User"}
                                    </p>
                                    <p className="text-[11px] capitalize text-slate-500">
                                        {user?.role || role}
                                    </p>
                                </div>

                                <ChevronDown size={16} className="hidden text-slate-400 sm:block" />
                            </button>

                            {profileOpen && (
                                <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setProfileOpen(false);
                                            navigate(`${config.home}/profile`);
                                        }}
                                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                    >
                                        <Settings size={17} />
                                        Profile & Settings
                                    </button>

                                    <button
                                        type="button"
                                        onClick={logout}
                                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                                    >
                                        <LogOut size={17} />
                                        Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* PAGE CONTENT */}
                <main className="min-h-[calc(100vh-80px)] p-4 sm:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}


