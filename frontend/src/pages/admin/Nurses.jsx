import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
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
  UserPlus,
  Users,
  X,
  BriefcaseBusiness,
} from "lucide-react";

import {
  createNurse,
  deleteNurse,
  getNurseApiError,
  getNurses,
  updateNurse,
} from "../../services/nurseApi";
import api from "../../services/api";
import { getPatients } from "../../services/patientApi";


const EMPTY_FORM = {
  full_name: "",
  user_id: "",
  department_id: "",
  employee_id: "",
  nursing_registration_number: "",
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
          "w-full overflow-hidden rounded-2xl border border-[#d8e6ef] bg-white shadow-[0_25px_70px_rgba(21,54,83,.20)]",
          wide ? "max-w-4xl" : "max-w-2xl",
          "max-h-[calc(100vh-32px)]",
          "flex flex-col",
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
            aria-label="Close"
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
      value={value}
      onChange={onChange}
      min={min}
      placeholder={placeholder}
      className="h-11 w-full rounded-xl border border-[#cfdfe8] bg-white px-3.5 text-sm font-medium text-[#153653] outline-none transition placeholder:text-[#a4b7c3] focus:border-[#67cddd] focus:ring-4 focus:ring-[#08b9d8]/10"
    />
  );
}


export default function Nurses() {
  const [nurses, setNurses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modal, setModal] = useState(null);
  const [selectedNurse, setSelectedNurse] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [assignmentNurse, setAssignmentNurse] = useState(null);
  const [assignmentPatients, setAssignmentPatients] = useState([]);
  const [assignedPatientIds, setAssignedPatientIds] = useState(new Set());
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignmentSavingId, setAssignmentSavingId] = useState(null);
  const [assignmentError, setAssignmentError] = useState("");
  const [assignmentSuccess, setAssignmentSuccess] = useState("");

  const loadNurses = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data = await getNurses();

      setNurses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getNurseApiError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  useEffect(() => {
    loadNurses();
  }, []);


  const stats = useMemo(() => {
    const total = nurses.length;

    const available = nurses.filter(
      (nurse) => nurse.is_available
    ).length;

    const unavailable = total - available;

    return {
      total,
      available,
      unavailable,
    };
  }, [nurses]);


  const filteredNurses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return nurses.filter((nurse) => {
      const matchesSearch =
        !query ||
        String(nurse.id).includes(query) ||
        String(nurse.user_id).includes(query) ||
        String(nurse.full_name || "").toLowerCase().includes(query) ||
        String(nurse.username || "").toLowerCase().includes(query) ||
        String(nurse.email || "").toLowerCase().includes(query) ||
        String(nurse.department_id).includes(query) ||
        String(nurse.employee_id || "")
          .toLowerCase()
          .includes(query) ||
        String(nurse.nursing_registration_number || "")
          .toLowerCase()
          .includes(query) ||
        String(nurse.qualification || "")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "available" && nurse.is_available) ||
        (statusFilter === "unavailable" && !nurse.is_available);

      return matchesSearch && matchesStatus;
    });
  }, [nurses, search, statusFilter]);


  const openCreate = () => {
    setForm(EMPTY_FORM);
    setError("");
    setModal("create");
  };


  const openEdit = (nurse) => {
    setForm({
      full_name: nurse.full_name ?? nurse.user?.full_name ?? "",
      user_id: nurse.user_id ?? "",
      department_id: nurse.department_id ?? "",
      employee_id: nurse.employee_id ?? "",
      nursing_registration_number:
        nurse.nursing_registration_number ?? "",
      qualification: nurse.qualification ?? "",
      joining_date: nurse.joining_date
        ? String(nurse.joining_date).slice(0, 10)
        : "",
      is_available: Boolean(nurse.is_available),
    });

    setSelectedNurse(nurse);
    setError("");
    setModal("edit");
  };


  const openView = (nurse) => {
    setSelectedNurse(nurse);
    setModal("view");
  };


  const closeModal = () => {
    if (saving) return;

    setModal(null);
    setSelectedNurse(null);
    setForm(EMPTY_FORM);
  };



  const openAssignments = async (nurse) => {
    setAssignmentNurse(nurse);
    setAssignmentPatients([]);
    setAssignedPatientIds(new Set());
    setAssignmentSearch("");
    setAssignmentError("");
    setAssignmentSuccess("");
    setAssignmentLoading(true);
    try {
      const [patientData, assignmentResponse] = await Promise.all([
        getPatients({ limit: 100, is_active: true }),
        api.get("/nurse-workspace/assignments", { params: { nurse_id: nurse.id } }),
      ]);
      const patients = Array.isArray(patientData) ? patientData : patientData?.items || patientData?.data || [];
      const assignments = Array.isArray(assignmentResponse.data) ? assignmentResponse.data : [];
      setAssignmentPatients(patients);
      setAssignedPatientIds(new Set(assignments.filter((item) => item.status === "active").map((item) => Number(item.patient_id))));
    } catch (err) {
      setAssignmentError(getNurseApiError(err));
    } finally {
      setAssignmentLoading(false);
    }
  };

  const assignPatient = async (patient) => {
    if (!assignmentNurse || !patient?.id) return;
    setAssignmentSavingId(Number(patient.id));
    setAssignmentError("");
    setAssignmentSuccess("");
    try {
      await api.post("/nurse-workspace/assignments", {
        nurse_id: Number(assignmentNurse.id),
        patient_id: Number(patient.id),
      });
      setAssignedPatientIds((current) => new Set([...current, Number(patient.id)]));
      const patientName = patient.full_name || [patient.first_name, patient.last_name].filter(Boolean).join(" ") || `Patient #${patient.id}`;
      setAssignmentSuccess(`${patientName} assigned successfully.`);
    } catch (err) {
      setAssignmentError(getNurseApiError(err));
    } finally {
      setAssignmentSavingId(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        full_name: form.full_name.trim(),
        user_id: Number(form.user_id),
        department_id: Number(form.department_id),
        employee_id: form.employee_id.trim(),
        nursing_registration_number:
          form.nursing_registration_number.trim(),
        qualification: form.qualification.trim(),
        joining_date: form.joining_date || null,
        is_available: Boolean(form.is_available),
      };

      if (
        payload.full_name.length < 2 ||
        !payload.user_id ||
        !payload.department_id ||
        !payload.employee_id ||
        !payload.nursing_registration_number ||
        !payload.qualification
      ) {
        setError("Please complete all required fields.");
        return;
      }

      if (modal === "edit" && selectedNurse) {
        await updateNurse(selectedNurse.id, payload);
        setSuccess("Nurse profile updated successfully.");
      } else {
        await createNurse(payload);
        setSuccess("Nurse profile created successfully.");
      }

      closeModal();
      await loadNurses();

      setTimeout(() => setSuccess(""), 3500);
    } catch (err) {
      setError(getNurseApiError(err));
    } finally {
      setSaving(false);
    }
  };


  const handleDelete = async (nurse) => {
    const confirmed = window.confirm(
      `Delete nurse profile ${nurse.employee_id}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await deleteNurse(nurse.id);

      setSuccess("Nurse profile deleted successfully.");

      await loadNurses();

      setTimeout(() => setSuccess(""), 3500);
    } catch (err) {
      setError(getNurseApiError(err));
    }
  };


  return (
    <div className="nurses-page min-h-full p-5 md:p-7 lg:p-8">

      {/* PAGE HEADER */}

      <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#08aeca]">
            <ShieldCheck size={15} />
            Clinical Workforce
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[#153653]">
            Nurses
          </h1>

          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#55718a]">
            Manage nursing staff profiles, registrations,
            qualifications and availability.
          </p>
        </div>

        <div className="flex flex-row items-center justify-end gap-3 flex-nowrap">

          <button
            type="button"
            onClick={() => loadNurses(true)}
            disabled={refreshing}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#d5e4ec] bg-white px-4 text-sm font-semibold text-[#55718a] shadow-sm transition hover:border-[#b8d1dc] hover:bg-[#f7fbfd] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#08b9d8] to-[#3478ed] px-4 text-sm font-bold text-white shadow-[0_8px_20px_rgba(52,120,237,.18)] transition hover:-translate-y-0.5"
          >
            <Plus size={18} />
            Add Nurse
          </button>

        </div>
      </div>


      {/* ALERTS */}

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#f1c9ce] bg-[#fff6f7] px-4 py-3.5 text-sm text-[#a53a48]">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">{error}</div>

          <button
            type="button"
            onClick={() => setError("")}
            className="text-[#a53a48]"
          >
            <X size={16} />
          </button>
        </div>
      )}


      {success && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#c7e9dc] bg-[#f2fbf7] px-4 py-3.5 text-sm text-[#16785d]">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <div>{success}</div>
        </div>
      )}


      {/* STATS */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-2xl border border-[#d8e6ef] bg-white p-5 shadow-[0_5px_24px_rgba(21,54,83,.055)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#8298aa]">
                Total Nurses
              </p>

              <p className="mt-2 text-3xl font-bold text-[#153653]">
                {loading ? "—" : stats.total}
              </p>

              <p className="mt-1 text-xs text-[#8298aa]">
                Registered nursing profiles
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

      </div>


      {/* DIRECTORY */}

      <section className="overflow-hidden rounded-2xl border border-[#d8e6ef] bg-white shadow-[0_5px_24px_rgba(21,54,83,.055)]">

        <div className="border-b border-[#e4edf2] p-5 md:p-6">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <h2 className="text-lg font-bold text-[#153653]">
                Nursing Directory
              </h2>

              <p className="mt-1 text-sm text-[#8298aa]">
                {filteredNurses.length} of {nurses.length} profiles
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
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search nurses..."
                  className="h-11 w-full rounded-xl border border-[#cfdfe8] bg-white pl-10 pr-3.5 text-sm text-[#153653] outline-none placeholder:text-[#a4b7c3] focus:border-[#67cddd] focus:ring-4 focus:ring-[#08b9d8]/10"
                />

              </div>


              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-11 rounded-xl border border-[#cfdfe8] bg-white px-3.5 text-sm font-medium text-[#55718a] outline-none focus:border-[#67cddd] focus:ring-4 focus:ring-[#08b9d8]/10"
              >
                <option value="all">All status</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
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
        ) : filteredNurses.length === 0 ? (

          <div className="flex min-h-[340px] flex-col items-center justify-center px-6 text-center">

            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf7fa] text-[#08aeca]">
              <UserRound size={25} />
            </div>

            <h3 className="text-base font-bold text-[#153653]">
              No nurses found
            </h3>

            <p className="mt-1 max-w-md text-sm leading-6 text-[#8298aa]">
              {search || statusFilter !== "all"
                ? "Try changing your search or status filter."
                : "No nurse profiles have been registered yet."}
            </p>

            {!search && statusFilter === "all" && (
              <button
                type="button"
                onClick={openCreate}
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#08b9d8] to-[#3478ed] px-4 text-sm font-bold text-white"
              >
                <Plus size={16} />
                Add Nurse
              </button>
            )}

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[950px] border-collapse">

              <thead>
                <tr className="bg-[#f5f9fb]">

                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-[#8298aa]">
                    Nurse
                  </th>

                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-[#8298aa]">
                    Employee ID
                  </th>

                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-[#8298aa]">
                    Registration
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

                {filteredNurses.map((nurse) => (
                  <tr
                    key={nurse.id}
                    className="border-t border-[#edf3f6] transition hover:bg-[#f8fcfd]"
                  >

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf7fa] text-[#08aeca]">
                          <UserRound size={18} />
                        </div>

                        <div>
                          <p className="font-semibold text-[#153653]">
                            {nurse.full_name || nurse.user?.full_name || `Nurse #${nurse.id}`}
                          </p>

                          <p className="mt-0.5 text-xs text-[#8298aa]">
                            {nurse.username || `User ID ${nurse.user_id}`}
                            {nurse.email ? ` · ${nurse.email}` : ""}
                          </p>
                        </div>

                      </div>

                    </td>


                    <td className="px-5 py-4">
                      <span className="font-semibold text-[#55718a]">
                        {nurse.employee_id}
                      </span>
                    </td>


                    <td className="px-5 py-4">
                      <span className="text-sm text-[#55718a]">
                        {nurse.nursing_registration_number}
                      </span>
                    </td>


                    <td className="px-5 py-4">
                      <span className="text-sm text-[#55718a]">
                        {nurse.qualification}
                      </span>
                    </td>


                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#f1f7fa] px-2.5 py-1.5 text-xs font-semibold text-[#55718a]">
                        <BriefcaseBusiness size={13} />
                        {nurse.department_name || `Dept #${nurse.department_id}`}
                      </span>
                    </td>


                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-sm text-[#55718a]">
                        <CalendarDays size={14} />
                        {formatDate(nurse.joining_date)}
                      </span>
                    </td>


                    <td className="px-5 py-4">

                      {nurse.is_available ? (
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
                          onClick={() => openAssignments(nurse)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#c9e8df] bg-white text-[#159570] transition hover:bg-[#f0fbf7]"
                          title="Assign Patients"
                          aria-label={`Assign patients to ${nurse.full_name || `Nurse ${nurse.id}`}`}
                        >
                          <UserPlus size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => openView(nurse)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d8e6ef] bg-white text-[#55718a] transition hover:border-[#b8d1dc] hover:bg-[#f4fafc] hover:text-[#153653]"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => openEdit(nurse)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d8e6ef] bg-white text-[#3478ed] transition hover:border-[#b8d1dc] hover:bg-[#f4fafc]"
                          title="Edit"
                        >
                          <Edit3 size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(nurse)}
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


      {/* CREATE / EDIT */}

      {assignmentNurse && (
        <Modal
          title={`Assign Patients — ${assignmentNurse.full_name || `Nurse #${assignmentNurse.id}`}`}
          subtitle="Assign only the patients this nurse is responsible for. Existing clinical records are not changed."
          onClose={() => {
            if (assignmentSavingId !== null) return;
            setAssignmentNurse(null);
            setAssignmentError("");
            setAssignmentSuccess("");
          }}
          wide
        >
          <div className="space-y-4 p-6">
            {assignmentError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{assignmentError}</div>}
            {assignmentSuccess && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{assignmentSuccess}</div>}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8298aa]" />
              <input value={assignmentSearch} onChange={(event) => setAssignmentSearch(event.target.value)} placeholder="Search loaded patients by name or patient number" className="h-11 w-full rounded-xl border border-[#cfdfe8] bg-white pl-9 pr-3 text-sm text-[#153653] outline-none focus:border-[#67cddd]" />
            </div>
            {assignmentLoading ? (
              <div className="flex items-center gap-2 py-10 text-sm text-[#55718a]"><Loader2 size={18} className="animate-spin" /> Loading active patients and current assignments...</div>
            ) : assignmentPatients.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#cfdfe8] p-8 text-center text-sm text-[#8298aa]">No active patients were returned. Check patient-view permission and the patients API.</div>
            ) : (
              <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-[#e1ebf0]">
                {assignmentPatients.filter((patient) => {
                  const q = assignmentSearch.trim().toLowerCase();
                  const name = patient.full_name || [patient.first_name, patient.last_name].filter(Boolean).join(" ");
                  return !q || String(name).toLowerCase().includes(q) || String(patient.patient_number || "").toLowerCase().includes(q);
                }).map((patient) => {
                  const patientName = patient.full_name || [patient.first_name, patient.last_name].filter(Boolean).join(" ") || `Patient #${patient.id}`;
                  const isAssigned = assignedPatientIds.has(Number(patient.id));
                  return (
                    <div key={patient.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf3f6] px-4 py-3 last:border-b-0">
                      <div className="min-w-0"><p className="text-sm font-semibold text-[#153653]">{patientName}</p><p className="mt-0.5 text-xs text-[#8298aa]">{patient.patient_number || `Patient ID ${patient.id}`}{patient.gender ? ` · ${patient.gender}` : ""}</p></div>
                      {isAssigned ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#eaf8f3] px-3 py-1.5 text-xs font-bold text-[#159570]"><CheckCircle2 size={14} /> Assigned</span>
                      ) : (
                        <button type="button" onClick={() => assignPatient(patient)} disabled={assignmentSavingId !== null} className="inline-flex items-center gap-2 rounded-lg bg-[#159570] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#117c5d] disabled:opacity-60">
                          {assignmentSavingId === Number(patient.id) ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />} Assign patient
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-xs leading-5 text-[#8298aa]">Assignments are saved through the authenticated backend endpoint. Assigning a patient does not create or alter vitals, prescriptions, notes, or care plans.</p>
          </div>
        </Modal>
      )}

      {(modal === "create" || modal === "edit") && (
        <Modal
          title={
            modal === "edit"
              ? "Edit Nurse Profile"
              : "Add Nurse"
          }
          subtitle={
            modal === "edit"
              ? "Update nursing staff information and availability."
              : "Create a nursing staff profile for the hospital."
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
                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}


            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              <Field
                label="Full Name"
                required
                hint="This updates the name on the linked hospital user account."
              >
                <Input
                  value={form.full_name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      full_name: e.target.value,
                    })
                  }
                  placeholder="Enter nurse's full name"
                />
              </Field>


              <Field
                label="User ID"
                required
                hint="ID of the existing hospital user account."
              >
                <Input
                  type="number"
                  min="1"
                  value={form.user_id}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      user_id: e.target.value,
                    })
                  }
                  placeholder="e.g. 12"
                />
              </Field>


              <Field
                label="Department ID"
                required
                hint="ID of the nurse's hospital department."
              >
                <Input
                  type="number"
                  min="1"
                  value={form.department_id}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      department_id: e.target.value,
                    })
                  }
                  placeholder="e.g. 3"
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
                  placeholder="e.g. NUR-001"
                />
              </Field>


              <Field
                label="Nursing Registration Number"
                required
              >
                <Input
                  value={form.nursing_registration_number}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      nursing_registration_number:
                        e.target.value,
                    })
                  }
                  placeholder="e.g. NURS-2026-001"
                />
              </Field>


              <Field
                label="Qualification"
                required
              >
                <Input
                  value={form.qualification}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      qualification: e.target.value,
                    })
                  }
                  placeholder="e.g. B.Sc Nursing"
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
                    Nurse currently available
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-[#8298aa]">
                    Mark this nurse as available for active
                    hospital operations.
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
                      : "Create Nurse"}
                  </>
                )}

              </button>

            </div>

          </form>

        </Modal>
      )}


      {/* VIEW */}

      {modal === "view" && selectedNurse && (
        <Modal
          title={selectedNurse.full_name || `Nurse #${selectedNurse.id}`}
          subtitle="Nursing profile details"
          onClose={closeModal}
        >

          <div className="p-6">

            <div className="mb-6 flex items-center gap-4 rounded-2xl border border-[#d8e6ef] bg-[#f7fbfd] p-5">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e7f8fb] text-[#08aeca]">
                <UserRound size={25} />
              </div>

              <div className="min-w-0">
                <h3 className="text-lg font-bold text-[#153653]">
                  {selectedNurse.full_name || `Nurse #${selectedNurse.id}`}
                </h3>
                <p className="mt-1 text-sm text-[#55718a]">
                  {selectedNurse.username || `User ID ${selectedNurse.user_id}`}
                  {selectedNurse.email ? ` · ${selectedNurse.email}` : ""}
                </p>

                <p className="mt-1 text-sm text-[#8298aa]">
                  Employee ID: {selectedNurse.employee_id}
                </p>
              </div>

            </div>


            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              {[
                ["Full Name", selectedNurse.full_name || "—"],
                ["Username", selectedNurse.username || "—"],
                ["Email", selectedNurse.email || "—"],
                ["Phone", selectedNurse.phone || selectedNurse.user?.phone || "—"],
                ["User ID", selectedNurse.user_id],
                ["Department", selectedNurse.department_name || `Department #${selectedNurse.department_id}`],
                ["Department ID", selectedNurse.department_id],
                [
                  "Employee ID",
                  selectedNurse.employee_id,
                ],
                [
                  "Registration Number",
                  selectedNurse.nursing_registration_number,
                ],
                [
                  "Qualification",
                  selectedNurse.qualification,
                ],
                [
                  "Joining Date",
                  formatDate(selectedNurse.joining_date),
                ],
                [
                  "Availability",
                  selectedNurse.is_available
                    ? "Available"
                    : "Unavailable",
                ],
                [
                  "Created",
                  formatDate(selectedNurse.created_at),
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
