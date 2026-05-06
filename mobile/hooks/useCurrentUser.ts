import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface User {
  id: string;
  phone: string;
  name: string | null;
  role: string | null;
  language: string | null;
}

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.email) { setLoading(false); return; }

      const phone = "+" + authUser.email.replace("@oshxona.internal", "");
      const { data } = await supabase
        .from("users").select("*").eq("phone", phone).single();
      setUser(data);
      setLoading(false);
    }
    load();
  }, []);

  return { user, loading };
}
