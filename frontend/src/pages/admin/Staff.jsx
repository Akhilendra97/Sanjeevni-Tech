import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Edit3,
  Eye,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";

import {
  createStaff,
  deleteStaff,
  getStaff,
  getStaffApiError,
  updateStaff,
} from "../../services/staffApi";


const EMPTY_FORM = {
  user_id: "",
  full_name: "",
  username: "",
  email: "",
  phone: "",
  password: "",
  department_id: "",
  employee_id: "",
  designation: "",
  qualification: "",
  joining_date: "",
  is_available: true,
};


function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}


function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f3049]/55 p-4 backdrop-blur-md">

      <div
        className={[
          "flex max-h-[calc(100vh-32px)] w-full flex-col overflow-hidden rounded-2xl border border-[#d8e6ef] bg-white shadow-[0_25px_70px_rgba(21,54,83,.20)]",
          wide ? "max-w-4xl" : "max-w-2xl",
        ].join(" ")}
      >

        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#e4edf2] px-6 py-5">

          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#153653]">
              {title}
            </h2>

            {subtitle && (
              <p className="mt-1 text-sm text-[#8298aa]">
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#d8e6ef] bg-white text-[#55718a] transition hover:border-[#b9d4df] hover:bg-[#f5fafc] hover:text-[#153653]"
          >
            <X size={18} />
          </button>

        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {children}
        </div>

      </div>
    </div>
  );
}


function Field({
  label,
  required = false,
  hint,
  children,
}) {
  return (
    <div className="space-y-2">

      <label className="block text-sm font-semibold text-[#153653]">
        {label}

        {required && (
          <span className="ml-1 text-[#d84b5b]">*</span>
        )}
      </label>

      {children}

      {hint && (
        <p className="text-xs text-[#a4b7c3]">
          {hint}
        </p>
      )}

    </div>
  );
}


function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  min,
}) {
  return (
    <input
      type={type}
      min={min}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="h-11 w-full rounded-xl border border-[#cfdfe8] bg-white px-3.5 text-sm font-medium text-[#153653] outline-none transition placeholder:text-[#a4b7c3] focus:border-[#67cddd] focus:ring-4 focus:ring-[#08b9d8]/10"
    />
  );
}


export default function Staff() {

  const [staff, setStaff] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modal, setModal] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const [saving, setSaving] = useState(false);


  const loadStaff = async (showRefresh = false) => {

    try {

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data = await getStaff();

      setStaff(Array.isArray(data) ? data : []);

    } catch (err) {

      setError(getStaffApiError(err));

    } finally {

      setLoading(false);
      setRefreshing(false);

    }
  };


  useEffect(() => {
    loadStaff();
  }, []);


  const stats = useMemo(() => {

    const total = staff.length;

    const available = staff.filter(
      (member) => member.is_available
    ).length;

    const unavailable = total - available;

    const designations = new Set(
      staff
        .map((member) => member.designation)
        .filter(Boolean)
    ).size;

    return {
      total,
      available,
      unavailable,
      designations,
    };

  }, [staff]);


  const filteredStaff = useMemo(() => {

    const query = search.trim().toLowerCase();

    return staff.filter((member) => {

      const matchesSearch =
        !query ||
        String(member.id).includes(query) ||
        String(member.user_id).includes(query) ||
        String(member.full_name || "").toLowerCase().includes(query) ||
        String(member.username || "").toLowerCase().includes(query) ||
        String(member.email || "").toLowerCase().includes(query) ||
        String(member.phone || "").toLowerCase().includes(query) ||
        String(member.department_id).includes(query) ||
        String(member.employee_id || "")
          .toLowerCase()
          .includes(query) ||
        String(member.designation || "")
          .toLowerCase()
          .includes(query) ||
        String(member.qualification || "")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "available" &&
          member.is_available) ||
        (statusFilter === "unavailable" &&
          !member.is_available);

      return matchesSearch && matchesStatus;

    });

  }, [staff, search, statusFilter]);


  const openCreate = () => {
    setForm(EMPTY_FORM);
    setSelectedStaff(null);
    setError("");
    setModal("create");
  };


  const openEdit = (member) => {

    setForm({
      user_id: member.user_id ?? "",
      full_name: member.full_name ?? "",
      username: member.username ?? "",
      email: member.email ?? "",
      phone: member.phone ?? "",
      password: "",
      department_id: member.department_id ?? "",
      employee_id: member.employee_id ?? "",
      designation: member.designation ?? "",
      qualification: member.qualification ?? "",
      joining_date: member.joining_date
        ? String(member.joining_date).slice(0, 10)
        : "",
      is_available: Boolean(member.is_available),
    });

    setSelectedStaff(member);
    setError("");
    setModal("edit");
  };


  const openView = (member) => {
    setSelectedStaff(member);
    setModal("view");
  };


  const closeModal = () => {

    if (saving) return;

    setModal(null);
    setSelectedStaff(null);
    setForm(EMPTY_FORM);

  };


  const handleSubmit = async (event) => {

    event.preventDefault();

    try {

      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        department_id: Number(form.department_id),
        employee_id: form.employee_id.trim(),
        designation: form.designation.trim(),
        qualification:
          form.qualification.trim() || null,
        joining_date: form.joining_date || null,
        is_available: Boolean(form.is_available),
      };

      if (modal === "create") {
        payload.full_name = form.full_name.trim();
        payload.username = form.username.trim();
        payload.email = form.email.trim();
        payload.phone = form.phone.trim() || null;
        payload.password = form.password;
      } else {
        payload.full_name = form.full_name.trim();
        payload.email = form.email.trim();
        payload.phone = form.phone.trim() || null;
      }

      if (
        !payload.department_id ||
        !payload.employee_id ||
        !payload.designation ||
        !payload.full_name ||
        !payload.email ||
        (modal === "create" && (!payload.username || !payload.password || payload.password.length < 8))
      ) {
        setError(
          "Complete all required fields. New staff passwords must be at least 8 characters."
        );
        return;
      }


      if (modal === "edit" && selectedStaff) {

        await updateStaff(
          selectedStaff.id,
          payload
        );

        setSuccess(
          "Staff profile updated successfully."
        );

      } else {

        await createStaff(payload);

        setSuccess(
          "Staff profile created successfully."
        );

      }


      closeModal();

      await loadStaff();

      setTimeout(() => setSuccess(""), 3500);

    } catch (err) {

      setError(getStaffApiError(err));

    } finally {

      setSaving(false);

    }
  };


  const handleDelete = async (member) => {

    const confirmed = window.confirm(
      `Delete staff profile ${member.employee_id}? This action cannot be undone.`
    );

    if (!confirmed) return;


    try {

      setError("");
      setSuccess("");

      await deleteStaff(member.id);

      setSuccess(
        "Staff profile deleted successfully."
      );

      await loadStaff();

      setTimeout(() => setSuccess(""), 3500);

    } catch (err) {

      setError(getStaffApiError(err));

    }
  };


  return (
    <div className="staff-page min-h-full p-5 md:p-7 lg:p-8">

      {/* HEADER */}

      <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

        <div>

          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#08aeca]">
            <ShieldCheck size={15} />
            Hospital Workforce
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[#153653]">
            Staff
          </h1>

          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#55718a]">
            Manage hospital support staff, designations,
            qualifications and workforce availability.
          </p>

        </div>


        <div className="flex flex-row items-center justify-end gap-3 flex-nowrap">

          <button
            type="button"
            onClick={() => loadStaff(true)}
            disabled={refreshing}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#d5e4ec] bg-white px-4 text-sm font-semibold text-[#55718a] shadow-sm transition hover:border-[#b8d1dc] hover:bg-[#f7fbfd] disabled:cursor-not-allowed disabled:opacity-60"
          >

            <RefreshCw
              size={17}
              className={
                refreshing ? "animate-spin" : ""
              }
            />

            Refresh

          </button>


          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#08b9d8] to-[#3478ed] px-4 text-sm font-bold text-white shadow-[0_8px_20px_rgba(52,120,237,.18)] transition hover:-translate-y-0.5"
          >

            <Plus size={18} />

            Add Staff

          </button>

        </div>

      </div>


      {/* ALERT */}

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#f1c9ce] bg-[#fff6f7] px-4 py-3.5 text-sm text-[#a53a48]">

          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0"
          />

          <div className="min-w-0 flex-1">
            {error}
          </div>

          <button
            type="button"
            onClick={() => setError("")}
          >
            <X size={16} />
          </button>

        </div>
      )}


      {success && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#c7e9dc] bg-[#f2fbf7] px-4 py-3.5 text-sm text-[#16785d]">

          <CheckCircle2
            size={18}
            className="mt-0.5 shrink-0"
          />

          <div>
            {success}
          </div>

        </div>
      )}


      {/* STATS */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl border border-[#d8e6ef] bg-white p-5 shadow-[0_5px_24px_rgba(21,54,83,.055)]">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-wider text-[#8298aa]">
                Total Staff
              </p>

              <p className="mt-2 text-3xl font-bold text-[#153653]">
                {loading ? "—" : stats.total}
              </p>

              <p className="mt-1 text-xs text-[#8298aa]">
                Registered staff profiles
              </p>

            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8f8fb] text-[#08aeca]">
              <Users size={21} />
            </div>

          </div>

        </div>


        <div className="rounded-2xl border border-[#d8e6ef] bg-white p-5 shadow-[0_5px_24px_rgba(21,54,83,.055)]">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-wider text-[#8298aa]">
                Available
              </p>

              <p className="mt-2 text-3xl font-bold text-[#159570]">
                {loading ? "—" : stats.available}
              </p>

              <p className="mt-1 text-xs text-[#8298aa]">
                Currently available
              </p>

            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf8f3] text-[#159570]">
              <CheckCircle2 size={21} />
            </div>

          </div>

        </div>


        <div className="rounded-2xl border border-[#d8e6ef] bg-white p-5 shadow-[0_5px_24px_rgba(21,54,83,.055)]">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-wider text-[#8298aa]">
                Unavailable
              </p>

              <p className="mt-2 text-3xl font-bold text-[#d58a18]">
                {loading ? "—" : stats.unavailable}
              </p>

              <p className="mt-1 text-xs text-[#8298aa]">
                Currently unavailable
              </p>

            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff7e9] text-[#d58a18]">
              <Activity size={21} />
            </div>

          </div>

        </div>


        <div className="rounded-2xl border border-[#d8e6ef] bg-white p-5 shadow-[0_5px_24px_rgba(21,54,83,.055)]">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-wider text-[#8298aa]">
                Designations
              </p>

              <p className="mt-2 text-3xl font-bold text-[#3478ed]">
                {loading ? "—" : stats.designations}
              </p>

              <p className="mt-1 text-xs text-[#8298aa]">
                Distinct staff roles
              </p>

            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef2ff] text-[#3478ed]">
              <BriefcaseBusiness size={21} />
            </div>

          </div>

        </div>

      </div>


      {/* DIRECTORY */}

      <section className="overflow-hidden rounded-2xl border border-[#d8e6ef] bg-white shadow-[0_5px_24px_rgba(21,54,83,.055)]">

        <div className="border-b border-[#e4edf2] p-5 md:p-6">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <h2 className="text-lg font-bold text-[#153653]">
                Staff Directory
              </h2>

              <p className="mt-1 text-sm text-[#8298aa]">
                {filteredStaff.length} of {staff.length} profiles
              </p>

            </div>


            <div className="flex flex-col gap-3 sm:flex-row">

              <div className="relative min-w-0 sm:w-72">

                <Search
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#91a7b5]"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search staff..."
                  className="h-11 w-full rounded-xl border border-[#cfdfe8] bg-white pl-10 pr-3.5 text-sm text-[#153653] outline-none placeholder:text-[#a4b7c3] focus:border-[#67cddd] focus:ring-4 focus:ring-[#08b9d8]/10"
                />

              </div>


              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="h-11 rounded-xl border border-[#cfdfe8] bg-white px-3.5 text-sm font-medium text-[#55718a] outline-none focus:border-[#67cddd] focus:ring-4 focus:ring-[#08b9d8]/10"
              >
                <option value="all">All status</option>
                <option value="available">Available</option>
                <option value="unavailable">
                  Unavailable
                </option>
              </select>

            </div>

          </div>

        </div>


        {loading ? (

          <div className="space-y-3 p-6">

            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-16 animate-pulse rounded-xl bg-[#f1f7fa]"
              />
            ))}

          </div>

        ) : filteredStaff.length === 0 ? (

          <div className="flex min-h-[340px] flex-col items-center justify-center px-6 text-center">

            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf7fa] text-[#08aeca]">
              <UserRound size={25} />
            </div>

            <h3 className="text-base font-bold text-[#153653]">
              No staff members found
            </h3>

            <p className="mt-1 max-w-md text-sm leading-6 text-[#8298aa]">
              {search || statusFilter !== "all"
                ? "Try changing your search or status filter."
                : "No staff profiles have been registered yet."}
            </p>

            {!search && statusFilter === "all" && (
              <button
                type="button"
                onClick={openCreate}
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#08b9d8] to-[#3478ed] px-4 text-sm font-bold text-white"
              >
                <Plus size={16} />
                Add Staff
              </button>
            )}

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1050px] border-collapse">

              <thead>

                <tr className="bg-[#f5f9fb]">

                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-[#8298aa]">
                    Staff
                  </th>

                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-[#8298aa]">
                    Employee ID
                  </th>

                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-[#8298aa]">
                    Designation
                  </th>

                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-[#8298aa]">
                    Qualification
                  </th>

                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-[#8298aa]">
                    Department
                  </th>

                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-[#8298aa]">
                    Joining Date
                  </th>

                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-[#8298aa]">
                    Status
                  </th>

                  <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-[#8298aa]">
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredStaff.map((member) => (

                  <tr
                    key={member.id}
                    className="border-t border-[#edf3f6] transition hover:bg-[#f8fcfd]"
                  >

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf7fa] text-[#08aeca]">
                          <UserRound size={18} />
                        </div>

                        <div>

                          <p className="font-semibold text-[#153653]">
                            {member.full_name || `Staff #${member.id}`}
                          </p>

                          <p className="mt-0.5 text-xs text-[#55718a]">
                            {member.username || `User ID ${member.user_id}`}
                          </p>
                          <p className="mt-0.5 text-xs text-[#8298aa]">
                            {member.email || "Email not provided"}{member.phone ? ` • ${member.phone}` : ""}
                          </p>

                        </div>

                      </div>

                    </td>


                    <td className="px-5 py-4">
                      <span className="font-semibold text-[#55718a]">
                        {member.employee_id}
                      </span>
                    </td>


                    <td className="px-5 py-4">

                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#eef4ff] px-2.5 py-1.5 text-xs font-bold text-[#3478ed]">
                        <BriefcaseBusiness size={13} />
                        {member.designation}
                      </span>

                    </td>


                    <td className="px-5 py-4">
                      <span className="text-sm text-[#55718a]">
                        {member.qualification || "—"}
                      </span>
                    </td>


                    <td className="px-5 py-4">

                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#f1f7fa] px-2.5 py-1.5 text-xs font-semibold text-[#55718a]">
                        <BriefcaseBusiness size={13} />
                        {member.department_name || `Dept #${member.department_id}`}
                      </span>

                    </td>


                    <td className="px-5 py-4">

                      <span className="inline-flex items-center gap-1.5 text-sm text-[#55718a]">
                        <CalendarDays size={14} />
                        {formatDate(member.joining_date)}
                      </span>

                    </td>


                    <td className="px-5 py-4">

                      {member.is_available ? (

                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf8f3] px-2.5 py-1.5 text-xs font-bold text-[#159570]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#159570]" />
                          Available
                        </span>

                      ) : (

                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff7e9] px-2.5 py-1.5 text-xs font-bold text-[#d58a18]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#d58a18]" />
                          Unavailable
                        </span>

                      )}

                    </td>


                    <td className="px-5 py-4">

                      <div className="flex items-center justify-end gap-2">

                        <button
                          type="button"
                          onClick={() => openView(member)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d8e6ef] bg-white text-[#55718a] transition hover:border-[#b8d1dc] hover:bg-[#f4fafc] hover:text-[#153653]"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>


                        <button
                          type="button"
                          onClick={() => openEdit(member)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d8e6ef] bg-white text-[#3478ed] transition hover:border-[#b8d1dc] hover:bg-[#f4fafc]"
                          title="Edit"
                        >
                          <Edit3 size={16} />
                        </button>


                        <button
                          type="button"
                          onClick={() => handleDelete(member)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#f0d3d7] bg-white text-[#d84b5b] transition hover:bg-[#fff6f7]"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </section>


      {/* CREATE / EDIT MODAL */}

      {(modal === "create" || modal === "edit") && (

        <Modal
          title={
            modal === "edit"
              ? "Edit Staff Profile"
              : "Add Staff"
          }
          subtitle={
            modal === "edit"
              ? "Update hospital staff information and availability."
              : "Create a support staff profile for the hospital."
          }
          onClose={closeModal}
          wide
        >

          <form
            onSubmit={handleSubmit}
            className="space-y-6 p-6"
          >

            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-[#f1c9ce] bg-[#fff6f7] px-4 py-3 text-sm text-[#a53a48]">

                <AlertCircle
                  size={17}
                  className="mt-0.5 shrink-0"
                />

                <span>{error}</span>

              </div>
            )}


            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              <Field label="Full Name" required hint="Actual staff member name; shown throughout the hospital system.">
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. Raghav Verma" />
              </Field>

              <Field label="Email" required>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="staff@hospital.com" />
              </Field>

              <Field label="Phone" hint="Optional contact number.">
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" />
              </Field>

              {modal === "create" && (
                <>
                  <Field label="Username" required hint="Used to log in.">
                    <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="e.g. raghav.verma" />
                  </Field>
                  <Field label="Initial Password" required hint="At least 8 characters. Save it securely for the staff member.">
                    <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Minimum 8 characters" />
                  </Field>
                </>
              )}

              {modal === "edit" && <Field label="User ID" hint="Linked login account ID.">
                <Input type="number" min="1" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} />
              </Field>}

              {/* Department assignment */}
              <Field
                label="Department ID"
                required
                hint="ID of the assigned hospital department."
              >

                <Input
                  type="number"
                  min="1"
                  value={form.department_id}
                  onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                  placeholder="e.g. 4"
                />
              </Field>


              <Field
                label="Employee ID"
                required
              >

                <Input
                  value={form.employee_id}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      employee_id: e.target.value,
                    })
                  }
                  placeholder="e.g. STF-001"
                />

              </Field>


              <Field
                label="Designation"
                required
                hint="Examples: Receptionist, Technician, Accountant."
              >

                <Input
                  value={form.designation}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      designation: e.target.value,
                    })
                  }
                  placeholder="e.g. Hospital Receptionist"
                />

              </Field>


              <Field
                label="Qualification"
                hint="Optional."
              >

                <Input
                  value={form.qualification}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      qualification: e.target.value,
                    })
                  }
                  placeholder="e.g. B.Com, MBA, Diploma"
                />

              </Field>


              <Field
                label="Joining Date"
                hint="Optional."
              >

                <Input
                  type="date"
                  value={form.joining_date}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      joining_date: e.target.value,
                    })
                  }
                />

              </Field>

            </div>


            <div className="rounded-xl border border-[#d8e6ef] bg-[#f7fbfd] p-4">

              <label className="flex cursor-pointer items-start gap-3">

                <input
                  type="checkbox"
                  checked={form.is_available}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      is_available: e.target.checked,
                    })
                  }
                  className="mt-0.5 h-4 w-4 accent-[#08b9d8]"
                />

                <span>

                  <span className="block text-sm font-bold text-[#153653]">
                    Staff member currently available
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-[#8298aa]">
                    Mark this staff member as available for
                    active hospital operations.
                  </span>

                </span>

              </label>

            </div>


            <div className="flex items-center justify-end gap-3 border-t border-[#e4edf2] pt-5">

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="h-11 rounded-xl border border-[#d5e4ec] bg-white px-5 text-sm font-semibold text-[#55718a] transition hover:bg-[#f7fbfd] disabled:opacity-50"
              >
                Cancel
              </button>


              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#08b9d8] to-[#3478ed] px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(52,120,237,.18)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {saving ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={17} />
                    {modal === "edit"
                      ? "Save Changes"
                      : "Create Staff"}
                  </>
                )}

              </button>

            </div>

          </form>

        </Modal>

      )}


      {/* VIEW MODAL */}

      {modal === "view" && selectedStaff && (

        <Modal
          title={selectedStaff.full_name || `Staff #${selectedStaff.id}`}
          subtitle="Hospital staff profile and linked login details"
          onClose={closeModal}
        >

          <div className="p-6">

            <div className="mb-6 flex items-center gap-4 rounded-2xl border border-[#d8e6ef] bg-[#f7fbfd] p-5">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e7f8fb] text-[#08aeca]">
                <UserRound size={25} />
              </div>

              <div className="min-w-0">

                <h3 className="text-lg font-bold text-[#153653]">
                  {selectedStaff.full_name || `Staff #${selectedStaff.id}`}
                </h3>

                <p className="mt-1 text-sm text-[#8298aa]">
                  {selectedStaff.designation}
                  {" • "}
                  Employee ID: {selectedStaff.employee_id}
                </p>

              </div>

            </div>


            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              {[
                ["User ID", selectedStaff.user_id],
                ["Full Name", selectedStaff.full_name],
                ["Username", selectedStaff.username],
                ["Email", selectedStaff.email],
                ["Phone", selectedStaff.phone],
                ["Department", selectedStaff.department_name || `Department #${selectedStaff.department_id}`],
                [
                  "Employee ID",
                  selectedStaff.employee_id,
                ],
                [
                  "Designation",
                  selectedStaff.designation,
                ],
                [
                  "Qualification",
                  selectedStaff.qualification || "—",
                ],
                [
                  "Joining Date",
                  formatDate(selectedStaff.joining_date),
                ],
                [
                  "Availability",
                  selectedStaff.is_available
                    ? "Available"
                    : "Unavailable",
                ],
                [
                  "Created",
                  formatDate(selectedStaff.created_at),
                ],
              ].map(([label, value]) => (

                <div
                  key={label}
                  className="rounded-xl border border-[#e1ebf0] bg-white p-4"
                >

                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#8298aa]">
                    {label}
                  </p>

                  <p className="mt-1.5 break-words text-sm font-semibold text-[#153653]">
                    {value ?? "—"}
                  </p>

                </div>

              ))}

            </div>


            <div className="mt-6 flex justify-end border-t border-[#e4edf2] pt-5">

              <button
                type="button"
                onClick={closeModal}
                className="h-11 rounded-xl border border-[#d5e4ec] bg-white px-5 text-sm font-semibold text-[#55718a] transition hover:bg-[#f7fbfd]"
              >
                Close
              </button>

            </div>

          </div>

        </Modal>

      )}

    </div>
  );
}
