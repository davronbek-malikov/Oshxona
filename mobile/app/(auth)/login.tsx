import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { router } from "expo-router";

const COUNTRY_CODES = [
  { code: "+82",  flag: "🇰🇷", label: "Korea" },
  { code: "+998", flag: "🇺🇿", label: "Uzbekistan" },
];

export default function LoginScreen() {
  const [countryCode, setCountryCode] = useState("+82");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleContinue() {
    if (!phone.trim()) return;
    setLoading(true);
    setError("");

    const fullPhone = `${countryCode}${phone.replace(/\s/g, "")}`;
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;

    try {
      const res = await fetch(`${apiUrl}/api/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone }),
      });
      const data = await res.json();

      if (!res.ok) { setError(data.error || "Error"); return; }

      router.push({
        pathname: "/(auth)/verify",
        params: { phone: fullPhone, devCode: data.devCode ?? "" },
      });
    } catch {
      setError("Check your internet connection");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 items-center justify-center px-6">
          {/* Logo */}
          <View className="w-24 h-24 rounded-full bg-primary items-center justify-center mb-4">
            <Text className="text-5xl">🍽️</Text>
          </View>
          <Text className="text-3xl font-bold text-gray-900">Oshxona</Text>
          <Text className="text-gray-500 mt-1 mb-10">Mazali halol taomlar</Text>

          {/* Country selector */}
          <View className="w-full mb-3">
            <Text className="text-base font-semibold mb-2">Phone number</Text>
            <View className="flex-row gap-3">
              <View className="flex-row">
                {COUNTRY_CODES.map((c) => (
                  <TouchableOpacity
                    key={c.code}
                    onPress={() => setCountryCode(c.code)}
                    className={`px-4 py-3 rounded-xl border-2 mr-2 ${
                      countryCode === c.code
                        ? "border-primary bg-orange-50"
                        : "border-gray-200"
                    }`}
                  >
                    <Text className="text-base font-semibold">
                      {c.flag} {c.code}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <TextInput
            className="w-full h-14 border-2 border-gray-200 rounded-2xl px-4 text-lg mb-4 focus:border-primary"
            placeholder="10 xxxx xxxx"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoFocus
          />

          {error ? (
            <Text className="text-red-500 text-sm mb-3">{error}</Text>
          ) : null}

          <TouchableOpacity
            onPress={handleContinue}
            disabled={loading || !phone.trim()}
            className={`w-full h-14 rounded-2xl items-center justify-center ${
              loading || !phone.trim() ? "bg-orange-200" : "bg-primary"
            }`}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-lg font-bold">Continue →</Text>
            )}
          </TouchableOpacity>

          <Text className="text-gray-400 text-sm mt-6 text-center">
            A verification code will be sent to confirm your number.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
