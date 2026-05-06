"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Fallback handler — only reached if someone navigates here directly.
// Normal login uses verifyOtp() on the verify page instead.
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        router.replace("/menu");
      }
    });
    // If no SIGNED_IN event within 3s, go to login
    const timeout = setTimeout(() => router.replace("/login"), 3000);
    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground text-sm">Logging in...</p>
    </div>
  );
}
