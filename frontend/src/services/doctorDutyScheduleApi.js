import api from "./api";

export async function listDutySchedules() {
    const response = await api.get("/schedules");
    return Array.isArray(response.data) ? response.data : [];
}

export async function listDoctorDutySchedules(doctorId) {
    const response = await api.get(`/schedules/doctor/${doctorId}`);
    return Array.isArray(response.data) ? response.data : [];
}

export async function createDutySchedule(payload) {
    const response = await api.post("/schedules", payload);
    return response.data;
}

export async function updateDutySchedule(id, payload) {
    const response = await api.patch(`/schedules/${id}`, payload);
    return response.data;
}

export async function deleteDutySchedule(id) {
    await api.delete(`/schedules/${id}`);
}
