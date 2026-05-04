"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function RolePickerPage() {
  const router = useRouter();
  const { user, loading } = useCurrentUser();
  const [saving, setSaving] = useState(false);

  async function pickRole(role: "customer" | "restaurant") {
    setSaving(true);
    const supabase = createClient();

    if (user) {
      await supabase.from("users").update({ role }).eq("id", user.id);
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("oshxona_role_confirmed", "1");
    }

    if (role === "restaurant") {
      router.replace("/restaurant/onboarding");
    } else {
      router.replace("/menu");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary mb-6">
          <span className="text-4xl">🍽️</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">Xush kelibsiz!</h1>
        <p className="text-muted-foreground mb-8">
          Siz kim sifatida foydalanasiz?
          <br />
          <span className="text-sm">How will you use Oshxona?</span>
        </p>

        <div className="space-y-4">
          <button
            onClick={() => pickRole("customer")}
            disabled={saving}
            className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
          >
            <span className="text-4xl">🛍️</span>
            <div>
              <p className="font-bold text-lg">Men mijozman</p>
              <p className="text-muted-foreground text-sm">I'm a customer</p>
              <p className="text-xs text-muted-foreground mt-1">
                Restoran qidirish va buyurtma berish
              </p>
            </div>
          </button>

          <button
            onClick={() => pickRole("restaurant")}
            disabled={saving}
            className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
          >
            <span className="text-4xl">🏪</span>
            <div>
              <p className="font-bold text-lg">Men restoran egasiman</p>
              <p className="text-muted-foreground text-sm">
                I'm a restaurant owner
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Restoran ochish va buyurtma olish
              </p>
            </div>
          </button>
        </div>

        {saving && (
          <p className="text-muted-foreground text-sm mt-4">Saqlanmoqda...</p>
        )}
      </div>
    </div>
  );
}
