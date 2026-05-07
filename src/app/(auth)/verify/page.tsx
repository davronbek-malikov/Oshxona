"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function VerifyPage() {
  const router = useRouter();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [phone, setPhone] = useState("");
  const [deepLink, setDeepLink] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"telegram" | "sms">("telegram");
  const [devCode, setDevCode] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const storedPhone = sessionStorage.getItem("auth_phone");
    if (!storedPhone) { router.replace("/login"); return; }
    setPhone(storedPhone);
    setDeepLink(sessionStorage.getItem("auth_deep_link") || "");
    setDeliveryMethod((sessionStorage.getItem("auth_delivery_method") as "telegram" | "sms") || "telegram");
    setDevCode(sessionStorage.getItem("auth_dev_code") || "");
    setMode((sessionStorage.getItem("auth_mode") as "signin" | "signup") || "signin");
  }, [router]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  function handleDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
    if (digit && newCode.every((d) => d !== "") && index === 5) {
      verifyCode(newCode.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function verifyCode(fullCode: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: fullCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Kod noto'g'ri");
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.verifyOtp({
        token_hash: data.tokenHash,
        type: "magiclink",
      });

      if (signInError) {
        setError("Kirish amalga oshmadi. Qayta urinib ko'ring.");
        return;
      }

      // Redirect logic:
      // - Sign Up AND no name set → go to profile setup
      // - Sign In OR name already set → go to menu
      const isNewUser = !data.user?.name;
      if (mode === "signup" && isNewUser) {
        router.replace("/setup-profile");
      } else if (data.user?.role === "restaurant") {
        router.replace("/restaurant/dashboard");
      } else {
        const confirmed = localStorage.getItem("oshxona_role_confirmed");
        if (!confirmed) {
          router.replace("/role-picker");
        } else {
          router.replace("/menu");
        }
      }
    } catch {
      setError("Internet aloqasini tekshiring");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendTimer > 0) return;
    setResendTimer(60);
    setError("");
    const res = await fetch("/api/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    if (data.method) {
      setDeliveryMethod(data.method);
      setDeepLink(data.deepLink ?? "");
      setDevCode(data.devCode ?? "");
      sessionStorage.setItem("auth_delivery_method", data.method);
      sessionStorage.setItem("auth_deep_link", data.deepLink ?? "");
      sessionStorage.setItem("auth_dev_code", data.devCode ?? "");
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🔐</span>
          </div>
          <h1 className="text-[24px] font-extrabold text-[#111]">
            {mode === "signup" ? "Hisobni tasdiqlash" : "Tasdiqlash kodi"}
          </h1>
          <p className="text-[14px] text-[#AAAAAA] mt-2">
            {deliveryMethod === "telegram"
              ? "Telegramdan tasdiqlash kodini oling"
              : "SMS orqali yuborildi"}
          </p>
          <p className="font-bold text-[15px] text-[#111] mt-1">{phone}</p>
        </div>

        {/* Dev mode code */}
        {devCode && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 mb-5 text-center">
            <p className="text-[11px] font-bold text-amber-600 uppercase mb-1">Dev mode — kod</p>
            <p className="text-4xl font-mono font-black tracking-widest text-amber-800">{devCode}</p>
          </div>
        )}

        {/* Telegram deep link */}
        {deliveryMethod === "telegram" && deepLink && (
          <a
            href={deepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full h-13 rounded-2xl bg-[#2AABEE] text-white font-bold text-[15px] mb-6 py-3.5"
          >
            ✈️ Telegramda kodni olish
          </a>
        )}

        {/* 6-digit OTP inputs */}
        <div className="flex gap-2 justify-center mb-6">
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-12 h-14 text-center text-2xl font-black border-2 rounded-2xl focus:outline-none transition-colors"
              style={{
                borderColor: digit ? "var(--primary)" : "#EEEEEE",
                color: digit ? "var(--primary)" : "#111",
              }}
            />
          ))}
        </div>

        {error && (
          <p className="text-red-500 text-[14px] text-center mb-4">{error}</p>
        )}

        <button
          onClick={() => verifyCode(code.join(""))}
          disabled={loading || code.some((d) => !d)}
          className="w-full h-14 rounded-2xl bg-primary text-white font-bold text-[17px] disabled:opacity-40 active:scale-[0.98] transition-transform"
        >
          {loading ? "Tekshirilmoqda..." : "Tasdiqlash ✓"}
        </button>

        {/* Resend */}
        <div className="text-center mt-5">
          {resendTimer > 0 ? (
            <p className="text-[#AAAAAA] text-sm">Qayta yuborish: {resendTimer}s</p>
          ) : (
            <button onClick={handleResend} className="text-primary font-bold text-sm">
              Kodni qayta yuborish
            </button>
          )}
        </div>

        <button
          onClick={() => {
            ["auth_phone","auth_deep_link","auth_delivery_method","auth_dev_code","auth_mode"]
              .forEach((k) => sessionStorage.removeItem(k));
            router.push("/login");
          }}
          className="w-full text-center text-[13px] text-[#AAAAAA] mt-5"
        >
          ← Orqaga qaytish
        </button>
      </div>
    </div>
  );
}
