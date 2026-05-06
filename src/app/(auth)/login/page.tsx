"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const COUNTRY_CODES = [
  { code: "+82", flag: "🇰🇷", label: "Korea" },
  { code: "+998", flag: "🇺🇿", label: "Uzbekistan" },
  { code: "+7", flag: "🇷🇺", label: "Russia" },
];

export default function LoginPage() {
  const router = useRouter();
  const [countryCode, setCountryCode] = useState("+82");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary mb-4">
            <span className="text-4xl">🍽️</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Oshxona</h1>
          <p className="text-muted-foreground mt-1">Mazali halol taomlar</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-base font-semibold mb-2">
              Telefon raqamingiz
            </label>
            <label className="block text-sm text-muted-foreground mb-3">
              Your phone number
            </label>
            <div className="flex gap-2">
              {/* Country picker */}
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="h-12 rounded-xl border border-input px-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>

              {/* Phone input */}
              <Input
                type="tel"
                placeholder="10 xxxx xxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoFocus
                className="flex-1"
              />
            </div>
          </div>

          {error && (
            <p className="text-destructive text-sm text-center">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading || !phone.trim()}
          >
            {loading ? "Yuklanmoqda..." : "Davom etish →"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-8">
          A verification code will be sent to confirm your number.
        </p>
      </div>
    </div>
  );
}
