import api from "./api";

export async function getDoctorLabReports() {
    const response = await api.get("/lab-reports");
    return Array.isArray(response.data) ? response.data : [];
}

export async function createDoctorLabReport(data) {
    const response = await api.post("/lab-reports", data);
    return response.data;
}

export async function updateDoctorLabReport(id, data) {
    const response = await api.patch(`/lab-reports/${id}`, data);
    return response.data;
}

export async function deleteDoctorLabReport(id) {
    await api.delete(`/lab-reports/${id}`);
}
