import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  UserCircle,
  Mail,
  ShieldCheck,
  RefreshCw,
  LogOut,
  CheckCircle2,
  Clock3,
  Hash,
} from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api/v1";

function decodeJwtPayload(token) {
  try {
    const part = token.split(".")[1];
    if (!part) return {};

    const normalized = part
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );

    return JSON.parse(atob(padded));
  } catch {
    return {};
  }
}

function getStoredUser() {
  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("token");

  if (!token) return {};

  const payload = decodeJwtPayload(token);

  return {
    id: payload.sub || payload.user_id || payload.id || "",
    username: payload.username || payload.preferred_username || "",
    email: payload.email || "",
    full_name:
      payload.full_name ||
      payload.name ||
      payload.username ||
      "Receptionist",
    role: payload.role || "receptionist",
    status: payload.status || "active",
  };
}

async function requestCurrentUser() {
  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("token");

  if (!token) return null;

  const endpoints = ["/auth/me", "/users/me"];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) continue;

      const data = await response.json();

      return data?.data || data?.user || data;
    } catch {
      // Try the next supported endpoint.
    }
  }

  return null;
}

export default function Profile() {
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const stored = getStoredUser();

    if (Object.keys(stored).length > 0) {
      setUser(stored);
    }

    const liveUser = await requestCurrentUser();

    if (liveUser && typeof liveUser === "object") {
      setUser((previous) => {
        const merged = { ...previous, ...liveUser };
        return merged;
      });
      setMessage("Profile loaded from the hospital authentication service.");
    } else if (Object.keys(stored).length > 0) {
      setUser((previous) => ({
        ...previous,
        full_name: previous.full_name || "",
        username: previous.username || "",
      }));
      setMessage("Profile loaded from the authenticated session.");
    } else {
      setMessage("No authenticated profile information is available.");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const initials = useMemo(() => {
    const name =
      user.full_name ||
      user.username ||
      user.email ||
      "A";

    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }, [user]);

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-full bg-slate-50 px-6 py-7">
      <div className="mx-auto max-w-6xl space-y-6">

        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-2xl font-bold text-white shadow-lg shadow-blue-100">
                {initials}
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-600">
                  Receptionist Workspace
                </p>

                <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                  Profile & Account
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  View the currently authenticated receptionist account.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={loadProfile}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-300 hover:text-cyan-700 disabled:opacity-60"
              >
                <RefreshCw
                  size={17}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>

              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <LogOut size={17} />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div className="flex items-center gap-3 rounded-2xl border border-cyan-100 bg-cyan-50 px-5 py-4 text-sm text-cyan-800">
            <CheckCircle2 size={18} />
            {message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-cyan-50 p-3 text-cyan-600">
                <UserCircle size={22} />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Account Information
                </h2>
                <p className="text-sm text-slate-500">
                  Current authenticated user details
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Full Name
                </div>
                <div className="font-semibold text-slate-900">
                  {user.full_name || "Not available"}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <Mail size={14} />
                  Email
                </div>
                <div className="break-all font-semibold text-slate-900">
                  {user.email || "Not available"}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Username
                </div>
                <div className="font-semibold text-slate-900">
                  {user.username || "Not available"}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <ShieldCheck size={14} />
                  Role
                </div>
                <div className="font-semibold capitalize text-slate-900">
                  {user.role || "receptionist"}
                </div>
              </div>

            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="font-bold text-slate-900">
              Account Status
            </h2>

            <div className="mt-6 space-y-4">

              <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                <span className="flex items-center gap-2 text-sm text-slate-500">
                  <CheckCircle2 size={17} />
                  Status
                </span>

                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold capitalize text-emerald-700">
                  {user.status || "active"}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                <span className="flex items-center gap-2 text-sm text-slate-500">
                  <ShieldCheck size={17} />
                  Access
                </span>

                <span className="text-sm font-bold capitalize text-slate-900">
                  {user.role || "receptionist"}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                <span className="flex items-center gap-2 text-sm text-slate-500">
                  <Hash size={17} />
                  User ID
                </span>

                <span className="max-w-[130px] truncate text-sm font-bold text-slate-900">
                  {String(user.id || "N/A")}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                <span className="flex items-center gap-2 text-sm text-slate-500">
                  <Clock3 size={17} />
                  Session
                </span>

                <span className="text-sm font-bold text-emerald-700">
                  Authenticated
                </span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
