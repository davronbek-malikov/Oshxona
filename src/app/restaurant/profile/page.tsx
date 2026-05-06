"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function RestaurantProfilePage() {
  const router = useRouter();
  const { user } = useCurrentUser();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-5 text-center">
        <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mx-auto mb-3">
          <span className="text-4xl">🏪</span>
        </div>
        <h2 className="text-xl font-bold">Restoran egasi</h2>
        <p className="text-muted-foreground text-sm mt-1">{user?.phone}</p>
      </div>

      <div className="bg-white rounded-2xl divide-y divide-border">
        <Link
          href="/restaurant/settings"
          className="flex items-center justify-between px-5 py-4 text-base"
        >
          <div className="flex items-center gap-3">
            <span>⚙️</span>
            <span>Restaurant settings</span>
          </div>
          <span className="text-muted-foreground">→</span>
        </Link>
        <Link
          href="/restaurant/onboarding"
          className="flex items-center justify-between px-5 py-4 text-base"
        >
          <div className="flex items-center gap-3">
            <span>📝</span>
            <span>Full re-onboarding</span>
          </div>
          <span className="text-muted-foreground">→</span>
        </Link>
        <Link
          href="/menu"
          className="flex items-center justify-between px-5 py-4 text-base"
        >
          <div className="flex items-center gap-3">
            <span>👤</span>
            <span>View as customer</span>
          </div>
          <span className="text-muted-foreground">→</span>
        </Link>
      </div>

      <Button
        variant="outline"
        className="w-full border-destructive text-destructive hover:bg-red-50"
        onClick={handleSignOut}
      >
        Chiqish / Sign out
      </Button>
    </div>
  );
}
