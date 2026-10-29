const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api/v1";

function authHeaders() {
  const token = localStorage.getItem("access_token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";

  let data = null;

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = text ? { detail: text } : null;
  }

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      `Request failed with status ${response.status}`;

    throw new Error(
      Array.isArray(message)
        ? message.map((item) => item?.msg || String(item)).join(", ")
        : String(message)
    );
  }

  return data;
}

export async function listPayments({
  invoiceId,
  patientId,
  paymentStatus,
} = {}) {
  const params = new URLSearchParams();

  if (invoiceId !== undefined && invoiceId !== null && invoiceId !== "") {
    params.set("invoice_id", invoiceId);
  }

  if (patientId !== undefined && patientId !== null && patientId !== "") {
    params.set("patient_id", patientId);
  }

  if (
    paymentStatus !== undefined &&
    paymentStatus !== null &&
    paymentStatus !== ""
  ) {
    params.set("payment_status", paymentStatus);
  }

  const query = params.toString();

  return request(`/payments${query ? `?${query}` : ""}`);
}

export async function getPayment(paymentId) {
  return request(`/payments/${paymentId}`);
}

export async function getPaymentByNumber(paymentNumber) {
  return request(
    `/payments/number/${encodeURIComponent(paymentNumber)}`
  );
}

export async function createPayment(payload) {
  return request("/payments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updatePayment(paymentId, payload) {
  return request(`/payments/${paymentId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deletePayment(paymentId) {
  return request(`/payments/${paymentId}`, {
    method: "DELETE",
  });
}
