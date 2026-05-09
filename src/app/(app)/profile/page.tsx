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

  // Use local display name so UI updates immediately after save
  const [displayName, setDisplayName] = useState("");
  const [editName, setEditName] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (user?.name) {
      setDisplayName(user.name);
      setEditName(user.name);
    }
  }, [user]);

  async function handleSaveName() {
    if (!editName.trim()) return;
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        setSaveError(d.error ?? "Xatolik yuz berdi");
        return;
      }
      // Update local display immediately — no need to re-fetch
      setDisplayName(editName.trim());
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaveError("Internet aloqasini tekshiring");
    } finally {
      setSaving(false);
    }
  }

  async function handleSetLang(l: Locale) {
    setLang(l);
    fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: l }),
    });
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#AAAAAA]">{t("common.loading")}</p>
      </div>
    );
  }

  const nameToShow = displayName || user?.name || "";

  return (
    <div className="space-y-4">
      {/* Avatar */}
      <div className="bg-white rounded-2xl p-5 text-center">
        <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mx-auto mb-3">
          <span className="text-3xl text-white font-extrabold">
            {nameToShow ? nameToShow[0].toUpperCase() : "👤"}
          </span>
        </div>
        <p className="font-extrabold text-[20px] text-[#111]">
          {nameToShow || t("profile.noName")}
        </p>
        <p className="text-[#AAAAAA] text-[13px] mt-1">{user?.phone}</p>
        {saved && (
          <p className="text-green-600 text-[13px] font-bold mt-1">✓ {t("common.saved")}</p>
        )}
      </div>

      {/* Name edit */}
      <div className="bg-white rounded-2xl p-4 space-y-3">
        <h3 className="font-bold text-[16px] text-[#111]">{t("profile.name")}</h3>
        {editing ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={editName}
                onChange={(e) => { setEditName(e.target.value); setSaveError(""); }}
                placeholder={t("profile.namePlaceholder")}
                className="h-12 flex-1 text-[16px] font-semibold"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
              />
              <Button
                onClick={handleSaveName}
                disabled={saving || !editName.trim()}
                className="h-12 px-5 font-bold"
              >
                {saving ? "..." : t("common.save")}
              </Button>
              <Button
                variant="outline"
                onClick={() => { setEditing(false); setSaveError(""); setEditName(nameToShow); }}
                className="h-12"
              >
                {t("common.cancel")}
              </Button>
            </div>
            {saveError && <p className="text-red-500 text-[13px]">{saveError}</p>}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-[15px] text-[#666]">
              {nameToShow || t("profile.notSet")}
            </p>
            <button
              onClick={() => { setEditing(true); setEditName(nameToShow); }}
              className="text-primary text-[14px] font-bold px-3 py-1.5 rounded-xl bg-primary/10 active:scale-95"
            >
              {t("common.edit")}
            </button>
          </div>
        )}
      </div>

      {/* Language toggle — text only, no flag emoji (Windows Chrome doesn't render flags) */}
      <div className="bg-white rounded-2xl p-4 space-y-3">
        <h3 className="font-bold text-[16px] text-[#111]">{t("profile.language")}</h3>
        <div className="flex gap-2">
          {(["uz", "en"] as Locale[]).map((l) => (
            <button
              key={l}
              onClick={() => handleSetLang(l)}
              className={`flex-1 h-12 rounded-2xl text-[15px] font-bold transition-colors border-2 ${
                lang === l
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-[#EEEEEE] text-[#AAAAAA]"
              }`}
            >
              {l === "uz" ? "O'zbek" : "English"}
            </button>
          ))}
        </div>
      </div>

      {/* Push notifications */}
      {pushState !== "unsupported" && (
        <div className="bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[16px] text-[#111]">
                🔔 {lang === "uz" ? "Bildirishnomalar" : "Notifications"}
              </h3>
              <p className="text-[13px] text-[#AAAAAA] mt-0.5">
                {pushState === "granted"
                  ? (lang === "uz" ? "Yoqilgan ✓" : "Enabled ✓")
                  : pushState === "denied"
                  ? (lang === "uz" ? "Brauzer bloklagan" : "Blocked by browser")
                  : (lang === "uz" ? "Buyurtma holati haqida xabar oling" : "Get notified about orders")}
              </p>
            </div>
            {pushState === "denied" ? (
              <span className="text-[12px] text-destructive font-bold">
                {lang === "uz" ? "Bloklangan" : "Blocked"}
              </span>
            ) : (
              <button
                onClick={async () => {
                  setPushLoading(true);
                  if (pushState === "granted") await unsubscribe();
                  else await subscribe();
                  setPushLoading(false);
                }}
                disabled={pushLoading || pushState === "loading"}
                className={`relative w-12 h-7 rounded-full transition-colors duration-300 flex-shrink-0 ${
                  pushState === "granted" ? "bg-primary" : "bg-gray-200"
                } disabled:opacity-50`}
              >
                <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                  pushState === "granted" ? "translate-x-6" : "translate-x-1"
                }`} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Nav shortcuts */}
      <div className="bg-white rounded-2xl divide-y divide-[#F2F2F2]">
        <button onClick={() => router.push("/orders")}
          className="flex items-center justify-between w-full px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="text-lg">📋</span>
            <span className="text-[15px] font-semibold text-[#111]">{t("profile.myOrders")}</span>
          </div>
          <span className="text-[#CCCCCC]">→</span>
        </button>
        <button onClick={() => router.push("/role-picker")}
          className="flex items-center justify-between w-full px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="text-lg">🔄</span>
            <span className="text-[15px] font-semibold text-[#111]">{t("profile.switchMode")}</span>
          </div>
          <span className="text-[#CCCCCC]">→</span>
        </button>
      </div>

      <Button
        variant="outline"
        className="w-full h-13 border-red-200 text-red-500 hover:bg-red-50 font-bold rounded-2xl"
        onClick={handleSignOut}
      >
        {t("profile.signOut")}
      </Button>
    </div>
  );
}
