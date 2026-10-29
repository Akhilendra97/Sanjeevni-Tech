import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api/v1";

const staffApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

staffApi.interceptors.request.use(
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


export const getStaff = async () => {
  const response = await staffApi.get("/staff");
  return response.data;
};


export const getStaffMember = async (staffId) => {
  const response = await staffApi.get(`/staff/${staffId}`);
  return response.data;
};


export const createStaff = async (payload) => {
  const response = await staffApi.post("/staff", payload);
  return response.data;
};


export const updateStaff = async (staffId, payload) => {
  const response = await staffApi.patch(
    `/staff/${staffId}`,
    payload
  );

  return response.data;
};


export const deleteStaff = async (staffId) => {
  await staffApi.delete(`/staff/${staffId}`);
};


export const getStaffApiError = (error) => {
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


export default staffApi;
