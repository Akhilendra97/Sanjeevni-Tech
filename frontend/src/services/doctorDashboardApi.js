const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api/v1";

const getToken = () => localStorage.getItem("access_token");

const request = async (path) => {
  const token = getToken();

  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(
      `${response.status} ${response.statusText}${message ? ` — ${message}` : ""}`
    );
  }

  return response.json();
};

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;

  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;

  return [];
};

const safeRequest = async (path) => {
  try {
    const payload = await request(path);
    return {
      ok: true,
      data: normalizeList(payload),
    };
  } catch (error) {
    return {
      ok: false,
      data: [],
      error: error?.message || "Request failed",
    };
  }
};

export const loadDoctorDashboard = async () => {
  const [
    appointments,
    patients,
    labReports,
    prescriptions,
    schedules,
  ] = await Promise.all([
    safeRequest("/appointments"),
    safeRequest("/patients"),
    safeRequest("/lab-reports"),
    safeRequest("/prescriptions"),
    safeRequest("/schedules"),
  ]);

  return {
    appointments: appointments.data,
    patients: patients.data,
    labReports: labReports.data,
    prescriptions: prescriptions.data,
    schedules: schedules.data,
    errors: [
      appointments,
      patients,
      labReports,
      prescriptions,
      schedules,
    ]
      .filter((item) => !item.ok)
      .map((item) => item.error),
  };
};
