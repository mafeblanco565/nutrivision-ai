"use client";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth";
import { authService } from "@/services/auth.service";

export function useSignInWithGoogle() {
  const signIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
  };
  return signIn;
}

export function useLogout() {
  const { clearUser } = useAuthStore();
  const router = useRouter();

  return async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearUser();
    router.push("/login");
  };
}

export function useCurrentUser() {
  const { user, setUser } = useAuthStore();

  const query = useQuery({
    queryKey: ["me"],
    queryFn: authService.getMe,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (query.data) setUser(query.data);
  }, [query.data, setUser]);

  return { ...query, user: query.data ?? user };
}

export function useInitializeAuth() {
  const { setUser, clearUser, setAccessToken } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          clearUser();
        }
        if (session?.access_token) {
          setAccessToken(session.access_token);
        }
        if (event === "SIGNED_IN" && session) {
          try {
            const userData = await authService.getMe();
            setUser(userData);
            if (!userData.has_profile) {
              router.push("/onboarding");
            }
          } catch {
            // Backend unreachable — keep session, user will retry
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
