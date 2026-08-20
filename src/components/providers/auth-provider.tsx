"use client";

import { useEffect, type ReactNode } from "react";
import { apiFetch } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import type { PublicUser } from "@/types/api";

export function AuthProvider({ children }: { children: ReactNode }) {
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);
  const clear = useAuthStore((state) => state.clear);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      setLoading(true);
      try {
        const data = await apiFetch<{ user: PublicUser }>("/api/auth/me");
        if (active) setUser(data.user);
      } catch {
        if (active) clear();
      }
    }

    void loadSession();
    return () => {
      active = false;
    };
  }, [clear, setLoading, setUser]);

  return children;
}
