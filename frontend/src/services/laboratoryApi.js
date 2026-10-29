import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api/v1";

const laboratoryApi = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

laboratoryApi.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


let redirectingToLogin = false;

laboratoryApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && !redirectingToLogin) {
      redirectingToLogin = true;

      localStorage.removeItem("access_token");
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  }
);
export const getLaboratories = async () => {
  const response = await laboratoryApi.get("/laboratories");
  return response.data;
};

export const getLaboratory = async (id) => {
  const response = await laboratoryApi.get(`/laboratories/${id}`);
  return response.data;
};

export const createLaboratory = async (payload) => {
  const response = await laboratoryApi.post("/laboratories", payload);
  return response.data;
};

export const updateLaboratory = async (id, payload) => {
  const response = await laboratoryApi.patch(`/laboratories/${id}`, payload);
  return response.data;
};

export const deleteLaboratory = async (id) => {
  await laboratoryApi.delete(`/laboratories/${id}`);
};

export const getLabTests = async () => {
  const response = await laboratoryApi.get("/lab-tests");
  return response.data;
};

export const getLabTest = async (id) => {
  const response = await laboratoryApi.get(`/lab-tests/${id}`);
  return response.data;
};

export const createLabTest = async (payload) => {
  const response = await laboratoryApi.post("/lab-tests", payload);
  return response.data;
};

export const updateLabTest = async (id, payload) => {
  const response = await laboratoryApi.patch(`/lab-tests/${id}`, payload);
  return response.data;
};

export const deleteLabTest = async (id) => {
  await laboratoryApi.delete(`/lab-tests/${id}`);
};

export const getLabSamples = async () => {
  const response = await laboratoryApi.get("/lab-samples");
  return response.data;
};

export const getLabSample = async (id) => {
  const response = await laboratoryApi.get(`/lab-samples/${id}`);
  return response.data;
};

export const createLabSample = async (payload) => {
  const response = await laboratoryApi.post("/lab-samples", payload);
  return response.data;
};

export const updateLabSample = async (id, payload) => {
  const response = await laboratoryApi.patch(`/lab-samples/${id}`, payload);
  return response.data;
};

export const deleteLabSample = async (id) => {
  await laboratoryApi.delete(`/lab-samples/${id}`);
};

export const getLabReports = async () => {
  const response = await laboratoryApi.get("/lab-reports");
  return response.data;
};

export const getLabReport = async (id) => {
  const response = await laboratoryApi.get(`/lab-reports/${id}`);
  return response.data;
};

export const createLabReport = async (payload) => {
  const response = await laboratoryApi.post("/lab-reports", payload);
  return response.data;
};

export const updateLabReport = async (id, payload) => {
  const response = await laboratoryApi.patch(`/lab-reports/${id}`, payload);
  return response.data;
};

export const deleteLabReport = async (id) => {
  await laboratoryApi.delete(`/lab-reports/${id}`);
};

export const getLaboratoryErrorMessage = (error) => {
  const detail = error?.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg || item?.message)
      .filter(Boolean)
      .join(", ");
  }

  if (typeof detail === "string") {
    return detail;
  }

  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
};

export default laboratoryApi;

