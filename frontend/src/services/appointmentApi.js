import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api/v1";

const appointmentClient = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

appointmentClient.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const getAppointments = async () => {
  const response = await appointmentClient.get("/appointments");
  return Array.isArray(response.data) ? response.data : [];
};

export const getAppointment = async (id) => {
  const response = await appointmentClient.get(`/appointments/${id}`);
  return response.data;
};

export const updateAppointment = async (id, payload) => {
  const response = await appointmentClient.patch(
    `/appointments/${id}`,
    payload
  );

  return response.data;
};

export const deleteAppointment = async (id) => {
  const response = await appointmentClient.delete(
    `/appointments/${id}`
  );

  return response.data;
};

export default {
  getAppointments,
  getAppointment,
  updateAppointment,
  deleteAppointment,
};
