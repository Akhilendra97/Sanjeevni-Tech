import api from "./api";

export const listMedicines = async ({
    skip = 0,
    limit = 500,
} = {}) => {
    const response = await api.get("/medicines", {
        params: {
            skip,
            limit,
        },
    });

    return response.data;
};

export const getMedicine = async (medicineId) => {
    const response = await api.get(
        `/medicines/${medicineId}`
    );

    return response.data;
};

export const createMedicine = async (payload) => {
    const response = await api.post(
        "/medicines",
        payload
    );

    return response.data;
};

export const updateMedicine = async (
    medicineId,
    payload
) => {
    const response = await api.put(
        `/medicines/${medicineId}`,
        payload
    );

    return response.data;
};

export const deleteMedicine = async (medicineId) => {
    await api.delete(
        `/medicines/${medicineId}`
    );
};

export const getLowStockMedicines = async () => {
    const response = await api.get(
        "/medicines/low-stock"
    );

    return response.data;
};

export const getExpiredMedicines = async () => {
    const response = await api.get(
        "/medicines/expired"
    );

    return response.data;
};
