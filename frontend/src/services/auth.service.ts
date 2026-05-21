import apiClient from "@/lib/api";
import type { User } from "@/types";

export const authService = {
  async getMe(): Promise<User> {
    const { data } = await apiClient.get<User>("/auth/me");
    return data;
  },
};
