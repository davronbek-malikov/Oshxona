import { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView } from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface Order {
  id: string;
  status: string;
  total_krw: number;
  created_at: string;
  restaurants: { name_uz: string } | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending_payment:   "Waiting payment",
  payment_claimed:   "Payment submitted",
  payment_confirmed: "Payment confirmed",
  preparing:         "Preparing",
  ready:             "Ready!",
  delivered:         "Delivered",
  cancelled:         "Cancelled",
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending_payment:   { bg: "bg-yellow-100", text: "text-yellow-700" },
  payment_claimed:   { bg: "bg-blue-100",   text: "text-blue-700" },
  payment_confirmed: { bg: "bg-green-100",  text: "text-green-700" },
  preparing:         { bg: "bg-orange-100", text: "text-orange-700" },
  ready:             { bg: "bg-orange-100", text: "text-primary" },
  delivered:         { bg: "bg-gray-100",   text: "text-gray-500" },
  cancelled:         { bg: "bg-red-100",    text: "text-red-500" },
};

export default function OrdersScreen() {
  const { user } = useCurrentUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("orders")
      .select("*, restaurants(name_uz)")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setOrders((data ?? []) as unknown as Order[]);
        setLoading(false);
      });

    // Realtime status updates
    const channel = supabase
      .channel(`orders-list-${user.id}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "orders",
        filter: `customer_id=eq.${user.id}`,
      }, (payload) => {
        setOrders((prev) =>
          prev.map((o) => o.id === (payload.new as Order).id
            ? { ...o, status: (payload.new as Order).status } : o)
        );
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#F97316" />
      </SafeAreaView>
    );
  }

  if (orders.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center px-6">
        <Text className="text-6xl">📋</Text>
        <Text className="text-xl font-bold mt-4">No orders yet</Text>
        <Text className="text-gray-400 mt-2 text-center">
          Your orders will appear here after you checkout
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/menu")}
          className="mt-6 bg-primary px-8 h-12 rounded-xl items-center justify-center"
        >
          <Text className="text-white font-bold">Browse restaurants</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-bold">My Orders</Text>
      </View>
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: order }) => {
          const s = STATUS_COLORS[order.status] ?? { bg: "bg-gray-100", text: "text-gray-600" };
          return (
            <TouchableOpacity
              onPress={() => router.push(`/orders/${order.id}`)}
              className="bg-white rounded-2xl p-4"
              activeOpacity={0.7}
            >
              <View className="flex-row items-start justify-between gap-2">
                <View className="flex-1">
                  <Text className="font-bold">#{order.id.slice(-6).toUpperCase()}</Text>
                  <Text className="text-gray-400 text-sm">
                    {(order.restaurants as { name_uz: string } | null)?.name_uz}
                  </Text>
                </View>
                <View className={`px-3 py-1 rounded-full ${s.bg}`}>
                  <Text className={`text-xs font-medium ${s.text}`}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </Text>
                </View>
              </View>
              <View className="flex-row justify-between mt-2">
                <Text className="text-xs text-gray-400">
                  {new Date(order.created_at).toLocaleString("ko-KR", {
                    month: "short", day: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </Text>
                <Text className="font-bold text-primary">
                  ₩{order.total_krw.toLocaleString()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}
