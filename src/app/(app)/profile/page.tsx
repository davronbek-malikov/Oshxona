"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useLanguage, type Locale } from "@/context/LanguageContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useCurrentUser();
  const { t, lang, setLang } = useLanguage();
  const { state: pushState, subscribe, unsubscribe } = usePushNotifications();
  const [pushLoading, setPushLoading] = useState(false);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user]);

  async function handleSaveName() {
    if (!user) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("users").update({ name }).eq("id", user.id);
    setSaving(false);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Avatar + info */}
      <div className="bg-white rounded-2xl p-5 text-center">
        <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mx-auto mb-3">
          <span className="text-4xl">👤</span>
        </div>
        <p className="font-bold text-lg">{user?.name || t("profile.noName")}</p>
        <p className="text-muted-foreground text-sm mt-1">{user?.phone}</p>
      </div>

      {/* Name edit */}
      <div className="bg-white rounded-2xl p-4 space-y-3">
        <h3 className="font-semibold">{t("profile.name")}</h3>
        {editing ? (
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("profile.namePlaceholder")}
              className="h-11 flex-1"
              autoFocus
            />
            <Button
              onClick={handleSaveName}
              disabled={saving || !name.trim()}
              className="h-11"
            >
              {saving ? "..." : t("common.save")}
            </Button>
            <Button
              variant="outline"
              onClick={() => setEditing(false)}
              className="h-11"
            >
              {t("common.cancel")}
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              {saved ? t("common.saved") : user?.name || t("profile.notSet")}
            </p>
            <button
              onClick={() => setEditing(true)}
              className="text-primary text-sm font-semibold"
            >
              {t("common.edit")}
            </button>
          </div>
        )}
      </div>

      {/* Language toggle */}
      <div className="bg-white rounded-2xl p-4 space-y-3">
        <h3 className="font-semibold">{t("profile.language")}</h3>
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {(["uz", "en"] as Locale[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`flex-1 h-9 rounded-lg text-sm font-semibold transition-colors ${
                lang === l
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              {l === "uz" ? "🇺🇿 " + t("profile.uz") : "🇬🇧 " + t("profile.en")}
            </button>
          ))}
        </div>
      </div>

      {/* Push notification toggle */}
      {pushState !== "unsupported" && (
        <div className="bg-white rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">🔔 Bildirishnomalar</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {pushState === "granted"
                  ? "Buyurtma yangilanishlari yoqilgan"
                  : pushState === "denied"
                  ? "Brauzer bloklagan — sozlamalardan yoqing"
                  : "Buyurtma holati haqida xabar oling"}
              </p>
            </div>

            {pushState === "denied" ? (
              <span className="text-xs text-destructive font-medium">Bloklangan</span>
            ) : (
              <button
                onClick={async () => {
                  setPushLoading(true);
                  if (pushState === "granted") {
                    await unsubscribe();
                  } else {
                    await subscribe();
                  }
                  setPushLoading(false);
                }}
                disabled={pushLoading || pushState === "loading"}
                className={`relative w-12 h-7 rounded-full transition-colors duration-200 flex-shrink-0 ${
                  pushState === "granted" ? "bg-primary" : "bg-gray-200"
                } disabled:opacity-50`}
                aria-label="Push bildirishnomalarini yoqish/o'chirish"
              >
                <span
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                    pushState === "granted" ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Navigation shortcuts */}
      <div className="bg-white rounded-2xl divide-y divide-border">
        <button
          onClick={() => router.push("/orders")}
          className="flex items-center justify-between w-full px-5 py-4 text-base"
        >
          <div className="flex items-center gap-3">
            <span>📋</span>
            <span>{t("profile.myOrders")}</span>
          </div>
          <span className="text-muted-foreground">→</span>
        </button>
        <button
          onClick={() => router.push("/role-picker")}
          className="flex items-center justify-between w-full px-5 py-4 text-base"
        >
          <div className="flex items-center gap-3">
            <span>🔄</span>
            <span>{t("profile.switchMode")}</span>
          </div>
          <span className="text-muted-foreground">→</span>
        </button>
      </div>

      <Button
        variant="outline"
        className="w-full border-destructive text-destructive hover:bg-red-50"
        onClick={handleSignOut}
      >
        {t("profile.signOut")}
      </Button>
    </div>
  );
}
