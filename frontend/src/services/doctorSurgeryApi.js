import api from "./api";

export async function listSurgeries(filters = {}) {
    const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== "" && value != null)
    );
    const response = await api.get("/surgeries", { params });
    return Array.isArray(response.data) ? response.data : [];
}

export async function createSurgery(payload) {
    const response = await api.post("/surgeries", payload);
    return response.data;
}

export async function updateSurgery(id, payload) {
    const response = await api.put(`/surgeries/${id}`, payload);
    return response.data;
}

export async function startSurgery(id) {
    const response = await api.patch(`/surgeries/${id}/start`);
    return response.data;
}

export async function completeSurgery(id) {
    const response = await api.patch(`/surgeries/${id}/complete`);
    return response.data;
}

export async function cancelSurgery(id, reason) {
    const response = await api.patch(`/surgeries/${id}/cancel`, null, {
        params: { cancellation_reason: reason }
    });
    return response.data;
}

export async function deleteSurgery(id) {
    await api.delete(`/surgeries/${id}`);
}
