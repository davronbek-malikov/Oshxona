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

      if (!res.ok) {
        setError(data.error || "Xatolik yuz berdi");
        return;
      }

      sessionStorage.setItem("auth_phone", fullPhone);
      sessionStorage.setItem("auth_mode", mode);
      sessionStorage.setItem("auth_delivery_method", data.method);
      sessionStorage.setItem("auth_deep_link", data.deepLink ?? "");
      sessionStorage.setItem("auth_dev_code", data.devCode ?? "");

      router.push("/verify");
    } catch {
      setError("Internet aloqasini tekshiring");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Hero section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8">
        <div className="w-24 h-24 rounded-3xl bg-primary flex items-center justify-center mb-5 shadow-lg"
             style={{ boxShadow: "0 8px 32px rgba(5,150,105,0.35)" }}>
          <span className="text-5xl">🍽️</span>
        </div>
        <h1 className="text-4xl font-extrabold text-[#111] tracking-tight">Oshxona</h1>
        <p className="text-[#AAAAAA] mt-2 text-base">Koreyadagi halol o'zbek taomlar</p>
      </div>

      {/* Auth section */}
      <div className="px-6 pb-12">

        {/* Mode not selected → show two buttons */}
        {!mode && (
          <div className="space-y-3">
            <button
              onClick={() => setMode("signin")}
              className="w-full h-14 rounded-2xl bg-primary text-white font-bold text-[17px] active:scale-[0.98] transition-transform shadow-sm"
              style={{ boxShadow: "0 4px 16px rgba(5,150,105,0.3)" }}
            >
              Kirish — Sign In
            </button>
            <button
              onClick={() => setMode("signup")}
              className="w-full h-14 rounded-2xl border-2 border-primary text-primary font-bold text-[17px] active:scale-[0.98] transition-transform bg-white"
            >
              Ro'yxatdan o'tish — Sign Up
            </button>

            <p className="text-center text-[13px] text-[#BBBBBB] mt-6 leading-relaxed">
              Telefon raqamingiz orqali kiring.{"\n"}No password needed.
            </p>
          </div>
        )}

        {/* Mode selected → show phone form */}
        {mode && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Back to mode selection */}
            <button
              type="button"
              onClick={() => { setMode(null); setPhone(""); setError(""); }}
              className="flex items-center gap-1 text-[#AAAAAA] text-sm mb-2"
            >
              ← {mode === "signin" ? "Kirish" : "Ro'yxatdan o'tish"}
            </button>

            <div>
              <h2 className="text-[22px] font-extrabold text-[#111] mb-1">
                {mode === "signin" ? "Xush kelibsiz!" : "Yangi hisob"}
              </h2>
              <p className="text-[14px] text-[#AAAAAA]">
                {mode === "signin"
                  ? "Telefon raqamingizni kiriting"
                  : "Ro'yxatdan o'tish uchun telefon raqamingizni kiriting"}
              </p>
            </div>

            {/* Phone input */}
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="h-14 rounded-2xl border border-[#EEEEEE] px-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 font-medium text-[#111]"
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
                className="flex-1 h-14 rounded-2xl border border-[#EEEEEE] px-4 text-base font-medium text-[#111] placeholder:text-[#CCCCCC] focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !phone.trim()}
              className="w-full h-14 rounded-2xl bg-primary text-white font-bold text-[17px] disabled:opacity-40 active:scale-[0.98] transition-transform"
              style={{ boxShadow: "0 4px 16px rgba(5,150,105,0.3)" }}
            >
              {loading ? "Yuborilmoqda..." : "Kodni yuborish →"}
            </button>

            <p className="text-center text-[12px] text-[#CCCCCC]">
              Telegram orqali tasdiqlash kodi yuboriladi
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
