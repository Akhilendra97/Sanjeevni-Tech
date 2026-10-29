import axios from "axios";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000/api/v1";

const doctorClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

doctorClient.interceptors.request.use((config) => {
    const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export async function getDoctors() {
    const response = await doctorClient.get("/doctors");
    return response.data;
}

export async function getMyDoctorProfile() {
    const response = await doctorClient.get("/doctors/me");
    return response.data;
}

export async function getDoctor(doctorId) {
    const response = await doctorClient.get(`/doctors/${doctorId}`);
    return response.data;
}

export async function createDoctor(payload) {
    const response = await doctorClient.post("/doctors", payload);
    return response.data;
}

export async function updateDoctor(doctorId, payload) {
    const response = await doctorClient.patch(
        `/doctors/${doctorId}`,
        payload
    );

    return response.data;
}

export async function deleteDoctor(doctorId) {
    return doctorClient.delete(`/doctors/${doctorId}`);
}

export function getDoctorApiError(error) {
    const detail = error?.response?.data?.detail;

    if (Array.isArray(detail)) {
        return detail
            .map((item) => item?.msg || "Validation error")
            .join(", ");
    }

    if (typeof detail === "string") {
        return detail;
    }

    if (error?.response?.status === 401) {
        return "Administrator session expired. Please login again.";
    }

    if (error?.response?.status === 403) {
        return "You do not have permission for this operation.";
    }

    if (error?.response?.status === 404) {
        return "Doctor record was not found.";
    }

    if (error?.response?.status >= 500) {
        return "Hospital server error. Please try again.";
    }

    return error?.message || "Unable to complete the operation.";
}

