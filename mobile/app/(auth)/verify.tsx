import { useState, useRef, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function VerifyScreen() {
  const { phone, devCode } = useLocalSearchParams<{ phone: string; devCode: string }>();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  function handleDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    if (digit && index < 5) inputs.current[index + 1]?.focus();
    if (digit && next.every((d) => d) && index === 5) verify(next.join(""));
  }

  function handleKey(index: number, key: string) {
    if (key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  async function verify(fullCode: string) {
    setLoading(true);
    setError("");
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;

    try {
      const res = await fetch(`${apiUrl}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: fullCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Wrong code");
        setCode(["", "", "", "", "", ""]);
        inputs.current[0]?.focus();
        return;
      }

      const { error: signInError } = await supabase.auth.verifyOtp({
        token_hash: data.tokenHash,
        type: "magiclink",
      });

      if (signInError) {
        setError("Login failed. Please try again.");
        return;
      }

      router.replace("/(tabs)/menu");
    } catch {
      setError("Check your internet connection");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendTimer > 0) return;
    setResendTimer(60);
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;
    await fetch(`${apiUrl}/api/auth/request-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-20 h-20 rounded-full bg-primary items-center justify-center mb-4">
          <Text className="text-4xl">🔐</Text>
        </View>
        <Text className="text-2xl font-bold text-center">Enter verification code</Text>
        <Text className="text-gray-500 mt-2 text-center">
          Get your 6-digit code from Telegram
        </Text>
        <Text className="font-semibold mt-1">{phone}</Text>

        {/* Dev mode banner */}
        {!!devCode && (
          <View className="w-full bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-4 mt-4 items-center">
            <Text className="text-yellow-700 text-xs font-bold uppercase mb-1">
              Dev mode — your code
            </Text>
            <Text className="text-yellow-800 text-4xl font-mono font-bold tracking-widest">
              {devCode}
            </Text>
          </View>
        )}

        {/* 6 digit inputs */}
        <View className="flex-row gap-2 mt-6 mb-4">
          {code.map((digit, i) => (
            <TextInput
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              className={`w-12 h-14 border-2 rounded-xl text-center text-2xl font-bold ${
                digit ? "border-primary" : "border-gray-200"
              }`}
              value={digit}
              onChangeText={(v) => handleDigit(i, v)}
              onKeyPress={({ nativeEvent }) => handleKey(i, nativeEvent.key)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {error ? (
          <Text className="text-red-500 text-sm mb-3">{error}</Text>
        ) : null}

        <TouchableOpacity
          onPress={() => verify(code.join(""))}
          disabled={loading || code.some((d) => !d)}
          className={`w-full h-14 rounded-2xl items-center justify-center mb-4 ${
            loading || code.some((d) => !d) ? "bg-orange-200" : "bg-primary"
          }`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-lg font-bold">Verify ✓</Text>
          )}
        </TouchableOpacity>

        {resendTimer > 0 ? (
          <Text className="text-gray-400 text-sm">Resend in {resendTimer}s</Text>
        ) : (
          <TouchableOpacity onPress={handleResend}>
            <Text className="text-primary font-semibold text-sm underline">Resend code</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4"
        >
          <Text className="text-gray-400 text-sm">← Back</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
