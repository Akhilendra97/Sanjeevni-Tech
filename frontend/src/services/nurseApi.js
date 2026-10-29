import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api/v1";

const nurseApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

nurseApi.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export const getNurses = async () => {
  const response = await nurseApi.get("/nurses");
  return response.data;
};

export const getNurse = async (nurseId) => {
  const response = await nurseApi.get(`/nurses/${nurseId}`);
  return response.data;
};

export const createNurse = async (payload) => {
  const response = await nurseApi.post("/nurses", payload);
  return response.data;
};

export const updateNurse = async (nurseId, payload) => {
  const response = await nurseApi.patch(
    `/nurses/${nurseId}`,
    payload
  );
  return response.data;
};

export const deleteNurse = async (nurseId) => {
  await nurseApi.delete(`/nurses/${nurseId}`);
};

export const getNurseApiError = (error) => {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg || "Invalid request")
      .join(", ");
  }

  return (
    error?.response?.data?.message ||
    error?.message ||
    "Unable to complete the request."
  );
};

export default nurseApi;
