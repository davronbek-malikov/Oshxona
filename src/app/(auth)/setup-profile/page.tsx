"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SetupProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [lang, setLang] = useState<"uz" | "en">("uz");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError("");

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user?.email) {
        setError("Sessiya topilmadi. Qayta kiring.");
        return;
      }

      const phone = "+" + user.email.replace("@oshxona.internal", "");
      const { error: updateError } = await supabase
        .from("users")
        .update({ name: name.trim(), language: lang })
        .eq("phone", phone);

      if (updateError) {
        setError("Saqlashda xatolik yuz berdi.");
        return;
      }

      // Save language preference locally
      localStorage.setItem("oshxona_lang", lang);

      // New users go to role picker to choose customer or restaurant
      router.replace("/role-picker");
    } catch {
      setError("Internet aloqasini tekshiring");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white px-6">
      {/* Progress indicator */}
      <div className="flex gap-1.5 pt-14 pb-8 justify-center">
        <div className="h-1.5 w-8 rounded-full bg-[#EEEEEE]" />
        <div className="h-1.5 w-8 rounded-full bg-[#EEEEEE]" />
        <div className="h-1.5 w-8 rounded-full bg-primary" />
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="mb-8">
          <span className="text-4xl">👋</span>
          <h1 className="text-[28px] font-extrabold text-[#111] mt-3 tracking-tight">
            Xush kelibsiz!
          </h1>
          <p className="text-[#AAAAAA] mt-1 text-[15px]">
            Profilingizni yarating. Welcome! Set up your profile.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-[13px] font-bold text-[#888] uppercase tracking-wide mb-2">
              Ismingiz / Your name
            </label>
            <input
              type="text"
              placeholder="Masalan: Davron"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="w-full h-14 rounded-2xl border border-[#EEEEEE] px-4 text-[17px] font-semibold text-[#111] placeholder:text-[#CCCCCC] focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Language */}
          <div>
            <label className="block text-[13px] font-bold text-[#888] uppercase tracking-wide mb-2">
              Til / Language
            </label>
            <div className="flex gap-3">
              {(["uz", "en"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`flex-1 h-14 rounded-2xl border-2 font-bold text-[15px] transition-colors ${
                    lang === l
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-[#EEEEEE] text-[#AAAAAA]"
                  }`}
                >
                  {l === "uz" ? "🇺🇿 O'zbek" : "🇬🇧 English"}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="w-full h-14 rounded-2xl bg-primary text-white font-bold text-[17px] disabled:opacity-40 active:scale-[0.98] transition-transform mt-4"
            style={{ boxShadow: "0 4px 16px rgba(5,150,105,0.3)" }}
          >
            {saving ? "Saqlanmoqda..." : "Davom etish →"}
          </button>
        </form>
      </div>
    </div>
  );
}
