import api from "./api";

const unwrap = (response) => response.data;

const pharmacyApi = {
  // ----------------------------------------------------------
  // SUPPLIERS
  // ----------------------------------------------------------

  listSuppliers: async (params = {}) => {
    const response = await api.get("/procurement/suppliers", { params });
    return unwrap(response);
  },

  getSupplier: async (id) => {
    const response = await api.get(`/procurement/suppliers/${id}`);
    return unwrap(response);
  },

  createSupplier: async (payload) => {
    const response = await api.post("/procurement/suppliers", payload);
    return unwrap(response);
  },

  updateSupplier: async (id, payload) => {
    const response = await api.put(`/procurement/suppliers/${id}`, payload);
    return unwrap(response);
  },

  deactivateSupplier: async (id) => {
    const response = await api.delete(`/procurement/suppliers/${id}`);
    return unwrap(response);
  },

  // ----------------------------------------------------------
  // PURCHASE ORDERS
  // ----------------------------------------------------------

  listPurchaseOrders: async (params = {}) => {
    const response = await api.get("/procurement/purchase-orders", { params });
    return unwrap(response);
  },

  getPurchaseOrder: async (id) => {
    const response = await api.get(`/procurement/purchase-orders/${id}`);
    return unwrap(response);
  },

  getPurchaseOrderByNumber: async (number) => {
    const response = await api.get(
      `/procurement/purchase-orders/number/${encodeURIComponent(number)}`
    );
    return unwrap(response);
  },

  createPurchaseOrder: async (payload) => {
    const response = await api.post("/procurement/purchase-orders", payload);
    return unwrap(response);
  },

  updatePurchaseOrder: async (id, payload) => {
    const response = await api.put(`/procurement/purchase-orders/${id}`, payload);
    return unwrap(response);
  },

  updatePurchaseOrderStatus: async (id, status) => {
    const response = await api.patch(
      `/procurement/purchase-orders/${id}/status`,
      null,
      { params: { status_value: status } }
    );
    return unwrap(response);
  },

  deletePurchaseOrder: async (id) => {
    const response = await api.delete(`/procurement/purchase-orders/${id}`);
    return unwrap(response);
  },

  updatePurchaseOrderItem: async (itemId, payload) => {
    const response = await api.put(
      `/procurement/purchase-order-items/${itemId}`,
      payload
    );
    return unwrap(response);
  },

  deletePurchaseOrderItem: async (itemId) => {
    const response = await api.delete(
      `/procurement/purchase-order-items/${itemId}`
    );
    return unwrap(response);
  },

  // ----------------------------------------------------------
  // STOCK RECEIVING
  // ----------------------------------------------------------

  listStockReceipts: async (params = {}) => {
    const response = await api.get("/stock-receipts", { params });
    return unwrap(response);
  },

  getStockReceipt: async (id) => {
    const response = await api.get(`/stock-receipts/${id}`);
    return unwrap(response);
  },

  createStockReceipt: async (payload) => {
    const response = await api.post("/stock-receipts", payload);
    return unwrap(response);
  },

  // ----------------------------------------------------------
  // INVENTORY
  // ----------------------------------------------------------

  listInventory: async (params = {}) => {
    const response = await api.get("/inventory", { params });
    return unwrap(response);
  },

  getInventory: async (id) => {
    const response = await api.get(`/inventory/${id}`);
    return unwrap(response);
  },

  createInventory: async (payload) => {
    const response = await api.post("/inventory", payload);
    return unwrap(response);
  },

  updateInventory: async (id, payload) => {
    const response = await api.put(`/inventory/${id}`, payload);
    return unwrap(response);
  },

  adjustInventoryQuantity: async (id, quantityChange) => {
    const response = await api.patch(
      `/inventory/${id}/adjust`,
      { quantity_change: quantityChange }
    );
    return unwrap(response);
  },

  reserveInventory: async (id, quantity) => {
    const response = await api.post(
      `/inventory/${id}/reserve`,
      { quantity }
    );
    return unwrap(response);
  },

  releaseInventory: async (id, quantity) => {
    const response = await api.post(
      `/inventory/${id}/release`,
      { quantity }
    );
    return unwrap(response);
  },

  deleteInventory: async (id) => {
    const response = await api.delete(`/inventory/${id}`);
    return unwrap(response);
  },

  getInventoryOverview: async () => {
    // Derive the overview from the real inventory endpoint; no unsupported /overview route.
    const response = await api.get("/inventory");
    const rows = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.items)
        ? response.data.items
        : [];
    return {
      inventory_items: rows.length,
      low_stock: rows.filter((item) =>
        Number(item.quantity || 0) <= Number(item.minimum_stock || 0)
      ).length,
      pharmacies: new Set(rows.map((item) => item.location).filter(Boolean)).size,
    };
  },
};

export default pharmacyApi;
