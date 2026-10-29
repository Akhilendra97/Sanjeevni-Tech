import api from "./api";

export async function getMedicalRecords() {
    const response = await api.get("/medical-records");
    return Array.isArray(response.data) ? response.data : [];
}

export async function createMedicalRecord(data) {
    const response = await api.post("/medical-records", data);
    return response.data;
}

export async function updateMedicalRecord(id, data) {
    const response = await api.patch(`/medical-records/${id}`, data);
    return response.data;
}

export async function deleteMedicalRecord(id) {
    await api.delete(`/medical-records/${id}`);
}
