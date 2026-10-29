import axios from "axios";

const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000/api/v1";

const authApi = axios.create({
    baseURL: API_BASE,
    headers: {
        "Content-Type": "application/json",
    },
});

// FastAPI/Pydantic 422 detail is often an array of objects.
// Normalize it to plain text before Login.jsx receives the error,
// preventing React's "Objects are not valid as a React child" crash.
authApi.interceptors.response.use(
    (response) => response,
    (error) => {
        const detail = error?.response?.data?.detail;

        if (Array.isArray(detail)) {
            const messages = detail.map((item) => {
                if (typeof item === "string") return item;
                const location = Array.isArray(item?.loc)
                    ? item.loc.filter((part) => part !== "body").join(" → ")
                    : "";
                const message = item?.msg || "Invalid request";
                return location ? `${location}: ${message}` : message;
            });
            error.response.data.detail = messages.join("; ");
        } else if (detail && typeof detail === "object") {
            error.response.data.detail =
                detail.msg || detail.message || "The server rejected the login request.";
        } else if (detail == null && error?.message) {
            // Keep network errors readable without changing request behavior.
        }

        return Promise.reject(error);
    }
);

export const loginRequest = async (usernameOrEmail, password) => {
    const response = await authApi.post(
        "/auth/login",
        {
            username_or_email: usernameOrEmail.trim(),
            password,
        }
    );

    return response.data;
};

export const getCurrentUser = async (accessToken) => {
    const response = await authApi.get(
        "/auth/me",
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );

    return response.data;
};

export default authApi;
