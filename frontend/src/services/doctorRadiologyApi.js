import api from "./api";

export async function getDoctorRadiologyReports(filters = {}) {
    const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== "" && value != null)
    );
    const response = await api.get("/radiology", { params });
    return Array.isArray(response.data) ? response.data : [];
}

export async function createDoctorRadiologyReport(data) {
    const response = await api.post("/radiology", data);
    return response.data;
}

export async function updateDoctorRadiologyReport(id, data) {
    const response = await api.put(`/radiology/${id}`, data);
    return response.data;
}

export async function deleteDoctorRadiologyReport(id) {
    await api.delete(`/radiology/${id}`);
}
