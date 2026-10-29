import api from "./api";

export async function getDoctorPrescriptions() {
    const response = await api.get("/prescriptions");
    return Array.isArray(response.data) ? response.data : [];
}

export async function createDoctorPrescription(data) {
    const response = await api.post("/prescriptions", data);
    return response.data;
}

export async function updateDoctorPrescription(id, data) {
    const response = await api.patch(`/prescriptions/${id}`, data);
    return response.data;
}

export async function deleteDoctorPrescription(id) {
    await api.delete(`/prescriptions/${id}`);
}
