import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, SafeAreaView, Clipboard,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useCartStore } from "@/store/cart";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface Restaurant {
  id: string;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_holder: string | null;
}

export default function CheckoutScreen() {
  const { user } = useCurrentUser();
  const { items, restaurantId, total, clearCart, itemCount } = useCartStore();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState<"account" | "amount" | null>(null);

  useEffect(() => {
    if (!restaurantId) { router.back(); return; }
    supabase.from("restaurants").select("*").eq("id", restaurantId).single()
      .then(({ data }) => setRestaurant(data));
  }, [restaurantId]);

  function copy(text: string, which: "account" | "amount") {
    Clipboard.setString(text);
    setCopied(which);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleSubmit() {
    if (!user || !restaurant || itemCount() === 0) return;
    if (deliveryType === "delivery" && !deliveryAddress.trim()) {
      Alert.alert("Address required", "Please enter your delivery address.");
      return;
    }
    setSubmitting(true);
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;

    try {
      const res = await fetch(`${apiUrl}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: user.id,
          restaurant_id: restaurant.id,
          items: items.map((i) => ({
            menu_item_id: i.id,
            quantity: i.quantity,
            price_at_order: i.price_krw,
          })),
          total_krw: total(),
          delivery_type: deliveryType,
          delivery_address: deliveryType === "delivery" ? deliveryAddress : null,
          customer_note: note || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        clearCart();
        router.replace(`/orders/${data.id}`);
      } else {
        Alert.alert("Error", data.error ?? "Could not place order");
      }
    } catch {
      Alert.alert("Error", "Check your internet connection");
    } finally {
      setSubmitting(false);
    }
  }

  if (!restaurant) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center gap-3 px-4 pt-4 pb-2">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-2xl">←</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold">Checkout</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 120 }}>
        {/* Order summary */}
        <View className="bg-white rounded-2xl p-4 gap-2">
          <Text className="font-semibold mb-1">📋 Order summary</Text>
          {items.map((item) => (
            <View key={item.id} className="flex-row justify-between">
              <Text className="text-sm text-gray-600">{item.name_uz} × {item.quantity}</Text>
              <Text className="text-sm font-medium">₩{(item.price_krw * item.quantity).toLocaleString()}</Text>
            </View>
          ))}
          <View className="flex-row justify-between border-t border-gray-100 pt-2 mt-1">
            <Text className="font-bold">Total</Text>
            <Text className="font-bold text-primary text-lg">₩{total().toLocaleString()}</Text>
          </View>
        </View>

        {/* Delivery type */}
        <View className="bg-white rounded-2xl p-4 gap-3">
          <Text className="font-semibold">🚴 Delivery type</Text>
          <View className="flex-row gap-3">
            {(["pickup", "delivery"] as const).map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setDeliveryType(type)}
                className={`flex-1 h-14 rounded-xl border-2 items-center justify-center ${
                  deliveryType === type ? "border-primary bg-orange-50" : "border-gray-200"
                }`}
              >
                <Text className={`font-semibold ${deliveryType === type ? "text-primary" : "text-gray-500"}`}>
                  {type === "pickup" ? "🏃 Pickup" : "🛵 Delivery"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {deliveryType === "delivery" && (
            <TextInput
              className="border border-gray-200 rounded-xl px-3 py-3 text-base min-h-[80px]"
              placeholder="Enter delivery address..."
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              multiline
            />
          )}
          <TextInput
            className="border border-gray-200 rounded-xl px-3 h-11 text-base"
            placeholder="Note (optional)..."
            value={note}
            onChangeText={setNote}
          />
        </View>

        {/* Bank transfer */}
        <View className="bg-white rounded-2xl p-4 gap-3">
          <Text className="font-semibold text-lg">💳 Bank Transfer</Text>
          <View className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <Text className="text-amber-800 text-sm font-semibold">Instructions:</Text>
            <Text className="text-amber-700 text-sm mt-1">
              Transfer to the account below, then tap "I have sent".
            </Text>
          </View>

          <View className="flex-row items-center justify-between bg-gray-50 rounded-xl p-3">
            <View>
              <Text className="text-xs text-gray-400">Bank</Text>
              <Text className="font-bold">{restaurant.bank_name}</Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between bg-gray-50 rounded-xl p-3">
            <View>
              <Text className="text-xs text-gray-400">Account number</Text>
              <Text className="font-bold font-mono text-lg">{restaurant.bank_account_number}</Text>
              <Text className="text-xs text-gray-400">{restaurant.bank_account_holder}</Text>
            </View>
            <TouchableOpacity
              onPress={() => copy(restaurant.bank_account_number ?? "", "account")}
              className="bg-orange-100 px-4 h-10 rounded-xl items-center justify-center"
            >
              <Text className="text-primary font-semibold text-sm">
                {copied === "account" ? "✓ Copied" : "Copy"}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center justify-between bg-orange-50 border border-orange-200 rounded-xl p-3">
            <View>
              <Text className="text-xs text-gray-400">Amount</Text>
              <Text className="font-bold text-2xl text-primary">₩{total().toLocaleString()}</Text>
            </View>
            <TouchableOpacity
              onPress={() => copy(total().toString(), "amount")}
              className="bg-orange-100 px-4 h-10 rounded-xl items-center justify-center"
            >
              <Text className="text-primary font-semibold text-sm">
                {copied === "amount" ? "✓ Copied" : "Copy"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Submit button */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-4 pb-8">
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting}
          className={`h-16 rounded-2xl items-center justify-center ${submitting ? "bg-orange-200" : "bg-primary"}`}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">✅ I have sent payment</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
