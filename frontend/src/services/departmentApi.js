import axios from "axios";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000/api/v1";

const departmentApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});


departmentApi.interceptors.request.use(
    (config) => {

        const token =
            localStorage.getItem("access_token");

        if (token) {
            config.headers.Authorization =
                `Bearer ${token}`;
        }

        return config;
    },

    (error) => Promise.reject(error)
);


export const getDepartments = async (
    activeOnly = false
) => {

    const response =
        await departmentApi.get(
            "/departments",
            {
                params: {
                    active_only: activeOnly,
                },
            }
        );

    return response.data;
};


export const getDepartment = async (
    departmentId
) => {

    const response =
        await departmentApi.get(
            `/departments/${departmentId}`
        );

    return response.data;
};


export const createDepartment = async (
    payload
) => {

    const response =
        await departmentApi.post(
            "/departments",
            payload
        );

    return response.data;
};


export const updateDepartment = async (
    departmentId,
    payload
) => {

    const response =
        await departmentApi.patch(
            `/departments/${departmentId}`,
            payload
        );

    return response.data;
};


export const deleteDepartment = async (
    departmentId
) => {

    await departmentApi.delete(
        `/departments/${departmentId}`
    );
};


export const getApiErrorMessage = (
    error,
    fallback = "Something went wrong. Please try again."
) => {

    const detail =
        error?.response?.data?.detail;

    if (typeof detail === "string") {
        return detail;
    }

    if (Array.isArray(detail)) {

        return detail
            .map(
                (item) =>
                    item?.msg ||
                    item?.message ||
                    String(item)
            )
            .join(", ");
    }

    return (
        error?.message ||
        fallback
    );
};


export default departmentApi;
