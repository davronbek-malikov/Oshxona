"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function VerifyPage() {
  const router = useRouter();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [phone, setPhone] = useState("");
  const [deepLink, setDeepLink] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"telegram" | "sms">("telegram");
  const [devCode, setDevCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const storedPhone = sessionStorage.getItem("auth_phone");
    const storedLink = sessionStorage.getItem("auth_deep_link");
    const storedMethod = sessionStorage.getItem("auth_delivery_method");
    if (!storedPhone) {
      router.replace("/login");
      return;
    }
    setPhone(storedPhone);
    setDeepLink(storedLink || "");
    setDeliveryMethod((storedMethod as "telegram" | "sms") || "telegram");
    setDevCode(sessionStorage.getItem("auth_dev_code") || "");
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
        setError(data.error || "Wrong code");
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }

      // Sign in client-side using the token hash — no redirect needed
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.verifyOtp({
        token_hash: data.tokenHash,
        type: "magiclink",
      });

      if (signInError) {
        setError("Login failed. Please try again.");
        return;
      }

      router.replace("/menu");
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
      sessionStorage.setItem("auth_delivery_method", data.method);
      setDeepLink(data.deepLink ?? "");
      sessionStorage.setItem("auth_deep_link", data.deepLink ?? "");
      setDevCode(data.devCode ?? "");
      sessionStorage.setItem("auth_dev_code", data.devCode ?? "");
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary mb-4">
            <span className="text-4xl">🔐</span>
          </div>
          <h1 className="text-2xl font-bold">Enter verification code</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {deliveryMethod === "sms"
              ? "6-digit code sent via SMS"
              : "Get your 6-digit code from Telegram"}
          </p>
          <p className="font-semibold mt-1">{phone}</p>
        </div>

        {/* Dev mode: show code directly (localhost only, never in production) */}
        {devCode && (
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 mb-4 text-center">
            <p className="text-xs font-semibold text-yellow-700 uppercase mb-1">Dev mode — your code</p>
            <p className="text-4xl font-mono font-bold tracking-widest text-yellow-800">{devCode}</p>
          </div>
        )}

        {/* Telegram deep-link button — only shown when using Telegram */}
        {deliveryMethod === "telegram" && deepLink && (
          <a
            href={deepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-[#2AABEE] text-white font-semibold text-base mb-6"
          >
            <span>✈️</span> Open Telegram to get code
          </a>
        )}

        {/* SMS notice */}
        {deliveryMethod === "sms" && (
          <div className="flex items-center gap-2 w-full h-12 rounded-xl bg-green-50 border border-green-200 text-green-800 font-medium text-sm justify-center mb-6">
            📱 Code sent to {phone}
          </div>
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
          onClick={() => {
            sessionStorage.removeItem("auth_phone");
            sessionStorage.removeItem("auth_deep_link");
            sessionStorage.removeItem("auth_delivery_method");
            sessionStorage.removeItem("auth_dev_code");
            router.push("/login");
          }}
          className="w-full text-center text-sm text-muted-foreground mt-4"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
