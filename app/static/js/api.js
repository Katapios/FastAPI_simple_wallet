const API_BASE = "/api/v1";

function getToken() {
  return localStorage.getItem("wallet_token");
}

function setToken(login) {
  localStorage.setItem("wallet_token", login);
}

function clearToken() {
  localStorage.removeItem("wallet_token");
}

async function apiRequest(method, path, body = null) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body !== null) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${path}`, options);
  let data = null;

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  }

  if (!response.ok) {
    const detail = data?.detail;
    let message;
    if (typeof detail === "string") {
      message = detail;
    } else if (Array.isArray(detail)) {
      message = detail.map((e) => e.msg || JSON.stringify(e)).join("; ");
    } else {
      message = `Ошибка ${response.status}`;
    }
    throw new Error(message);
  }

  return data;
}

export const api = {
  getToken,
  setToken,
  clearToken,

  createUser(login) {
    return apiRequest("POST", "/users", { login });
  },

  getMe() {
    return apiRequest("GET", "/users/me");
  },

  getBalance() {
    return apiRequest("GET", "/balance");
  },

  getWallets() {
    return apiRequest("GET", "/wallets");
  },

  createWallet(payload) {
    return apiRequest("POST", "/wallets", payload);
  },

  addIncome(payload) {
    return apiRequest("POST", "/operations/income", payload);
  },

  addExpense(payload) {
    return apiRequest("POST", "/operations/expense", payload);
  },

  transfer(payload) {
    return apiRequest("POST", "/operations/transfer", payload);
  },

  getOperations(params = {}) {
    const query = new URLSearchParams();
    if (params.wallet_id) query.set("wallet_id", params.wallet_id);
    if (params.date_from) query.set("date_from", params.date_from);
    if (params.date_to) query.set("date_to", params.date_to);
    const qs = query.toString();
    return apiRequest("GET", `/operations${qs ? `?${qs}` : ""}`);
  },
};
