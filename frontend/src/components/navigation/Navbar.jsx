import {
  Menu,
  ShieldCheck,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import QuickSearch from "./QuickSearch";
import NotificationBell from "./NotificationBell";

const titles = {
  "/admin": ["Hospital Overview", "Real-time clinical operations"],
  "/admin/departments": ["Departments", "Manage hospital departments"],
  "/admin/doctors": ["Doctors", "Clinical workforce management"],
  "/admin/nurses": ["Nurses", "Nursing workforce management"],
  "/admin/staff": ["Staff", "Hospital staff management"],
  "/admin/users": ["Users", "Access and identity management"],
  "/admin/wards": ["Wards & Beds", "Capacity and bed management"],
  "/admin/laboratory": ["Laboratory", "Diagnostic services"],
  "/admin/analytics": ["Analytics", "Hospital performance intelligence"],
  "/admin/audit-logs": ["Audit Logs", "Security and activity history"],
  "/admin/hospital-settings": ["Hospital Settings", "System configuration"],
};

export default function Navbar({ onMobileMenu }) {
  const location = useLocation();
  const { user } = useAuth();

  const title =
    titles[location.pathname]?.[0] || "Hospital Management";
  const subtitle =
    titles[location.pathname]?.[1] ||
    "Sanjeevni Tech Smart Hospital";

  const fullName = user?.full_name || user?.username || "Administrator";
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <header className="hospital-navbar sticky top-0 z-30 h-[72px]">
      <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onMobileMenu}
            className="navbar-action flex h-9 w-9 shrink-0 items-center justify-center rounded-lg lg:hidden"
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>

          <div className="min-w-0">
            <div className="navbar-title truncate text-[15px] sm:text-[16px]">
              {title}
            </div>
            <div className="navbar-subtitle mt-0.5 truncate text-[10px] sm:text-[11px]">
              {subtitle}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:block"><QuickSearch compact /></div>
          <NotificationBell />

          <div className="mx-1 hidden h-7 w-px bg-slate-200 sm:block" />

          <div className="flex items-center gap-2">
            <div className="navbar-avatar flex h-9 w-9 items-center justify-center rounded-xl text-[11px] font-extrabold text-white">
              {initials || "AD"}
            </div>

            <div className="hidden min-w-0 lg:block">
              <div className="max-w-[150px] truncate text-[12px] font-bold text-[#153653]">
                {fullName}
              </div>
              <div className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-[#8298aa]">
                <ShieldCheck size={10} />
                Administrator
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}


