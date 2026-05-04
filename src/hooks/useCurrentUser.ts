"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

export function useCurrentUser() {
  const [user, setUser] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser?.email) {
        setUser(null);
        setLoading(false);
        return;
      }

      // email is `<digits>@oshxona.internal`, phone is `+<digits>`
      const phone = "+" + authUser.email.replace("@oshxona.internal", "");

      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("phone", phone)
        .single();

      setUser(data);
      setLoading(false);
    }

    load();
  }, []);

  return { user, loading };
}
