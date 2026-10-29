import api from "./api";

export async function getAssignedPatients(search = "") {
  const response = await api.get("/nurse-workspace/assigned-patients", { params: search ? { search } : {} });
  return Array.isArray(response.data) ? response.data : [];
}
export async function getMedicationSchedule() {
  const response = await api.get("/nurse-workspace/medication-schedule");
  return Array.isArray(response.data) ? response.data : [];
}
export async function getNursingNotes() {
  const response = await api.get("/nurse-workspace/nursing-notes");
  return Array.isArray(response.data) ? response.data : [];
}
export async function createNursingNote(payload) {
  const response = await api.post("/nurse-workspace/nursing-notes", payload);
  return response.data;
}
export async function updateNursingNote(id, payload) {
  const response = await api.patch(`/nurse-workspace/nursing-notes/${id}`, payload);
  return response.data;
}
export async function deleteNursingNote(id) {
  await api.delete(`/nurse-workspace/nursing-notes/${id}`);
}
export async function getNurseCarePlans() {
  const response = await api.get("/nurse-workspace/care-plans");
  return Array.isArray(response.data) ? response.data : [];
}

export async function createNurseCarePlan(payload) {
  const response = await api.post("/nursing-care-plans", payload);
  return response.data;
}

export async function updateNurseCarePlan(id, payload) {
  const response = await api.put(`/nursing-care-plans/${id}`, payload);
  return response.data;
}
