import { useEffect, useState } from "react";
import {
    Activity, ArrowLeft, BadgeCheck, BriefcaseMedical,
    CalendarDays, CircleAlert, Clock3, IndianRupee,
    LoaderCircle, RefreshCw, ShieldCheck, Stethoscope,
    UserRound, UserRoundCheck
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getMyDoctorProfile } from "../../services/doctorApi";

const field = (label, value) => ({ label, value });

function display(value) {
    if (value === null || value === undefined || value === "") return "Not available";
    return String(value);
}

export default function Profile() {
    const { user } = useAuth();
    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function loadProfile() {
        setLoading(true);
        setError("");
        try {
            if (!user?.user_id) {
                throw new Error("Your signed-in user details are unavailable. Please sign in again.");
            }

            const match = await getMyDoctorProfile();

            if (!match || Number(match.user_id) !== Number(user.user_id)) {
                setDoctor(null);
                setError("No doctor profile is linked to this signed-in account. Please contact the hospital administrator.");
                return;
            }

            setDoctor(match);
        } catch (err) {
            const detail = err?.response?.data?.detail;
            setError(
                Array.isArray(detail)
                    ? detail.map(item => item.msg).join(", ")
                    : typeof detail === "string"
                        ? detail
                        : err.message || "Unable to load your profile."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadProfile();
    }, [user?.user_id]);

    const sections = doctor ? [
        {
            title: "Professional information",
            icon: BriefcaseMedical,
            items: [
                field("Employee ID", doctor.employee_id),
                field("Registration number", doctor.registration_number),
                field("Specialization", doctor.specialization),
                field("Qualification", doctor.qualification),
                field("Department ID", doctor.department_id),
                field("Experience", doctor.experience_years == null ? null : `${doctor.experience_years} years`)
            ]
        },
        {
            title: "Practice details",
            icon: Stethoscope,
            items: [
                field("Consultation fee", doctor.consultation_fee == null ? null : `₹${doctor.consultation_fee}`),
                field("Joining date", doctor.joining_date),
                field("Availability", doctor.is_available === true ? "Available" : doctor.is_available === false ? "Unavailable" : null),
                field("Profile last updated", doctor.updated_at ? new Date(doctor.updated_at).toLocaleString() : null)
            ]
        }
    ] : [];

    return (
        <div className="min-h-full space-y-6 bg-slate-50/70 p-4 sm:p-6 lg:p-8">
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="bg-gradient-to-r from-cyan-50 via-white to-blue-50 p-6 sm:p-8">
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                                <UserRound className="h-7 w-7" />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Doctor workspace</p>
                                <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Profile &amp; Settings</h1>
                                <p className="mt-2 text-sm text-slate-600">View your account and professional details.</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link to="/doctor" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                                <ArrowLeft className="h-4 w-4" /> Dashboard
                            </Link>
                            <button onClick={loadProfile} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-60">
                                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {loading ? (
                <section className="flex min-h-64 items-center justify-center rounded-3xl border border-slate-200 bg-white">
                    <div className="text-center">
                        <LoaderCircle className="mx-auto h-9 w-9 animate-spin text-cyan-600" />
                        <p className="mt-3 font-semibold text-slate-700">Loading your profile…</p>
                    </div>
                </section>
            ) : error ? (
                <section className="rounded-3xl border border-amber-200 bg-white p-7 shadow-sm">
                    <div className="flex gap-3">
                        <CircleAlert className="h-6 w-6 shrink-0 text-amber-600" />
                        <div>
                            <h2 className="font-bold text-slate-900">Profile needs attention</h2>
                            <p className="mt-2 text-sm leading-6 text-slate-600">{error}</p>
                            <button onClick={loadProfile} className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">Try again</button>
                        </div>
                    </div>
                </section>
            ) : doctor ? (
                <>
                    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-blue-100">
                                <Stethoscope className="h-9 w-9" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="text-2xl font-extrabold text-slate-900">{display(doctor?.full_name || doctor?.user?.full_name || user?.full_name || user?.username || "Doctor")}</h2>
                                    <BadgeCheck className="h-5 w-5 text-cyan-600" />
                                </div>
                                <p className="mt-1 text-slate-600">{display(doctor.specialization)}</p>
                                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                                    <span className="rounded-full bg-cyan-50 px-3 py-1.5 text-cyan-800">Doctor account</span>
                                    <span className={`rounded-full px-3 py-1.5 ${doctor.is_available === true ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                                        {doctor.is_available === true ? "Available" : "Not available"}
                                    </span>
                                </div>
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-4 sm:min-w-44">
                                <p className="text-xs font-medium text-slate-500">Employee ID</p>
                                <p className="mt-1 font-bold text-slate-900">{display(doctor.employee_id)}</p>
                            </div>
                        </div>
                    </section>

                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                            { label: "Experience", value: doctor.experience_years == null ? "—" : `${doctor.experience_years} yrs`, icon: Clock3 },
                            { label: "Consultation fee", value: doctor.consultation_fee == null ? "—" : `₹${doctor.consultation_fee}`, icon: IndianRupee },
                            { label: "Department ID", value: display(doctor.department_id), icon: Activity },
                            { label: "Joining date", value: display(doctor.joining_date), icon: CalendarDays }
                        ].map(item => (
                            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-slate-500">{item.label}</p>
                                    <item.icon className="h-5 w-5 text-cyan-600" />
                                </div>
                                <p className="mt-3 break-words text-xl font-extrabold text-slate-900">{item.value}</p>
                            </div>
                        ))}
                    </section>

                    {sections.map(section => (
                        <section key={section.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="rounded-xl bg-cyan-50 p-3 text-cyan-700"><section.icon className="h-5 w-5" /></div>
                                <h2 className="text-lg font-extrabold text-slate-900">{section.title}</h2>
                            </div>
                            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {section.items.map(item => (
                                    <div key={item.label} className="min-w-0 border-b border-slate-100 pb-4">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{item.label}</p>
                                        <p className="mt-2 break-words text-sm font-semibold text-slate-800">{display(item.value)}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}

                    <section className="flex gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
                        <ShieldCheck className="h-6 w-6 shrink-0 text-blue-700" />
                        <div>
                            <h3 className="font-bold text-blue-950">Account security</h3>
                            <p className="mt-1 text-sm leading-6 text-blue-900/80">Your professional details are displayed from the hospital API. Profile editing and password changes are not enabled on this page because a doctor-authorized update endpoint has not been confirmed.</p>
                        </div>
                    </section>
                </>
            ) : (
                <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
                    <UserRoundCheck className="mx-auto h-10 w-10 text-slate-400" />
                    <p className="mt-3 font-semibold text-slate-800">No profile information available.</p>
                </section>
            )}
        </div>
    );
}



