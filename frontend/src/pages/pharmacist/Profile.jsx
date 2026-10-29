import { useEffect, useState } from "react";
import { UserRound, ShieldCheck, BriefcaseMedical, RefreshCw, Mail, Phone, BadgeCheck } from "lucide-react";
import api from "../../services/api";

export default function PharmacistProfile() {
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProfile = async () => {
    setLoading(true);
    setError("");
    try {
      // Use the authenticated session already established by the app API client.
      const candidates = ["/users/me", "/auth/me", "/users/profile"];
      let result = null;
      for (const endpoint of candidates) {
        try {
          const response = await api.get(endpoint);
          result = response?.data?.data ?? response?.data?.user ?? response?.data;
          if (result && typeof result === "object") break;
        } catch (e) {
          if (![404, 405].includes(e?.response?.status)) throw e;
        }
      }
      if (!result) throw new Error("Profile endpoint was not found. Check the backend's authenticated-user endpoint.");
      setUser(result);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || "Unable to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProfile(); }, []);

  const displayName = user.full_name || user.name || user.username || "Signed-in Pharmacist";
  const email = user.email || "Not provided by account";
  const role = user.role || "pharmacist";

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-900 px-8 py-8 text-white">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400/15 ring-1 ring-white/20">
                <UserRound size={30} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">Pharmacist workspace</p>
                <h1 className="mt-2 text-3xl font-bold">My Profile</h1>
                <p className="mt-1 text-sm text-slate-300">Account details and role information</p>
              </div>
            </div>
            <button onClick={loadProfile} className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold hover:bg-white/10">
              <RefreshCw size={16}/> Refresh
            </button>
          </div>
        </div>
        <div className="grid gap-4 p-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <UserRound className="mb-4 text-cyan-700" size={22}/>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Account name</p>
            <p className="mt-2 break-words text-lg font-bold text-slate-900">{loading ? "Loading…" : displayName}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <Mail className="mb-4 text-cyan-700" size={22}/>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email</p>
            <p className="mt-2 break-words text-base font-semibold text-slate-800">{loading ? "Loading…" : email}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <ShieldCheck className="mb-4 text-emerald-700" size={22}/>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Access role</p>
            <p className="mt-2 text-lg font-bold capitalize text-slate-900">{loading ? "Loading…" : String(role).replaceAll("_"," ")}</p>
          </div>
        </div>
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Professional access</h2>
        <p className="mt-1 text-sm text-slate-500">Your signed-in account is used for pharmacy operations.</p>
        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-cyan-50 p-4 text-sm text-cyan-950">
          <BadgeCheck className="mt-0.5 shrink-0 text-cyan-700" size={20}/>
          <p>Role-based access remains managed by the hospital authentication system. This page does not change credentials or permissions.</p>
        </div>
        {error && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{error}</div>}
      </section>
    </div>
  );
}
