import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { createClient } from "@/lib/supabase/client";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://backend-production-bdbf.up.railway.app/api/v1";

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// Attach Supabase access token on every request
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  }
  return config;
});

// On 401: refresh session and retry once
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (typeof window !== "undefined") {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.refreshSession();

        if (session?.access_token) {
          original.headers.Authorization = `Bearer ${session.access_token}`;
          return apiClient(original);
        } else {
          await supabase.auth.signOut();
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
