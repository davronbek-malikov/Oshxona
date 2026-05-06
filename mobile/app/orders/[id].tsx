import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";

interface Order {
  id: string;
  status: string;
  total_krw: number;
  created_at: string;
  restaurant_id: string;
  order_items: Array<{ id: string; quantity: number; price_at_order: number; menu_items: { name_uz: string } | null }>;
  restaurants: { name_uz: string; phone: string | null; bank_name: string | null; bank_account_number: string | null; bank_account_holder: string | null } | null;
}

const STEPS = [
  { key: "pending_payment",   label: "Waiting for payment",  icon: "⏳" },
  { key: "payment_claimed",   label: "Payment submitted",    icon: "💸" },
  { key: "payment_confirmed", label: "Payment confirmed",    icon: "✅" },
  { key: "preparing",         label: "Preparing your order", icon: "🍳" },
  { key: "ready",             label: "Ready for pickup",     icon: "🎉" },
  { key: "delivered",         label: "Delivered",            icon: "🛵" },
];

const STATUS_ORDER: Record<string, number> = {
  pending_payment: 0, payment_claimed: 1, payment_confirmed: 2,
  preparing: 3, ready: 4, delivered: 5, cancelled: -1,
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [stars, setStars] = useState(0);
  const [rated, setRated] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  useEffect(() => {
    const sb = supabase;
    sb.from("orders")
      .select(`*, order_items(id, quantity, price_at_order, menu_items(name_uz)), restaurants(name_uz, phone, bank_name, bank_account_number, bank_account_holder)`)
      .eq("id", id).single()
      .then(({ data }) => { setOrder(data as unknown as Order); setLoading(false); });

    sb.from("ratings").select("stars").eq("order_id", id).single()
      .then(({ data }) => { if (data) { setStars(data.stars); setRated(true); } });

    const channel = sb.channel(`order-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` },
        (payload) => setOrder((prev) => prev ? { ...prev, status: (payload.new as Order).status } : prev))
      .subscribe((s) => setLive(s === "SUBSCRIBED"));

    return () => { sb.removeChannel(channel); };
  }, [id]);

  async function handleCancel() {
    Alert.alert("Cancel order?", "This cannot be undone.", [
      { text: "No", style: "cancel" },
      { text: "Yes, cancel", style: "destructive", onPress: async () => {
        setCancelling(true);
        await fetch(`${apiUrl}/api/orders/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "cancelled" }),
        });
        setOrder((prev) => prev ? { ...prev, status: "cancelled" } : prev);
        setCancelling(false);
      }},
    ]);
  }

  async function submitRating(s: number) {
    if (!order || rated) return;
    setStars(s);
    await fetch(`${apiUrl}/api/ratings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: order.id, restaurant_id: order.restaurant_id, stars: s }),
    });
    setRated(true);
  }

  if (loading) {
    return <View className="flex-1 items-center justify-center bg-white"><ActivityIndicator size="large" color="#F97316" /></View>;
  }

  if (!order) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-400">Order not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-primary">← Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const currentStep = STATUS_ORDER[order.status] ?? -1;

  if (order.status === "cancelled") {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <TouchableOpacity onPress={() => router.back()} className="px-4 pt-4">
          <Text className="text-2xl">←</Text>
        </TouchableOpacity>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-6xl">❌</Text>
          <Text className="text-xl font-bold mt-4">Order Cancelled</Text>
          <Text className="text-gray-400 mt-2">#{order.id.slice(-6).toUpperCase()}</Text>
          <TouchableOpacity
            onPress={() => router.replace("/(tabs)/menu")}
            className="mt-6 bg-primary px-8 h-12 rounded-xl items-center justify-center"
          >
            <Text className="text-white font-bold">Back to menu</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-2xl">←</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold">Order #{order.id.slice(-6).toUpperCase()}</Text>
        </View>
        {live && (
          <View className="flex-row items-center gap-1">
            <View className="w-2 h-2 rounded-full bg-green-500" />
            <Text className="text-green-600 text-xs font-semibold">LIVE</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Restaurant */}
        {order.restaurants && (
          <View className="bg-white rounded-2xl p-4 flex-row items-center justify-between">
            <View>
              <Text className="font-semibold">{order.restaurants.name_uz}</Text>
              {order.restaurants.phone && (
                <Text className="text-gray-400 text-sm">📞 {order.restaurants.phone}</Text>
              )}
            </View>
          </View>
        )}

        {/* Status stepper */}
        <View className="bg-white rounded-2xl p-4">
          <Text className="font-semibold mb-4">Order status</Text>
          {STEPS.map((step, i) => {
            const done = i < currentStep;
            const active = i === currentStep;
            return (
              <View key={step.key} className="flex-row items-center gap-3 mb-3">
                <View className={`w-9 h-9 rounded-full items-center justify-center ${
                  done ? "bg-green-100" : active ? "bg-primary" : "bg-gray-100"
                }`}>
                  <Text className={done ? "text-green-600" : active ? "text-white" : "text-gray-400"}>
                    {done ? "✓" : step.icon}
                  </Text>
                </View>
                <Text className={`text-sm font-medium flex-1 ${
                  active ? "text-primary font-bold" : done ? "text-gray-700" : "text-gray-400"
                }`}>
                  {step.label}
                </Text>
                {active && <Text className="text-primary text-xs">Now</Text>}
              </View>
            );
          })}
        </View>

        {/* Bank transfer info */}
        {(order.status === "pending_payment" || order.status === "payment_claimed") && order.restaurants && (
          <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4 gap-2">
            <Text className="font-semibold">💳 Bank transfer details</Text>
            <Text className="text-amber-800 text-sm">{order.restaurants.bank_name} • <Text className="font-mono font-bold">{order.restaurants.bank_account_number}</Text></Text>
            <Text className="text-amber-800 text-sm">{order.restaurants.bank_account_holder}</Text>
            <Text className="font-bold text-2xl text-primary">₩{order.total_krw.toLocaleString()}</Text>
          </View>
        )}

        {/* Order items */}
        <View className="bg-white rounded-2xl p-4 gap-2">
          <Text className="font-semibold">📋 Order summary</Text>
          {order.order_items.map((item) => (
            <View key={item.id} className="flex-row justify-between">
              <Text className="text-sm text-gray-600">{item.menu_items?.name_uz ?? "Item"} × {item.quantity}</Text>
              <Text className="text-sm font-medium">₩{(item.price_at_order * item.quantity).toLocaleString()}</Text>
            </View>
          ))}
          <View className="flex-row justify-between border-t border-gray-100 pt-2 mt-1">
            <Text className="font-bold">Total</Text>
            <Text className="font-bold text-primary">₩{order.total_krw.toLocaleString()}</Text>
          </View>
        </View>

        {/* Rating — after delivery */}
        {order.status === "delivered" && (
          <View className="bg-white rounded-2xl p-4">
            <Text className="font-semibold mb-3">⭐ Rate your order</Text>
            {rated ? (
              <View className="items-center py-2">
                <Text className="text-3xl">{"⭐".repeat(stars)}</Text>
                <Text className="text-gray-400 text-sm mt-1">Thank you for your rating!</Text>
              </View>
            ) : (
              <View className="flex-row justify-center gap-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <TouchableOpacity key={s} onPress={() => submitRating(s)}>
                    <Text style={{ fontSize: 36, opacity: s <= stars ? 1 : 0.3 }}>⭐</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Cancel */}
        {order.status === "pending_payment" && (
          <TouchableOpacity
            onPress={handleCancel}
            disabled={cancelling}
            className="border border-red-300 h-12 rounded-xl items-center justify-center"
          >
            <Text className="text-red-500 font-semibold">
              {cancelling ? "Cancelling..." : "Cancel order"}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => router.push("/(tabs)/orders")} className="items-center">
          <Text className="text-gray-400 text-sm underline">All orders →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
