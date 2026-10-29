import api from "./api";

export const getPatients = async ({
    search = "",
    skip = 0,
    limit = 100,
    is_active = true,
} = {}) => {
    const response = await api.get("/patients", {
        params: {
            ...(search.trim() ? { search: search.trim() } : {}),
            skip,
            limit,
            is_active,
        },
    });

    return response.data;
};

export const getPatient = async (patientId) => {
    const response = await api.get(`/patients/${patientId}`);
    return response.data;
};

export const getPatientByNumber = async (patientNumber) => {
    const response = await api.get(
        `/patients/number/${encodeURIComponent(patientNumber)}`
    );

    return response.data;
};

export const createPatient = async (patientData) => {
    const response = await api.post("/patients", patientData);
    return response.data;
};

export const updatePatient = async (patientId, patientData) => {
    const response = await api.patch(
        `/patients/${patientId}`,
        patientData
    );

    return response.data;
};

export const deactivatePatient = async (patientId) => {
    const response = await api.delete(`/patients/${patientId}`);
    return response.data;
};

export default {
    getPatients,
    getPatient,
    getPatientByNumber,
    createPatient,
    updatePatient,
    deactivatePatient,
};
