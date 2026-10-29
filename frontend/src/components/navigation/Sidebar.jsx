import { NavLink } from "react-router-dom";
import {
  Activity,
  BarChart3,
  BedDouble,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CalendarClock,
  FlaskConical,
  Hospital,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Stethoscope,
  Users,
  UserRoundCog,
  UserRoundPlus,
} from "lucide-react";

const operations = [
  { label: "Overview", path: "/admin", icon: LayoutDashboard, end: true },
  { label: "Departments", path: "/admin/departments", icon: Building2 },
  { label: "Doctors", path: "/admin/doctors", icon: Stethoscope },
  { label: "Nurses", path: "/admin/nurses", icon: Activity },
  { label: "Staff", path: "/admin/staff", icon: Users },
  { label: "Staff Duty Roster", path: "/admin/staff-duties", icon: CalendarClock },
  { label: "Users", path: "/admin/users", icon: UserRoundCog },
  { label: "Wards", path: "/admin/wards", icon: Building2 },
  { label: "Beds & Occupancy", path: "/admin/beds", icon: BedDouble },
  { label: "Laboratory", path: "/admin/laboratory", icon: FlaskConical },
];

const intelligence = [
  { label: "Analytics", path: "/admin/analytics", icon: BarChart3 },
  { label: "Audit Logs", path: "/admin/audit-logs", icon: ShieldCheck },
];

const administration = [
  { label: "Hospital Settings", path: "/admin/hospital-settings", icon: Settings },
];

function NavigationItem({ item, collapsed }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      end={item.end}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        [
          "sidebar-link group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold",
          collapsed ? "justify-center" : "",
          isActive ? "active" : "",
        ].join(" ")
      }
    >
      <Icon size={17} strokeWidth={2} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );
}

function Section({ title, items, collapsed }) {
  return (
    <section className="mb-5">
      {!collapsed && (
        <div className="sidebar-section-title px-3 mb-2">
          {title}
        </div>
      )}

      <div className="space-y-1">
        {items.map((item) => (
          <NavigationItem
            key={item.path}
            item={item}
            collapsed={collapsed}
          />
        ))}
      </div>
    </section>
  );
}

export default function Sidebar({
  collapsed = false,
  onToggle,
  onLogout,
  mobile = false,
}) {
  return (
    <aside
      className={[
        "hospital-sidebar fixed inset-y-0 left-0 z-40 flex flex-col",
        mobile ? "w-[258px]" : "hidden lg:flex",
        collapsed && !mobile ? "w-[82px]" : "w-[258px]",
      ].join(" ")}
    >
      <div className="sidebar-brand flex h-[72px] items-center px-4">
        <div className="sidebar-logo flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
          <Hospital size={21} />
        </div>

        {(!collapsed || mobile) && (
          <div className="ml-3 min-w-0">
            <div className="text-[15px] font-extrabold tracking-tight">
              Sanjeevni Tech
            </div>
            <div className="mt-0.5 text-[9px] font-bold uppercase tracking-[.16em] text-white/45">
              Smart Hospital ERP
            </div>
          </div>
        )}

        {!mobile && (
          <button
            onClick={onToggle}
            className="ml-auto hidden h-7 w-7 items-center justify-center rounded-lg text-white/55 transition hover:bg-white/10 hover:text-white lg:flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight size={15} />
            ) : (
              <ChevronLeft size={15} />
            )}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-5">
        <Section
          title="Hospital Operations"
          items={operations}
          collapsed={collapsed && !mobile}
        />

        <Section
          title="Intelligence"
          items={intelligence}
          collapsed={collapsed && !mobile}
        />

        <Section
          title="Administration"
          items={administration}
          collapsed={collapsed && !mobile}
        />
      </div>

      <div className="sidebar-logout px-3 py-3">
        <button
          onClick={onLogout}
          className={[
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition",
            collapsed && !mobile ? "justify-center" : "",
          ].join(" ")}
          title={collapsed && !mobile ? "Sign out" : undefined}
        >
          <LogOut size={17} />
          {(!collapsed || mobile) && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}



