const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api/v1";

function getToken() {
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    ""
  );
}

async function request(path, options = {}) {
  const token = getToken();

  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const data = await response.json();

      if (typeof data?.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data?.detail)) {
        message = data.detail
          .map((item) => item?.msg || "Validation error")
          .join(", ");
      } else if (data?.message) {
        message = data.message;
      }
    } catch {
      // Keep HTTP fallback message.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function listInvoices({
  patientId,
  admissionId,
  invoiceStatus,
} = {}) {
  const params = new URLSearchParams();

  if (patientId !== undefined && patientId !== null && patientId !== "") {
    params.set("patient_id", patientId);
  }

  if (
    admissionId !== undefined &&
    admissionId !== null &&
    admissionId !== ""
  ) {
    params.set("admission_id", admissionId);
  }

  if (invoiceStatus) {
    params.set("invoice_status", invoiceStatus);
  }

  const query = params.toString();

  return request(`/invoices${query ? `?${query}` : ""}`);
}

export async function getInvoice(id) {
  return request(`/invoices/${id}`);
}

export async function getInvoiceByNumber(invoiceNumber) {
  return request(
    `/invoices/number/${encodeURIComponent(invoiceNumber)}`
  );
}

export async function createInvoice(payload) {
  return request("/invoices", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateInvoice(id, payload) {
  return request(`/invoices/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteInvoice(id) {
  return request(`/invoices/${id}`, {
    method: "DELETE",
  });
}
