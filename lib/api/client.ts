import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const accessToken = localStorage.getItem("access_token");
    const adminKey = localStorage.getItem("admin_key");

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    if (adminKey) {
      config.headers["X-Admin-Key"] = adminKey;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("admin_key");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
