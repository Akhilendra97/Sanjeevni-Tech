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

export async function listInsuranceClaims(params = {}) {
  const response = await client.get("/insurance-claims", {
    params: {
      insurance_id: params.insuranceId || undefined,
      patient_id: params.patientId || undefined,
      admission_id: params.admissionId || undefined,
      status_value: params.status || undefined,
    },
  });

  return response.data;
}

export async function getInsuranceClaim(id) {
  const response = await client.get(`/insurance-claims/${id}`);
  return response.data;
}

export async function getInsuranceClaimByNumber(claimNumber) {
  const response = await client.get(
    `/insurance-claims/number/${encodeURIComponent(claimNumber)}`
  );

  return response.data;
}

export async function createInsuranceClaim(payload) {
  const response = await client.post("/insurance-claims", payload);
  return response.data;
}

export async function updateInsuranceClaim(id, payload) {
  const response = await client.put(`/insurance-claims/${id}`, payload);
  return response.data;
}

export async function deleteInsuranceClaim(id) {
  await client.delete(`/insurance-claims/${id}`);
}
