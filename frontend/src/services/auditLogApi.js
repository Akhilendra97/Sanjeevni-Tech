import axios from "axios";

const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000/api/v1";

const auditLogApi = axios.create({
    baseURL: API_BASE,
    headers: {
        "Content-Type": "application/json",
    },
});

auditLogApi.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export const getAuditLogs = async () => {
    const response = await auditLogApi.get("/audit-logs");
    return response.data;
};

export const getAuditLog = async (auditLogId) => {
    const response = await auditLogApi.get(`/audit-logs/${auditLogId}`);
    return response.data;
};

export const getUserAuditLogs = async (userId) => {
    const response = await auditLogApi.get(`/audit-logs/user/${userId}`);
    return response.data;
};

export const deleteAuditLog = async (auditLogId) => {
    await auditLogApi.delete(`/audit-logs/${auditLogId}`);
};

export default auditLogApi;
