import axios from "axios";

const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000/api/v1";

const client = axios.create({
    baseURL: API_BASE,
    headers: {
        "Content-Type": "application/json",
    },
});

client.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export async function listPrescriptions() {
    const response = await client.get("/prescriptions");
    return response.data;
}

export async function getPrescription(id) {
    const response = await client.get(`/prescriptions/${id}`);
    return response.data;
}

export async function createPrescription(payload) {
    const response = await client.post("/prescriptions", payload);
    return response.data;
}

export async function updatePrescription(id, payload) {
    const response = await client.patch(
        `/prescriptions/${id}`,
        payload
    );
    return response.data;
}

export async function deletePrescription(id) {
    await client.delete(`/prescriptions/${id}`);
}
