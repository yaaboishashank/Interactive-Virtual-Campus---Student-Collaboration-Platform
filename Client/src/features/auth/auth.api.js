import api from "../../lib/axiosInstance";

export async function registerUser(values) {
  const { data } = await api.post("/auth/register", values);
  return data;
}

export async function loginUser(values) {
  const { data } = await api.post("/auth/login", values);
  return data;
}

export async function getCurrentUser() {
  const { data } = await api.get("/auth/me");
  return data;
}