const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000/api/v1";

const getToken = () =>
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    "";

const request = async (endpoint, options = {}) => {
    const token = getToken();

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    let data = null;

    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {
        const message =
            data?.detail ||
            data?.message ||
            `Request failed with status ${response.status}`;

        throw new Error(
            Array.isArray(message)
                ? message.map((item) => item?.msg || String(item)).join(", ")
                : String(message)
        );
    }

    return data;
};

export const listPharmacyDispensings = async ({
    patientId,
    prescriptionId,
    status,
} = {}) => {
    const params = new URLSearchParams();

    if (patientId) {
        params.set("patient_id", patientId);
    }

    if (prescriptionId) {
        params.set("prescription_id", prescriptionId);
    }

    if (status && status !== "all") {
        params.set("status", status);
    }

    const query = params.toString();

    return request(
        `/pharmacy-dispensing${query ? `?${query}` : ""}`
    );
};

export const getPharmacyDispensing = async (dispensingId) =>
    request(`/pharmacy-dispensing/${dispensingId}`);

export const getPharmacyDispensingByNumber = async (dispensingNumber) =>
    request(
        `/pharmacy-dispensing/number/${encodeURIComponent(
            dispensingNumber
        )}`
    );

export const createPharmacyDispensing = async (payload) =>
    request("/pharmacy-dispensing", {
        method: "POST",
        body: JSON.stringify(payload),
    });

export const cancelPharmacyDispensing = async (dispensingId) =>
    request(`/pharmacy-dispensing/${dispensingId}/cancel`, {
        method: "PATCH",
    });
