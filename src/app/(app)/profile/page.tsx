"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-5 text-center">
        <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mx-auto mb-3">
          <span className="text-4xl">👤</span>
        </div>
        <h2 className="text-xl font-bold">Profil</h2>
        <p className="text-muted-foreground text-sm mt-1">Foydalanuvchi ma'lumotlari</p>
      </div>

      <div className="bg-white rounded-2xl p-5 space-y-3">
        <h3 className="font-semibold text-lg">Til / Language</h3>
        <div className="flex gap-3">
          <button className="flex-1 h-12 rounded-xl border-2 border-primary bg-primary/10 text-primary font-semibold">
            🇺🇿 O'zbekcha
          </button>
          <button className="flex-1 h-12 rounded-xl border-2 border-border text-muted-foreground font-semibold">
            🇬🇧 English
          </button>
        </div>
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
