"use client";

import { useEffect, useState } from "react";
import type { Database } from "@/types/database";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

export function useCurrentUser() {
  const [user, setUser] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { setUser(d?.user ?? null); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return { user, loading };
}
