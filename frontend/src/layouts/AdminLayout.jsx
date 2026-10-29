import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/navigation/Sidebar";
import Navbar from "../components/navigation/Navbar";
import { useAuth } from "../context/AuthContext";

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout } = useAuth();

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      logout();
    }
  };

  return (
    <div className="app-shell min-h-screen">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((value) => !value)}
        onLogout={handleLogout}
      />

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <Sidebar
            collapsed={false}
            mobile
            onToggle={() => setMobileOpen(false)}
            onLogout={handleLogout}
          />
        </div>
      )}

      <div
        className={[
          "min-h-screen transition-all duration-300",
          collapsed ? "lg:pl-[82px]" : "lg:pl-[258px]",
        ].join(" ")}
      >
        <Navbar onMobileMenu={() => setMobileOpen(true)} />

        <main className="hospital-light-workspace min-h-[calc(100vh-72px)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


