import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://backend-production-bdbf.up.railway.app/api/v1";

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 90000,
});

// Attach Supabase access token on every request
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    // First try the stored token (set by onAuthStateChange)
    const stored = useAuthStore.getState().accessToken;
    if (stored) {
      config.headers.Authorization = `Bearer ${stored}`;
      return config;
    }
    // Fallback: read directly from Supabase
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      useAuthStore.getState().setAccessToken(session.access_token);
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  }
  return config;
});

// On 401/403: refresh session and retry once
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    if ((status === 401 || status === 403) && !original._retry) {
      original._retry = true;

      if (typeof window !== "undefined") {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.refreshSession();

        if (session?.access_token) {
          useAuthStore.getState().setAccessToken(session.access_token);
          original.headers.Authorization = `Bearer ${session.access_token}`;
          return apiClient(original);
        } else {
          useAuthStore.getState().clearUser();
          await supabase.auth.signOut();
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
