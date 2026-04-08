const BASE_URL = "http://127.0.0.1:8000";

export const getToken = () => localStorage.getItem("ms_token");
export const getUser  = () => JSON.parse(localStorage.getItem("ms_currentUser") || "null");
export const logout   = () => {
  localStorage.removeItem("ms_token");
  localStorage.removeItem("ms_currentUser");
};

// Main API caller — automatically attaches JWT token
export const apiCall = async (endpoint, method = "GET", body = null) => {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json();

  if (!response.ok) throw new Error(data.detail || "Something went wrong");
  return data;
};