"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const COUNTRY_CODES = [
  { code: "+82",  flag: "🇰🇷", label: "Korea" },
  { code: "+998", flag: "🇺🇿", label: "Uzbekistan" },
  { code: "+7",   flag: "🇷🇺", label: "Russia" },
];

type Mode = "signin" | "signup" | null;

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(null);
  const [countryCode, setCountryCode] = useState("+82");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!phone.trim() || !mode) return;
    setLoading(true);
    setError("");
    const fullPhone = `${countryCode}${phone.replace(/\s/g, "")}`;
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Xatolik yuz berdi"); return; }
      sessionStorage.setItem("auth_phone", fullPhone);
      sessionStorage.setItem("auth_mode", mode);
      sessionStorage.setItem("auth_delivery_method", data.method);
      sessionStorage.setItem("auth_deep_link", data.deepLink ?? "");
      sessionStorage.setItem("auth_dev_code", data.devCode ?? "");
      sessionStorage.setItem("auth_auto_sent", data.autoSent ? "true" : "false");
      router.push("/verify");
    } catch {
      setError("Internet aloqasini tekshiring");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">

      {/* ── Hero — large centered logo visible immediately ── */}
      <div className="flex flex-col items-center justify-center flex-1 px-6 pt-12 pb-6">

        {/* Big logo */}
        <div className="w-36 h-36 mb-6 drop-shadow-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/new_logo.png"
            alt="Oshxona"
            className="w-full h-full object-contain"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              if (!img.src.endsWith("new_logo.png")) {
                img.src = "/logo.svg";
              } else {
                img.parentElement!.innerHTML =
                  '<div style="width:144px;height:144px;background:#F97316;border-radius:36px;display:flex;align-items:center;justify-content:center;font-size:64px">🍽️</div>';
              }
            }}
          />
        </div>

        {/* App name */}
        <h1 className="text-[36px] font-extrabold text-[#111] tracking-tight leading-none">
          Oshxona
        </h1>
        <p className="text-[16px] text-[#666] font-medium mt-2 text-center leading-relaxed">
          Koreyadagi halol o&apos;zbek taomlar
        </p>
        <p className="text-[13px] text-[#AAAAAA] mt-1 text-center">
          Halal Uzbek food in Korea
        </p>
      </div>

      {/* ── Auth section ── */}
      <div className="px-6 pb-10">

        {/* Mode not selected */}
        {!mode && (
          <div className="space-y-3">
            <button
              onClick={() => setMode("signin")}
              className="w-full h-[56px] rounded-2xl bg-primary text-white font-bold text-[17px] active:scale-[0.98] transition-transform"
              style={{ boxShadow: "0 4px 16px rgba(5,150,105,0.3)" }}
            >
              Kirish — Sign In
            </button>
            <button
              onClick={() => setMode("signup")}
              className="w-full h-[56px] rounded-2xl border-2 border-primary text-primary font-bold text-[17px] active:scale-[0.98] transition-transform bg-white"
            >
              Ro&apos;yxatdan o&apos;tish — Sign Up
            </button>
            <p className="text-center text-[13px] text-[#AAAAAA] pt-3">
              Parol kerak emas — Telegram orqali kiring
            </p>
          </div>
        )}

        {/* Mode selected — phone form */}
        {mode && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <button
              type="button"
              onClick={() => { setMode(null); setPhone(""); setError(""); }}
              className="flex items-center gap-1.5 text-[#888] text-[14px] font-semibold mb-1"
            >
              ← Orqaga
            </button>

            <div>
              <h2 className="text-[24px] font-extrabold text-[#111] mb-1">
                {mode === "signin" ? "Xush kelibsiz!" : "Yangi hisob"}
              </h2>
              <p className="text-[15px] text-[#666]">
                {mode === "signin"
                  ? "Telefon raqamingizni kiriting"
                  : "Ro'yxatdan o'tish uchun telefon raqamingizni kiriting"}
              </p>
            </div>

            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="h-[56px] rounded-2xl border-2 border-[#EEEEEE] px-3 text-[15px] bg-white focus:outline-none focus:border-primary font-semibold text-[#111]"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                placeholder="10 xxxx xxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoFocus
                className="flex-1 h-[56px] rounded-2xl border-2 border-[#EEEEEE] px-4 text-[15px] font-medium text-[#111] placeholder:text-[#CCCCCC] focus:outline-none focus:border-primary"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-600 text-[14px] font-medium">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !phone.trim()}
              className="w-full h-[56px] rounded-2xl bg-primary text-white font-bold text-[17px] disabled:opacity-40 active:scale-[0.98] transition-transform"
              style={{ boxShadow: "0 4px 16px rgba(5,150,105,0.3)" }}
            >
              {loading ? "Yuborilmoqda..." : "Kodni yuborish →"}
            </button>

            <p className="text-center text-[13px] text-[#AAAAAA]">
              ✈️ Telegram orqali tasdiqlash kodi yuboriladi
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
