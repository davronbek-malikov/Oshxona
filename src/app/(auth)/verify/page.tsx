"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function VerifyPage() {
  const router = useRouter();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [phone, setPhone] = useState("");
  const [deepLink, setDeepLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const storedPhone = sessionStorage.getItem("auth_phone");
    const storedLink = sessionStorage.getItem("auth_deep_link");
    if (!storedPhone) {
      router.replace("/login");
      return;
    }
    setPhone(storedPhone);
    setDeepLink(storedLink || "");
  }, [router]);

  // Countdown timer for resend
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

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits filled
    if (digit && newCode.every((d) => d !== "") && index === 5) {
      verifyCode(newCode.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
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

      // Use the magic link to establish Supabase session
      if (data.sessionLink) {
        window.location.href = data.sessionLink;
      } else {
        router.replace("/menu");
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

    await fetch("/api/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary mb-4">
            <span className="text-4xl">🔐</span>
          </div>
          <h1 className="text-2xl font-bold">Kodni kiriting</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Telegram orqali 6 xonali kod yuborildi
          </p>
          <p className="font-semibold mt-1">{phone}</p>
        </div>

        {/* Telegram deep-link button */}
        {deepLink && (
          <a
            href={deepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-[#2AABEE] text-white font-semibold text-base mb-6"
          >
            <span>✈️</span> Telegramdan kodni olish
          </a>
        )}

        {/* 6-digit code inputs */}
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
              className="w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl
                focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring
                transition-colors"
              style={{ borderColor: digit ? "var(--primary)" : undefined }}
            />
          ))}
        </div>

        {error && (
          <p className="text-destructive text-sm text-center mb-4">{error}</p>
        )}

        <Button
          onClick={() => verifyCode(code.join(""))}
          className="w-full"
          size="lg"
          disabled={loading || code.some((d) => !d)}
        >
          {loading ? "Tekshirilmoqda..." : "Tasdiqlash ✓"}
        </Button>

        {/* Resend */}
        <div className="text-center mt-6">
          {resendTimer > 0 ? (
            <p className="text-muted-foreground text-sm">
              Qayta yuborish: {resendTimer}s
            </p>
          ) : (
            <button
              onClick={handleResend}
              className="text-primary font-semibold text-sm underline"
            >
              Kodni qayta yuborish
            </button>
          )}
        </div>

        <button
          onClick={() => router.push("/login")}
          className="w-full text-center text-sm text-muted-foreground mt-4"
        >
          ← Orqaga qaytish
        </button>
      </div>
    </div>
  );
}
