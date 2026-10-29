import api from "./api";

export const getUsers = async ({
    search = "",
    role = "",
    status = "",
    page = 1,
    pageSize = 10,
} = {}) => {
    const response = await api.get("/users", {
        params: {
            search: search || undefined,
            role: role || undefined,
            status: status || undefined,
            page,
            page_size: pageSize,
        },
    });

    return response.data;
};

export const getUser = async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
};

export const createUser = async (payload) => {
    const response = await api.post("/users", payload);
    return response.data;
};

export const updateUser = async (userId, payload) => {
    const response = await api.patch(`/users/${userId}`, payload);
    return response.data;
};

export const updateUserStatus = async (userId, status) => {
    const response = await api.patch(`/users/${userId}/status`, {
        status,
    });

    return response.data;
};

export const resetUserPassword = async (userId, password) => {
    await api.post(`/users/${userId}/reset-password`, {
        password,
    });
};

export default {
    getUsers,
    getUser,
    createUser,
    updateUser,
    updateUserStatus,
    resetUserPassword,
};
