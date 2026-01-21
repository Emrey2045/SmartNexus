import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let queue = [];

function resolveQueue(error, token = null) {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  queue = [];
}

API.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    // 401 aldıysak refresh dene (sonsuz döngüyü engelle)
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(err);
      }

      // Aynı anda birden fazla request 401 alırsa kuyruğa al
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((newToken) => {
          original.headers.Authorization = `Bearer ${newToken}`;
          return API(original);
        });
      }

      isRefreshing = true;

      try {
        const r = await API.post("/auth/refresh", { refreshToken });
        const { accessToken, refreshToken: newRefresh } = r.data.data;

        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefresh);

        API.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        resolveQueue(null, accessToken);

        original.headers.Authorization = `Bearer ${accessToken}`;
        return API(original);
      } catch (refreshErr) {
        resolveQueue(refreshErr, null);
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

export default API;
