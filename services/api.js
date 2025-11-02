import axios from "axios";
import { setupCache } from "axios-cache-interceptor";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const REQUEST_TIMEOUT = 5000;
const CACHE_TTL_MS = 60000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

const baseInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

const api = setupCache(baseInstance, {
  ttl: CACHE_TTL_MS,
  shouldCache: (response) =>
    response.config.method === "get" && response.status === 200,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { config } = error;

    const isNetworkError = axios.isAxiosError(error) && !error.response;
    const currentRetries = config?._retry || 0;
    const canRetry = isNetworkError && currentRetries < MAX_RETRIES;

    if (canRetry) {
      config._retry = currentRetries + 1;

      console.warn(
        `[Axios Retry] Attempt ${config._retry}/${MAX_RETRIES} for ${config.url}`
      );

      return new Promise((resolve) =>
        setTimeout(() => resolve(api(config)), RETRY_DELAY_MS)
      );
    }

    return Promise.reject(error);
  }
);

export default api;
