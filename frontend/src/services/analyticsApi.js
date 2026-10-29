import api from "./api";

const analyticsApi = {
  overview: async () => {
    const response = await api.get("/analytics/overview");
    return response.data;
  },

  health: async () => {
    const response = await api.get("/analytics/health");
    return response.data;
  },
};

export default analyticsApi;
