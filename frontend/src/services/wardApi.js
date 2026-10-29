import axios from "axios";

const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000/api/v1";

const wardApi = axios.create({
    baseURL: API_BASE,
    headers: {
        "Content-Type": "application/json",
    },
});

wardApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("access_token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

export const getWards = async () => {
    const response = await wardApi.get("/wards");
    return response.data;
};

export const getWard = async (wardId) => {
    const response = await wardApi.get(`/wards/${wardId}`);
    return response.data;
};

export const createWard = async (payload) => {
    const response = await wardApi.post("/wards", payload);
    return response.data;
};

export const updateWard = async (wardId, payload) => {
    const response = await wardApi.patch(
        `/wards/${wardId}`,
        payload
    );

    return response.data;
};

export const deleteWard = async (wardId) => {
    await wardApi.delete(`/wards/${wardId}`);
};

export const getWardErrorMessage = (error) => {
    const detail = error?.response?.data?.detail;

    if (typeof detail === "string") {
        return detail;
    }

    if (Array.isArray(detail)) {
        return detail
            .map((item) => {
                if (typeof item === "string") {
                    return item;
                }

                return item?.msg || "Invalid ward data.";
            })
            .join(", ");
    }

    if (error?.message) {
        return error.message;
    }

    return "Unable to complete the ward operation.";
};

export default wardApi;
