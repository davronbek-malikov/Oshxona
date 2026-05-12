"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RiderRoot() {
  const router = useRouter();

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }

      const res = await fetch("/api/rider/orders?type=mine");
      if (res.status === 404) {
        router.replace("/rider/onboarding");
      } else {
        router.replace("/rider/orders");
      }
    }
    check();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#111]">
      <div className="w-8 h-8 border-2 border-[#F97316]/30 border-t-[#F97316] rounded-full animate-spin" />
    </div>
  );
}
