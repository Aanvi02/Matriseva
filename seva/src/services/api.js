const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const getToken  = () => localStorage.getItem("ms_token");
export const getUser   = () => JSON.parse(localStorage.getItem("ms_currentUser") || "null");
export const setToken  = (t) => localStorage.setItem("ms_token", t);
export const setUser   = (u) => localStorage.setItem("ms_currentUser", JSON.stringify(u));
export const clearAuth = () => {
  localStorage.removeItem("ms_token");
  localStorage.removeItem("ms_currentUser");
};

async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });
  if (res.status === 401) { clearAuth(); window.location.href = "/login"; return; }
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "API error");
  return data;
}

export const authAPI = {
  login: (email, password) => apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (userData) => apiFetch("/auth/register", { method: "POST", body: JSON.stringify(userData) }),
};

export const patientsAPI = {
  getAll: (filters = {}) => { const p = new URLSearchParams(filters).toString(); return apiFetch(`/patients${p ? "?" + p : ""}`); },
  getById: (id) => apiFetch(`/patients/${id}`),
  create: (data) => apiFetch("/patients", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => apiFetch(`/patients/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  addVisit: (id, data) => apiFetch(`/patients/${id}/visits`, { method: "POST", body: JSON.stringify(data) }),
};

export const mlAPI = {
  predict: (vitals) => apiFetch("/ml/predict", { method: "POST", body: JSON.stringify(vitals) }),
};

export const appointmentsAPI = {
  getAll: () => apiFetch("/appointments"),
  create: (data) => apiFetch("/appointments", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => apiFetch(`/appointments/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
};
