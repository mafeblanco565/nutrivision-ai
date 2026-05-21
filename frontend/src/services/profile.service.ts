import apiClient from "@/lib/api";
import type { Profile, ProfileCreate } from "@/types";

export const profileService = {
  async create(payload: ProfileCreate): Promise<Profile> {
    const { data } = await apiClient.post<Profile>("/profile", payload);
    return data;
  },

  async get(): Promise<Profile> {
    const { data } = await apiClient.get<Profile>("/profile");
    return data;
  },

  async update(payload: Partial<ProfileCreate>): Promise<Profile> {
    const { data } = await apiClient.patch<Profile>("/profile", payload);
    return data;
  },
};
